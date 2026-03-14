import os
import tempfile
import uuid
from typing import List, Optional
from datetime import datetime
import httpx
from litellm import acompletion
from pathlib import Path

from models.sft import DataItem, CoTData, CoTStep, SFTConfig


class SFTService:
    """Service for generating SFT training data via LLM.

    Uses litellm to support 100+ LLM providers through a
    unified interface. Users configure model, api_key, and
    api_base to switch between providers.

    Attributes:
        config (SFTConfig): The service configuration holding
            model, api_key, base_url, etc.
    """

    def __init__(self, config: SFTConfig):
        """Initialize the SFT service.

        Args:
            config (SFTConfig): Configuration containing LLM
                provider credentials and model settings.
        """
        self.config = config

    async def _llm_call(
        self,
        messages: list,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4000,
    ) -> str:
        """Make an async LLM call via litellm.

        Args:
            messages (list): Chat messages in OpenAI format.
            model (Optional[str]): Model override. Defaults
                to self.config.model.
            temperature (float): Sampling temperature.
            max_tokens (int): Maximum tokens in response.

        Returns:
            str: The content of the assistant's reply.

        Raises:
            Exception: If the LLM call fails.
        """
        response = await acompletion(
            model=model or self.config.model,
            api_key=self.config.api_key,
            api_base=self.config.base_url,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content

    async def extract_content_from_file(
        self, file_path: str
    ) -> str:
        """Extract content from uploaded file.

        Supports PDF, DOCX, TXT, and MD formats.

        Args:
            file_path (str): Path to the uploaded file.

        Returns:
            str: The extracted text content.

        Raises:
            ValueError: If file type is unsupported.
            Exception: If required library is not installed.
        """
        ext = Path(file_path).suffix.lower()

        if ext in ['.txt', '.md']:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()

        elif ext == '.pdf':
            try:
                import pdfplumber
                with pdfplumber.open(file_path) as pdf:
                    text = ''
                    for page in pdf.pages:
                        text += page.extract_text() or ''
                    return text.strip()
            except ImportError:
                raise Exception(
                    "pdfplumber not installed. "
                    "Run: pip install pdfplumber"
                )

        elif ext == '.docx':
            try:
                from docx import Document
                doc = Document(file_path)
                return '\n'.join(
                    [para.text for para in doc.paragraphs]
                )
            except ImportError:
                raise Exception(
                    "python-docx not installed. "
                    "Run: pip install python-docx"
                )

        else:
            raise ValueError(
                f"Unsupported file type: {ext}"
            )

    async def extract_content_from_url(
        self, url: str
    ) -> str:
        """Extract content from a URL.

        Handles HTML, JSON, and plain text responses.

        Args:
            url (str): The URL to fetch content from.

        Returns:
            str: The extracted text content.

        Raises:
            Exception: If the HTTP request fails.
        """
        async with httpx.AsyncClient(
            timeout=30.0
        ) as client:
            try:
                response = await client.get(
                    url, follow_redirects=True
                )
                response.raise_for_status()

                content_type = response.headers.get(
                    'content-type', ''
                )

                if 'text/html' in content_type:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(
                        response.text, 'html.parser'
                    )
                    for script in soup(
                        ["script", "style", "nav", "footer"]
                    ):
                        script.decompose()
                    text = soup.get_text(
                        separator='\n', strip=True
                    )
                    return text

                elif 'application/json' in content_type:
                    return response.text

                else:
                    return response.text[:5000]

            except httpx.HTTPError as e:
                raise Exception(
                    f"Failed to fetch URL: {str(e)}"
                )

    async def generate_sft_data(
        self,
        content: str,
        instruction: str,
        suggestions_count: int = 3
    ) -> List[DataItem]:
        """Generate SFT training data using LLM.

        Args:
            content (str): Source content for data generation.
            instruction (str): User instruction describing
                the desired training data.
            suggestions_count (int): Number of items to
                generate. Defaults to 3.

        Returns:
            List[DataItem]: Generated training data items.

        Raises:
            Exception: If LLM call or parsing fails.
        """
        prompt = (
            f"You are a training data generation assistant."
            f" Based on the following content and "
            f"instruction, generate {suggestions_count} "
            f"high-quality training data items.\n\n"
            f"Content:\n{content}\n\n"
            f"Instruction:\n{instruction}\n\n"
            f"Generate {suggestions_count} different "
            f"training data items. Each item should "
            f"include:\n"
            f"1. A clear instruction\n"
            f"2. Relevant input content (can be empty)\n"
            f"3. A comprehensive output\n\n"
            f"Format each item as JSON:\n"
            f'{{"instruction": "...", "input": "...", '
            f'"output": "..."}}\n\n'
            f"Return as a JSON array."
        )

        try:
            result_text = await self._llm_call(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a training data "
                            "generation expert."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=4000,
            )

            import json

            try:
                items = json.loads(result_text)
                if not isinstance(items, list):
                    items = [items]
            except json.JSONDecodeError:
                items = self._parse_items_from_text(
                    result_text
                )

            data_items = []
            for i, item in enumerate(
                items[:suggestions_count]
            ):
                data_item = DataItem(
                    id=str(uuid.uuid4()),
                    instruction=item.get(
                        'instruction', ''
                    ),
                    input=item.get('input', ''),
                    output=item.get('output', ''),
                    source='ai_generated',
                    timestamp=datetime.now(),
                )
                data_items.append(data_item)

            return data_items

        except Exception as e:
            raise Exception(
                f"Failed to generate data: {str(e)}"
            )

    def _parse_items_from_text(
        self, text: str
    ) -> List[dict]:
        """Parse training items from text fallback.

        Used when JSON parsing of LLM output fails.

        Args:
            text (str): Raw text output from the LLM.

        Returns:
            List[dict]: Parsed training data dicts.
        """
        items = []
        lines = text.strip().split('\n')

        current_item = {}
        for line in lines:
            line = line.strip()
            if line.startswith('Instruction:') or \
               line.startswith('instruction:'):
                if current_item:
                    items.append(current_item)
                current_item = {
                    'instruction': (
                        line.split(':', 1)[1].strip()
                    )
                }
            elif line.startswith('Input:') or \
                 line.startswith('input:'):
                current_item['input'] = (
                    line.split(':', 1)[1].strip()
                )
            elif line.startswith('Output:') or \
                 line.startswith('output:'):
                current_item['output'] = (
                    line.split(':', 1)[1].strip()
                )

        if current_item:
            items.append(current_item)

        return items

    async def generate_cot_data(
        self, question: str
    ) -> CoTData:
        """Generate Chain of Thought reasoning data.

        Args:
            question (str): The question to analyze.

        Returns:
            CoTData: Structured CoT reasoning with steps
                and final answer.

        Raises:
            Exception: If LLM call or parsing fails.
        """
        prompt = (
            f"Analyze this question step by step and "
            f"provide a detailed reasoning chain.\n\n"
            f"Question: {question}\n\n"
            f"Break down your reasoning into clear "
            f"steps:\n"
            f"1. Identify the key components of the "
            f"question\n"
            f"2. Apply logical reasoning to each "
            f"component\n"
            f"3. Combine the reasoning to reach a "
            f"conclusion\n"
            f"4. Provide the final answer\n\n"
            f"Format your response as:\n"
            f"Step 1: [thought]\n"
            f"Step 2: [thought]\n"
            f"...\n"
            f"Answer: [final answer]"
        )

        try:
            result_text = await self._llm_call(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert at logical "
                            "reasoning and chain-of-thought"
                            " analysis."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=2000,
            )

            steps = []
            current_step = None
            answer = ""

            for line in result_text.split('\n'):
                line = line.strip()
                if line.startswith('Step'):
                    if current_step:
                        steps.append(current_step)
                    step_num = len(steps) + 1
                    thought = (
                        line.split(':', 1)[1].strip()
                        if ':' in line
                        else ''
                    )
                    current_step = CoTStep(
                        step=step_num, thought=thought
                    )
                elif line.startswith('Answer:'):
                    if current_step:
                        steps.append(current_step)
                    answer = (
                        line.split(':', 1)[1].strip()
                    )
                elif current_step:
                    current_step.thought += ' ' + line

            if current_step and current_step not in steps:
                steps.append(current_step)

            return CoTData(
                id=str(uuid.uuid4()),
                question=question,
                reasoning_steps=steps,
                answer=answer,
            )

        except Exception as e:
            raise Exception(
                f"Failed to generate CoT data: {str(e)}"
            )

    async def generate_image_description(
        self, image_path: str
    ) -> str:
        """Generate description for image using vision model.

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

            with open(image_path, 'rb') as f:
                image_data = base64.b64encode(
                    f.read()
                ).decode('utf-8')

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

        except Exception as e:
            raise Exception(
                f"Failed to generate image "
                f"description: {str(e)}"
            )

    async def upload_to_huggingface(
        self,
        file_path: str,
        repo_name: str,
        token: str,
    ) -> dict:
        """Upload dataset to HuggingFace.

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
        except Exception as e:
            raise Exception(
                f"Failed to upload to HuggingFace: "
                f"{str(e)}"
            )
