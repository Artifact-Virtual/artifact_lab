# ARTIFACT VIRTUAL LABORATORY

> Advanced AI-powered development environment with Monaco Editor-based file management and intelligent code assistance.

A comprehensive development toolkit featuring real-time codebase analysis, professional file management, and AI-powered assistance. Combines Monaco Editor's full IDE capabilities with Ollama LLM integration for intelligent code analysis and generation.  
Built for extensibility, privacy, and high-performance development workflows—ideal for teams and solo developers seeking professional coding tools with AI assistance.

## Features

### **Core Development Environment**
- **AVA File Manager**: Monaco Editor-based professional file editing with VS Code experience
- **AI-Powered Chat**: Intelligent code assistance with file context and direct modifications
- **File Management API**: Comprehensive file operations (create, read, write, delete)
- **Real-time Monitoring**: Live file watching and workspace indexing
- **Multi-Language Support**: 25+ programming languages with syntax highlighting

### **Professional Interface**
- **Monaco Editor Integration**: Full VS Code editing experience in browser
- **Dark Theme**: Professional AMOLED-styled interface
- **File Tree Navigation**: Interactive explorer with file type icons
- **Status Bar**: Real-time feedback and operation status
- **Keyboard Shortcuts**: Industry-standard shortcuts (Ctrl+S, Ctrl+R, etc.)

### **AI Intelligence**
- **Ollama Integration**: Multiple model support (CodeLlama, Qwen2.5-Coder, etc.)
- **File Context Awareness**: AI can reference and modify open files
- **Code Analysis**: Intelligent suggestions and error detection
- **Natural Language Commands**: Convert descriptions to code
- **Audit Logging**: Track all AI operations and file changes

### **Analytics & Visualization**
- **Enhanced Visualizer**: Advanced code analytics and system monitoring
- **Dependency Analysis**: Real-time codebase structure insights
- **Performance Metrics**: System resource monitoring
- **File Statistics**: Comprehensive project analytics
- **Dotfile Support**: Include configuration files in analysis

### **Development Tools**
- **Auto-Save Detection**: Track file modifications in real-time
- **Error Highlighting**: Syntax errors highlighted as you type
- **IntelliSense**: Auto-completion and code suggestions
- **Find & Replace**: Powerful search capabilities
- **Multiple Cursors**: Edit multiple locations simultaneously

## Directory Structure

```
.
├── .core/                  # Core architecture, icons, and instructions
├── .data/                  # Agents, backups, lattice simulation, QVM, virtualization
├── .ollama_models/         # Ollama model storage
├── .pt_models/             # PyTorch model storage
├── _thoughtprocess/        # Drafts, notes, SOPs
├── system/                 # BlackNet, DevCore, and related system modules
├── workspace_manager/      # Main analytics, visualization, and orchestration code
│   ├── __init__.py
│   ├── config.json
│   ├── dependency_index.json
│   ├── dependency_indexer.py
│   ├── enhanced_visualizer.py
│   ├── main.py
│   ├── ollama_client.py
│   ├── summarizer.py
│   ├── visualizer.py
│   ├── watcher.py
│   ├── webchat.py
│   └── system_summary.json
├── .gitignore
├── license.txt
├── package.json
├── README.md
├── requirements.txt
├── requirements.lock.txt
├── run.bat
├── run.ps1
├── run.sh
├── test_system.bat
```

## Quick Start

### Prerequisites

