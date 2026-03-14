"""SFT training data generation service.

Uses docling for document conversion, litellm for LLM calls,
and implements multi-round generation with quality controls.
"""

import asyncio
import json
import logging
import random
import re
import uuid
from datetime import datetime
from difflib import SequenceMatcher
from typing import AsyncGenerator, List, Optional

import httpx
from litellm import acompletion
from litellm.exceptions import (
    APIConnectionError,
    RateLimitError,
    ServiceUnavailableError,
)
from pathlib import Path

from models.sft import (
    DataItem,
    CoTData,
    CoTStep,
    SFTConfig,
)

logger = logging.getLogger(__name__)

# ----- Lazy-initialised docling converter -----
# DocumentConverter is heavyweight; build it once at
# module level on first use.
_converter = None


def _get_converter():
    """Return the singleton DocumentConverter instance.

    Lazily initialises a ``docling.DocumentConverter``
    on first call. The converter is heavyweight (loads
    ML models) so it is reused across all requests.

    Returns:
        DocumentConverter: The shared converter instance.
    """
    global _converter
    if _converter is None:
        from docling.document_converter import (
            DocumentConverter,
        )
        _converter = DocumentConverter()
    return _converter


# ----- Style / temperature presets for diversity -----
_STYLES = [
    "Q&A style",
    "instruction-following style",
    "scenario-based style",
    "analytical/reasoning style",
]
_TEMPS = [0.6, 0.8, 0.9, 0.7]


# ----- Helpers (module-level, stateless) -----

def _extract_json(text: str) -> str:
    r"""Strip markdown code fences from LLM output.

    LLMs often wrap JSON in ` ```json ... ``` ` blocks
    which breaks ``json.loads``. This helper removes
    those fences so the raw JSON can be parsed.

    Args:
        text (str): Raw LLM output that may contain
            markdown code fences.

    Returns:
        str: Cleaned text with code fences removed.
    """
    pattern = r"```(?:json)?\s*\n?(.*?)\n?\s*```"
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text.strip()


def _chunk_content(
    text: str,
    max_chars: int = 6000,
    overlap: int = 500,
) -> List[str]:
    r"""Split text into overlapping chunks by paragraph.

    Splits on double-newlines (paragraph boundaries),
    greedily fills each chunk up to *max_chars*, and
    overlaps the last *overlap* characters into the
    next chunk to preserve context across boundaries.

    Args:
        text (str): The full source text.
        max_chars (int): Maximum characters per chunk.
            Defaults to 6000.
        overlap (int): Number of trailing characters to
            repeat at the start of the next chunk.
            Defaults to 500.

    Returns:
        List[str]: Ordered list of text chunks.
    """
    if len(text) <= max_chars:
        return [text]

    paragraphs = text.split("\n\n")
    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        candidate = (
            (current + "\n\n" + para) if current else para
        )
        if len(candidate) > max_chars and current:
            chunks.append(current)
            # Overlap: seed next chunk with tail
            tail = current[-overlap:] if overlap else ""
            current = tail + "\n\n" + para
        else:
            current = candidate

    if current:
        chunks.append(current)

    return chunks


def _validate_item(item: dict) -> bool:
    r"""Check that a training item meets minimum quality.

    Rejects items whose ``instruction`` is shorter than
    10 characters or whose ``output`` is shorter than
    20 characters.

    Args:
        item (dict): A training data dictionary with keys
            ``instruction``, ``input``, and ``output``.

    Returns:
        bool: True if the item passes validation.
    """
    instr = item.get("instruction", "")
    output = item.get("output", "")
    return len(instr) >= 10 and len(output) >= 20


def _deduplicate_items(
    items: List[dict],
    threshold: float = 0.85,
) -> List[dict]:
    r"""Remove near-duplicate training items.

    Uses ``difflib.SequenceMatcher`` on the concatenation
    of ``instruction`` + ``output`` to detect duplicates
    at the given similarity *threshold*.

    Args:
        items (List[dict]): Candidate training items.
        threshold (float): Similarity ratio above which
            an item is considered a duplicate. Defaults
            to 0.85.

    Returns:
        List[dict]: De-duplicated list of items.
    """
    unique: List[dict] = []
    for item in items:
        text = (
            item.get("instruction", "")
            + " "
            + item.get("output", "")
        )
        is_dup = False
        for kept in unique:
            kept_text = (
                kept.get("instruction", "")
                + " "
                + kept.get("output", "")
            )
            ratio = SequenceMatcher(
                None, text, kept_text
            ).ratio()
            if ratio > threshold:
                is_dup = True
                break
        if not is_dup:
            unique.append(item)
    return unique


