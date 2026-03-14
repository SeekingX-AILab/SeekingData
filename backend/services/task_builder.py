"""Service for building and managing Harbor task directories.

Produces task directories that conform to Harbor's expected
layout::

    task-name/
    ├── task.toml
    ├── instruction.md
    ├── environment/
    │   └── Dockerfile
    ├── tests/
    │   └── test.sh
    └── solution/
        └── solve.sh
"""

import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import toml

from models.harbor import (
    HarborTask,
    TaskConfigModel,
    TaskExportFormat,
    TaskStatus,
)


class TaskBuilder:
    """Service for building and managing Harbor tasks.

    Attributes:
        tasks_dir: Root directory where task sub-dirs
            are stored.
    """

    def __init__(self, tasks_dir: str = "./tasks"):
        """Initialize TaskBuilder.

        Args:
            tasks_dir: Path to the root tasks directory.
        """
        self.tasks_dir = Path(tasks_dir)
        self.tasks_dir.mkdir(parents=True, exist_ok=True)

    # ----------------------------------------------------------
    # CRUD helpers
    # ----------------------------------------------------------

    def create_task(
        self,
        name: str,
        description: str,
        instruction: str = "",
        task_config: Optional[TaskConfigModel] = None,
        tests: Optional[List[str]] = None,
        environment_files: Optional[Dict[str, str]] = None,
    ) -> HarborTask:
        """Create a new Harbor task and persist it to disk.

        Args:
            name: Human-readable task name.
            description: Short task description.
            instruction: Markdown instruction content.
            task_config: Task configuration; uses defaults
                when *None*.
            tests: Lines for ``tests/test.sh``.
            environment_files: Extra files for the
                ``environment/`` directory.

        Returns:
            The newly created ``HarborTask``.
        """
        now = datetime.now()
        task = HarborTask(
            id=self._generate_task_id(name),
            name=name,
            description=description,
            status=TaskStatus.DRAFT,
            task_config=task_config or TaskConfigModel(),
            instruction=instruction,
            tests=tests or [],
            environment_files=environment_files or {},
            created_at=now,
            updated_at=now,
        )
        self.save_task(task)
        return task

    def update_task(self, task: HarborTask) -> HarborTask:
        """Update an existing task on disk.

        Args:
            task: The modified ``HarborTask`` instance.

        Returns:
            The updated ``HarborTask``.
        """
        task.updated_at = datetime.now()
        self.save_task(task)
        return task

    # ----------------------------------------------------------
    # Persistence — write Harbor-compatible directory
    # ----------------------------------------------------------

    def save_task(self, task: HarborTask) -> None:
        """Persist a task as a Harbor-compatible directory.

        Creates the following structure::

            <task.id>/
            ├── task.toml
            ├── instruction.md
            ├── environment/
            │   └── Dockerfile   (default if none provided)
            └── tests/
                └── test.sh

        Args:
            task: The ``HarborTask`` to save.
        """
        task_dir = self.tasks_dir / task.id
        task_dir.mkdir(parents=True, exist_ok=True)

        # -- task.toml
        toml_path = task_dir / "task.toml"
        toml_path.write_text(
            self._task_config_to_toml(task),
            encoding="utf-8",
        )

        # -- instruction.md
        instruction_path = task_dir / "instruction.md"
        instruction_path.write_text(
            task.instruction or "",
            encoding="utf-8",
        )

        # -- environment/
        env_dir = task_dir / "environment"
        env_dir.mkdir(exist_ok=True)
        env_files = task.environment_files
        if not env_files:
            env_files = {
                "Dockerfile": self._default_dockerfile(),
            }
        for filename, content in env_files.items():
            (env_dir / filename).write_text(
                content, encoding="utf-8",
            )

        # -- tests/test.sh
        tests_dir = task_dir / "tests"
        tests_dir.mkdir(exist_ok=True)
        test_script = self._build_test_script(task.tests)
        test_path = tests_dir / "test.sh"
        test_path.write_text(
            test_script, encoding="utf-8",
        )

    # ----------------------------------------------------------
    # Persistence — read from disk
    # ----------------------------------------------------------

    def load_task(
        self, task_id: str,
    ) -> Optional[HarborTask]:
        """Load a task from its directory on disk.

        Args:
            task_id: The task identifier (directory name).

        Returns:
            A ``HarborTask`` if found, else *None*.
        """
        task_dir = self.tasks_dir / task_id
        if not task_dir.exists():
            return None

        toml_path = task_dir / "task.toml"
        if not toml_path.exists():
            return None

        raw = toml.loads(toml_path.read_text(encoding="utf-8"))

        # Extract SeekingData metadata stored alongside
        # the standard Harbor sections.
        sd_meta = raw.pop("_seekingdata", {})

        task_config = TaskConfigModel.model_validate(raw)

        # -- instruction.md
        instr_path = task_dir / "instruction.md"
        instruction = ""
        if instr_path.exists():
            instruction = instr_path.read_text(
                encoding="utf-8",
            )

        # -- tests/test.sh
        tests: List[str] = []
        test_path = task_dir / "tests" / "test.sh"
        if test_path.exists():
            content = test_path.read_text(encoding="utf-8")
            tests = self._parse_test_script(content)

        # -- environment/
        env_files: Dict[str, str] = {}
        env_dir = task_dir / "environment"
        if env_dir.exists():
            for f in env_dir.iterdir():
                if f.is_file():
                    env_files[f.name] = f.read_text(
                        encoding="utf-8",
                    )

        return HarborTask(
            id=task_id,
            name=sd_meta.get("name", task_id),
            description=sd_meta.get("description", ""),
            status=TaskStatus(
                sd_meta.get("status", "draft"),
            ),
            task_config=task_config,
            instruction=instruction,
            tests=tests,
            environment_files=env_files,
            created_at=datetime.fromisoformat(
                sd_meta.get(
                    "created_at",
                    datetime.now().isoformat(),
                ),
            ),
            updated_at=datetime.fromisoformat(
                sd_meta.get(
                    "updated_at",
                    datetime.now().isoformat(),
                ),
            ),
        )

    def list_tasks(self) -> List[HarborTask]:
        """List all tasks stored under ``tasks_dir``.

        Returns:
            List of ``HarborTask`` sorted newest-first.
        """
        tasks: List[HarborTask] = []
        for task_dir in self.tasks_dir.iterdir():
            if task_dir.is_dir():
                task = self.load_task(task_dir.name)
                if task:
                    tasks.append(task)
        return sorted(
            tasks,
            key=lambda t: t.created_at,
            reverse=True,
        )

    def delete_task(self, task_id: str) -> bool:
        """Delete a task directory.

        Args:
            task_id: The task identifier.

        Returns:
            *True* if deleted, *False* if not found.
        """
        task_dir = self.tasks_dir / task_id
        if not task_dir.exists():
            return False
        shutil.rmtree(task_dir)
        return True

    # ----------------------------------------------------------
    # Export
    # ----------------------------------------------------------

    def export_task(self, task_id: str) -> Dict:
        """Export task as a Harbor directory structure dict.

        Args:
            task_id: The task identifier.

        Returns:
            Dictionary matching ``TaskExportFormat``.

        Raises:
            ValueError: If the task is not found.
        """
        task = self.load_task(task_id)
        if not task:
            raise ValueError(
                f"Task not found: {task_id}",
            )

        export = TaskExportFormat(
            task_toml=self._task_config_to_toml(task),
            instruction_md=task.instruction,
            tests={
                "test.sh": self._build_test_script(
                    task.tests,
                ),
            },
            environment=task.environment_files or {
                "Dockerfile": self._default_dockerfile(),
            },
        )
        return export.model_dump()

    # ----------------------------------------------------------
    # Internal helpers
    # ----------------------------------------------------------

    def _task_config_to_toml(
        self, task: HarborTask,
    ) -> str:
        """Serialize a task to Harbor-compatible TOML.

        Produces TOML parseable by real Harbor's
        ``TaskConfig.model_validate_toml()``.
        Includes a ``[_seekingdata]`` section to persist
        SeekingData-specific metadata (name, description,
        status, timestamps).

        Args:
            task: The ``HarborTask`` to serialize.

        Returns:
            TOML string.
        """
        cfg = task.task_config
        data = cfg.model_dump(mode="json")

        # Store SeekingData metadata in a private section
        # that Harbor will ignore (unknown keys are OK).
        data["_seekingdata"] = {
            "name": task.name,
            "description": task.description,
            "status": task.status.value,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat(),
        }

        return toml.dumps(data)

    @staticmethod
    def _build_test_script(
        test_lines: List[str],
    ) -> str:
        """Build a single ``test.sh`` from test lines.

        Args:
            test_lines: Individual test commands.

        Returns:
            Complete bash script as a string.
        """
        lines = ["#!/bin/bash", "set -euo pipefail", ""]
        if test_lines:
            lines.extend(test_lines)
        else:
            lines.append("echo 'No tests defined'")
        lines.append("")
        return "\n".join(lines)

    @staticmethod
    def _parse_test_script(
        content: str,
    ) -> List[str]:
        """Parse test commands from a ``test.sh`` script.

        Strips the shebang and ``set`` preamble, returning
        only the meaningful command lines.

        Args:
            content: Raw content of ``test.sh``.

        Returns:
            List of non-boilerplate lines.
        """
        skip = {"#!/bin/bash", "set -euo pipefail", ""}
        return [
            line
            for line in content.splitlines()
            if line not in skip
            and not line.startswith(
                "echo 'No tests defined'",
            )
        ]

    @staticmethod
    def _default_dockerfile() -> str:
        """Return a minimal default Dockerfile.

        Returns:
            Dockerfile content string.
        """
        return (
            "FROM python:3.12-slim\n"
            "WORKDIR /app\n"
            "COPY . .\n"
        )

    @staticmethod
    def _generate_task_id(name: str) -> str:
        """Generate a unique task directory name.

        Args:
            name: Human-readable task name.

        Returns:
            A slug like ``my-task-20260314120000-abcd1234``.
        """
        timestamp = datetime.now().strftime(
            "%Y%m%d%H%M%S",
        )
        short_id = str(uuid.uuid4())[:8]
        safe = "".join(
            c if c.isalnum() or c in "-_" else "-"
            for c in name
        )
        return f"{safe}-{timestamp}-{short_id}"
