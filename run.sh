#!/bin/bash
# Entrypoint for ADE Desktop - starts all services and launches Electron app

# Cleanup background processes on exit
cleanup() {
    echo "Cleaning up background processes..."
    if [ ! -z "$WEBCHAT_PID" ]; then
        kill $WEBCHAT_PID 2>/dev/null || true
    fi
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null || true
    fi
}
trap cleanup EXIT

echo "Starting ADE (Artifact Development Engine) Desktop..."

# Check if Ollama is running on dedicated port 11500
echo "Checking for Ollama on port 11500..."
if command -v lsof &> /dev/null; then
    OLLAMA_RUNNING=$(lsof -i:11500 | grep LISTEN)
else
    OLLAMA_RUNNING=$(netstat -ano | grep 11500)
fi

if [ -n "$OLLAMA_RUNNING" ]; then
    echo "Ollama server is already running on port 11500"
else
    # Check if Ollama is running on any port
    if pgrep -x "ollama" > /dev/null; then
        echo "Ollama is running on a different port. Will use existing instance."    else
        echo "Starting Ollama server on dedicated port 11500..."
        OLLAMA_HOST=127.0.0.1:11500 ollama serve &
        OLLAMA_PID=$!
        # Wait for Ollama to be ready
        echo "Waiting for Ollama to be ready..."
        for i in {1..30}; do
            if curl -s http://localhost:11500/api/version > /dev/null 2>&1; then
                echo "Ollama server is ready!"
                break
            fi
            sleep 2
            if [ $i -eq 30 ]; then
                echo "Warning: Ollama may not be fully ready yet, continuing..."
            fi
        done
    fi
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

# Determine workspace root directory
if [ -d "ADE" ]; then
    # Already in workspace root
    WORKSPACE_ROOT=$(pwd)
elif [ -d "../ADE" ]; then
    # In ADE-Desktop subdirectory
    cd ..
    WORKSPACE_ROOT=$(pwd)
else
    echo "ERROR: Cannot find ADE directory. Please run from workspace root or ADE-Desktop."
    exit 1
fi

# Start ONLY the ADE webchat service on port 9000 for Electron integration
echo "Starting ADE webchat service on port 9000..."
$PYTHON_CMD ADE-Desktop/ade_core/webchat.py &
WEBCHAT_PID=$!

# Give the service a moment to start
sleep 3

# Wait for ADE service to be ready
echo "Waiting for ADE service to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:9000/status > /dev/null 2>&1; then
        echo "ADE service is ready!"
        break
    fi
    sleep 2
    if [ $i -eq 30 ]; then
        echo "Warning: ADE service may not be fully ready, but launching desktop app anyway..."
    fi
done

# Launch the Electron desktop app
echo "Launching ADE Desktop application..."
cd ADE-Desktop

if [ -d "node_modules" ]; then
    echo "Starting ADE Desktop..."
    npm start
else
    echo "Installing dependencies first..."
    npm install
    echo "Starting ADE Desktop..."
    npm start
fi

