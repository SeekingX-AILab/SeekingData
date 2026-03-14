# API Documentation

SeekingData Pro Backend API is built with FastAPI and provides RESTful endpoints for SFT data generation and Harbor task management.

## Base URL

```
Development: http://localhost:5001
Production: http://127.0.0.1:5001
```

## Authentication

Most endpoints require API keys passed in the request body.

## Endpoints

### Health Check

Check if the backend is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy"
}
```

---

### SFT Data Generation

#### Generate SFT Data

Generate training data using OpenAI API.

**Endpoint:** `POST /api/sft/generate`

**Request Body:**
```json
{
  "content": "string - The input content to process",
  "config": {
    "apiKey": "string - OpenAI API key",
    "baseUrl": "string - OpenAI API base URL (optional)",
    "model": "string - Model name (e.g., gpt-4o-mini)",
    "suggestionsCount": "number - Number of suggestions (optional, default: 3)"
  }
}
```

**Response:**
```json
{
  "data": "string - Generated training data"
}
```

**Error Response:**
```json
{
  "detail": "string - Error message"
}
```

**Example:**
```bash
curl -X POST http://localhost:5001/api/sft/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Explain quantum computing in simple terms",
    "config": {
      "apiKey": "sk-your-api-key",
      "model": "gpt-4o-mini"
    }
  }'
```

---

### GitHub Task Generation

#### Generate Task from GitHub

Generate a Harbor task from a GitHub repository.

**Endpoint:** `POST /api/github/generate-task`

**Request Body:**
```json
{
  "repoUrl": "string - GitHub repository URL",
  "issueNumber": "number - Issue number (optional)",
  "prNumber": "number - Pull request number (optional)"
}
```

**Response:**
```json
{
  "task": {
    "id": "string - Unique task ID",
    "name": "string - Task name",
    "description": "string - Task description",
    "files": {
      "task.toml": "string - Task configuration",
      "instruction.md": "string - Task instructions",
      "tests/test.py": "string - Test cases",
      "environment/Dockerfile": "string - Docker environment"
    }
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:5001/api/github/generate-task \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/owner/repo",
    "issueNumber": 42
  }'
```

---

### Task Management

#### List Tasks

Get a list of all tasks.

**Endpoint:** `GET /api/tasks`

**Query Parameters:**
- `status` (optional): Filter by status (`draft`, `ready`, `testing`, `completed`)
- `search` (optional): Search in task name and description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "tasks": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "status": "string",
      "path": "string",
      "createdAt": "string - ISO 8601 date"
    }
  ],
  "total": "number - Total number of tasks"
}
```

#### Get Task

Get a specific task by ID.

**Endpoint:** `GET /api/tasks/{task_id}`

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "status": "string",
  "path": "string",
  "createdAt": "string",
  "files": {
    "task.toml": "string",
    "instruction.md": "string",
    "tests/test.py": "string",
    "environment/Dockerfile": "string"
  }
}
```

#### Create Task

Create a new task.

**Endpoint:** `POST /api/tasks`

**Request Body:**
```json
{
  "name": "string - Task name",
  "description": "string - Task description",
  "files": {
    "task.toml": "string",
    "instruction.md": "string",
    "tests/test.py": "string",
    "environment/Dockerfile": "string"
  }
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "status": "draft",
  "path": "string",
  "createdAt": "string"
}
```

#### Update Task

Update an existing task.

**Endpoint:** `PUT /api/tasks/{task_id}`

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "status": "string (optional)",
  "files": {
    "task.toml": "string (optional)",
    "instruction.md": "string (optional)",
    "tests/test.py": "string (optional)",
    "environment/Dockerfile": "string (optional)"
  }
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "status": "string",
  "path": "string",
  "createdAt": "string"
}
```

#### Delete Task

Delete a task.

**Endpoint:** `DELETE /api/tasks/{task_id}`

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

---

### Task Validation

#### Validate Task

Validate a Harbor task.

**Endpoint:** `POST /api/tasks/validate`

**Request Body:**
```json
{
  "taskPath": "string - Path to task directory"
}
```

**Response:**
```json
{
  "valid": "boolean",
  "errors": ["string - List of errors"],
  "warnings": ["string - List of warnings"]
}
```

**Example:**
```bash
curl -X POST http://localhost:5001/api/tasks/validate \
  -H "Content-Type: application/json" \
  -d '{
    "taskPath": "/path/to/task"
  }'
```

---

### Export

#### Export Task

Export a task to a ZIP file.

**Endpoint:** `GET /api/tasks/{task_id}/export`

**Response:**
Binary ZIP file with task files.

**Headers:**
```
Content-Type: application/zip
Content-Disposition: attachment; filename="task-{task_id}.zip"
```

---

## Error Handling

All endpoints follow standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "detail": "string - Human-readable error message"
}
```

---

## Rate Limiting

The API respects rate limits from external services:

- OpenAI API: According to your plan limits
- GitHub API: 5000 requests/hour with token, 60/hour without

---

## CORS

The API accepts requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

---

## OpenAPI Documentation

Interactive API documentation is available at:

- Swagger UI: `http://localhost:5001/docs`
- ReDoc: `http://localhost:5001/redoc`
- OpenAPI JSON: `http://localhost:5001/openapi.json`

---

## Examples

### Python Client

```python
import requests

BASE_URL = "http://localhost:5001"

# Generate SFT data
response = requests.post(
    f"{BASE_URL}/api/sft/generate",
    json={
        "content": "Explain machine learning",
        "config": {
            "apiKey": "sk-your-api-key",
            "model": "gpt-4o-mini"
        }
    }
)
data = response.json()
print(data["data"])
```

### JavaScript Client

```javascript
const BASE_URL = 'http://localhost:5001';

// Generate SFT data
const response = await fetch(`${BASE_URL}/api/sft/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Explain machine learning',
    config: {
      apiKey: 'sk-your-api-key',
      model: 'gpt-4o-mini',
    },
  }),
});

const data = await response.json();
console.log(data.data);
```

---

## WebSocket (Future)

Real-time updates for long-running operations (planned):

```javascript
const ws = new WebSocket('ws://localhost:5001/ws');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Progress:', update.progress);
};
```
