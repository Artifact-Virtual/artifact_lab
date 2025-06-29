# ARTIFACT DEVELOPMENT ENGINE

![Dashboard Screenshot](L:/devops/artifact_lab/worxpace/screenshots/dashboard4.png)

![Canvas Screenshot](L:/devops/artifact_lab/worxpace/screenshots/canvas.png)

[Studio] version 1.0.0

> Professional Monaco Editor-based development environment with AI-powered assistance, and advanced workflow automation.

A comprehensive development studio featuring a clean, professional Monaco Editor interface. Combines full IDE capabilities with intelligent AI assistance, advanced file management, and planned workflow automation integrations. Built for modern development teams seeking a premium coding experience with AI-powered assistance and seamless workflow integration.

---

## Features

### Completed Features

- **Modern Desktop IDE**: ADE-Desktop now uses a modern, bezelless iframe instead of deprecated webview technology.
- **Service Integration**: Robust backend service orchestration (Ollama and webchat on ports 11500 and 9000).
- **Electron App**: Fully functional desktop IDE with service status indicators.
- **Cross-Origin Support**: Iframe properly configured to load ADE Studio interface from localhost.
- **Connection Management**: Robust connection retry logic and error handling for iframe loading.
- **Backend Services**: Hardened startup scripts with port detection and path-aware service management.

### Technical Implementation

- **Frontend**: Modern iframe with bezelless design, connection status monitoring, and retry logic.
- **Backend**: Python services (Ollama interface and webchat) with robust error handling and logging.
- **Configuration**: Centralized `config.json` with path abstraction and service configuration.
- **Scripts**: PowerShell and Bash startup scripts with IPv4 detection and service orchestration.
- **Architecture**: Clean separation between Electron frontend and Python backend services.

### Monaco Editor File Manager (Primary Interface)

- **Professional Interface**: Clean, Monaco Editor-based file manager at `http://localhost:8080`.
- **IDE Experience**: Full IDE capabilities with IntelliSense, syntax highlighting, and support for over 180 languages.
- **Clean Design**: Minimal, professional interface without visual clutter.
- **File Tree Navigation**: Hierarchical explorer with expand/collapse functionality.
- **Consistent UI**: Monochromatic design with subtle gray hover effects.
- **Real-Time Operations**: Instant feedback on file operations and modifications.

### AI Intelligence & Assistance

- **Ollama Integration**: Multiple model support (CodeLlama, Qwen2.5-Coder, and more).
- **File Context Awareness**: AI can reference and modify open files (Phase 5).
- **Code Analysis**: Intelligent suggestions and error detection.
- **Natural Language Commands**: Convert descriptions to code.
- **Audit Logging**: Track all AI operations and file changes.
- **Chat Integration**: AI chat with file and project context (Phase 5).

### Advanced Workflow Automation (Phase 5)

- **Windmill Integration**: Workflow automation and data processing.
- **Multi-File Operations**: Bulk operations across project files.
- **Advanced Search**: Semantic search with vector database integration.
- **Git Integration**: Source control panel and operations.
- **Real-Time Collaboration**: Multi-user editing capabilities.

---

## Directory Structure

```
.
├── .core/                  # Core architecture, icons, and instructions
├── .data/                  # Agents, backups, lattice simulation, QVM, virtualization
├── .ollama_models/         # Ollama model storage
├── .pt_models/             # PyTorch model storage
├── _thoughtprocess/        # Drafts, notes, SOPs
├── system/                 # BlackNet, DevCore, and related system modules
├── ADE/                    # Webchat service and core configuration
│   ├── __init__.py
│   ├── config.json
│   ├── ollama_interface.py
│   ├── studio_enhanced.html
│   ├── webchat.py
│   └── themes.css
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

---

## Quick Start

### Prerequisites

- Python 3.9 or higher
- [Ollama](https://ollama.com/) installed and running locally or remotely
- Pygame, Watchdog, Flask, and other dependencies (see `requirements.txt`)
- (Optional) [Amenzia VPN](https://amenzia.com/) for invisible, secure workflows

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

Choose your platform:

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

---

## System Workflow Overview

1. **Ollama Server** starts automatically (if not already running).
2. **Monaco File Manager** launches at `http://localhost:8080` (default interface).
3. **Legacy Chat Interface** available at `http://localhost:8080/chat-old`.
4. **Studio Interface** (coming in Phase 5) at `http://localhost:8080/studio`.
5. **Browser opens** automatically to the chat interface.
6. **File Watcher** begins monitoring workspace changes.
7. **Dependency Indexer** scans and indexes the codebase.
8. **AI Summarizer** analyzes code using Ollama.
9. **Visualizer Selection** prompts you to choose from multiple visualization modes.
10. **Amenzia VPN** (if enabled) ensures all traffic is encrypted and invisible.

