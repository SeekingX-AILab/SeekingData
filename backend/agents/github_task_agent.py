"""Agent for analyzing GitHub repos and generating Harbor tasks.

Uses the GitHub REST API to fetch issue/PR data and repository
structure, then produces a ``HarborTask`` aligned with the real
Harbor task directory format.
"""

import os
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from models.harbor import (
    AgentConfigModel,
    EnvironmentConfigModel,
    GitHubAnalysisResult,
    GitHubTaskRequest,
    HarborTask,
    TaskConfigModel,
    TaskStatus,
    VerifierConfigModel,
)


class GitHubTaskAgent:
    """Analyzes GitHub repositories and generates tasks.

    Attributes:
        github_token: Personal access token for the
            GitHub API.
        headers: HTTP headers sent with every request.
    """

    def __init__(
        self,
        github_token: Optional[str] = None,
    ):
        """Initialize the GitHub task agent.

        Args:
            github_token: Optional GitHub PAT. Falls back
                to the ``GITHUB_TOKEN`` env var.
        """
        self.github_token = (
            github_token or os.getenv("GITHUB_TOKEN")
        )
        self.headers: Dict[str, str] = {}
        if self.github_token:
            self.headers["Authorization"] = (
                f"token {self.github_token}"
            )

    # ----------------------------------------------------------
    # Public API
    # ----------------------------------------------------------

    async def analyze_repository(
        self,
        request: GitHubTaskRequest,
    ) -> GitHubAnalysisResult:
        """Analyze a GitHub repo and extract task info.

        Args:
            request: The analysis request with repo URL
                and optional issue/PR numbers.

        Returns:
            A ``GitHubAnalysisResult`` with extracted data
            and suggested tasks.

        Raises:
            ValueError: If the repo URL is invalid.
        """
        repo_match = re.match(
            r"https://github\.com/([^/]+)/([^/]+)",
            request.repo_url,
        )
        if not repo_match:
            raise ValueError(
                "Invalid GitHub repository URL",
            )

        owner, repo = repo_match.groups()
        repo_name = f"{owner}/{repo}"

        async with httpx.AsyncClient(
            timeout=30.0,
        ) as client:
            result = GitHubAnalysisResult(
                repo_url=request.repo_url,
                repo_name=repo_name,
            )

            if request.issue_number:
                issue = await self._fetch_issue(
                    client, owner, repo,
                    request.issue_number,
                )
                result.issue_title = issue.get("title")
                result.issue_body = issue.get("body")

            if request.pr_number:
                pr = await self._fetch_pr(
                    client, owner, repo,
                    request.pr_number,
                )
                result.pr_title = pr.get("title")
                result.pr_body = pr.get("body")

            result.code_context = (
                await self._fetch_repo_structure(
                    client, owner, repo,
                )
            )
            result.suggested_tasks = (
                self._generate_task_suggestions(result)
            )
            return result

    async def generate_harbor_task(
        self,
        request: GitHubTaskRequest,
        analysis: Optional[GitHubAnalysisResult] = None,
    ) -> HarborTask:
        """Generate a Harbor task from GitHub analysis.

        Args:
            request: The original GitHub request.
            analysis: Pre-computed analysis result.
                If *None* the repo is analyzed first.

        Returns:
            A ``HarborTask`` ready to be saved to disk.
        """
        if not analysis:
            analysis = await self.analyze_repository(
                request,
            )

        description = self._build_task_description(
            analysis,
        )
        instruction = self._build_instruction(analysis)
        tests = self._generate_tests(analysis)
        dockerfile = self._generate_dockerfile(
            analysis,
        )

        task = HarborTask(
            id=str(uuid.uuid4()),
            name=(
                f"github-task-"
                f"{datetime.now().strftime('%Y%m%d%H%M%S')}"
            ),
            description=description,
            status=TaskStatus.DRAFT,
            task_config=TaskConfigModel(
                metadata={
                    "source": "github",
                    "repo": analysis.repo_name,
                    "tags": ["github", "auto-generated"],
                },
                verifier=VerifierConfigModel(
                    timeout_sec=300.0,
                ),
                agent=AgentConfigModel(
                    timeout_sec=600.0,
                ),
                environment=EnvironmentConfigModel(
                    cpus=1,
                    memory_mb=2048,
                ),
            ),
            instruction=instruction,
            tests=tests,
            environment_files={
                "Dockerfile": dockerfile,
            },
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        return task

    # ----------------------------------------------------------
    # GitHub API helpers
    # ----------------------------------------------------------

    async def _fetch_issue(
        self,
        client: httpx.AsyncClient,
        owner: str,
        repo: str,
        issue_number: int,
    ) -> Dict[str, Any]:
        """Fetch issue data from GitHub.

        Args:
            client: The HTTP client.
            owner: Repository owner.
            repo: Repository name.
            issue_number: Issue number.

        Returns:
            JSON response dict.
        """
        url = (
            f"https://api.github.com/repos/"
            f"{owner}/{repo}/issues/{issue_number}"
        )
        resp = await client.get(
            url, headers=self.headers,
        )
        resp.raise_for_status()
        return resp.json()

    async def _fetch_pr(
        self,
        client: httpx.AsyncClient,
        owner: str,
        repo: str,
        pr_number: int,
    ) -> Dict[str, Any]:
        """Fetch pull request data from GitHub.

        Args:
            client: The HTTP client.
            owner: Repository owner.
            repo: Repository name.
            pr_number: PR number.

        Returns:
            JSON response dict.
        """
        url = (
            f"https://api.github.com/repos/"
            f"{owner}/{repo}/pulls/{pr_number}"
        )
        resp = await client.get(
            url, headers=self.headers,
        )
        resp.raise_for_status()
        return resp.json()

    async def _fetch_repo_structure(
        self,
        client: httpx.AsyncClient,
        owner: str,
        repo: str,
    ) -> List[Dict[str, str]]:
        """Fetch top-level repository structure.

        Args:
            client: The HTTP client.
            owner: Repository owner.
            repo: Repository name.

        Returns:
            List of dicts with name/type/path keys.
        """
        try:
            url = (
                f"https://api.github.com/repos/"
                f"{owner}/{repo}/contents/"
            )
            resp = await client.get(
                url, headers=self.headers,
            )
            resp.raise_for_status()

            structure = []
            for item in resp.json()[:10]:
                structure.append({
                    "name": item["name"],
                    "type": item["type"],
                    "path": item["path"],
                })
            return structure
        except Exception:
            return []

    # ----------------------------------------------------------
    # Content builders
    # ----------------------------------------------------------

    @staticmethod
    def _generate_task_suggestions(
        analysis: GitHubAnalysisResult,
    ) -> List[str]:
        """Generate task suggestions from analysis.

        Args:
            analysis: The GitHub analysis result.

        Returns:
            List of suggested task titles.
        """
        suggestions: List[str] = []
        if analysis.issue_title:
            suggestions.append(
                f"Fix: {analysis.issue_title}",
            )
        if analysis.pr_title:
            suggestions.append(
                f"Implement: {analysis.pr_title}",
            )
        if not suggestions:
            suggestions.extend([
                "Add unit tests for core functionality",
                "Improve code documentation",
                "Optimize performance bottlenecks",
                "Refactor legacy code",
            ])
        return suggestions

    @staticmethod
    def _build_task_description(
        analysis: GitHubAnalysisResult,
    ) -> str:
        """Build a short task description.

        Args:
            analysis: The GitHub analysis result.

        Returns:
            Multi-line description string.
        """
        parts = [f"Repository: {analysis.repo_name}"]
        if analysis.issue_title:
            parts.append(f"Issue: {analysis.issue_title}")
        if analysis.pr_title:
            parts.append(f"PR: {analysis.pr_title}")
        return "\n".join(parts)

    @staticmethod
    def _build_instruction(
        analysis: GitHubAnalysisResult,
    ) -> str:
        """Build markdown instruction for the agent.

        Args:
            analysis: The GitHub analysis result.

        Returns:
            Instruction string in Markdown format.
        """
        parts = [
            "# Task Description\n",
            f"Repository: {analysis.repo_name}\n",
        ]
        if analysis.issue_body:
            parts.extend([
                "\n## Issue Details\n",
                analysis.issue_body,
                "\n",
            ])
        if analysis.pr_body:
            parts.extend([
                "\n## Pull Request Details\n",
                analysis.pr_body,
                "\n",
            ])
        if analysis.code_context:
            parts.append("\n## Repository Structure\n")
            for item in analysis.code_context:
                parts.append(
                    f"- {item['type']}: {item['name']}\n",
                )
        parts.extend([
            "\n## Instructions\n",
            "1. Analyze the repository structure\n",
            "2. Understand the issue or request\n",
            "3. Implement the necessary changes\n",
            "4. Ensure all tests pass\n",
            "5. Document your changes\n",
        ])
        return "".join(parts)

    @staticmethod
    def _generate_tests(
        analysis: GitHubAnalysisResult,
    ) -> List[str]:
        """Generate test commands for the task.

        Args:
            analysis: The GitHub analysis result.

        Returns:
            List of shell commands for ``test.sh``.
        """
        return [
            "cd /app",
            "pytest tests/ -v || true",
            "ruff check . || true",
        ]

    @staticmethod
    def _generate_dockerfile(
        analysis: GitHubAnalysisResult,
    ) -> str:
        """Generate a Dockerfile for the task environment.

        Clones the target repository and installs deps.

        Args:
            analysis: The GitHub analysis result.

        Returns:
            Dockerfile content string.
        """
        return (
            "FROM python:3.12-slim\n"
            "WORKDIR /app\n"
            f"RUN git clone {analysis.repo_url} repo"
            " && cd repo"
            " && pip install -r requirements.txt"
            " 2>/dev/null || true\n"
            "COPY . .\n"
        )
