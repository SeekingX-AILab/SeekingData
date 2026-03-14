from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
import tempfile
import os
import uuid

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


def get_sft_service() -> SFTService:
    """Dependency to get SFT service instance"""
    config = SFTConfig(
        base_url=settings.llm_api_base,
        api_key=settings.llm_api_key,
        model=settings.llm_model,
        suggestions_count=settings.suggestions_count,
    )
    return SFTService(config)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), service: SFTService = Depends(get_sft_service)
):
    """Upload and extract content from file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    allowed_extensions = [".pdf", ".docx", ".txt", ".md"]
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}",
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name

    try:
        extracted_content = await service.extract_content_from_file(tmp_file_path)
        return {"content": extracted_content}
    finally:
        os.unlink(tmp_file_path)


@router.post("/extract-url")
async def extract_url(
    request: BatchProcessRequest, service: SFTService = Depends(get_sft_service)
):
    """Extract content from URL"""
    try:
        content = await service.extract_content_from_url(request.url)
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate")
async def generate_sft_data(
    request: GenerateRequest, service: SFTService = Depends(get_sft_service)
):
    """Generate SFT training data"""
    try:
        items = await service.generate_sft_data(
            content=request.content,
            instruction=request.instruction,
            suggestions_count=request.suggestions_count,
        )
        return {"items": [item.model_dump() for item in items]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-process")
async def batch_process_url(
    request: BatchProcessRequest, service: SFTService = Depends(get_sft_service)
):
    """Process single URL in batch mode"""
    try:
        content = await service.extract_content_from_url(request.url)
        items = await service.generate_sft_data(
            content=content, instruction="Generate training data from this content"
        )
        return {"item": items[0].model_dump() if items else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cot-generate")
async def generate_cot_data(
    request: CoTGenerateRequest, service: SFTService = Depends(get_sft_service)
):
    """Generate Chain of Thought reasoning data"""
    try:
        cot_data = await service.generate_cot_data(request.question)
        return cot_data.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-image-description")
async def generate_image_description(
    file: UploadFile = File(...), service: SFTService = Depends(get_sft_service)
):
    """Generate description for uploaded image"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name

    try:
        description = await service.generate_image_description(tmp_file_path)
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
    """Upload dataset to HuggingFace"""
    if not file.filename or not repo_name or not token:
        raise HTTPException(
            status_code=400, detail="File, repo_name, and token are required"
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_file_path = tmp_file.name

    try:
        result = await service.upload_to_huggingface(
            file_path=tmp_file_path, repo_name=repo_name, token=token
        )
        return result
    finally:
        os.unlink(tmp_file_path)


@router.get("/config")
async def get_config():
    """Get current SFT configuration"""
    return {
        "base_url": settings.llm_api_base,
        "model": settings.llm_model,
        "suggestions_count": settings.suggestions_count,
    }


@router.post("/config")
async def update_config(config_update: ConfigUpdate):
    """Update SFT configuration"""
    if config_update.base_url:
        settings.llm_api_base = config_update.base_url
    if config_update.api_key:
        settings.llm_api_key = config_update.api_key
    if config_update.model:
        settings.llm_model = config_update.model
    if config_update.vision_model:
        settings.llm_vision_model = (
            config_update.vision_model
        )
    if config_update.suggestions_count:
        settings.suggestions_count = (
            config_update.suggestions_count
        )

    return {"status": "success"}
