# SeekingData

<div align="center">

**Professional SFT Data Generation & Harbor Task Management Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![Electron](https://img.shields.io/badge/electron-33-blue.svg)](https://www.electronjs.org/)

[中文文档](README_CN.md)

</div>

---

> ⚠️ **Work in Progress**: This project is undergoing a complete refactor with 
> many new features being added. It is not recommended for production use at 
> this time. Please wait for a stable release.

---

## Overview

SeekingData is a cross-platform desktop application that integrates SFT 
(Supervised Fine-Tuning) data generation and Harbor task management, featuring 
Material Design 3 for a modern user experience.

## Features

### SFT Data Generation

| Feature | Description |
|---------|-------------|
| Single Processing | File upload (PDF/DOCX/TXT), URL extraction, AI-powered generation |
| Batch Processing | Bulk URL processing with real-time progress tracking |
| Format Converter | Alpaca ↔ OpenAI bidirectional conversion |
| CoT Generator | Chain of Thought reasoning data generation |
| Image Dataset | Automatic image description generation |
| Video Dataset | Video understanding data processing |
| Dataset Sharing | One-click upload to HuggingFace |

### Harbor Task Management

| Feature | Description |
|---------|-------------|
| GitHub Task Generator | Auto-generate tasks from GitHub repositories |
| Visual Task Builder | Drag-and-drop editing with Monaco Editor |
| Task Manager | List, search, view details, export tasks |
| Task Validation | Integrated Harbor validation tools |

## Tech Stack

### Frontend

- **Framework**: React 18 + Vite 5
- **UI Design**: Material Design 3
- **Styling**: TailwindCSS 3.4
- **State Management**: Zustand
- **Routing**: React Router DOM 7
- **Code Editor**: Monaco Editor
- **Flow Editor**: React Flow

### Backend

- **Framework**: FastAPI 0.115+
- **Language**: Python 3.12
- **Validation**: Pydantic 2.10+
- **LLM Integration**: LiteLLM 1.40+
- **Document Processing**: Docling 2.0+
- **Agent Framework**: Camel AI 0.2.89
- **Task Framework**: Harbor 0.1.45

### Desktop Application

- **Framework**: Electron 33
- **Packaging**: Electron Builder
- **Platforms**: macOS, Windows, Linux

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12+
- uv (Python package manager)
- yarn (Node package manager)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/SeekingData.git
cd SeekingData

# Install frontend dependencies
yarn install

# Install backend dependencies
cd backend
uv venv .venv --python 3.12
source .venv/bin/activate  # macOS/Linux
# or .venv\Scripts\activate  # Windows
uv pip install -r requirements.txt
```

### Development

```bash
# Terminal 1: Start backend
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 5001

# Terminal 2: Start frontend
yarn dev
```

Access the application at: http://localhost:3002

### Production Build

```bash
# macOS
yarn build:mac

# Windows
yarn build:win

# Linux
yarn build:linux
```

## Configuration

### Backend Environment (backend/.env)

```env
# LLM API Configuration
OPENAI_API_KEY=sk-xxx

# GitHub Token (optional, for GitHub task generation)
GITHUB_TOKEN=ghp_xxx

# Application
APP_NAME=SeekingData
APP_VERSION=0.1.0
DEBUG=true
```

### Frontend Settings

Configure via the Settings page in the application:

- **API Base URL**: LLM provider endpoint
- **API Key**: Your secret API key
- **Model**: Model identifier (e.g., qwen/qwen3.5-plus)
- **Suggestions Count**: Number of suggestions per request (1-10)

## Project Structure

```
SeekingData/
├── src/                    # React frontend
│   ├── components/
│   │   ├── sft/           # SFT data generation
│   │   ├── harbor/        # Harbor task management
│   │   ├── ui/            # Material Design 3 components
│   │   └── layout/        # Layout components
│   ├── lib/               # Utilities and stores
│   └── pages/             # Page components
├── backend/               # FastAPI backend
│   ├── agents/           # AI agents (GitHub, etc.)
│   ├── api/routes/       # API endpoints
│   ├── models/           # Pydantic models
│   ├── services/         # Business logic
│   └── tasks/            # Harbor task storage
├── electron/             # Electron main process
├── scripts/              # Build scripts
└── docs/                 # Documentation
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sft/config` | Get current configuration |
| POST | `/api/sft/config` | Save configuration |
| POST | `/api/sft/generate` | Generate SFT data |
| POST | `/api/sft/batch` | Batch URL processing |
| POST | `/api/sft/convert` | Format conversion |
| GET | `/api/harbor/tasks` | List all tasks |
| POST | `/api/harbor/tasks` | Create new task |
| GET | `/api/harbor/tasks/{id}` | Get task details |
| POST | `/api/harbor/github/generate` | Generate from GitHub |

## Supported Models

The application supports any LiteLLM-compatible model:

| Provider | Model Examples |
|----------|---------------|
| OpenAI | gpt-4, gpt-4o, gpt-3.5-turbo |
| Qwen | qwen/qwen3.5-plus, qwen/qwen-max |
| Moonshot | moonshot/kimi-k2.5 |
| Zhipu | zhipu/glm-5, zhipu/glm-4 |
| MiniMax | minimax/MiniMax-M2.5 |
| DeepSeek | openai/deepseek-v3.2 |

## Documentation

- [Quick Start Guide](QUICK_START.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)

## Contributing

Contributions are welcome! Please read our contributing guidelines before 
submitting a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) 
file for details.

## Acknowledgments

- [Harbor](https://github.com/harbor-ai/harbor) - Agent task framework
- [Camel AI](https://github.com/camel-ai/camel) - AI agent framework
- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [React](https://reactjs.org/) - UI library
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [LiteLLM](https://github.com/BerriAI/litellm) - Unified LLM interface

---

<div align="center">

Made with ❤️ by SeekingX-AILab

</div>
