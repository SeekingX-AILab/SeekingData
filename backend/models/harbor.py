from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    DRAFT = "draft"
    READY = "ready"
    TESTING = "testing"
    COMPLETED = "completed"
    FAILED = "failed"


class EnvironmentType(str, Enum):
    E2B = "e2b"
    DOCKER = "docker"
    DAYTONA = "daytona"
    RUNLOOP = "runloop"
    LOCAL = "local"


class GitHubTaskRequest(BaseModel):
    repo_url: str
    issue_number: Optional[int] = None
    pr_number: Optional[int] = None
    branch: Optional[str] = None
    additional_context: Optional[str] = None


class TaskConfigModel(BaseModel):
    name: str
    description: str
    difficulty: int = Field(default=1, ge=1, le=10)
    tags: List[str] = Field(default_factory=list)
    timeout: int = Field(default=3600)


class EnvironmentConfigModel(BaseModel):
    environment_type: EnvironmentType = EnvironmentType.DOCKER
    base_image: str = "python:3.12-slim"
    setup_commands: List[str] = Field(default_factory=list)
    required_ports: List[int] = Field(default_factory=list)


class AgentConfigModel(BaseModel):
    agent_type: str = "claude-code"
    model: str = "claude-sonnet-4-20250514"
    max_tokens: int = 16000
    temperature: float = Field(default=0.7, ge=0, le=2)


class VerifierConfigModel(BaseModel):
    test_commands: List[str] = Field(default_factory=list)
    success_criteria: List[str] = Field(default_factory=list)
    timeout: int = Field(default=300)


class HarborTask(BaseModel):
    id: str
    name: str
    description: str
    status: TaskStatus = TaskStatus.DRAFT
    task_config: TaskConfigModel
    environment_config: EnvironmentConfigModel
    agent_config: AgentConfigModel
    verifier_config: VerifierConfigModel
    instruction: str
    tests: List[str] = Field(default_factory=list)
    environment_files: Dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class TaskValidationResult(BaseModel):
    task_id: str
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    test_results: List[Dict[str, Any]] = Field(default_factory=list)


class GitHubAnalysisResult(BaseModel):
    repo_url: str
    repo_name: str
    issue_title: Optional[str] = None
    issue_body: Optional[str] = None
    pr_title: Optional[str] = None
    pr_body: Optional[str] = None
    code_context: List[Dict[str, str]] = Field(default_factory=list)
    suggested_tasks: List[str] = Field(default_factory=list)


class TaskExportFormat(BaseModel):
    """Harbor task.toml export format"""
    task_id: str
    task_name: str
    description: str
    difficulty: int
    tags: List[str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "fix-login-bug",
                "task_name": "Fix Login Bug",
                "description": "Fix authentication issue in login module",
                "difficulty": 3,
                "tags": ["bugfix", "authentication"]
            }
        }
