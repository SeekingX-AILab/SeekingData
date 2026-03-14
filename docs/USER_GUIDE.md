# User Guide

Welcome to SeekingData Pro! This guide will help you get started with generating AI training data and Harbor evaluation tasks.

## Installation

### Download

Download the latest version for your platform:

- **macOS**: `SeekingData-x.x.x.dmg`
- **Windows**: `SeekingData-Setup-x.x.x.exe`
- **Linux**: `SeekingData-x.x.x.AppImage`

### Installation Steps

#### macOS

1. Open the `.dmg` file
2. Drag SeekingData to Applications folder
3. Open SeekingData from Applications
4. If you see "Unidentified developer" warning:
   - Go to System Preferences → Privacy & Security
   - Click "Open Anyway" next to the security warning

#### Windows

1. Run the `.exe` installer
2. Follow the installation wizard
3. Launch SeekingData from Start Menu

#### Linux

1. Make the `.AppImage` file executable:
   ```bash
   chmod +x SeekingData-x.x.x.AppImage
   ```
2. Run the application:
   ```bash
   ./SeekingData-x.x.x.AppImage
   ```

## First Launch

### Configuration

On first launch, you'll need to configure your API keys:

1. Click **Settings** in the sidebar
2. Enter your OpenAI API key
3. (Optional) Enter your GitHub token for GitHub features
4. Click **Save**

## Features

### SFT Data Generation

#### Single Processing

Generate training data from a single input:

1. Click **Single Processing** in the sidebar
2. Choose input method:
   - **File Upload**: Upload PDF, DOCX, or TXT files
   - **URL**: Enter a URL to extract content
   - **Text**: Paste text directly
3. Click **Generate** to create training data
4. Review and edit the generated data
5. Download in your preferred format

#### Batch Processing

Process multiple inputs at once:

1. Click **Batch Processing** in the sidebar
2. Enter multiple URLs (one per line)
3. Click **Start Processing**
4. Monitor progress in real-time
5. Review and download results

#### Format Conversion

Convert between Alpaca and OpenAI formats:

1. Click **Format Conversion** in the sidebar
2. Upload your dataset file
3. Select conversion direction:
   - Alpaca → OpenAI
   - OpenAI → Alpaca
4. Preview the converted data
5. Download the result

#### CoT Generator

Generate Chain of Thought reasoning data:

1. Click **CoT Generator** in the sidebar
2. Enter a question that requires reasoning
3. Click **Generate CoT**
4. Review the step-by-step reasoning
5. Edit if needed and download

#### Image Dataset

Generate image description datasets:

1. Click **Image Dataset** in the sidebar
2. Upload images or provide image URLs
3. Click **Generate Descriptions**
4. Review and edit descriptions
5. Download the dataset

#### Video Dataset

Generate video understanding datasets:

1. Click **Video Dataset** in the sidebar
2. Upload videos or provide video URLs
3. Click **Generate Q&A**
4. Review and edit the Q&A pairs
5. Download the dataset

#### Dataset Sharing

Share datasets to HuggingFace:

1. Click **Dataset Share** in the sidebar
2. Select your prepared dataset
3. Enter HuggingFace repository details
4. Click **Upload to HuggingFace**
5. Share the repository URL

### Harbor Tasks

#### GitHub Task Generator

Automatically generate Harbor tasks from GitHub:

1. Click **GitHub Generator** in the sidebar
2. Enter a GitHub repository URL
3. Select an Issue or PR to generate a task from
4. Click **Generate Task**
5. Preview the generated task files
6. Edit if needed
7. Export the task to your local filesystem

#### Visual Task Builder

Build Harbor tasks visually:

1. Click **Visual Builder** in the sidebar
2. Drag and drop task components:
   - Docker environment
   - Test cases
   - Instructions
3. Edit each component using Monaco Editor
4. Preview the generated files in real-time
5. Validate the task
6. Export when ready

#### Task Manager

Manage your Harbor tasks:

1. Click **Task Manager** in the sidebar
2. View all tasks in list or card view
3. Search and filter tasks
4. Click a task to view details
5. Edit, duplicate, or delete tasks
6. Run validation tests
7. Export tasks to share

## Tips & Best Practices

### SFT Data Generation

- **Quality over quantity**: Focus on high-quality examples
- **Diverse inputs**: Use varied sources for better generalization
- **Review outputs**: Always review generated data before use
- **Format consistency**: Stick to one format for your dataset

### Harbor Tasks

- **Clear instructions**: Write detailed instruction.md files
- **Comprehensive tests**: Include multiple test cases
- **Minimal environment**: Keep Dockerfile minimal
- **Validation**: Always run validation before sharing

### Performance

- **Batch size**: Limit batch processing to 10-20 items at a time
- **API limits**: Respect rate limits for external APIs
- **Offline mode**: The app works offline after initial setup

## Troubleshooting

### Common Issues

**"Backend not responding"**

- Restart the application
- Check if port 5001 is available
- Check firewall settings

**"API key invalid"**

- Verify your API key is correct
- Check if the key has necessary permissions
- Ensure the base URL is correct

**"File upload failed"**

- Check file size (max 10MB)
- Verify file format is supported
- Try a different file

**"GitHub rate limit exceeded"**

- Add a GitHub token in settings
- Wait for rate limit to reset (usually 1 hour)

### Logs

View application logs:

- **macOS**: `~/Library/Logs/SeekingData/`
- **Windows**: `%APPDATA%/SeekingData/logs/`
- **Linux**: `~/.config/SeekingData/logs/`

### Getting Help

- **Documentation**: Check the [Architecture Guide](./ARCHITECTURE.md)
- **Issues**: Report bugs on GitHub Issues
- **Community**: Join our Discord community

## Keyboard Shortcuts

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| New Task | `Cmd + N` | `Ctrl + N` |
| Save | `Cmd + S` | `Ctrl + S` |
| Export | `Cmd + E` | `Ctrl + E` |
| Settings | `Cmd + ,` | `Ctrl + ,` |
| Toggle Sidebar | `Cmd + B` | `Ctrl + B` |

## Updates

### Automatic Updates

SeekingData Pro checks for updates automatically on launch.

### Manual Update Check

1. Go to **Settings**
2. Click **Check for Updates**
3. Download and install if available

## Privacy & Security

### Data Storage

- All data is stored locally on your device
- API keys are encrypted in local storage
- No data is sent to external servers (except API calls)

### API Keys

- OpenAI API key: Required for AI features
- GitHub token: Optional, for GitHub features

### Network Access

The app makes network requests to:
- OpenAI API (if configured)
- GitHub API (if GitHub features used)
- Custom base URLs (if configured)

## Uninstallation

### macOS

1. Quit SeekingData Pro
2. Drag from Applications to Trash
3. Remove data (optional):
   ```bash
   rm -rf ~/Library/Application\ Support/SeekingData
   rm -rf ~/Library/Logs/SeekingData
   ```

### Windows

1. Uninstall from Control Panel
2. Remove data (optional):
   ```
   %APPDATA%/SeekingData
   ```

### Linux

1. Remove the `.AppImage` file
2. Remove data (optional):
   ```bash
   rm -rf ~/.config/SeekingData
   ```
