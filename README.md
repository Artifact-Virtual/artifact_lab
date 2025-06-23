# ARTIFACT VIRTUAL LABORATORY

> Quantum-simulated backend. Fully private, robustly secure, and dark by design—an advanced laboratory for accelerated research and development.

A modular, real-time codebase analysis and visualization toolkit powered by Ollama LLM integration. Offers multi-mode visualization, deep analytics, and an integrated AMOLED-styled web chat interface.  
Built for extensibility, privacy, and high-performance insight into evolving codebases—ideal for teams and solo developers seeking actionable intelligence and seamless workflow integration.


## Features
  
- **File Watching**: Monitors workspace for file changes and logs events.
- **Dependency Indexing**: Builds and updates a directory-wise dependency index.
- **AI Summarization**: Summarizes codebase using Ollama LLM (configurable model).
- **Enhanced Visualization**: Multiple visualization modes:
  - **Tree View**: Interactive hierarchical file browser.
  - **Complexity Heatmap**: Visual complexity analysis across directories.
  - **File Analysis**: Detailed file-by-file breakdown.
  - **Metrics Dashboard**: System performance and codebase statistics.
- **Web Chat Interface**: AMOLED-styled browser chat with Ollama AI.
- **Auto-Start**: Single entrypoint starts Ollama server and all components.
- **All-in-One**: All data and config consolidated in `workspace_manager/`.
- **Dotfile Support**: Analytics and visualization include dotfiles (e.g., `.gitignore`).
- **Live indexing and visualization** system that maintains an evolving context as your codebase grows. This enables up-to-date analytics and visual feedback, ensuring that changes and dependencies are always reflected in real time.


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


## Configuration

Edit `workspace_manager/config.json` to customize Ollama and webchat settings.


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


## Notes

- All data, config, and outputs are in `workspace_manager/`.
- Designed for extensibility and can be adapted for larger codebases or additional LLMs.
- For best results, ensure Ollama is installed and the desired model is pulled.


## License

See [license.txt](license.txt) for details (MIT License).