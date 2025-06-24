@echo off
echo Testing ARTIFACT VIRTUAL...

:: Check if Ollama is running
echo Checking Ollama status...
curl http://localhost:11434/api/version

:: Start webchat
echo Starting webchat...
start "" python ADE\webchat.py

:: Wait and test
timeout /t 3 /nobreak >nul
echo Testing webchat status...
curl http://localhost:8080/status

pause