- Python 3.9+
- [Ollama](https://ollama.com/) installed and running locally or remote
- Pygame, Watchdog, Flask, and other dependencies (see `requirements.txt`)
- (Optional but recommended) [Amenzia VPN](https://amenzia.com/) for invisible, secure workflows

### Installation

1. **Install Python dependencies:**
  ```bash
  pip install -r requirements.txt
  ```

2. **Pull the default Ollama model:**
  ```bash
  ollama pull qwen2.5-coder:latest
  ```

3. **(Optional) Configure settings** in `workspace_manager/config.json`:
  ```json
  {
    "ollama_model": "qwen2.5-coder:latest",
    "ollama_host": "localhost",
    "ollama_port": 11434,
    "webchat_port": 8080
  }
  ```

4. **(Optional) Start Amenzia VPN** for a fully invisible and secure workflow.

### Running the System

**Choose your platform:**

- **Linux/macOS (Bash):**
  ```bash
  ./run.sh
  ```
- **Windows (Batch):**
  ```cmd
  run.bat
  ```
- **Windows (PowerShell):**
  ```powershell
  .\run.ps1
  ```

## What Happens When You Run

1. **Ollama Server** starts automatically (if not already running)
2. **Web Chat Interface** launches at `http://localhost:8080`
3. **Browser opens** automatically to the chat interface
4. **File Watcher** begins monitoring workspace changes
5. **Dependency Indexer** scans and indexes the codebase
6. **AI Summarizer** analyzes code using Ollama
7. **Visualizer Selection** prompts you to choose from multiple visualization modes
8. **Amenzia VPN** (if enabled) ensures all traffic is encrypted and invisible

## Visualization Modes

### 1. Enhanced Visualizer (Recommended)
- Tree view, heatmaps, file analysis, and system metrics dashboard
- Interactive and informative

### 2. Enhanced Starmap Constellation Visualizer
- 3D starmap: files as stars, directories as constellations
- Advanced shader effects, smart labeling, particle systems, and real-time metrics

### 3. Classic 3D Visualizer
- 3D circular node display
- System performance graphs

## Controls

### Enhanced Visualizer

- **1-4**: Switch between view modes (Tree, Heatmap, File Analysis, Metrics)
- **Mouse Click**: Select directories/files
- **Scroll Wheel**: Navigate Tree View
- **S**: Toggle sidebar
- **R**: Reload data
- **ESC**: Exit visualizer

### Starmap Visualizer [optional]

- **Mouse Drag**: Rotate starmap
- **Scroll Wheel**: Zoom
- **Space**: Reset camera
- **L**: Toggle star labels
- **C**: Toggle connection lines
- **M**: Toggle metrics panel
- **P**: Toggle particle effects
- **D**: Detailed analysis view
- **R**: Reload codebase data
- **ESC**: Exit starmap

## Components

- **Web Chat Interface** (`workspace_manager/webchat.py`): Modern browser chat with Ollama AI.
- **3D Visualizer** (`workspace_manager/visualizer.py`): Interactive 3D codebase visualization.
- **File Watcher** (`workspace_manager/watcher.py`): Monitors file system changes.
- **Dependency Indexer** (`workspace_manager/dependency_indexer.py`): Scans workspace and builds dependency index.
- **AI Summarizer** (`workspace_manager/summarizer.py`): Summarizes codebase using Ollama.
- **Enhanced Visualizer** (`workspace_manager/enhanced_visualizer.py`): Advanced analytics dashboard.
- **Amenzia VPN Integration**: Provides a secure, invisible network layer for all lab operations.

## Configuration

Edit `workspace_manager/config.json` to customize Ollama and webchat settings.  
Configure Amenzia VPN as per [Amenzia documentation](https://amenzia.com/docs) for maximum privacy.

## Troubleshooting

- **Ollama Issues**:  
  - Ensure Ollama is installed: `ollama --version`
  - Check if model exists: `ollama list`
  - Pull model if missing: `ollama pull qwen2.5-coder:latest`
- **Port Conflicts**:  
  - Change `webchat_port` or `ollama_port` in config if needed
- **Dependencies**:  
  - Install missing packages: `pip install flask requests pygame psutil watchdog`
- **Visualization Issues**:  
  - Ensure display/graphics drivers are properly configured
- **VPN Issues**:  
  - Verify Amenzia VPN is running and properly configured for your environment

## Development

To run components individually:

```bash
python workspace_manager/visualizer.py        # Just the visualizer
python workspace_manager/webchat.py           # Just the web chat
python -m workspace_manager.main              # Main orchestrator (no Ollama auto-start)
```

## Commands & Modules

- `run.sh` — Entrypoint script (starts Ollama and the lab)
- `workspace_manager/main.py` — Main orchestrator
- `workspace_manager/watcher.py` — Watches for file changes
- `workspace_manager/dependency_indexer.py` — Builds/updates dependency index
- `workspace_manager/summarizer.py` — Summarizes codebase using Ollama
- `workspace_manager/ollama_client.py` — Abstraction for Ollama LLM API
- `workspace_manager/visualizer.py` — 3D visualization of codebase
- `workspace_manager/config.json` — Ollama configuration
- `workspace_manager/dependency_index.json` — Directory-wise dependency index
- `workspace_manager/system_summary.json` — Maintained codebase summary

## Requirements

- Python 3.9+
- [Ollama](https://ollama.com/) running locally or remote
- Pygame, Watchdog, Flask
- (Recommended) [Amenzia VPN](https://amenzia.com/) for invisible, secure workflows

## Notes

- All data, config, and outputs are in `workspace_manager/`.
- Designed for extensibility and can be adapted for larger codebases or additional LLMs.
- For best results, ensure Ollama is installed and the desired model is pulled.
- For maximum privacy and invisibility, enable Amenzia VPN during all operations.

## License

See [license.txt](license.txt) for details (MIT License).