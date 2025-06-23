#!/bin/bash
# Entrypoint for Artifact Lab workspace manager (cross-platform)

echo "Starting Artifact Lab Workspace Manager..."

# Cross-platform Ollama port check (works in Git Bash, WSL, and Windows with netstat)
if command -v lsof &> /dev/null; then
    OLLAMA_RUNNING=$(lsof -i:11434 | grep LISTEN)
else
    OLLAMA_RUNNING=$(netstat -ano | grep 11434)
fi

if [ -n "$OLLAMA_RUNNING" ]; then
    echo "Ollama server is already running on port 11434"
else
    echo "Starting Ollama server..."
    ollama serve &
    OLLAMA_PID=$!
    # Wait for Ollama to be ready
    echo "Waiting for Ollama to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:11434/api/version > /dev/null 2>&1; then
            echo "Ollama server is ready!"
            break
        fi
        sleep 1
    done
fi

# Detect python command (python, python3, or py)
PYTHON_CMD=python
if ! command -v python &> /dev/null; then
    if command -v python3 &> /dev/null; then
        PYTHON_CMD=python3
    elif command -v py &> /dev/null; then
        PYTHON_CMD=py
    else
        echo "Python is not installed or not in PATH."
        exit 1
    fi
fi

# Start the web chat interface in background
echo "Starting web chat interface..."
$PYTHON_CMD workspace_manager/webchat.py &
WEBCHAT_PID=$!

# Give the web chat a moment to start
sleep 2

# Open web chat in browser (optional - comment out if you don't want auto-open)
$PYTHON_CMD -c "import webbrowser; webbrowser.open('http://localhost:8080')" 2>/dev/null &

# Run the workspace manager
echo "Starting workspace manager..."
cd workspace_manager
$PYTHON_CMD main.py

