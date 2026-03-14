"""Harbor task models aligned with real Harbor API.

These models mirror the Harbor ``TaskConfig`` schema
(``harbor.models.task.config``) so that task directories
produced by SeekingData are directly consumable by Harbor's
``Job`` runner.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    """Lifecycle status of a SeekingData-managed task."""

    DRAFT = "draft"
    READY = "ready"
    TESTING = "testing"
    COMPLETED = "completed"
    FAILED = "failed"


class EnvironmentType(str, Enum):
    """Supported Harbor environment backends."""

    DOCKER = "docker"
    E2B = "e2b"
    DAYTONA = "daytona"
    LOCAL = "local"


# ------------------------------------------------------------------
# Models that map 1-to-1 with sections inside ``task.toml``
# ------------------------------------------------------------------

class VerifierConfigModel(BaseModel):
    """Maps to ``[verifier]`` in task.toml.

    Attributes:
        timeout_sec: Max seconds the verifier may run.
        env: Environment variables forwarded to the
            verifier container.
    """

    timeout_sec: float = 600.0
    env: Dict[str, str] = Field(default_factory=dict)


class AgentConfigModel(BaseModel):
    """Maps to ``[agent]`` in task.toml.

    Attributes:
        timeout_sec: Max seconds the agent may run.
    """

    timeout_sec: float = 600.0


class EnvironmentConfigModel(BaseModel):
    """Maps to ``[environment]`` in task.toml.

    Attributes:
        build_timeout_sec: Max seconds to build the
            environment image.
        docker_image: Optional base Docker image.
        cpus: Number of CPUs allocated.
        memory_mb: Memory in megabytes.
        storage_mb: Storage in megabytes.
        gpus: Number of GPUs allocated.
        allow_internet: Whether network access is
            permitted inside the environment.
    """

    build_timeout_sec: float = 600.0
    docker_image: Optional[str] = None
    cpus: int = 1
    memory_mb: int = 2048
    storage_mb: int = 10240
    gpus: int = 0
    allow_internet: bool = True


class TaskConfigModel(BaseModel):
    """Maps to the full content of ``task.toml``.

    Attributes:
        version: Schema version string.
        metadata: Free-form metadata dict (author,
            difficulty, tags, etc.).
        verifier: Verifier section configuration.
        agent: Agent section configuration.
        environment: Environment section configuration.
    """

    version: str = "1.0"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    verifier: VerifierConfigModel = Field(
        default_factory=VerifierConfigModel,
    )
    agent: AgentConfigModel = Field(
        default_factory=AgentConfigModel,
    )
    environment: EnvironmentConfigModel = Field(
        default_factory=EnvironmentConfigModel,
    )


# ------------------------------------------------------------------
# SeekingData's wrapper around a Harbor task
# ------------------------------------------------------------------

class HarborTask(BaseModel):
    """SeekingData's representation of a Harbor task.

    Attributes:
        id: Unique task identifier (also the directory
            name under ``tasks/``).
        name: Human-readable task name.
        description: Short description of the task.
        status: Current lifecycle status.
        task_config: Content that will be serialized to
            ``task.toml``.
        instruction: Markdown instructions written to
            ``instruction.md``.
        tests: Lines for ``tests/test.sh``.
        environment_files: Filename-to-content mapping
            written into ``environment/``.
        created_at: Creation timestamp.
        updated_at: Last-modified timestamp.
    """

    id: str
    name: str
    description: str
    status: TaskStatus = TaskStatus.DRAFT
    task_config: TaskConfigModel = Field(
        default_factory=TaskConfigModel,
    )
    instruction: str = ""
    tests: List[str] = Field(default_factory=list)
    environment_files: Dict[str, str] = Field(
        default_factory=dict,
    )
    created_at: datetime = Field(
        default_factory=datetime.now,
    )
    updated_at: datetime = Field(
        default_factory=datetime.now,
    )


# ------------------------------------------------------------------
# Request / result models used by API routes
# ------------------------------------------------------------------

class TaskCreateRequest(BaseModel):
    """Request body for creating a new task via API.

    Attributes:
        name: Human-readable task name.
        description: Short description of the task.
        instruction: Markdown instruction content.
        task_config: Optional task configuration; uses
            defaults when omitted.
        tests: Optional test script lines.
        environment_files: Optional environment files.
    """

    name: str
    description: str = ""
    instruction: str = ""
    task_config: TaskConfigModel = Field(
        default_factory=TaskConfigModel,
    )
    tests: List[str] = Field(default_factory=list)
    environment_files: Dict[str, str] = Field(
        default_factory=dict,
    )


class RunTaskRequest(BaseModel):
    """Request body for running a task via Harbor.

    Attributes:
        agent_name: Name of the Harbor agent to use.
        model_name: LLM model identifier for the agent.
    """

    agent_name: str = "claude-code"
    model_name: str = (
        "anthropic/claude-sonnet-4-20250514"
    )


class TaskValidationResult(BaseModel):
    """Result of validating a task directory.

    Attributes:
        task_id: Identifier of the validated task.
        is_valid: Whether the task passed validation.
        errors: List of blocking errors found.
        warnings: List of non-blocking warnings.
        test_results: Detailed per-test results.
    """

    task_id: str
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    test_results: List[Dict[str, Any]] = Field(
        default_factory=list,
    )


class GitHubTaskRequest(BaseModel):
    """Request to analyze a GitHub repo for task generation.

    Attributes:
        repo_url: Full URL of the GitHub repository.
        issue_number: Optional issue number to focus on.
        pr_number: Optional PR number to focus on.
        branch: Optional branch name.
        additional_context: Extra context for the agent.
    """

    repo_url: str
    issue_number: Optional[int] = None
    pr_number: Optional[int] = None
    branch: Optional[str] = None
    additional_context: Optional[str] = None


class GitHubAnalysisResult(BaseModel):
    """Result of analyzing a GitHub repository.

    Attributes:
        repo_url: URL that was analyzed.
        repo_name: ``owner/repo`` string.
        issue_title: Title of the analyzed issue.
        issue_body: Body of the analyzed issue.
        pr_title: Title of the analyzed PR.
        pr_body: Body of the analyzed PR.
        code_context: Relevant file/dir entries.
        suggested_tasks: Auto-generated task suggestions.
    """

    repo_url: str
    repo_name: str
    issue_title: Optional[str] = None
    issue_body: Optional[str] = None
    pr_title: Optional[str] = None
    pr_body: Optional[str] = None
    code_context: List[Dict[str, str]] = Field(
        default_factory=list,
    )
    suggested_tasks: List[str] = Field(
        default_factory=list,
    )


class TaskExportFormat(BaseModel):
    """Exported Harbor task directory structure.

    Attributes:
        task_toml: Serialized ``task.toml`` content.
        instruction_md: Content of ``instruction.md``.
        tests: Mapping of test filenames to contents.
        environment: Mapping of env filenames to contents.
    """

    task_toml: str
    instruction_md: str
    tests: Dict[str, str] = Field(
        default_factory=dict,
    )
    environment: Dict[str, str] = Field(
        default_factory=dict,
    )
