from fastapi import APIRouter, HTTPException, Depends
from typing import List
import os

from models.harbor import (
    GitHubTaskRequest,
    HarborTask,
    TaskValidationResult,
    TaskStatus,
)
from agents.github_task_agent import GitHubTaskAgent
from services.task_builder import TaskBuilder
from config import settings

router = APIRouter(prefix="/api/harbor", tags=["harbor"])


def get_github_agent() -> GitHubTaskAgent:
    """Dependency to get GitHub agent instance"""
    return GitHubTaskAgent(github_token=settings.github_token)


def get_task_builder() -> TaskBuilder:
    """Dependency to get task builder instance"""
    return TaskBuilder(tasks_dir=settings.tasks_dir)


@router.post("/github/analyze")
async def analyze_github_repo(
    request: GitHubTaskRequest, agent: GitHubTaskAgent = Depends(get_github_agent)
):
    """Analyze GitHub repository and extract task information"""
    try:
        analysis = await agent.analyze_repository(request)
        return analysis.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/github/generate-task")
async def generate_task_from_github(
    request: GitHubTaskRequest,
    agent: GitHubTaskAgent = Depends(get_github_agent),
    builder: TaskBuilder = Depends(get_task_builder),
):
    """Generate Harbor task from GitHub repository"""
    try:
        analysis = await agent.analyze_repository(request)
        task = await agent.generate_harbor_task(request, analysis)
        saved_task = builder.create_task(
            name=task.name,
            description=task.description,
            instruction=task.instruction,
            task_config=task.task_config,
            environment_config=task.environment_config,
            agent_config=task.agent_config,
            verifier_config=task.verifier_config,
        )
        return saved_task.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tasks")
async def create_task(
    task: HarborTask, builder: TaskBuilder = Depends(get_task_builder)
):
    """Create a new Harbor task"""
    try:
        saved_task = builder.create_task(
            name=task.name,
            description=task.description,
            instruction=task.instruction,
            task_config=task.task_config,
            environment_config=task.environment_config,
            agent_config=task.agent_config,
            verifier_config=task.verifier_config,
        )
        return saved_task.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks", response_model=List[HarborTask])
async def list_tasks(builder: TaskBuilder = Depends(get_task_builder)):
    """List all Harbor tasks"""
    try:
        tasks = builder.list_tasks()
        return [task.model_dump() for task in tasks]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{task_id}")
async def get_task(
    task_id: str, builder: TaskBuilder = Depends(get_task_builder)
):
    """Get specific task by ID"""
    task = builder.load_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task.model_dump()


@router.put("/tasks/{task_id}")
async def update_task(
    task_id: str,
    task: HarborTask,
    builder: TaskBuilder = Depends(get_task_builder),
):
    """Update existing task"""
    existing_task = builder.load_task(task_id)
    if not existing_task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.id = task_id
    updated_task = builder.update_task(task)
    return updated_task.model_dump()


@router.delete("/tasks/{task_id}")
async def delete_task(
    task_id: str, builder: TaskBuilder = Depends(get_task_builder)
):
    """Delete task"""
    success = builder.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "deleted"}


@router.post("/tasks/{task_id}/validate")
async def validate_task(
    task_id: str, builder: TaskBuilder = Depends(get_task_builder)
):
    """Validate task configuration"""
    task = builder.load_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    errors = []
    warnings = []

    if not task.name:
        errors.append("Task name is required")

    if not task.instruction:
        errors.append("Instruction is required")

    if not task.tests:
        warnings.append("No tests defined")

    if not task.verifier_config.test_commands:
        warnings.append("No verifier test commands defined")

    is_valid = len(errors) == 0

    result = TaskValidationResult(
        task_id=task_id,
        is_valid=is_valid,
        errors=errors,
        warnings=warnings,
    )

    return result.model_dump()


@router.post("/tasks/{task_id}/run")
async def run_task(
    task_id: str, builder: TaskBuilder = Depends(get_task_builder)
):
    """Run task in Harbor environment"""
    task = builder.load_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = TaskStatus.TESTING
    builder.update_task(task)

    try:
        from harbor import Job, JobConfig

        job_config = JobConfig(
            task_id=task_id,
            agent_config=task.agent_config.model_dump(),
            environment_config=task.environment_config.model_dump(),
        )

        job = Job(job_config)
        result = await job.run()

        task.status = TaskStatus.COMPLETED if result.success else TaskStatus.FAILED
        builder.update_task(task)

        return {
            "status": task.status.value,
            "result": result.model_dump() if hasattr(result, "model_dump") else str(result),
        }

    except ImportError:
        task.status = TaskStatus.FAILED
        builder.update_task(task)
        raise HTTPException(
            status_code=500,
            detail="Harbor not installed. Run: pip install harbor-ai",
        )
    except Exception as e:
        task.status = TaskStatus.FAILED
        builder.update_task(task)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tasks/{task_id}/export")
async def export_task(
    task_id: str, builder: TaskBuilder = Depends(get_task_builder)
):
    """Export task in Harbor format"""
    try:
        export_data = builder.export_task(task_id)
        return export_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
