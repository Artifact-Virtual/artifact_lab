# ARTIFACT VIRTUAL - Workspace Manager

A modular, real-time codebase analysis and visualization system with Ollama LLM integration, featuring multiple visualization modes and an integrated web chat interface.

## Features
- **File Watching**: Monitors workspace for file changes and logs events
- **Dependency Indexing**: Builds and updates directory-wise dependency index
- **AI Summarization**: Summarizes codebase using Ollama LLM (configurable model)
- **Enhanced Visualization**: Choose from multiple visualization modes:
   - **Tree View**: Interactive hierarchical file browser
   - **Complexity Heatmap**: Visual complexity analysis across directories
   - **File Analysis**: Detailed file-by-file breakdown
   - **Metrics Dashboard**: System performance and codebase statistics
- **Web Chat Interface**: Sleek AMOLED-styled browser chat with Ollama AI
- **Auto-Start**: Single entrypoint starts Ollama server and all components
- **All-in-One**: All data and config consolidated in `workspace_manager/`

## Visualization Modes

### 1. Enhanced Visualizer (Recommended)
- **Tree View**: Navigate your codebase structure with file icons and metrics
- **Complexity Heatmap**: See which directories have the highest complexity scores
- **File Analysis**: Get detailed insights into file types and distributions
- **Metrics Dashboard**: Real-time system performance and codebase overview

### 2. Classic 3D Visualizer
- Interactive 3D node network visualization
- Real-time system performance graphs
- Original circular layout with zoom and rotation

## Quick Start

