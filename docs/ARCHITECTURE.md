# Architecture Overview

## System Architecture

SeekingData Pro is a desktop application built with Electron, React, and FastAPI.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Electron Desktop App                    │
│  ┌──────────────────┐        ┌────────────────────┐    │
│  │   Main Process   │───────▶│  Python Backend    │    │
│  │  (Node.js/TS)    │        │  (FastAPI)         │    │
│  └──────────────────┘        └────────────────────┘    │
│          │                              │                │
│          │                              │                │
│          ▼                              ▼                │
│  ┌──────────────────┐        ┌────────────────────┐    │
│  │ Renderer Process │◀──────▶│   REST API         │    │
│  │  (React + Vite)  │        │   (/api/*)         │    │
│  └──────────────────┘        └────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend (Renderer Process)

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript 5.4+
- **Styling**: TailwindCSS 3.4 + Material Design 3
- **State Management**: Zustand
- **Routing**: React Router DOM 7
- **UI Components**: Custom Material Design 3 components

### Desktop (Main Process)

- **Framework**: Electron 33
- **Build**: Electron Builder + vite-plugin-electron
- **IPC**: Context Bridge + Preload Scripts

### Backend (Python)

- **Language**: Python 3.11+
- **Framework**: FastAPI 0.115+
- **Package Manager**: uv
- **Agent Framework**: Camel-AI 0.2.90+
- **Task Framework**: Harbor

## Core Components

### 1. Electron Main Process (`electron/main/`)

The main process is responsible for:

- Creating and managing application windows
- Starting and managing the Python backend
- Handling system-level events
- Managing application lifecycle

**Key Files:**
- `index.ts`: Main entry point
- `init.ts`: Python backend initialization
- `utils/envUtil.ts`: Environment utilities

### 2. React Frontend (`src/`)

The frontend is a single-page application built with React:

**Structure:**
- `components/`: Reusable UI components
  - `ui/`: Material Design 3 components (Button, Card, Input)
  - `layout/`: Layout components (Sidebar, Layout)
  - `sft/`: SFT-related components
  - `harbor/`: Harbor task components
- `lib/`: Utilities and libraries
  - `api.ts`: API client
  - `stores.ts`: Zustand stores
  - `types.ts`: TypeScript types
- `pages/`: Page components

### 3. FastAPI Backend (`backend/`)

The backend provides REST API endpoints:

**Structure:**
- `api/routes/`: API endpoints
  - `health.py`: Health check
  - `sft.py`: SFT data generation
- `models/`: Pydantic models
- `services/`: Business logic
- `agents/`: Camel AI agents
- `config.py`: Configuration management
- `main.py`: FastAPI application entry point

## Data Flow

### SFT Data Generation Flow

```
User Input → React Component → API Client → FastAPI Route
    ↓
OpenAI API Call → Response Processing → Return to Frontend
    ↓
Display in UI → User Edit/Download
```

### Harbor Task Generation Flow

```
GitHub URL → React Component → API Client → FastAPI Route
    ↓
Camel GitHub Toolkit → Code Analysis → Task Generation
    ↓
Harbor Task Object → Export Files → Return to Frontend
    ↓
Display in UI → User Preview/Edit/Export
```

## Packaging Mechanism

### Pre-installation Process

1. **Install uv**: Package manager for Python
2. **Create Virtual Environment**: Isolated Python environment
3. **Install Dependencies**: Pre-install all Python packages
4. **Fix Paths**: Replace absolute paths with placeholders
5. **Bundle Resources**: Package into Electron app

### Build Flow

```
npm run build:mac
    ↓
preinstall-deps.js (Install uv, venv, deps)
    ↓
fix-venv-paths.js (Replace paths with placeholders)
    ↓
fix-symlinks.js (Check symlinks)
    ↓
vite build (Build React app)
    ↓
electron-builder (Package Electron app)
    ↓
Generate DMG/ZIP (macOS) or EXE (Windows)
```

### Runtime Path Fix

On first launch, the Electron main process:

1. Detects the application installation path
2. Finds `pyvenv.cfg` with placeholders
3. Replaces placeholders with actual paths
4. Starts the Python backend with fixed environment

## Security Considerations

### Electron Security

- **Context Isolation**: Enabled by default
- **Node Integration**: Disabled in renderer
- **Preload Scripts**: Minimal API exposure
- **Content Security Policy**: Strict CSP headers

### API Security

- **CORS**: Configured for local development
- **Input Validation**: Pydantic models
- **Error Handling**: Sanitized error messages

## Performance Optimization

### Frontend

- **Code Splitting**: Route-based splitting
- **Lazy Loading**: Component-level lazy loading
- **Tree Shaking**: Vite automatic optimization
- **Caching**: Zustand persist middleware

### Backend

- **Async I/O**: All operations are async
- **Connection Pooling**: Database connections
- **Caching**: Response caching for API calls

### Desktop

- **Pre-installed Dependencies**: No runtime installation
- **Optimized Bundle**: Exclude dev files and caches
- **Efficient IPC**: Minimal main-renderer communication

## Extension Points

### Adding New SFT Features

1. Create React component in `src/components/sft/`
2. Add route in `src/App.tsx`
3. Create API endpoint in `backend/api/routes/`
4. Implement business logic in `backend/services/`

### Adding Harbor Task Types

1. Create agent in `backend/agents/`
2. Create service in `backend/services/`
3. Add API endpoint in `backend/api/routes/`
4. Create frontend component in `src/components/harbor/`

## Development Workflow

### Local Development

```bash
# Terminal 1: Start backend
cd backend
uv sync
uv run uvicorn main:app --reload --port 5001

# Terminal 2: Start frontend
npm install
npm run dev
```

### Production Build

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

## Testing Strategy

### Frontend Testing

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright

### Backend Testing

- **Unit Tests**: pytest
- **API Tests**: pytest + FastAPI TestClient

### Integration Testing

- Test Electron + Backend integration
- Test cross-platform compatibility