---

## Visualization Modes

### Enhanced Visualizer (Recommended)

- Tree view, heatmaps, file analysis, and system metrics dashboard.
- Interactive and informative.

### Enhanced Starmap Constellation Visualizer

- 3D starmap: files as stars, directories as constellations.
- Advanced shader effects, smart labeling, particle systems, and real-time metrics.

### Classic 3D Visualizer

- 3D circular node display.
- System performance graphs.

---

## Controls

### Enhanced Visualizer

- **1-4**: Switch between view modes (Tree, Heatmap, File Analysis, Metrics)
- **Mouse Click**: Select directories or files
- **Scroll Wheel**: Navigate Tree View
- **S**: Toggle sidebar
- **R**: Reload data
- **ESC**: Exit visualizer

### Starmap Visualizer

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

---

## Components

- **Web Chat Interface** (`ADE/webchat.py`): Modern browser chat with Ollama AI.
- **3D Visualizer** (`ADE/visualizer.py`): Interactive 3D codebase visualization.
- **File Watcher** (`ADE/watcher.py`): Monitors file system changes.
- **Dependency Indexer** (`ADE/dependency_indexer.py`): Scans workspace and builds dependency index.
- **AI Summarizer** (`ADE/summarizer.py`): Summarizes codebase using Ollama.
- **Enhanced Visualizer** (`ADE/enhanced_visualizer.py`): Advanced analytics dashboard.
- **Amenzia VPN Integration**: Provides a secure, invisible network layer for all lab operations.

---

## Configuration

Edit `ADE/config.json` to customize Ollama and webchat settings.  
Configure Amenzia VPN as per [Amenzia documentation](https://amenzia.com/docs) for maximum privacy.

---

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
  - Ensure display and graphics drivers are properly configured
- **VPN Issues**:  
  - Verify Amenzia VPN is running and properly configured for your environment

---

## Development

To run components individually:

```bash
python ADE/visualizer.py        # Just the visualizer
python ADE/webchat.py           # Just the web chat
python -m ADE.main              # Main orchestrator (no Ollama auto-start)
```

---

## Commands & Modules

- `run.sh` — Entrypoint script (starts Ollama and the lab)
- `ADE/webchat.py` — Web interface and API server
- `ADE-Desktop/` — Electron-based desktop IDE application
- `ADE/watcher.py` — Watches for file changes
- `ADE/dependency_indexer.py` — Builds and updates dependency index
- `ADE/summarizer.py` — Summarizes codebase using Ollama
- `ADE/ollama_client.py` — Abstraction for Ollama LLM API
- `ADE/visualizer.py` — 3D visualization of codebase
- `ADE/config.json` — Ollama configuration
- `ADE/dependency_index.json` — Directory-wise dependency index
- `ADE/system_summary.json` — Maintained codebase summary

---

## Requirements

- Python 3.9 or higher
- [Ollama](https://ollama.com/) running locally or remotely
- Pygame, Watchdog, Flask
- (Recommended) [Amenzia VPN](https://amenzia.com/) for invisible, secure workflows

---

## Notes

- All data, configuration, and outputs are in `ADE/`.
- Designed for extensibility and can be adapted for larger codebases or additional LLMs.
- For best results, ensure Ollama is installed and the desired model is pulled.
- For maximum privacy and invisibility, enable Amenzia VPN during all operations.

---

## License

See [license.txt](license.txt) for details (MIT License).

---

## Roadmap

- Monaco-first file manager and studio interface
- All documentation and SOPs updated
- Enhanced visualizer is now the only analytics and visualization option
- Studio interface with Monaco, AI, and search (in progress)
- Windmill integration (planned)
- Advanced chat and file context for AI (planned)
- Multi-file and project operations, search, git, and collaboration (planned)

---

## See Also

- `FILE_MANAGER.md` for file manager help and supported languages
- `STUDIO_FEATURES.md` for full studio features and API
- `ADE/ADE.md` for system architecture
- `_thoughtprocess/notes/n220625.sop` for operational procedures and changelog