### Prerequisites
- Python 3.8+
- [Ollama](https://ollama.ai/) installed on your system
- A compatible Ollama model (default: `qwen2.5-coder:latest`)

### Installation

1. **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2. **Pull the default Ollama model** (if not already available):
    ```bash
    ollama pull qwen2.5-coder:latest
    ```

3. **Configure settings** (optional) in `workspace_manager/config.json`:
    ```json
    {
       "ollama_model": "your-preferred-model",
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

### What happens when you run:

1. **Ollama Server** starts automatically (if not already running)
2. **Web Chat Interface** launches at `http://localhost:8080`
3. **Browser opens** automatically to the chat interface
4. **File Watcher** begins monitoring workspace changes
5. **Dependency Indexer** scans and indexes the codebase
6. **AI Summarizer** analyzes code using Ollama
7. **Visualizer Selection** prompts you to choose from multiple visualization modes

## Visualizer Options

### 1. Enhanced Visualizer (Recommended)
- Tree view, heatmaps, file analysis
- System metrics dashboard
- Interactive and informative

### 2. Enhanced Starmap Constellation Visualizer (NEW & IMPROVED!)
- **3D Starmap**: Files as stars in 3D space organized into constellations (directories)
- **Advanced Shader Effects**: Realistic star glow, diffraction spikes, and cosmic dust
- **Interactive Controls**: Pan, spin, zoom with momentum-based camera controls
- **Smart Labeling**: Only shows labels for important/selected/hovered stars
- **Detailed Analysis**: Click stars for comprehensive file analysis panels
- **Advanced Particle Systems**: Explosion effects, energy trails, ambient space dust
- **Enhanced System Metrics**: Creative charts and graphs with real-time telemetry
- **Excludes Dot Directories**: Automatically filters out .git, .vscode, etc.

### 3. Original Starmap Visualizer
- Basic 3D starmap with file constellations
- Files as stars with connections
- Simple cosmic codebase view

### 4. Classic 3D Visualizer
- 3D circular node display
- System performance graphs
- Original visualization

## Enhanced Starmap Controls

The Enhanced Starmap Visualizer offers the most advanced and visually stunning experience:

### Camera Controls
- **Mouse Drag**: Rotate starmap (momentum-based, smooth)
- **Scroll Wheel**: Zoom in/out
- **Space**: Reset camera view to origin

### Star Interaction
- **Click Star**: Select for detailed analysis
- **Double Click**: Zoom to star and show detail panel
- **Hover**: Quick info display with smart labeling

### Toggle Features
- **L**: Star labels on/off (smart display system)
- **C**: Connection lines (energy beams between related files)
- **M**: System metrics panel (advanced telemetry charts)
- **P**: Particle effects (explosions, trails, ambient dust)
- **D**: Detailed analysis view (comprehensive file information)

### System Controls
- **R**: Reload codebase data
- **ESC**: Exit starmap

### Advanced Features

**Smart Labeling System**
- Only shows labels for important files (main.py, index.js, etc.)
- Abbreviated labels for distant view
- Full labels for selected/hovered stars

**Shader Effects**
- Multi-layer glow with realistic falloff
- Chromatic aberration for stellar cores
- Advanced diffraction spikes for important stars
- Temperature-based star coloring

**Particle Systems**
- Explosion effects when selecting stars
- Energy trails along connections
- Ambient cosmic dust particles
- Different particle types (spark, energy, glow)

**System Metrics Visualization**
- CPU, Memory, Storage, Network monitoring
- Creative graph designs with area fills
- Real-time telemetry updates
- Grid-based layouts with smooth animations

## Enhanced Visualizer Controls

When using the Enhanced Visualizer, you have these controls:

### Navigation
- **1-4**: Switch between view modes (Tree, Heatmap, File Analysis, Metrics)
- **Mouse Click**: Select directories and files in Tree View
- **Scroll Wheel**: Navigate up/down in Tree View
- **S**: Toggle sidebar visibility
- **R**: Reload data from disk
- **ESC**: Exit visualizer

### View Modes Explained

**Tree View (1)**
- Navigate your codebase hierarchically
- Click directories to expand/collapse
- Click files for detailed analysis
- Visual complexity indicators

**Complexity Heatmap (2)**  
- Heat map visualization of directory complexity
- Red = high complexity, Green = low complexity
- Shows file counts and complexity scores

**File Analysis (3)**
- Detailed analysis of selected files
- File type distribution
- Directory statistics

**Metrics Dashboard (4)**
- Real-time system performance monitoring
- Codebase overview statistics
- CPU and RAM usage graphs

## Components

### 1. Web Chat Interface (`webchat.py`)
- Modern, responsive web interface
- Real-time chat with Ollama AI
- Connection status monitoring
- Accessible at `http://localhost:8080`

### 2. 3D Visualizer (`visualizer.py`)
- Interactive 3D codebase visualization
- Real-time CPU and RAM monitoring with waveform graphs
- Mouse controls for navigation
- Directory and file node representation

### 3. File Watcher (`watcher.py`)
- Monitors file system changes
- Logs create, modify, delete events
- Runs continuously in background

### 4. Dependency Indexer (`dependency_indexer.py`)
- Scans workspace for files
- Builds dependency relationships
- Outputs to `dependency_index.json`

### 5. AI Summarizer (`summarizer.py`)
- Connects to Ollama LLM
- Analyzes and summarizes codebase
- Configurable model selection

## Configuration

Edit `workspace_manager/config.json` to customize:

```json
{
   "ollama_endpoint": "http://localhost:11434/api/generate",
   "ollama_model": "qwen2.5-coder:latest",
   "ollama_host": "localhost",
   "ollama_port": 11434,
   "webchat_port": 8080
}
```

## Troubleshooting

### Ollama Issues
- Ensure Ollama is installed: `ollama --version`
- Check if model exists: `ollama list`
- Pull model if missing: `ollama pull qwen2.5-coder:latest`

### Port Conflicts
- Change `webchat_port` in config.json if port 8080 is in use
- Change `ollama_port` if 11434 is in use

### Dependencies
- Install missing packages: `pip install flask requests pygame psutil watchdog`
- For visualization issues, ensure display/graphics drivers are properly configured

## Development

To run components individually:

```bash
# Just the visualizer
python workspace_manager/visualizer.py

# Just the web chat
python workspace_manager/webchat.py

# Just the main workspace manager (without Ollama auto-start)
python -m workspace_manager.main
```
    ```sh
    ./run.sh
    ```
    - This will start the Ollama server (if not running) and launch the workspace manager.

## Commands & Modules
- `run.sh` — Entrypoint script (starts Ollama and the manager)
- `workspace-manager/main.py` — Main orchestrator (watcher, indexer, summarizer, visualizer)
- `workspace-manager/watcher.py` — Watches for file changes
- `workspace-manager/dependency_indexer.py` — Builds/updates dependency index
- `workspace-manager/summarizer.py` — Summarizes codebase using Ollama
- `workspace-manager/ollama_client.py` — Abstraction for Ollama LLM API
- `workspace-manager/visualizer.py` — 3D visualization of codebase
- `workspace-manager/config.json` — Ollama configuration
- `workspace-manager/dependency_index.json` — Directory-wise dependency index
- `workspace-manager/system_summary.json` — Maintained codebase summary

## Requirements
- Python 3.9+
- [Ollama](https://ollama.com/) running locally or remote
- Pygame, Watchdog

## Notes
- All data, config, and outputs are in `workspace-manager/`.
- The system is designed for extensibility and can be adapted for larger codebases or additional LLMs.
- For best results, ensure Ollama is installed and the desired model is pulled.

---

### Example: Change Model
Edit `workspace-manager/config.json`:
```json
{
   "ollama_endpoint": "http://localhost:11434/api/generate",
   "ollama_model": "tinyllama:latest"
}
```

### Example: Run
```sh
./run.sh
```

---

For advanced automation (e.g., VS Code tasks), see `.vscode/` (if present).