@echo off
echo Starting ARTIFACT VIRTUAL Workspace Manager...

:: Check if Ollama is running
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Starting Ollama server...
    start "" ollama serve
    echo Waiting for Ollama to be ready...
    
    :: Wait for Ollama to be ready (max 30 seconds)
    for /l %%i in (1,1,30) do (
        curl -s http://localhost:11434/api/version >nul 2>&1
        if not errorlevel 1 (
            echo Ollama server is ready!
            goto :ollama_ready
        )
        timeout /t 1 /nobreak >nul
    )
    echo Warning: Ollama may not be fully ready yet
    :ollama_ready
) else (
    echo Ollama server is already running
)

:: Start the web chat interface in background
echo Starting web chat interface...
start "" python workspace_manager\webchat.py

:: Give the web chat a moment to start
timeout /t 3 /nobreak >nul

:: Open web chat in browser (optional)
echo Opening web chat in browser...
start "" http://localhost:8080

:: Run the workspace manager
echo Starting workspace manager...
cd workspace_manager
python main.py

cd ..

pause
