from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SFTConfig(BaseModel):
    """Configuration for SFT data generation service.

    Attributes:
        base_url (str): The base URL for the LLM API endpoint.
        api_key (str): The API key for authenticating with the
            LLM provider.
        model (str): The model identifier in litellm format
            (e.g. "openai/gpt-4", "deepseek/deepseek-chat").
        vision_model (str): The vision model identifier used
            for image description tasks.
        suggestions_count (int): Number of data items to
            generate per request (1-10).
    """

    base_url: str
    api_key: str
    model: str = "openai/gpt-4"
    vision_model: str = "openai/gpt-4-vision-preview"
    suggestions_count: int = Field(default=3, ge=1, le=10)


class GenerateRequest(BaseModel):
    content: str
    instruction: str
    suggestions_count: int = Field(default=3, ge=1, le=10)


class DataItem(BaseModel):
    id: str
    instruction: str
    input: str
    output: str
    source: str
    timestamp: datetime = Field(default_factory=datetime.now)


class BatchProcessRequest(BaseModel):
    url: str


class CoTGenerateRequest(BaseModel):
    question: str


class CoTStep(BaseModel):
    step: int
    thought: str


class CoTData(BaseModel):
    id: str
    question: str
    reasoning_steps: List[CoTStep]
    answer: str


class UploadHFRequest(BaseModel):
    repo_name: str
    token: str
    file_path: str


class ConfigUpdate(BaseModel):
    """Partial update model for SFT configuration.

    Attributes:
        base_url (Optional[str]): New LLM API base URL.
        api_key (Optional[str]): New LLM API key.
        model (Optional[str]): New model identifier.
        vision_model (Optional[str]): New vision model
            identifier.
        suggestions_count (Optional[int]): New suggestion
            count.
    """

    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None
    vision_model: Optional[str] = None
    suggestions_count: Optional[int] = None
