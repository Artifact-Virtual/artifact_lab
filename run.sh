#!/bin/bash
# Entrypoint for Artifact Lab workspace manager (cross-platform)

# Cleanup background processes on exit
cleanup() {
    echo "Cleaning up background processes..."
    if [ ! -z "$MAIN_PID" ]; then
        kill $MAIN_PID 2>/dev/null || true
    fi
    if [ ! -z "$VIZ_PID" ]; then
        kill $VIZ_PID 2>/dev/null || true
    fi
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null || true
    fi
}
trap cleanup EXIT

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

# Start all components
cd ADE

echo "Starting background services (watcher, summarizer, dependency indexer)..."
$PYTHON_CMD main.py &
MAIN_PID=$!

sleep 2

echo "Launching Enhanced Metrics Visualizer in background..."
$PYTHON_CMD enhanced_visualizer.py &
VIZ_PID=$!

sleep 2

echo "Starting ADE Studio IDE (Monaco editor, file manager, AVA chat)..."
echo "ADE Studio will be available at: http://localhost:8080"
echo "Press Ctrl+C to stop all services"
$PYTHON_CMD webchat.py

# Cleanup will run on exit

