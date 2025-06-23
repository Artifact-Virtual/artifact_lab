Write-Host "Starting Artifact Lab Workspace Manager..." -ForegroundColor Green

# Check if Ollama is running
$ollamaRunning = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if (-not $ollamaRunning) {
    Write-Host "Starting Ollama server..." -ForegroundColor Yellow
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    
    Write-Host "Waiting for Ollama to be ready..." -ForegroundColor Yellow
    $maxWait = 30
    for ($i = 1; $i -le $maxWait; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -TimeoutSec 1 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "Ollama server is ready!" -ForegroundColor Green
                break
            }
        } catch {
            # Continue waiting
        }
        Start-Sleep -Seconds 1
        if ($i -eq $maxWait) {
            Write-Host "Warning: Ollama may not be fully ready yet" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Ollama server is already running" -ForegroundColor Green
}

# Start the web chat interface in background
Write-Host "Starting web chat interface..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "workspace_manager\webchat.py" -WindowStyle Hidden

# Give the web chat a moment to start
Start-Sleep -Seconds 3

# Open web chat in browser
Write-Host "Opening web chat in browser..." -ForegroundColor Yellow
Start-Process "http://localhost:8080"

# Run the workspace manager
Write-Host "Starting workspace manager..." -ForegroundColor Green
python -m workspace_manager.main

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
