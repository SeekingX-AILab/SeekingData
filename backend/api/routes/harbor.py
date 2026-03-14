"""Harbor task management API routes.

Provides endpoints for creating, listing, updating,
validating, exporting, and running Harbor tasks.
"""

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from agents.github_task_agent import GitHubTaskAgent
from config import settings
from models.harbor import (
    GitHubTaskRequest,
    HarborTask,
    RunTaskRequest,
    TaskCreateRequest,
    TaskStatus,
    TaskValidationResult,
)
from services.task_builder import TaskBuilder

router = APIRouter(
    prefix="/api/harbor",
    tags=["harbor"],
)


# ----------------------------------------------------------
# Dependencies
# ----------------------------------------------------------

def get_github_agent() -> GitHubTaskAgent:
    """Dependency: return a GitHubTaskAgent instance."""
    return GitHubTaskAgent(
        github_token=settings.github_token,
    )


def get_task_builder() -> TaskBuilder:
    """Dependency: return a TaskBuilder instance."""
    return TaskBuilder(tasks_dir=settings.tasks_dir)


# ----------------------------------------------------------
# GitHub integration
# ----------------------------------------------------------

@router.post("/github/analyze")
async def analyze_github_repo(
    request: GitHubTaskRequest,
    agent: GitHubTaskAgent = Depends(get_github_agent),
):
    """Analyze a GitHub repository for task generation.

    Args:
        request: The GitHub analysis request.
        agent: Injected GitHubTaskAgent.

    Returns:
        Analysis result dict.
    """
    try:
        analysis = await agent.analyze_repository(
            request,
        )
        return analysis.model_dump()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e),
        )


@router.post("/github/generate-task")
async def generate_task_from_github(
    request: GitHubTaskRequest,
    agent: GitHubTaskAgent = Depends(get_github_agent),
    builder: TaskBuilder = Depends(get_task_builder),
):
    """Generate and save a Harbor task from a GitHub repo.

    Args:
        request: The GitHub analysis request.
        agent: Injected GitHubTaskAgent.
        builder: Injected TaskBuilder.

    Returns:
        The created task dict.
    """
    try:
        analysis = await agent.analyze_repository(
            request,
        )
        task = await agent.generate_harbor_task(
            request, analysis,
        )
        saved = builder.create_task(
            name=task.name,
            description=task.description,
            instruction=task.instruction,
            task_config=task.task_config,
            tests=task.tests,
            environment_files=task.environment_files,
        )
        return saved.model_dump()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e),
        )


# ----------------------------------------------------------
# Task CRUD
# ----------------------------------------------------------

@router.post("/tasks")
async def create_task(
    req: TaskCreateRequest,
    builder: TaskBuilder = Depends(get_task_builder),
):
    """Create a new Harbor task.

    Args:
        req: Task creation payload.
        builder: Injected TaskBuilder.

    Returns:
        The created task dict.
    """
    try:
        saved = builder.create_task(
            name=req.name,
            description=req.description,
            instruction=req.instruction,
            task_config=req.task_config,
            tests=req.tests,
            environment_files=req.environment_files,
        )
        return saved.model_dump()
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e),
        )


@router.get("/tasks")
async def list_tasks(
    builder: TaskBuilder = Depends(get_task_builder),
):
    """List all Harbor tasks.

    Args:
        builder: Injected TaskBuilder.

    Returns:
        List of task dicts.
    """
    try:
        tasks = builder.list_tasks()
        return [t.model_dump() for t in tasks]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e),
        )


@router.get("/tasks/{task_id}")
async def get_task(
    task_id: str,
    builder: TaskBuilder = Depends(get_task_builder),
):
    """Get a specific task by ID.

    Args:
        task_id: The task identifier.
        builder: Injected TaskBuilder.

    Returns:
        The task dict.
    """
    task = builder.load_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404, detail="Task not found",
        )
    return task.model_dump()


@router.put("/tasks/{task_id}")
async def update_task(
    task_id: str,
    task: HarborTask,
    builder: TaskBuilder = Depends(get_task_builder),
):
    """Update an existing task.

    Args:
        task_id: The task identifier.
        task: The updated task data.
        builder: Injected TaskBuilder.

    Returns:
        The updated task dict.
    """
    existing = builder.load_task(task_id)
    if not existing:
        raise HTTPException(
            status_code=404, detail="Task not found",
        )
    task.id = task_id
    updated = builder.update_task(task)
    return updated.model_dump()


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str,
    builder: TaskBuilder = Depends(get_task_builder),
):
    """Delete a task.

    Args:
        task_id: The task identifier.
        builder: Injected TaskBuilder.

    Returns:
        Status confirmation dict.
    """
    success = builder.delete_task(task_id)
    if not success:
        raise HTTPException(
            status_code=404, detail="Task not found",
        )
    return {"status": "deleted"}


# ----------------------------------------------------------
# Validation
# ----------------------------------------------------------

