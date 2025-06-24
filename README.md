# ARTIFACT DEVELOPMENT ENGINE

[   Studio] version 1.0.0

> Professional Monaco Editor-based development environment with ADAM-matching aesthetics, AI-powered assistance, and advanced workflow automation.

A comprehensive development studio featuring a clean, professional Monaco Editor interface with pure black theme matching ADAM's aesthetics. Combines full IDE capabilities with intelligent AI assistance, advanced file management, and planned workflow automation integrations. Built for modern development teams seeking a premium coding experience with AI-powered assistance and seamless workflow integration.

## Features

### **Monaco Editor File Manager (Primary Interface)**
- **Professional Interface**: Clean, Monaco Editor-based file manager at `http://localhost:8080`
- **IDE Experience**: Full IDE capabilities with IntelliSense, syntax highlighting, and 180+ language support
- **Clean Design**: Minimal, professional interface without visual clutter
- **File Tree Navigation**: Hierarchical explorer with expand/collapse functionality
- **Consistent UI**: Monochromatic design with subtle gray hover effects
- **Real-time Operations**: Instant feedback on file operations and modifications

### **AI Intelligence & Assistance**
- **Ollama Integration**: Multiple model support (CodeLlama, Qwen2.5-Coder, etc.)
- **File Context Awareness**: AI can reference and modify open files (Phase 5)
- **Code Analysis**: Intelligent suggestions and error detection
- **Natural Language Commands**: Convert descriptions to code
- **Audit Logging**: Track all AI operations and file changes
- **Chat Integration**: AI chat with file/project context (Phase 5)

### **Advanced Workflow Automation (Phase 5)**
- **Windmill Integration**: Workflow automation and data processing
- **Multi-file Operations**: Bulk operations across project files
- **Advanced Search**: Semantic search with vector DB integration
- **Git Integration**: Source control panel and operations
- **Real-time Collaboration**: Multi-user editing capabilities

## Directory Structure

```
.
├── .core/                  # Core architecture, icons, and instructions
├── .data/                  # Agents, backups, lattice simulation, QVM, virtualization
├── .ollama_models/         # Ollama model storage
├── .pt_models/             # PyTorch model storage
├── _thoughtprocess/        # Drafts, notes, SOPs
├── system/                 # BlackNet, DevCore, and related system modules
├── ADE/                    # Main analytics, visualization, and orchestration code
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

3. **(Optional) Configure settings** in `ADE/config.json`:
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
2. **Monaco File Manager** launches at `http://localhost:8080` (default interface)
3. **Legacy Chat Interface** available at `http://localhost:8080/chat-old`
4. **Studio Interface** coming in Phase 5 at `http://localhost:8080/studio`
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

- **Web Chat Interface** (`ADE/webchat.py`): Modern browser chat with Ollama AI.
- **3D Visualizer** (`ADE/visualizer.py`): Interactive 3D codebase visualization.
- **File Watcher** (`ADE/watcher.py`): Monitors file system changes.
- **Dependency Indexer** (`ADE/dependency_indexer.py`): Scans workspace and builds dependency index.
- **AI Summarizer** (`ADE/summarizer.py`): Summarizes codebase using Ollama.
- **Enhanced Visualizer** (`ADE/enhanced_visualizer.py`): Advanced analytics dashboard.
- **Amenzia VPN Integration**: Provides a secure, invisible network layer for all lab operations.

## Configuration

Edit `ADE/config.json` to customize Ollama and webchat settings.  
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
python ADE/visualizer.py        # Just the visualizer
python ADE/webchat.py           # Just the web chat
python -m ADE.main              # Main orchestrator (no Ollama auto-start)
```

## Commands & Modules

- `run.sh` — Entrypoint script (starts Ollama and the lab)
- `ADE/main.py` — Main orchestrator
- `ADE/watcher.py` — Watches for file changes
- `ADE/dependency_indexer.py` — Builds/updates dependency index
- `ADE/summarizer.py` — Summarizes codebase using Ollama
- `ADE/ollama_client.py` — Abstraction for Ollama LLM API
- `ADE/visualizer.py` — 3D visualization of codebase
- `ADE/config.json` — Ollama configuration
- `ADE/dependency_index.json` — Directory-wise dependency index
- `ADE/system_summary.json` — Maintained codebase summary

## Requirements

- Python 3.9+
- [Ollama](https://ollama.com/) running locally or remote
- Pygame, Watchdog, Flask
- (Recommended) [Amenzia VPN](https://amenzia.com/) for invisible, secure workflows

## Notes

- All data, config, and outputs are in `ADE/`.
- Designed for extensibility and can be adapted for larger codebases or additional LLMs.
- For best results, ensure Ollama is installed and the desired model is pulled.
- For maximum privacy and invisibility, enable Amenzia VPN during all operations.

## License

See [license.txt](license.txt) for details (MIT License).

## Roadmap

- ✅ Monaco-first file manager and studio interface
- ✅ All documentation and SOPs updated
- ✅ Enhanced visualizer is now the only analytics/visualization option
- 🚧 Studio interface with Monaco+AI+search (in progress)
- 🚧 Windmill integration (planned)
- 🚧 Advanced chat/file context for AI (planned)
- 🚧 Multi-file/project operations, search, git, and collaboration (planned)

## See Also
- `FILE_MANAGER.md` for file manager help and supported languages
- `STUDIO_FEATURES.md` for full studio features and API
- `ADE/ADE.md` for system architecture
- `_thoughtprocess/notes/n220625.sop` for operational procedures and changelog
