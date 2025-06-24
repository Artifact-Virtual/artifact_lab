# ADE Studio & Workspace Manager

## 1. Overview

The ADE Studio is a comprehensive development environment featuring a professional Monaco Editor-based file manager with AMOLED display, advanced code analytics, and integrated AI assistant capabilities. The system provides a clean, professional interface with a pure black background, crisp white text, and subtle gray accents for a premium development experience. Built as a Monaco Editor-first platform, it offers VS Code-like functionality with seamless AI integration and advanced workflow automation capabilities.

## 2. Core Features

### 2.1. Monaco Editor File Manager (Primary Interface)
- **Default Interface**: Professional file manager at http://localhost:8080 with ADAM-matching color scheme
- **Pure Black Theme**: Consistent monochromatic design with black background (#000000), white text (#ffffff), and gray accents
- **Monaco Editor**: Full VS Code-like editing experience with IntelliSense, syntax highlighting, and code completion for 180+ languages
- **Clean UI**: Minimal, professional interface without visual clutter or unnecessary controls
- **File Tree Explorer**: Hierarchical navigation with expand/collapse functionality and file-type recognition
- **Toolbar**: Clean, contextual buttons with consistent gray hover effects
- **Status Bar**: Real-time feedback on file operations and modifications

### 2.2. File Management
- **Full CRUD Operations**: Create, read, write, and delete files and folders through the UI or API.
- **File Tree Explorer**: A hierarchical file explorer with folder expansion/collapse and file-type icons for intuitive navigation.
- **Real-time Sync**: The file explorer and editor state are automatically synchronized with the backend file system.
- **Auto-Save Detection**: Real-time change tracking with visual indicators for unsaved files.
- **Context Menus**: Right-click operations for files and folders (delete, rename, etc.).

### 2.3. AI Assistant Integration
- **Context-Aware Chat**: The integrated AI chat panel is aware of the currently open file and editor state.
- **Code Analysis & Generation**: AI-powered code review, refactoring suggestions, and documentation generation.
- **Direct File Modification**: The AI can suggest and apply changes directly to files in the editor, with user confirmation.
- **LLM Integration**: Connects to local LLM models via an Ollama endpoint.

### 2.4. Code Analytics & Visualization
- **Enhanced Metrics Visualizer**: An advanced dashboard for code analytics and system monitoring.
- **Real-time System Metrics**: Animated charts displaying live CPU, Memory, and Disk usage.
- **Comprehensive File Analysis**: Includes dotfiles (`.gitignore`, `.env`) and provides metrics on file types, sizes, and language distribution.
- **Dependency Indexing**: Analyzes and indexes file dependencies and project statistics.
- **Real-time Monitoring**: A file watcher monitors the workspace for changes in real-time.

### 2.5. Advanced Search & Navigation
- **Global Search**: Search for text across all files in the workspace.
- **Symbol Search**: Find functions, classes, and variables across the project.
- **Go to Definition**: Instantly navigate to symbol definitions.
- **Find References**: Locate all references to a specific symbol.

## 3. Architecture

### 3.1. System Diagram
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Flask Backend  │    │   File System  │
│ (Monaco, React) │    │ (webchat.py)     │    │                 │
│ • Editor & UI   │◄──►│ • File API       │◄──►│ • Workspace     │
│ • File Explorer │    │ • LLM Chat API   │    │ • Audit Logs    │
│ • Chat Panel    │    │ • Audit System   │    │ • Config Files  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 3.2. Key Components & File Structure
- `main.py`: Main entry point for launching the visualizer.
- `webchat.py`: The core Flask application serving the frontend and all backend APIs.
- `enhanced_visualizer.py`: The advanced analytics and system monitoring dashboard.
- `dependency_indexer.py`: Handles comprehensive file analysis and indexing, including dotfiles.
- `watcher.py`: Provides real-time file system monitoring.
- `ollama_client.py`: Manages communication with the Ollama LLM service.
- `config.json`: System configuration and settings.
- `audit_log.json`: Audit log for all file operations.
- `llm_audit_log.json`: Audit log for all LLM interactions.

### 3.3. Technical Stack
- **Backend**: Flask, psutil, watchdog
- **Frontend**: Monaco Editor, HTML, CSS, JavaScript
- **Visualization**: pygame
- **AI Integration**: Ollama

## 4. API Reference

### 4.1. Core Endpoints
- `GET /`: Serves the main web chat interface.
- `GET /file-manager`: Serves the Monaco-based file editing interface.
- `GET /status`: Returns system status and LLM model information.
- `POST /chat`: Handles LLM interaction with context.

### 4.2. File Management API
- `GET /api/files/list?path=<path>`: Lists contents of a directory.
- `GET /api/files/read?path=<file>`: Reads the contents of a file.
- `POST /api/files/write`: Writes content to a file. Expects a JSON body: `{"path": "file.txt", "content": "..."}`.
- `DELETE /api/files/delete?path=<file>`: Deletes a file.

### 4.3. Audit & Monitoring API
- `GET /api/audit/files`: Returns the file operation audit log.
- `GET /api/audit/llm`: Returns the LLM interaction audit log.

### 4.4. Analytics API
- `GET /api/analytics/workspace`: Returns analytics for the entire workspace.
- `GET /api/analytics/file?path=<file>`: Returns metrics for a specific file.
- `GET /api/analytics/dependencies`: Returns the project dependency graph.

## 5. Configuration

### 5.1. Server Configuration (`config.json`)
- **Host**: `0.0.0.0` (listens on all interfaces)
- **Port**: `8080`
- **LLM Model**: `codellama:7b`
- **Ollama Endpoint**: `http://localhost:11434`

### 5.2. Editor Settings (Client-side)
- **Theme**: `vs-dark`
- **Font Size**: 14px
- **Word Wrap**: `on`
- **Minimap**: Enabled

## 6. Security & Compliance

### 6.1. Security Features
- **Workspace Boundary Enforcement**: Operations are strictly confined to the defined workspace root.
- **Path Traversal Prevention**: All file paths are validated and sanitized to prevent directory traversal attacks.
- **Input Sanitization**: All inputs for file operations are sanitized.
- **User-Controllable Operations**: All file modifications initiated by the AI require user confirmation.

### 6.2. Audit System
- **File Operations Logging**: All CRUD operations are logged with timestamps and details in `audit_log.json`.
- **LLM Interaction Logging**: Complete conversation histories are logged in `llm_audit_log.json`.
- **Data Retention**: Logs are automatically rotated to retain the last 1000 file operations and 500 LLM interactions.

## 7. Usage and Operations

### 7.1. Quick Start
1.  Navigate to the project root directory.
2.  Ensure Ollama server is running.
3.  Launch the web application: `python -m ADE.webchat`
4.  Access the interface at `http://localhost:8080`.

### 7.2. CLI Examples
```bash
# List root directory files
curl http://localhost:8080/api/files/list

# Read a file
curl "http://localhost:8080/api/files/read?path=README.md"

# Write a new file
curl -X POST http://localhost:8080/api/files/write \
  -H "Content-Type: application/json" \
  -d '{"path": "test.js", "content": "console.log(\"Hello ADE\");"}'
```

## 8. Supported Languages & Formats
The editor provides syntax highlighting and language support for a wide range of formats, including:
- **Programming Languages**: JavaScript, TypeScript, Python, Java, C/C++, C#, Go, Rust, PHP, Ruby.
- **Web Technologies**: HTML, CSS, SCSS, JSON, XML.
- **Documentation & Config**: Markdown, YAML, TOML, INI.
- **Shell & Scripts**: Bash, PowerShell, Dockerfile, Makefile.
- **Data & Query Languages**: SQL, GraphQL.

## 9. Troubleshooting Guide

### 9.1. File Explorer Not Loading
- **Cause**: The Flask server may not be running or the API is returning an error.
- **Solution**:
    1.  Ensure `webchat.py` is running without errors.
    2.  Test the API endpoint directly: `curl http://localhost:8080/api/files/list`.
    3.  Check the browser's developer console for network or JavaScript errors.

### 9.2. LLM Connection Issues
- **Cause**: The Ollama server may not be running or the configured model is unavailable.
- **Solution**:
    1.  Ensure the Ollama service is active: `ollama serve`.
    2.  Verify the required model is pulled: `ollama pull codellama:7b`.
    3.  Check the Ollama endpoint: `curl http://localhost:11434/api/version`.

### 9.3. Module Not Found Errors
- **Cause**: Scripts are not being run from the correct project root directory.
- **Solution**: Always run scripts from the project root (`l:\devops\artifact_lab`) or use the module syntax (`python -m ADE.main`) to ensure correct path resolution.

## 10. Project Evolution: Removed Components

To improve performance and focus the tool's scope, the following components have been completely removed:
- **Starmap Visualizer**: All 3D starmap functionality, including `starmap_visualizer.py`, particle systems, and cosmic effects, has been eliminated to remove graphical lag and streamline the application. The `enhanced_visualizer.py` is now the primary tool for analytics.

## 11. Roadmap & Future Integrations

### 11.1. Planned Features
- **Git Integration**: Perform version control operations (commit, push, pull, diff) directly from the UI.
- **Real-time Collaboration**: Enable multiple users to edit files simultaneously.
- **Advanced Workspace Operations**: Support for multi-file refactoring, bulk renaming, and project-wide actions.
- **Plugin System**: An extension architecture to add custom functionality.

### 11.2. Planned Integrations
- **Windmill**: Use Windmill for workflow automation and complex data operations.
- **Vector Database**: Integrate a vector DB for semantic code search and enhanced AI context.