@router.post("/tasks/{task_id}/validate")
async def validate_task(
    task_id: str,
    builder: TaskBuilder = Depends(get_task_builder),
):
    """Validate a task against Harbor requirements.

    Checks that the task directory contains a parseable
    ``task.toml``, non-empty ``instruction.md``, an
    ``environment/Dockerfile``, and ``tests/test.sh``.

    Args:
        task_id: The task identifier.
        builder: Injected TaskBuilder.

    Returns:
        Validation result dict.
    """
    task = builder.load_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404, detail="Task not found",
        )

    errors = []
    warnings = []
    task_dir = Path(settings.tasks_dir) / task_id

    # Check task.toml is parseable by real Harbor
    try:
        from harbor.models.task.config import (
            TaskConfig as RealTaskConfig,
        )
        toml_path = task_dir / "task.toml"
        if toml_path.exists():
            RealTaskConfig.model_validate_toml(
                toml_path.read_text(encoding="utf-8"),
            )
        else:
            errors.append("task.toml is missing")
    except ImportError:
        warnings.append(
            "Harbor not installed; "
            "skipped task.toml validation",
        )
    except Exception as e:
        errors.append(
            f"task.toml is invalid: {e}",
        )

    # Check instruction.md
    instr_path = task_dir / "instruction.md"
    if not instr_path.exists():
        errors.append("instruction.md is missing")
    elif not instr_path.read_text(
        encoding="utf-8",
    ).strip():
        errors.append("instruction.md is empty")

    # Check environment/Dockerfile
    dockerfile = task_dir / "environment" / "Dockerfile"
    compose = (
        task_dir / "environment"
        / "docker-compose.yaml"
    )
    if not dockerfile.exists() and not compose.exists():
        errors.append(
            "environment/ must contain a Dockerfile "
            "or docker-compose.yaml",
        )

    # Check tests/test.sh
    test_sh = task_dir / "tests" / "test.sh"
    if not test_sh.exists():
        errors.append("tests/test.sh is missing")

    # Warnings for optional items
    if not task.tests:
        warnings.append("test.sh has no real commands")

    result = TaskValidationResult(
        task_id=task_id,
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
    )
    return result.model_dump()


# ----------------------------------------------------------
# Run task via Harbor Job API
# ----------------------------------------------------------

@router.post("/tasks/{task_id}/run")
async def run_task(
    task_id: str,
    req: RunTaskRequest = RunTaskRequest(),
    builder: TaskBuilder = Depends(get_task_builder),
):
    """Run a task using the real Harbor Job API.

    Builds a ``Job(JobConfig(...))`` pointing at the task
    directory and executes it.

    Args:
        task_id: The task identifier.
        req: Optional run configuration (agent name,
            model).
        builder: Injected TaskBuilder.

    Returns:
        Dict with status and job result.
    """
    task = builder.load_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404, detail="Task not found",
        )

    task.status = TaskStatus.TESTING
    builder.update_task(task)

    try:
        from harbor import (
            Job,
            JobConfig,
            LocalDatasetConfig,
        )
        from harbor.models.trial.config import (
            AgentConfig as TrialAgentConfig,
        )

        task_dir = Path(settings.tasks_dir) / task_id

        job = Job(JobConfig(
            datasets=[
                LocalDatasetConfig(
                    path=task_dir.parent,
                    task_names=[task_dir.name],
                ),
            ],
            agents=[
                TrialAgentConfig(
                    name=req.agent_name,
                    model_name=req.model_name,
                ),
            ],
            job_name=f"seekingdata-{task_id}",
        ))

        result = await job.run()

        task.status = (
            TaskStatus.COMPLETED
            if getattr(result, "success", False)
            else TaskStatus.FAILED
        )
        builder.update_task(task)

        return {
            "status": task.status.value,
            "result": (
                result.model_dump()
                if hasattr(result, "model_dump")
                else str(result)
            ),
        }

    except ImportError:
        task.status = TaskStatus.FAILED
        builder.update_task(task)
        raise HTTPException(
            status_code=500,
            detail=(
                "Harbor not installed. "
                "Add harbor to dependencies."
            ),
        )
    except Exception as e:
        task.status = TaskStatus.FAILED
        builder.update_task(task)
        raise HTTPException(
            status_code=500, detail=str(e),
        )


# ----------------------------------------------------------
# Export
# ----------------------------------------------------------

@router.get("/tasks/{task_id}/export")
async def export_task(
    task_id: str,
    builder: TaskBuilder = Depends(get_task_builder),
):
    """Export a task in Harbor directory format.

    Args:
        task_id: The task identifier.
        builder: Injected TaskBuilder.

    Returns:
        Dictionary with task.toml, instruction.md,
        tests, and environment file contents.
    """
    try:
        return builder.export_task(task_id)
    except ValueError as e:
        raise HTTPException(
            status_code=404, detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=str(e),
        )
