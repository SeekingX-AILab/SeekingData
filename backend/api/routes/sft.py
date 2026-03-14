from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Depends,
)
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List
import tempfile
import os
import uuid
import json
from pathlib import Path

from models.sft import (
    GenerateRequest,
    DataItem,
    BatchProcessRequest,
    CoTGenerateRequest,
    CoTData,
    ConfigUpdate,
    SFTConfig,
)
from services.sft_service import SFTService
from config import settings

router = APIRouter(prefix="/api/sft", tags=["sft"])


def _config_path() -> Path:
    r"""Return the path to the JSON config file.

    The config file is stored at ``backend/config.json``,
    located relative to this source file.

    Returns:
        Path: Absolute path to ``config.json``.
    """
    return Path(__file__).resolve().parents[2] / "config.json"


def _load_config() -> dict:
    r"""Read the JSON config file and return its contents.

    If the file does not exist or contains invalid JSON,
    an empty dictionary is returned.

    Returns:
        dict: Parsed configuration dictionary.
    """
    path = _config_path()
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _save_config(data: dict) -> None:
    r"""Persist a configuration dictionary to the JSON file.

    Args:
        data (dict): Configuration key-value pairs to save.
    """
    path = _config_path()
    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def _apply_config_to_settings(cfg: dict) -> None:
    r"""Apply loaded JSON config values to runtime settings.

    Only keys that are present and non-empty in *cfg*
    will override the corresponding runtime setting.

    Args:
        cfg (dict): Configuration dictionary from JSON file.
    """
    if cfg.get("base_url"):
        settings.llm_api_base = cfg["base_url"]
    if cfg.get("api_key"):
        settings.llm_api_key = cfg["api_key"]
    if cfg.get("model"):
        settings.llm_model = cfg["model"]
    if cfg.get("suggestions_count") is not None:
        settings.suggestions_count = cfg["suggestions_count"]


# Apply persisted config on module load so that the
# runtime settings reflect the last saved configuration.
_apply_config_to_settings(_load_config())


def get_sft_service() -> SFTService:
    r"""Dependency to get SFT service instance.

    Returns:
        SFTService: Configured service backed by current
            runtime settings.
    """
    config = SFTConfig(
        base_url=settings.llm_api_base,
        api_key=settings.llm_api_key,
        model=settings.llm_model,
        suggestions_count=settings.suggestions_count,
    )
    return SFTService(config)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    service: SFTService = Depends(get_sft_service),
):
    """Upload and extract content from file."""
    if not file.filename:
        raise HTTPException(
            status_code=400, detail="No file provided"
        )

    allowed_extensions = [
        ".pdf", ".docx", ".pptx", ".xlsx", ".csv",
        ".txt", ".md", ".html", ".tex",
        ".png", ".jpg", ".jpeg",
    ]
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported file type. Allowed: "
                f"{', '.join(allowed_extensions)}"
            ),
        )

    with tempfile.NamedTemporaryFile(
        delete=False, suffix=file_ext
    ) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name

    try:
        extracted_content = (
            await service.extract_content_from_file(
                tmp_file_path
            )
        )
        return {"content": extracted_content}
    finally:
        os.unlink(tmp_file_path)


@router.post("/extract-url")
async def extract_url(
    request: BatchProcessRequest,
    service: SFTService = Depends(get_sft_service),
):
    """Extract content from URL."""
    try:
        content = await service.extract_content_from_url(
            request.url
        )
        return {"content": content}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


