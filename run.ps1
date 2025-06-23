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

# Start the AVA web chat interface
Write-Host "Starting AVA web chat interface..." -ForegroundColor Green
cd workspace_manager
python webchat.py

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