class SFTService:
    r"""Service for generating SFT training data via LLM.

    Uses litellm to support 100+ LLM providers through a
    unified interface. Employs multi-round generation with
    style variation, quality validation, and deduplication
    to produce diverse, high-quality training items.

    Attributes:
        config (SFTConfig): The service configuration
            holding model, api_key, base_url, etc.
    """

    def __init__(self, config: SFTConfig):
        """Initialise the SFT service.

        Args:
            config (SFTConfig): Configuration containing
                LLM provider credentials and model
                settings.
        """
        self.config = config

    # ----- LLM call with retry -----

    async def _llm_call(
        self,
        messages: list,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4000,
    ) -> str:
        r"""Make an async LLM call with exponential backoff.

        Retries up to 3 times on transient errors such as
        rate-limit, connection, service-unavailable, and
        timeout errors. Non-transient errors (auth, invalid
        model) are raised immediately.

        Args:
            messages (list): Chat messages in OpenAI format.
            model (Optional[str]): Model override. Defaults
                to ``self.config.model``.
            temperature (float): Sampling temperature.
            max_tokens (int): Maximum tokens in response.

        Returns:
            str: The content of the assistant's reply.

        Raises:
            Exception: If all retries are exhausted or a
                non-transient error occurs.
        """
        max_retries = 3
        transient = (
            RateLimitError,
            APIConnectionError,
            ServiceUnavailableError,
            TimeoutError,
        )

        for attempt in range(max_retries):
            try:
                response = await acompletion(
                    model=model or self.config.model,
                    api_key=self.config.api_key,
                    api_base=self.config.base_url,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                return response.choices[0].message.content
            except transient as exc:
                if attempt == max_retries - 1:
                    raise
                delay = (
                    1.0 * (2 ** attempt)
                    + random.uniform(0, 1)
                )
                logger.warning(
                    "LLM call attempt %d failed: %s. "
                    "Retrying in %.1fs",
                    attempt + 1,
                    exc,
                    delay,
                )
                await asyncio.sleep(delay)
        # Unreachable, but keeps mypy happy
        raise RuntimeError("Exhausted retries")

    # ----- Content extraction via docling -----

    async def extract_content_from_file(
        self, file_path: str
    ) -> str:
        r"""Extract content from an uploaded file via docling.

        Docling handles PDF, DOCX, PPTX, XLSX, CSV, HTML,
        images, and more. The conversion is CPU-bound and
        synchronous, so it is run in a thread pool.

        Args:
            file_path (str): Path to the uploaded file.

        Returns:
            str: Extracted content as Markdown text.

        Raises:
            Exception: If docling conversion fails.
        """
        def _convert():
            """Run docling conversion synchronously."""
            converter = _get_converter()
            result = converter.convert(file_path)
            return result.document.export_to_markdown()

        return await asyncio.to_thread(_convert)

    async def extract_content_from_url(
        self, url: str
    ) -> str:
        r"""Extract content from a URL via docling.

        Tries docling first (handles HTML, PDF links, etc.).
        Falls back to a plain httpx fetch for JSON and plain
        text URLs where docling adds no value.

        Args:
            url (str): The URL to fetch content from.

        Returns:
            str: The extracted text content.

        Raises:
            Exception: If both docling and httpx fail.
        """
        # Try docling first
        try:
            def _convert_url():
                """Run docling URL conversion."""
                converter = _get_converter()
                result = converter.convert(url)
                return result.document.export_to_markdown()

            return await asyncio.to_thread(_convert_url)
        except Exception as docling_err:
            logger.info(
                "Docling URL conversion failed (%s), "
                "falling back to httpx",
                docling_err,
            )

        # Fallback: plain httpx for text/JSON URLs
        async with httpx.AsyncClient(
            timeout=30.0
        ) as client:
            try:
                response = await client.get(
                    url, follow_redirects=True
                )
                response.raise_for_status()

                content_type = response.headers.get(
                    "content-type", ""
                )
                if "application/json" in content_type:
                    return response.text
                return response.text[:10000]

            except httpx.HTTPError as exc:
                raise Exception(
                    f"Failed to fetch URL: {exc}"
                ) from exc

    # ----- SFT data generation (multi-round) -----

    async def generate_sft_data(
        self,
        content: str,
        instruction: str,
        suggestions_count: int = 3,
    ) -> List[DataItem]:
        r"""Generate SFT training data using multi-round LLM.

        Splits the workload into rounds of 2-3 items,
        rotating through style presets and temperatures
        to maximise diversity. Content longer than 6000
        characters is chunked and rounds are distributed
        across chunks. Results are validated and
        deduplicated before returning.

        Args:
            content (str): Source content for generation.
            instruction (str): User instruction describing
                the desired training data.
            suggestions_count (int): Number of items to
                generate. Defaults to 3.

        Returns:
            List[DataItem]: Generated training data items.

        Raises:
            Exception: If generation fails after retries.
        """
        chunks = _chunk_content(content)
        collected: List[dict] = []
        max_rounds = suggestions_count * 2

        # Decide items per round
        if suggestions_count <= 3:
            items_per_round = suggestions_count
        else:
            items_per_round = min(3, suggestions_count)

        round_idx = 0
        while (
            len(collected) < suggestions_count
            and round_idx < max_rounds
        ):
            chunk = chunks[round_idx % len(chunks)]
            style = _STYLES[round_idx % len(_STYLES)]
            temp = _TEMPS[round_idx % len(_TEMPS)]

            remaining = suggestions_count - len(collected)
            count = min(items_per_round, remaining)

            # Build anti-repetition clause
            anti_rep = ""
            if collected:
                existing = "\n".join(
                    f"- {it['instruction']}"
                    for it in collected
                )
                anti_rep = (
                    "\n\nIMPORTANT: Do NOT repeat or "
                    "paraphrase any of these existing "
                    "instructions:\n"
                    f"{existing}\n"
                )

            user_prompt = (
                f"Based on the following content and "
                f"instruction, generate {count} "
                f"high-quality SFT training data items "
                f"in **{style}**.\n\n"
                f"Content:\n{chunk}\n\n"
                f"Instruction:\n{instruction}\n\n"
                f"Each item must include:\n"
                f"- instruction: a clear task\n"
                f"- input: relevant context (can be "
                f"empty string)\n"
                f"- output: a comprehensive answer\n\n"
                f"Return ONLY a JSON array of objects "
                f"with keys: instruction, input, output."
                f"{anti_rep}"
            )

            try:
                result_text = await self._llm_call(
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are an expert SFT "
                                "training data generator."
                            ),
                        },
                        {
                            "role": "user",
                            "content": user_prompt,
                        },
                    ],
                    temperature=temp,
                    max_tokens=4000,
                )

                cleaned = _extract_json(result_text)
                try:
                    items = json.loads(cleaned)
                    if not isinstance(items, list):
                        items = [items]
                except json.JSONDecodeError:
                    items = self._parse_items_from_text(
                        result_text
                    )

                # Validate and append
                for item in items:
                    if _validate_item(item):
                        collected.append(item)

            except Exception as exc:
                logger.warning(
                    "Round %d failed: %s", round_idx, exc
                )

            round_idx += 1

        # Deduplicate
        collected = _deduplicate_items(collected)

        # Build DataItem objects
        data_items = []
        for item in collected[:suggestions_count]:
            data_items.append(
                DataItem(
                    id=str(uuid.uuid4()),
                    instruction=item.get(
                        "instruction", ""
                    ),
                    input=item.get("input", ""),
                    output=item.get("output", ""),
                    source="ai_generated",
                    timestamp=datetime.now(),
                )
            )

        return data_items

    # ----- SSE streaming generation -----

    async def generate_sft_data_stream(
        self,
        content: str,
        instruction: str,
        suggestions_count: int = 3,
    ) -> AsyncGenerator[dict, None]:
        r"""Generate SFT data with streaming progress events.

        Yields dict events as each generation round completes,
        enabling Server-Sent Events (SSE) streaming to the
        frontend for real-time progress feedback.

        Event types yielded:
            - ``progress``: Before each LLM call with round
              info and item counts.
            - ``items``: After each round with newly validated
              items.
            - ``done``: After dedup with all final items.
            - ``error``: If a round fails (non-fatal).

        Args:
            content (str): Source content for generation.
            instruction (str): User instruction describing
                the desired training data.
            suggestions_count (int): Number of items to
                generate. Defaults to 3.

        Yields:
            dict: Event dictionaries with a ``type`` key.
        """
        chunks = _chunk_content(content)
        collected: List[dict] = []
        max_rounds = suggestions_count * 2

        if suggestions_count <= 3:
            items_per_round = suggestions_count
        else:
            items_per_round = min(3, suggestions_count)

        round_idx = 0
        while (
            len(collected) < suggestions_count
            and round_idx < max_rounds
        ):
            # Emit progress event before LLM call
            yield {
                "type": "progress",
                "round": round_idx + 1,
                "total_rounds": max_rounds,
                "items_so_far": len(collected),
                "target": suggestions_count,
            }

            chunk = chunks[round_idx % len(chunks)]
            style = _STYLES[round_idx % len(_STYLES)]
            temp = _TEMPS[round_idx % len(_TEMPS)]

            remaining = (
                suggestions_count - len(collected)
            )
            count = min(items_per_round, remaining)

            # Build anti-repetition clause
            anti_rep = ""
            if collected:
                existing = "\n".join(
                    f"- {it['instruction']}"
                    for it in collected
                )
                anti_rep = (
                    "\n\nIMPORTANT: Do NOT repeat or "
                    "paraphrase any of these existing "
                    "instructions:\n"
                    f"{existing}\n"
                )

            user_prompt = (
                f"Based on the following content and "
                f"instruction, generate {count} "
                f"high-quality SFT training data items "
                f"in **{style}**.\n\n"
                f"Content:\n{chunk}\n\n"
                f"Instruction:\n{instruction}\n\n"
                f"Each item must include:\n"
                f"- instruction: a clear task\n"
                f"- input: relevant context (can be "
                f"empty string)\n"
                f"- output: a comprehensive answer\n\n"
                f"Return ONLY a JSON array of objects "
                f"with keys: instruction, input, output."
                f"{anti_rep}"
            )

            try:
                result_text = await self._llm_call(
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are an expert SFT "
                                "training data generator."
                            ),
                        },
                        {
                            "role": "user",
                            "content": user_prompt,
                        },
                    ],
                    temperature=temp,
                    max_tokens=4000,
                )

                cleaned = _extract_json(result_text)
                try:
                    items = json.loads(cleaned)
                    if not isinstance(items, list):
                        items = [items]
                except json.JSONDecodeError:
                    items = (
                        self._parse_items_from_text(
                            result_text
                        )
                    )

                # Validate and collect new items
                new_items = []
                for item in items:
                    if _validate_item(item):
                        collected.append(item)
                        new_items.append(item)

                # Emit items event with this round's items
                if new_items:
                    yield {
                        "type": "items",
                        "new_items": new_items,
                    }

            except Exception as exc:
                logger.warning(
                    "Round %d failed: %s",
                    round_idx,
                    exc,
                )
                yield {
                    "type": "error",
                    "round": round_idx + 1,
                    "message": str(exc),
                }

            round_idx += 1

        # Deduplicate and build final DataItem objects
        collected = _deduplicate_items(collected)
        data_items = []
        for item in collected[:suggestions_count]:
            data_items.append(
                DataItem(
                    id=str(uuid.uuid4()),
                    instruction=item.get(
                        "instruction", ""
                    ),
                    input=item.get("input", ""),
                    output=item.get("output", ""),
                    source="ai_generated",
                    timestamp=datetime.now(),
                ).model_dump()
            )

        yield {
            "type": "done",
            "items": data_items,
        }

    # ----- Text fallback parser (regex-based) -----

    def _parse_items_from_text(
        self, text: str
    ) -> List[dict]:
        r"""Parse training items from unstructured text.

        Uses regex to capture ``Instruction:``,
        ``Input:``, and ``Output:`` blocks, handling
        multiline content, bold/heading prefixes, and
        variant casing.

        Args:
            text (str): Raw text output from the LLM.

        Returns:
            List[dict]: Parsed training data dicts.
        """
        # Split text into item blocks by Instruction:
        instr_pattern = re.compile(
            r"(?:\*{0,2}|#{1,3})?\s*"
            r"[Ii]nstruction\s*\**\s*:\s*",
        )
        # Split into segments starting with Instruction:
        parts = instr_pattern.split(text)
        # First part is before any Instruction:
        parts = parts[1:] if len(parts) > 1 else []

        items: List[dict] = []
        input_pat = re.compile(
            r"(?:\*{0,2}|#{1,3})?\s*"
            r"[Ii]nput\s*\**\s*:\s*",
        )
        output_pat = re.compile(
            r"(?:\*{0,2}|#{1,3})?\s*"
            r"[Oo]utput\s*\**\s*:\s*",
        )

        for part in parts:
            item: dict = {}

            # Try to split by Output:
            out_split = output_pat.split(part, maxsplit=1)
            if len(out_split) == 2:
                before_output = out_split[0]
                item["output"] = out_split[1].strip()
            else:
                before_output = part
                item["output"] = ""

            # Try to split by Input:
            inp_split = input_pat.split(
                before_output, maxsplit=1
            )
            if len(inp_split) == 2:
                item["instruction"] = (
                    inp_split[0].strip()
                )
                item["input"] = inp_split[1].strip()
            else:
                item["instruction"] = (
                    before_output.strip()
                )
                item["input"] = ""

            if item.get("instruction"):
                items.append(item)

        return items

    # ----- Chain-of-Thought generation -----

    async def generate_cot_data(
        self, question: str
    ) -> CoTData:
        r"""Generate Chain of Thought reasoning data.

        Uses regex-based parsing to extract steps of the
        form ``Step N: ...`` and the final ``Answer: ...``
        block. Handles multiline step content and avoids
        false matches like "Stepping back...".

        Args:
            question (str): The question to analyse.

        Returns:
            CoTData: Structured CoT reasoning with steps
                and final answer.

        Raises:
            Exception: If LLM call or parsing fails.
        """
        prompt = (
            "Analyze this question step by step and "
            "provide a detailed reasoning chain.\n\n"
            f"Question: {question}\n\n"
            "Break down your reasoning into clear "
            "steps:\n"
            "1. Identify the key components of the "
            "question\n"
            "2. Apply logical reasoning to each "
            "component\n"
            "3. Combine the reasoning to reach a "
            "conclusion\n"
            "4. Provide the final answer\n\n"
            "Format your response as:\n"
            "Step 1: [thought]\n"
            "Step 2: [thought]\n"
            "...\n"
            "Answer: [final answer]"
        )

        try:
            result_text = await self._llm_call(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert at logical "
                            "reasoning and "
                            "chain-of-thought analysis."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=2000,
            )

            # Regex-based CoT parser
            step_pattern = re.compile(
                r"Step\s+(\d+)\s*:\s*"
                r"(.*?)"
                r"(?=Step\s+\d+\s*:|Answer\s*:|$)",
                re.DOTALL | re.IGNORECASE,
            )
            answer_pattern = re.compile(
                r"Answer\s*:\s*(.*)",
                re.DOTALL | re.IGNORECASE,
            )

            steps: List[CoTStep] = []
            for match in step_pattern.finditer(
                result_text
            ):
                step_num = int(match.group(1))
                thought = match.group(2).strip()
                steps.append(
                    CoTStep(
                        step=step_num, thought=thought
                    )
                )

            answer = ""
            ans_match = answer_pattern.search(result_text)
            if ans_match:
                answer = ans_match.group(1).strip()

            return CoTData(
                id=str(uuid.uuid4()),
                question=question,
                reasoning_steps=steps,
                answer=answer,
            )

        except Exception as exc:
            raise Exception(
                f"Failed to generate CoT data: {exc}"
            ) from exc

    # ----- Image description -----

    async def generate_image_description(
        self, image_path: str
    ) -> str:
        r"""Generate description for image using vision model.

        Uses the configured vision_model instead of a
        hardcoded model name, allowing any litellm-supported
        vision provider.

        Args:
            image_path (str): Path to the image file.

        Returns:
            str: A detailed text description of the image.

        Raises:
            Exception: If the vision LLM call fails.
        """
        try:
            import base64

            with open(image_path, "rb") as f:
                image_data = base64.b64encode(
                    f.read()
                ).decode("utf-8")

            result_text = await self._llm_call(
                model=self.config.vision_model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    "Describe this image "
                                    "in detail, including "
                                    "objects, actions, "
                                    "and context."
                                ),
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": (
                                        "data:image/"
                                        "jpeg;base64,"
                                        f"{image_data}"
                                    )
                                },
                            },
                        ],
                    }
                ],
                max_tokens=500,
            )

            return result_text

        except Exception as exc:
            raise Exception(
                "Failed to generate image "
                f"description: {exc}"
            ) from exc

    # ----- HuggingFace upload -----

    async def upload_to_huggingface(
        self,
        file_path: str,
        repo_name: str,
        token: str,
    ) -> dict:
        r"""Upload dataset to HuggingFace.

        Args:
            file_path (str): Path to the dataset JSON file.
            repo_name (str): HuggingFace repo ID
                (e.g. "user/dataset-name").
            token (str): HuggingFace API token.

        Returns:
            dict: Upload result with success status and
                repo URL.

        Raises:
            Exception: If upload fails or huggingface_hub
                is not installed.
        """
        try:
            from huggingface_hub import HfApi

            api = HfApi()
            api.upload_file(
                path_or_fileobj=file_path,
                path_in_repo="dataset.json",
                repo_id=repo_name,
                repo_type="dataset",
                token=token,
            )

            return {
                "success": True,
                "repo_url": (
                    "https://huggingface.co/datasets/"
                    f"{repo_name}"
                ),
            }

        except ImportError:
            raise Exception(
                "huggingface_hub not installed. "
                "Run: pip install huggingface_hub"
            )
        except Exception as exc:
            raise Exception(
                "Failed to upload to HuggingFace: "
                f"{exc}"
            ) from exc
