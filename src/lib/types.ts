export interface SFTGenerateRequest {
  content: string;
  config: {
    baseUrl: string;
    apiKey: string;
    model: string;
    suggestionsCount: number;
  };
}

export interface SFTGenerateResponse {
  data: string;
}

export interface GitHubGenerateRequest {
  repoUrl: string;
  issueNumber?: number;
  prNumber?: number;
}

export interface GitHubGenerateResponse {
  task: {
    id: string;
    name: string;
    description: string;
    files: {
      'task.toml': string;
      'instruction.md': string;
      'tests/test.py': string;
      'environment/Dockerfile': string;
    };
  };
}

export interface Task {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'ready' | 'testing' | 'completed';
  path: string;
  createdAt: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

export interface TaskValidateRequest {
  taskPath: string;
}

export interface TaskValidateResponse {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
