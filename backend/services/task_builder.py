import os
import toml
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime

from models.harbor import (
    HarborTask,
    TaskConfigModel,
    EnvironmentConfigModel,
    AgentConfigModel,
    VerifierConfigModel,
    TaskStatus,
)


class TaskBuilder:
    """Service for building and managing Harbor tasks"""

    def __init__(self, tasks_dir: str = "./tasks"):
        self.tasks_dir = Path(tasks_dir)
        self.tasks_dir.mkdir(parents=True, exist_ok=True)

    def create_task(
        self,
        name: str,
        description: str,
        instruction: str,
        task_config: Optional[TaskConfigModel] = None,
        environment_config: Optional[EnvironmentConfigModel] = None,
        agent_config: Optional[AgentConfigModel] = None,
        verifier_config: Optional[VerifierConfigModel] = None,
    ) -> HarborTask:
        """Create a new Harbor task"""

        task = HarborTask(
            id=self._generate_task_id(name),
            name=name,
            description=description,
            status=TaskStatus.DRAFT,
            task_config=task_config or TaskConfigModel(name=name, description=description),
            environment_config=environment_config or EnvironmentConfigModel(),
            agent_config=agent_config or AgentConfigModel(),
            verifier_config=verifier_config or VerifierConfigModel(),
            instruction=instruction,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        self.save_task(task)
        return task

    def update_task(self, task: HarborTask) -> HarborTask:
        """Update existing task"""
        task.updated_at = datetime.now()
        self.save_task(task)
        return task

    def save_task(self, task: HarborTask) -> None:
        """Save task to disk"""
        task_dir = self.tasks_dir / task.id
        task_dir.mkdir(parents=True, exist_ok=True)

        task_toml_path = task_dir / "task.toml"
        with open(task_toml_path, "w") as f:
            toml.dump(self._task_to_dict(task), f)

        instruction_path = task_dir / "instruction.md"
        with open(instruction_path, "w") as f:
            f.write(task.instruction)

        if task.tests:
            tests_dir = task_dir / "tests"
            tests_dir.mkdir(exist_ok=True)
            for idx, test in enumerate(task.tests):
                test_path = tests_dir / f"test_{idx}.sh"
                with open(test_path, "w") as f:
                    f.write(f"#!/bin/bash\n{test}")

        if task.environment_files:
            env_dir = task_dir / "environment"
            env_dir.mkdir(exist_ok=True)
            for filename, content in task.environment_files.items():
                file_path = env_dir / filename
                with open(file_path, "w") as f:
                    f.write(content)

    def load_task(self, task_id: str) -> Optional[HarborTask]:
        """Load task from disk"""
        task_dir = self.tasks_dir / task_id
        if not task_dir.exists():
            return None

        task_toml_path = task_dir / "task.toml"
        if not task_toml_path.exists():
            return None

        with open(task_toml_path, "r") as f:
            data = toml.load(f)

        instruction_path = task_dir / "instruction.md"
        if instruction_path.exists():
            with open(instruction_path, "r") as f:
                data["instruction"] = f.read()

        tests_dir = task_dir / "tests"
        if tests_dir.exists():
            data["tests"] = []
            for test_file in sorted(tests_dir.glob("test_*.sh")):
                with open(test_file, "r") as f:
                    data["tests"].append(f.read())

        env_dir = task_dir / "environment"
        if env_dir.exists():
            data["environment_files"] = {}
            for env_file in env_dir.iterdir():
                with open(env_file, "r") as f:
                    data["environment_files"][env_file.name] = f.read()

        return HarborTask(**data)

    def list_tasks(self) -> List[HarborTask]:
        """List all tasks"""
        tasks = []
        for task_dir in self.tasks_dir.iterdir():
            if task_dir.is_dir():
                task = self.load_task(task_dir.name)
                if task:
                    tasks.append(task)
        return sorted(tasks, key=lambda t: t.created_at, reverse=True)

    def delete_task(self, task_id: str) -> bool:
        """Delete task"""
        task_dir = self.tasks_dir / task_id
        if not task_dir.exists():
            return False

        import shutil
        shutil.rmtree(task_dir)
        return True

    def export_task(self, task_id: str) -> Dict:
        """Export task in Harbor format"""
        task = self.load_task(task_id)
        if not task:
            raise ValueError(f"Task not found: {task_id}")

        return {
            "task.toml": self._task_to_toml(task),
            "instruction.md": task.instruction,
            "tests": {f"test_{idx}.sh": test for idx, test in enumerate(task.tests)},
            "environment": task.environment_files,
        }

    def _task_to_dict(self, task: HarborTask) -> Dict:
        """Convert task to dictionary for TOML serialization"""
        return {
            "id": task.id,
            "name": task.name,
            "description": task.description,
            "status": task.status.value,
            "task_config": task.task_config.model_dump(),
            "environment_config": task.environment_config.model_dump(),
            "agent_config": task.agent_config.model_dump(),
            "verifier_config": task.verifier_config.model_dump(),
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
        }

    def _task_to_toml(self, task: HarborTask) -> str:
        """Convert task to TOML format"""
        task_dict = {
            "task": {
                "name": task.name,
                "description": task.description,
                "difficulty": task.task_config.difficulty,
                "tags": task.task_config.tags,
            },
            "environment": {
                "type": task.environment_config.environment_type.value,
                "base_image": task.environment_config.base_image,
            },
            "agent": {
                "type": task.agent_config.agent_type,
                "model": task.agent_config.model,
            },
            "verifier": {
                "test_commands": task.verifier_config.test_commands,
                "timeout": task.verifier_config.timeout,
            },
        }
        return toml.dumps(task_dict)

    def _generate_task_id(self, name: str) -> str:
        """Generate unique task ID"""
        import uuid
        from datetime import datetime

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        short_id = str(uuid.uuid4())[:8]
        safe_name = "".join(c if c.isalnum() or c in "-_" else "-" for c in name)
        return f"{safe_name}-{timestamp}-{short_id}"
