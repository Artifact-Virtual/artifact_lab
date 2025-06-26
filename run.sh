#!/bin/bash
# DevCore Artifact Lab - Unified Entry Point

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}■ DevCore Artifact Lab - Unified Entry Point${NC}"
echo -e "${CYAN}════════════════════════════════════════════════${NC}"

# Cleanup background processes on exit
cleanup() {
    echo -e "${GRAY}◦ Cleaning up background processes...${NC}"
    if [ ! -z "$WEBCHAT_PID" ]; then
        kill $WEBCHAT_PID 2>/dev/null || true
    fi
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null || true
    fi
    if [ ! -z "$WORKSPACE_PID" ]; then
        kill $WORKSPACE_PID 2>/dev/null || true
    fi
}
trap cleanup EXIT

# Function to display help
show_help() {
    echo ""
    echo -e "${YELLOW}Usage: ./run.sh [command] [options]${NC}"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  ade              Start ADE Desktop application (default)"
    echo "  workspace        Start Workspace Manager"
    echo "  format           Run Code Formatter"
    echo "  format-watch     Run Code Formatter in watch mode"
    echo "  backup           Create codebase backup"
    echo "  backup-list      List available backups"
    echo "  backup-clean     Clean old backups"
    echo "  changelog        Update changelog from git commits"
    echo "  changelog-hooks  Install git hooks for automatic changelog"
    echo "  all              Run all services"
    echo "  help             Show this help message"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo "  --verbose        Show detailed output"
    echo "  --no-ollama      Skip Ollama startup"
    echo ""
    exit 0
}

# Parse arguments
COMMAND=$1
VERBOSE=false
NO_OLLAMA=false

for arg in "$@"; do
    case $arg in
        --verbose)
            VERBOSE=true
            ;;
        --no-ollama)
            NO_OLLAMA=true
            ;;
        help|-h|--help)
            show_help
            ;;
    esac
done

# Default command
if [ -z "$COMMAND" ]; then
    COMMAND="ade"
fi

echo -e "${GRAY}◦ Command: $COMMAND${NC}"
echo -e "${GRAY}◦ Workspace Root: $(pwd)${NC}"
echo ""

# Function to check if a service is running
check_service_running() {
    local port=$1
    if command -v lsof &> /dev/null; then
        lsof -i:$port | grep LISTEN > /dev/null
    elif command -v netstat &> /dev/null; then
        netstat -ano | grep $port > /dev/null
    else
        return 1
    fi
}

# Function to start Ollama if needed
start_ollama() {
    if [ "$NO_OLLAMA" = true ]; then
        echo -e "${YELLOW}○ Skipping Ollama startup (--no-ollama)${NC}"
        return
    fi
    
    echo -e "${GRAY}◦ Checking for Ollama on port 11500...${NC}"
    if check_service_running 11500; then
        echo -e "${GREEN}▣ Ollama server is already running on port 11500${NC}"
    else
        if pgrep -x "ollama" > /dev/null; then
            echo -e "${GREEN}▣ Ollama is running on a different port. Will use existing instance.${NC}"
        else
            echo -e "${GRAY}◦ Starting Ollama server on dedicated port 11500...${NC}"
            OLLAMA_HOST=127.0.0.1:11500 ollama serve &
            OLLAMA_PID=$!
            
            echo -e "${GRAY}◦ Waiting for Ollama to be ready...${NC}"
            for i in {1..30}; do
                if curl -s http://localhost:11500/api/version > /dev/null 2>&1; then
                    echo -e "${GREEN}▣ Ollama server is ready!${NC}"
                    break
                fi
                sleep 2
                if [ $i -eq 30 ]; then
                    echo -e "${YELLOW}▲ Warning: Ollama may not be fully ready yet, continuing...${NC}"
                fi
            done
        fi
    fi
}

# Detect python command
PYTHON_CMD=python
if ! command -v python &> /dev/null; then
    if command -v python3 &> /dev/null; then
        PYTHON_CMD=python3
    elif command -v py &> /dev/null; then
        PYTHON_CMD=py
    else
        echo -e "${RED}× Python is not installed or not in PATH.${NC}"
        exit 1
    fi
fi

# Determine workspace root directory
WORKSPACE_ROOT=$(pwd)
if [ -d "ADE" ]; then
    # Already in workspace root
    :
elif [ -d "../ADE" ]; then
    # In subdirectory
    cd ..
    WORKSPACE_ROOT=$(pwd)
else
    echo -e "${RED}× ERROR: Cannot find ADE directory. Please run from workspace root.${NC}"
    exit 1