@router.post("/generate")
async def generate_sft_data(
    request: GenerateRequest,
    service: SFTService = Depends(get_sft_service),
):
    """Generate SFT training data."""
    try:
        items = await service.generate_sft_data(
            content=request.content,
            instruction=request.instruction,
            suggestions_count=request.suggestions_count,
        )
        return {
            "items": [item.model_dump() for item in items]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


@router.post("/generate-stream")
async def generate_sft_data_stream(
    request: GenerateRequest,
    service: SFTService = Depends(get_sft_service),
):
    r"""Stream SFT generation progress via SSE.

    Returns a Server-Sent Events stream that emits
    progress, items, and done events as each generation
    round completes. This allows the frontend to show
    real-time progress instead of blocking.

    Args:
        request (GenerateRequest): The generation params
            (content, instruction, suggestions_count).
        service (SFTService): Injected SFT service.

    Returns:
        StreamingResponse: SSE text/event-stream response.
    """
    async def event_generator():
        """Yield SSE-formatted events from the service."""
        try:
            async for event in (
                service.generate_sft_data_stream(
                    content=request.content,
                    instruction=request.instruction,
                    suggestions_count=(
                        request.suggestions_count
                    ),
                )
            ):
                yield (
                    f"data: {json.dumps(event)}\n\n"
                )
        except Exception as exc:
            error_event = {
                "type": "error",
                "message": str(exc),
            }
            yield (
                f"data: {json.dumps(error_event)}\n\n"
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/batch-process")
async def batch_process_url(
    request: BatchProcessRequest,
    service: SFTService = Depends(get_sft_service),
):
    """Process single URL in batch mode."""
    try:
        content = await service.extract_content_from_url(
            request.url
        )
        items = await service.generate_sft_data(
            content=content,
            instruction=(
                "Generate training data from this content"
            ),
        )
        return {
            "item": (
                items[0].model_dump() if items else None
            )
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


@router.post("/cot-generate")
async def generate_cot_data(
    request: CoTGenerateRequest,
    service: SFTService = Depends(get_sft_service),
):
    """Generate Chain of Thought reasoning data."""
    try:
        cot_data = await service.generate_cot_data(
            request.question
        )
        return cot_data.model_dump()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e)
        )


@router.post("/generate-image-description")
async def generate_image_description(
    file: UploadFile = File(...),
    service: SFTService = Depends(get_sft_service),
):
    """Generate description for uploaded image."""
    if not file.filename:
        raise HTTPException(
            status_code=400, detail="No file provided"
        )

    with tempfile.NamedTemporaryFile(
        delete=False, suffix=".jpg"
    ) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name

    try:
        description = (
            await service.generate_image_description(
                tmp_file_path
            )
        )
        return {"description": description}
    finally:
        os.unlink(tmp_file_path)


@router.post("/upload-to-hf")
async def upload_to_huggingface(
    file: UploadFile = File(...),
    repo_name: str = "",
    token: str = "",
    service: SFTService = Depends(get_sft_service),
):
    """Upload dataset to HuggingFace."""
    if not file.filename or not repo_name or not token:
        raise HTTPException(
            status_code=400,
            detail=(
                "File, repo_name, and token are required"
            ),
        )

    with tempfile.NamedTemporaryFile(
        delete=False, suffix=".json"
    ) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name

    try:
        result = await service.upload_to_huggingface(
            file_path=tmp_file_path,
            repo_name=repo_name,
            token=token,
        )
        return result
    finally:
        os.unlink(tmp_file_path)


@router.get("/config")
async def get_config():
    r"""Get current SFT configuration.

    Reads persisted JSON config, merges with runtime
    settings, and masks the API key for security
    (only last 4 characters are shown).

    Returns:
        dict: Configuration with masked api_key.
    """
    cfg = _load_config()
    api_key = cfg.get(
        "api_key", settings.llm_api_key
    )
    masked_key = ""
    if api_key and len(api_key) > 4:
        masked_key = "*" * (len(api_key) - 4) + api_key[-4:]
    elif api_key:
        masked_key = api_key

    return {
        "base_url": cfg.get(
            "base_url", settings.llm_api_base
        ),
        "model": cfg.get(
            "model", settings.llm_model
        ),
        "api_key": masked_key,
        "suggestions_count": cfg.get(
            "suggestions_count",
            settings.suggestions_count,
        ),
        "vision_model": cfg.get(
            "vision_model", "openai/gpt-4-vision-preview"
        ),
    }


@router.post("/config")
async def update_config(config_update: ConfigUpdate):
    r"""Update SFT configuration.

    Persists values to JSON file and updates the runtime
    settings so they take effect immediately.

    Args:
        config_update (ConfigUpdate): Partial config
            payload from the client.

    Returns:
        dict: Status message plus current vision_model.
    """
    cfg = _load_config()

    if config_update.base_url:
        cfg["base_url"] = config_update.base_url
        settings.llm_api_base = config_update.base_url
    if config_update.api_key:
        cfg["api_key"] = config_update.api_key
        settings.llm_api_key = config_update.api_key
    if config_update.model:
        cfg["model"] = config_update.model
        settings.llm_model = config_update.model
    if config_update.vision_model:
        cfg["vision_model"] = config_update.vision_model
    if config_update.suggestions_count is not None:
        cfg["suggestions_count"] = (
            config_update.suggestions_count
        )
        settings.suggestions_count = (
            config_update.suggestions_count
        )

    _save_config(cfg)

    return {
        "status": "success",
        "vision_model": cfg.get(
            "vision_model", "openai/gpt-4-vision-preview"
        ),
    }
