import os
import re
import uuid
from typing import List, Optional, Dict, Any
import httpx
from datetime import datetime

from models.harbor import (
    GitHubTaskRequest,
    GitHubAnalysisResult,
    HarborTask,
    TaskConfigModel,
    EnvironmentConfigModel,
    AgentConfigModel,
    VerifierConfigModel,
    TaskStatus,
)


class GitHubTaskAgent:
    """Agent for analyzing GitHub repositories and generating Harbor tasks"""

    def __init__(self, github_token: Optional[str] = None):
        self.github_token = github_token or os.getenv("GITHUB_TOKEN")
        self.headers = {}
        if self.github_token:
            self.headers["Authorization"] = f"token {self.github_token}"

    async def analyze_repository(
        self, request: GitHubTaskRequest
    ) -> GitHubAnalysisResult:
        """Analyze GitHub repository and extract task information"""

        repo_match = re.match(
            r"https://github\.com/([^/]+)/([^/]+)", request.repo_url
        )
        if not repo_match:
            raise ValueError("Invalid GitHub repository URL")

        owner, repo = repo_match.groups()
        repo_name = f"{owner}/{repo}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            result = GitHubAnalysisResult(
                repo_url=request.repo_url, repo_name=repo_name
            )

            if request.issue_number:
                issue_data = await self._fetch_issue(
                    client, owner, repo, request.issue_number
                )
                result.issue_title = issue_data.get("title")
                result.issue_body = issue_data.get("body")

            if request.pr_number:
                pr_data = await self._fetch_pr(
                    client, owner, repo, request.pr_number
                )
                result.pr_title = pr_data.get("title")
                result.pr_body = pr_data.get("body")

            repo_structure = await self._fetch_repo_structure(
                client, owner, repo
            )
            result.code_context = repo_structure

            result.suggested_tasks = self._generate_task_suggestions(result)

            return result

    async def _fetch_issue(
        self, client: httpx.AsyncClient, owner: str, repo: str, issue_number: int
    ) -> Dict[str, Any]:
        """Fetch issue data from GitHub"""
        url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}"
        response = await client.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    async def _fetch_pr(
        self, client: httpx.AsyncClient, owner: str, repo: str, pr_number: int
    ) -> Dict[str, Any]:
        """Fetch pull request data from GitHub"""
        url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"
        response = await client.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    async def _fetch_repo_structure(
        self, client: httpx.AsyncClient, owner: str, repo: str
    ) -> List[Dict[str, str]]:
        """Fetch repository structure and key files"""
        try:
            url = f"https://api.github.com/repos/{owner}/{repo}/contents/"
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()

            contents = response.json()
            structure = []

            for item in contents[:10]:
                if item["type"] == "file":
                    structure.append(
                        {"name": item["name"], "type": "file", "path": item["path"]}
                    )
                elif item["type"] == "dir":
                    structure.append(
                        {"name": item["name"], "type": "directory", "path": item["path"]}
                    )

            return structure

        except Exception:
            return []

    def _generate_task_suggestions(
        self, analysis: GitHubAnalysisResult
    ) -> List[str]:
        """Generate task suggestions based on analysis"""
        suggestions = []

        if analysis.issue_title:
            suggestions.append(f"Fix: {analysis.issue_title}")

        if analysis.pr_title:
            suggestions.append(f"Implement: {analysis.pr_title}")

        if not suggestions:
            suggestions.extend(
                [
                    "Add unit tests for core functionality",
                    "Improve code documentation",
                    "Optimize performance bottlenecks",
                    "Refactor legacy code",
                ]
            )

        return suggestions

    async def generate_harbor_task(
        self,
        request: GitHubTaskRequest,
        analysis: Optional[GitHubAnalysisResult] = None,
    ) -> HarborTask:
        """Generate Harbor task from GitHub analysis"""

        if not analysis:
            analysis = await self.analyze_repository(request)

        task_description = self._build_task_description(analysis)
        instruction = self._build_instruction(analysis)
        tests = self._generate_tests(analysis)

        task = HarborTask(
            id=str(uuid.uuid4()),
            name=f"github-task-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            description=task_description,
            status=TaskStatus.DRAFT,
            task_config=TaskConfigModel(
                name=analysis.repo_name,
                description=task_description,
                difficulty=5,
                tags=["github", "auto-generated"],
            ),
            environment_config=EnvironmentConfigModel(
                environment_config=EnvironmentConfigModel(
                    setup_commands=[
                        f"git clone {request.repo_url}",
                        "pip install -r requirements.txt",
                    ]
                )
            ),
            agent_config=AgentConfigModel(
                agent_type="claude-code",
                model="claude-sonnet-4-20250514",
            ),
            verifier_config=VerifierConfigModel(test_commands=tests),
            instruction=instruction,
            tests=tests,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        return task

    def _build_task_description(self, analysis: GitHubAnalysisResult) -> str:
        """Build task description from analysis"""
        parts = [f"Repository: {analysis.repo_name}"]

        if analysis.issue_title:
            parts.append(f"Issue: {analysis.issue_title}")

        if analysis.pr_title:
            parts.append(f"PR: {analysis.pr_title}")

        return "\n".join(parts)

    def _build_instruction(self, analysis: GitHubAnalysisResult) -> str:
        """Build task instruction from analysis"""
        instruction_parts = [
            "# Task Description\n",
            f"Repository: {analysis.repo_name}\n",
        ]

        if analysis.issue_body:
            instruction_parts.extend(
                ["\n## Issue Details\n", analysis.issue_body, "\n"]
            )

        if analysis.pr_body:
            instruction_parts.extend(
                ["\n## Pull Request Details\n", analysis.pr_body, "\n"]
            )

        if analysis.code_context:
            instruction_parts.append("\n## Repository Structure\n")
            for item in analysis.code_context:
                instruction_parts.append(
                    f"- {item['type']}: {item['name']}\n"
                )

        instruction_parts.extend(
            [
                "\n## Instructions\n",
                "1. Analyze the repository structure and code\n",
                "2. Understand the issue or feature request\n",
                "3. Implement the necessary changes\n",
                "4. Ensure all tests pass\n",
                "5. Document your changes\n",
            ]
        )

        return "".join(instruction_parts)

    def _generate_tests(self, analysis: GitHubAnalysisResult) -> List[str]:
        """Generate test commands based on analysis"""
        tests = [
            "pytest tests/ -v",
            "python -m pytest --cov=src",
            "black --check .",
            "ruff check .",
        ]

        return tests
