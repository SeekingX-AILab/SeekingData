from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # LLM Configuration (litellm-compatible)
    llm_api_base: str = "https://api.openai.com/v1"
    llm_api_key: str = ""
    llm_model: str = "openai/gpt-4"
    suggestions_count: int = 3

    # GitHub Configuration
    github_token: Optional[str] = None

    # Harbor Configuration
    tasks_dir: str = "./tasks"
    harbor_registry_url: Optional[str] = None

    # Application Settings
    app_name: str = "SeekingData Pro"
    debug: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
