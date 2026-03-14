# SeekingData

<div align="center">

**专业的 SFT 数据生成与 Harbor 任务管理平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.115+-green.svg)](https://fastapi.tiangolo.com/)
[![Electron](https://img.shields.io/badge/electron-33-blue.svg)](https://www.electronjs.org/)

[English](README.md)

</div>

---

> ⚠️ **开发中**：本项目正在进行完全重构，并添加大量新功能。目前不建议用于生产环境，
> 请等待稳定版本发布后再使用。

---

## 项目简介

SeekingData 是一个跨平台桌面应用程序，集成了 SFT（监督微调）数据生成和 
Harbor 任务管理功能，采用 Material Design 3 设计语言，提供现代化的用户体验。

## 功能特性

### SFT 数据生成

| 功能 | 描述 |
|------|------|
| 单条处理模式 | 文件上传（PDF/DOCX/TXT）、URL 提取、AI 智能生成 |
| 批量处理模式 | 批量 URL 处理，实时进度追踪 |
| 格式转换工具 | Alpaca ↔ OpenAI 双向转换 |
| CoT 生成器 | Chain of Thought 推理数据生成 |
| 图片数据集生成器 | 图像描述自动生成 |
| 视频数据集生成器 | 视频理解数据处理 |
| 数据集分享 | 一键上传到 HuggingFace |

### Harbor 任务管理

| 功能 | 描述 |
|------|------|
| GitHub 任务生成器 | 从 GitHub 仓库自动生成任务 |
| 可视化任务构建器 | 拖拽式任务编辑，Monaco Editor 集成 |
| 任务管理器 | 任务列表、搜索、详情、导出 |
| 任务验证 | 集成 Harbor 验证工具 |

## 技术架构

### 前端技术栈

- **框架**: React 18 + Vite 5
- **UI 设计**: Material Design 3
- **样式**: TailwindCSS 3.4
- **状态管理**: Zustand
- **路由**: React Router DOM 7
- **代码编辑器**: Monaco Editor
- **流程编辑器**: React Flow

### 后端技术栈

- **框架**: FastAPI 0.115+
- **语言**: Python 3.12
- **数据验证**: Pydantic 2.10+
- **LLM 集成**: LiteLLM 1.40+
- **文档处理**: Docling 2.0+
- **Agent 框架**: Camel AI 0.2.89
- **任务框架**: Harbor 0.1.45

### 桌面应用

- **框架**: Electron 33
- **打包**: Electron Builder
- **平台**: macOS, Windows, Linux

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.12+
- uv（Python 包管理器）
- yarn（Node 包管理器）

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/yourusername/SeekingData.git
cd SeekingData

# 安装前端依赖
yarn install

# 安装后端依赖
cd backend
uv venv .venv --python 3.12
source .venv/bin/activate  # macOS/Linux
# 或 .venv\Scripts\activate  # Windows
uv pip install -r requirements.txt
```

### 开发模式

```bash
# 终端 1: 启动后端
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 5001

# 终端 2: 启动前端
yarn dev
```

访问地址：http://localhost:3002

### 生产打包

```bash
# macOS
yarn build:mac

# Windows
yarn build:win

# Linux
yarn build:linux
```

## 配置说明

### 后端环境变量（backend/.env）

```env
# LLM API 配置
OPENAI_API_KEY=sk-xxx

# GitHub Token（可选，用于 GitHub 任务生成）
GITHUB_TOKEN=ghp_xxx

# 应用配置
APP_NAME=SeekingData
APP_VERSION=0.1.0
DEBUG=true
```

### 前端设置

通过应用内的设置页面进行配置：

- **API Base URL**: LLM 服务商端点
- **API Key**: 您的 API 密钥
- **Model**: 模型标识符（如 qwen/qwen3.5-plus）
- **Suggestions Count**: 每次请求的建议数量（1-10）

## 项目结构

```
SeekingData/
├── src/                    # React 前端
│   ├── components/
│   │   ├── sft/           # SFT 数据生成组件
│   │   ├── harbor/        # Harbor 任务组件
│   │   ├── ui/            # Material Design 3 组件
│   │   └── layout/        # 布局组件
│   ├── lib/               # 工具库和状态管理
│   └── pages/             # 页面组件
├── backend/               # FastAPI 后端
│   ├── agents/           # AI 代理（GitHub 等）
│   ├── api/routes/       # API 路由
│   ├── models/           # Pydantic 模型
│   ├── services/         # 业务逻辑
│   └── tasks/            # Harbor 任务存储
├── electron/             # Electron 主进程
├── scripts/              # 打包脚本
└── docs/                 # 文档
```

## API 接口

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/sft/config` | 获取当前配置 |
| POST | `/api/sft/config` | 保存配置 |
| POST | `/api/sft/generate` | 生成 SFT 数据 |
| POST | `/api/sft/batch` | 批量 URL 处理 |
| POST | `/api/sft/convert` | 格式转换 |
| GET | `/api/harbor/tasks` | 获取任务列表 |
| POST | `/api/harbor/tasks` | 创建新任务 |
| GET | `/api/harbor/tasks/{id}` | 获取任务详情 |
| POST | `/api/harbor/github/generate` | 从 GitHub 生成任务 |

## 支持的模型

应用支持所有 LiteLLM 兼容的模型：

| 服务商 | 模型示例 |
|--------|---------|
| OpenAI | gpt-4, gpt-4o, gpt-3.5-turbo |
| 通义千问 | qwen/qwen3.5-plus, qwen/qwen-max |
| Moonshot | moonshot/kimi-k2.5 |
| 智谱 | zhipu/glm-5, zhipu/glm-4 |
| MiniMax | minimax/MiniMax-M2.5 |
| DeepSeek | openai/deepseek-v3.2 |

## 文档

- [快速开始指南](QUICK_START.md)
- [架构文档](docs/ARCHITECTURE.md)
- [API 文档](docs/API.md)
- [用户手册](docs/USER_GUIDE.md)

## 贡献

欢迎贡献代码！请阅读贡献指南后提交 Pull Request。

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 致谢

- [Harbor](https://github.com/harbor-ai/harbor) - Agent 任务框架
- [Camel AI](https://github.com/camel-ai/camel) - AI Agent 框架
- [FastAPI](https://fastapi.tiangolo.com/) - 现代化 Web 框架
- [React](https://reactjs.org/) - 用户界面库
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用
- [LiteLLM](https://github.com/BerriAI/litellm) - 统一 LLM 接口

---

<div align="center">

Made with ❤️ by SeekingX-AILab

</div>
