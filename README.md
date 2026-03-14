# SeekingData Pro

<div align="center">

**专业的 SFT 数据生成与 Harbor 任务管理平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.115+-green.svg)](https://fastapi.tiangolo.com/)

[English](#english) | [中文文档](#中文文档)

</div>

---

## 中文文档

### 🎯 项目简介

SeekingData Pro 是一个集成了 SFT 数据生成和 Harbor 任务管理的桌面应用程序，采用 Material Design 3 设计语言，提供现代化的用户体验。

### ✨ 核心特性

#### SFT 数据生成

- **单条处理模式** - 支持文件上传、URL 提取、AI 智能生成
- **批量处理模式** - 批量 URL 处理，进度追踪
- **格式转换工具** - Alpaca ↔ OpenAI 双向转换
- **CoT 生成器** - Chain of Thought 推理数据生成
- **图片数据集生成器** - 图像描述自动生成
- **视频数据集生成器** - 视频理解数据处理
- **数据集分享** - 一键上传到 HuggingFace

#### Harbor 任务管理

- **GitHub 任务生成器** - 从 GitHub 仓库自动生成任务
- **可视化任务构建器** - 拖拽式任务编辑，Monaco Editor 集成
- **任务管理器** - 任务列表、搜索、详情、导出
- **任务验证** - 集成 Harbor 验证工具

### 🏗️ 技术架构

#### 前端技术栈

- **框架**: React 18 + Vite 5
- **UI 设计**: Material Design 3
- **样式**: TailwindCSS 3.4
- **状态管理**: Zustand
- **路由**: React Router DOM 7
- **类型**: TypeScript 5.4

#### 后端技术栈

- **框架**: FastAPI 0.115+
- **语言**: Python 3.12
- **验证**: Pydantic 2.10+
- **Agent**: Camel AI 0.2.89
- **任务框架**: Harbor 0.1.45

#### 桌面应用

- **框架**: Electron 33
- **打包**: Electron Builder
- **平台**: macOS, Windows, Linux

### 🚀 快速开始

#### 开发模式

```bash
# 1. 启动后端
cd backend
source .venv/bin/activate  # macOS/Linux
# 或 .venv\Scripts\activate  # Windows
uvicorn main:app --reload --port 5001

# 2. 启动前端（新终端）
yarn dev
```

访问：http://localhost:3000

#### 生产打包

```bash
# macOS
yarn build:mac

# Windows
yarn build:win

# Linux
yarn build:linux
```

### 📦 安装

#### 前置要求

- Node.js 18+
- Python 3.12+
- uv（Python 包管理器）

#### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/yourusername/SeekingData.git
cd SeekingData

# 安装前端依赖
yarn install

# 安装后端依赖
cd backend
uv venv .venv --python 3.12
source .venv/bin/activate
uv pip install -r requirements.txt
uv pip install -e /path/to/harbor  # 安装本地 Harbor
```

### 🔧 配置

创建 `backend/.env` 文件：

```env
# OpenAI API
OPENAI_API_KEY=sk-xxx

# GitHub Token（可选）
GITHUB_TOKEN=ghp_xxx

# 应用配置
APP_NAME=SeekingData Pro
APP_VERSION=0.1.0
DEBUG=true
```

### 📚 文档

- [快速开始指南](QUICK_START.md)
- [架构文档](docs/ARCHITECTURE.md)
- [API 文档](docs/API.md)
- [用户手册](docs/USER_GUIDE.md)
- [迁移指南](docs/MIGRATION.md)

### 🤝 贡献

欢迎贡献！请查看 [贡献指南](CONTRIBUTING.md)。

### 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

### 🙏 致谢

- [Harbor](https://github.com/yourusername/harbor) - Agent 任务框架
- [Camel AI](https://github.com/camel-ai/camel) - AI Agent 框架
- [FastAPI](https://fastapi.tiangolo.com/) - 现代化的 Web 框架
- [React](https://reactjs.org/) - 用户界面库
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用

---

## English

### 🎯 Overview

SeekingData Pro is a desktop application that integrates SFT data generation and Harbor task management, featuring Material Design 3 for a modern user experience.

### ✨ Key Features

#### SFT Data Generation

- **Single Processing Mode** - File upload, URL extraction, AI-powered generation
- **Batch Processing Mode** - Bulk URL processing with progress tracking
- **Format Converter** - Alpaca ↔ OpenAI bidirectional conversion
- **CoT Generator** - Chain of Thought reasoning data generation
- **Image Dataset Generator** - Automatic image description generation
- **Video Dataset Generator** - Video understanding data processing
- **Dataset Sharing** - One-click upload to HuggingFace

#### Harbor Task Management

- **GitHub Task Generator** - Auto-generate tasks from GitHub repositories
- **Visual Task Builder** - Drag-and-drop task editing with Monaco Editor
- **Task Manager** - Task list, search, details, export
- **Task Validation** - Integrated Harbor validation tools

### 🚀 Quick Start

```bash
# Development mode
cd backend && source .venv/bin/activate
uvicorn main:app --reload --port 5001

# Frontend (new terminal)
yarn dev

# Production build
yarn build:mac  # macOS
yarn build:win  # Windows
yarn build:linux  # Linux
```

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by SeekingData Team

</div>