fi

# Function to execute workspace manager commands
execute_workspace_manager() {
    local action=$1
    cd "$WORKSPACE_ROOT/workspace-manager"
    
    case $action in
        "format")
            echo -e "${GRAY}◦ Running Code Formatter...${NC}"
            node code-formatter.js
            ;;
        "format-watch")
            echo -e "${GRAY}◦ Running Code Formatter in watch mode...${NC}"
            node code-formatter.js --watch
            ;;
        "backup")
            echo -e "${GRAY}◦ Creating codebase backup...${NC}"
            node backup-manager.js backup
            ;;
        "backup-list")
            echo -e "${GRAY}◦ Listing available backups...${NC}"
            node backup-manager.js list
            ;;
        "backup-clean")
            echo -e "${GRAY}◦ Cleaning old backups...${NC}"
            node backup-manager.js clean
            ;;
        "changelog")
            echo -e "${GRAY}◦ Updating changelog...${NC}"
            node changelog-automation.js
            ;;
        "changelog-hooks")
            echo -e "${GRAY}◦ Installing git hooks...${NC}"
            node changelog-automation.js --install-hooks
            ;;
        "workspace")
            echo -e "${GRAY}◦ Starting Workspace Manager...${NC}"
            npm start
            ;;
    esac
}

# Execute commands
case $COMMAND in
    "ade")
        start_ollama
        
        # Start ADE webchat service
        echo -e "${GRAY}◦ Starting ADE webchat service on port 9000...${NC}"
        $PYTHON_CMD "$WORKSPACE_ROOT/ADE-Desktop/ade_core/webchat.py" &
        WEBCHAT_PID=$!
        
        # Give the service a moment to start
        sleep 3
        
        # Wait for ADE service to be ready
        echo -e "${GRAY}◦ Waiting for ADE service to be ready...${NC}"
        for i in {1..30}; do
            if curl -s http://localhost:9000/status > /dev/null 2>&1; then
                echo -e "${GREEN}▣ ADE service is ready!${NC}"
                break
            fi
            sleep 2
            if [ $i -eq 30 ]; then
                echo -e "${YELLOW}▲ Warning: ADE service may not be fully ready, but launching desktop app anyway...${NC}"
            fi
        done
        
        # Launch the Electron desktop app
        echo -e "${GRAY}◦ Launching ADE Desktop application...${NC}"
        cd "$WORKSPACE_ROOT/ADE-Desktop"
        
        if [ -d "node_modules" ]; then
            echo -e "${GREEN}▣ Starting ADE Desktop...${NC}"
            npm start
        else
            echo -e "${GRAY}◦ Installing dependencies first...${NC}"
            npm install
            echo -e "${GREEN}▣ Starting ADE Desktop...${NC}"
            npm start
        fi
        ;;
        
    "workspace")
        execute_workspace_manager "workspace"
        ;;
    "format")
        execute_workspace_manager "format"
        ;;
    "format-watch")
        execute_workspace_manager "format-watch"
        ;;
    "backup")
        execute_workspace_manager "backup"
        ;;
    "backup-list")
        execute_workspace_manager "backup-list"
        ;;
    "backup-clean")
        execute_workspace_manager "backup-clean"
        ;;
    "changelog")
        execute_workspace_manager "changelog"
        ;;
    "changelog-hooks")
        execute_workspace_manager "changelog-hooks"
        ;;
        
    "all")
        echo -e "${GRAY}◦ Starting all services...${NC}"
        start_ollama
        
        # Start workspace manager in background
        echo -e "${GRAY}◦ Starting Workspace Manager...${NC}"
        cd "$WORKSPACE_ROOT/workspace-manager"
        npm start &
        WORKSPACE_PID=$!
        
        # Run code formatter once
        echo -e "${GRAY}◦ Running Code Formatter...${NC}"
        node code-formatter.js
        
        # Create backup
        echo -e "${GRAY}◦ Creating codebase backup...${NC}"
        node backup-manager.js backup
        
        # Update changelog
        echo -e "${GRAY}◦ Updating changelog...${NC}"
        node changelog-automation.js
        
        echo -e "${GREEN}▣ All services started!${NC}"
        
        # Keep script running
        echo -e "${CYAN}◐ All services are running. Press Ctrl+C to stop.${NC}"
        wait
        ;;
        
    *)
        echo -e "${RED}× Unknown command: $COMMAND${NC}"
        echo -e "${GRAY}Use './run.sh help' for usage information.${NC}"
        exit 1
        ;;
esac
