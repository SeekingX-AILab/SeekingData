# Changelog

All notable changes to SeekingData Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-14

### Added

#### Project Structure
- Initialized project with Vite + React + Electron architecture
- Created monorepo structure with clear separation of concerns
- Configured TypeScript 5.4+ with strict mode
- Set up ESLint and Prettier for code quality

#### Frontend (React + Vite)
- Built React 18 application with Vite 5
- Implemented Material Design 3 UI system
  - Custom Button component with ripple effects
  - Card component with elevation variants
  - Input component with floating labels
- Created responsive layout with Sidebar navigation
- Implemented Zustand store for state management
- Set up React Router DOM for navigation
- Created reusable UI component library

#### Backend (FastAPI + Python)
- Built FastAPI 0.115+ backend with uvicorn
- Configured Pydantic models for data validation
- Implemented SFT data generation endpoint
- Set up CORS for frontend communication
- Created health check endpoint

#### Desktop (Electron)
- Configured Electron 33 main process
- Implemented Python backend startup management
- Created preload scripts for IPC communication
- Set up environment variable management
- Implemented venv path fixing mechanism for packaging

#### Packaging & Build
- Created preinstall-deps.js script for dependency pre-installation
- Implemented fix-venv-paths.js for cross-platform path management
- Added fix-symlinks.js for symlink validation
- Configured Electron Builder for macOS, Windows, and Linux
- Set up build scripts for all platforms

#### Documentation
- Created comprehensive Architecture documentation
- Wrote Migration Guide for existing users
- Prepared User Guide with installation instructions
- Documented all API endpoints

### Changed

- Migrated from Next.js to Vite + React (better suited for Electron)
- Switched from pip to uv for Python package management
- Updated UI to Material Design 3 (Google style)
- Improved build process with pre-installed dependencies

### Technical Highlights

#### Pre-installed Dependencies Mechanism (inspired by eigent)
- Install uv package manager during build
- Create Python virtual environment with all dependencies
- Fix absolute paths using placeholder replacement
- At runtime, replace placeholders with actual installation paths
- Result: Zero-wait installation for end users

#### Material Design 3 Implementation
- Custom color system with primary, secondary, and surface colors
- Elevation system with 5 shadow levels
- Ripple effects on interactive elements
- Smooth animations and transitions
- Responsive spacing and typography

#### Architecture Patterns
- Context Isolation in Electron for security
- Preload scripts for safe IPC communication
- Zustand for global state management
- Modular component structure
- Separation of concerns between layers

## [Unreleased]

### Planned Features

#### SFT Components Migration
- Single Processing component
- Batch Processing component
- Format Conversion component
- CoT Generator component
- Image Dataset Generator component
- Video Dataset Generator component
- Dataset Sharing component

#### Harbor Task Features
- GitHub Task Generator
  - GitHub API integration
  - Issue/PR parsing
  - Camel Agent integration
  - Task template generation

- Visual Task Builder
  - Drag-and-drop interface
  - Monaco Editor integration
  - Real-time preview
  - Task validation

- Task Manager
  - Task list view
  - Search and filter
  - Task details
  - Export functionality

#### Backend Enhancements
- Camel-AI integration
- Harbor framework integration
- GitHub API service
- Task validation service
- File processing utilities

#### Testing
- Unit tests for frontend components
- API integration tests
- E2E tests with Playwright
- Cross-platform testing

### Known Issues

- npm dependency warnings (non-critical)
- Need to implement actual SFT component logic
- Backend Harbor integration pending
- Testing suite not yet implemented

## Migration Notes

For users migrating from the original SeekingData:

1. **Data Format**: Data stored in LocalStorage is compatible
2. **API Keys**: Need to re-enter in Settings
3. **Components**: All original features will be preserved
4. **UI**: Updated to Material Design 3 (more modern)

## Development Setup

```bash
# Clone repository
git clone https://github.com/seekingdata/seekingdata-pro.git

# Install dependencies
npm install

# Start development
npm run dev

# In another terminal, start backend
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 5001
```

## Build

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

## Contributing

We welcome contributions! Please see CONTRIBUTING.md for guidelines.

## License

MIT License - see LICENSE file for details.
