# SeekingData - 快速开始指南

> ⚠️ **开发中**：本项目正在进行完全重构，并添加大量新功能。目前不建议用于生产环境，请等待稳定版本发布后再使用。

## 🎯 项目状态

✅ **后端依赖已安装** - 使用 uv 管理 Python 3.12 环境  
✅ **前端依赖已安装** - 使用 yarn 管理 Node.js 依赖  
✅ **Harbor 框架已集成** - 本地安装 harbor==0.1.45  
✅ **Camel AI 已集成** - camel-ai==0.2.89  
⚠️ **前端启动成功** - 运行在 http://localhost:3002/

## 🚀 开发模式启动

### 1. 启动后端（终端 1）

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 5001
 cd backend                                                                                                                                                                                                     
  source .venv/bin/activate
  uvicorn main:app --host 127.0.0.1 --port 5001 --reload                                                                                                                                                         
                                                               
```

### 2. 启动前端（终端 2）

```bash
yarn dev
```

访问：http://localhost:3002/

## 📦 打包为桌面应用

### macOS

```bash
npm run build:mac
# 或
yarn build:mac
```

生成文件：`dist/SeekingData-0.1.0.dmg`

### Windows

```bash
npm run build:win
# 或
yarn build:win
```

生成文件：`dist/SeekingData Setup 0.1.0.exe`

### Linux

```bash
npm run build:linux
# 或
yarn build:linux
```

生成文件：`dist/seekingdata-0.1.0.AppImage`

## 🔧 环境配置

### 后端配置（backend/.env）

```env
# OpenAI API（必需）
OPENAI_API_KEY=sk-xxx

# GitHub Token（可选，用于 GitHub 任务生成）
GITHUB_TOKEN=ghp_xxx

# 应用配置
APP_NAME=SeekingData
APP_VERSION=0.1.0
DEBUG=true
```

### 前端配置

无需额外配置，自动连接后端 API。

## 🐛 常见问题

### 1. 端口被占用

```bash
# 查找占用进程
lsof -i :3000
lsof -i :5001

# 杀死进程
kill -9 <PID>
```

### 2. Python 依赖问题

```bash
cd backend
source .venv/bin/activate
uv pip install -r requirements.txt
```

### 3. Node 依赖问题

```bash
rm -rf node_modules
rm yarn.lock
yarn install
```

### 4. Harbor 导入问题

Harbor 已本地安装，如需重新安装：

```bash
cd backend
source .venv/bin/activate
uv pip install -e /Users/finnywang/codebase/harbor
```

## 📚 项目结构

```
SeekingData/
├── src/                    # React 前端
│   ├── components/
│   │   ├── sft/           # SFT 数据生成组件
│   │   ├── harbor/        # Harbor 任务组件
│   │   ├── ui/            # Material Design 3 组件
│   │   └── layout/        # 布局组件
│   ├── lib/               # 工具库
│   └── pages/             # 页面
├── backend/               # FastAPI 后端
│   ├── agents/           # GitHub Agent
│   ├── api/routes/       # API 路由
│   ├── models/           # Pydantic 模型
│   └── services/         # 业务逻辑
├── electron/             # Electron 主进程
├── scripts/              # 打包脚本
└── docs/                 # 文档
```

## 🎨 功能模块

### SFT 数据生成

- ✅ 单条处理模式
- ✅ 批量处理模式
- ✅ 格式转换（Alpaca ↔ OpenAI）
- ✅ CoT 生成器
- ✅ 图片数据集生成
- ✅ 视频数据集生成
- ✅ 数据集分享（HuggingFace）

### Harbor 任务管理

- ✅ GitHub 任务生成
- ✅ 可视化任务构建器
- ✅ 任务管理器
- ✅ 任务验证和导出

## 📖 详细文档

- `docs/ARCHITECTURE.md` - 架构文档
- `docs/API.md` - API 文档
- `docs/USER_GUIDE.md` - 用户手册
- `docs/MIGRATION.md` - 迁移指南

## 🔐 安全提示

⚠️ **重要**：打包前请确保：

1. `.env` 文件不包含真实 API 密钥
2. 使用环境变量或配置文件管理敏感信息
3. 打包后的应用需要用户自行配置 API 密钥

## 🎯 下一步

1. ✅ 测试所有功能
2. ✅ 配置 API 密钥
3. ✅ 执行打包命令
4. ✅ 分发给用户

---

**祝使用愉快！** 🎉
