Write-Host "Starting ADE (Artifact Development Engine)..." -ForegroundColor Cyan

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

# Change to ADE directory
Set-Location -Path "ADE"

Write-Host "Starting background services (watcher, summarizer, dependency indexer)..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "main.py" -WindowStyle Hidden

Start-Sleep -Seconds 2

Write-Host "Launching Enhanced Metrics Visualizer in background..." -ForegroundColor Yellow  
Start-Process -FilePath "python" -ArgumentList "enhanced_visualizer.py" -WindowStyle Hidden

Start-Sleep -Seconds 2

# Start the ADE Studio IDE
Write-Host "Starting ADE Studio IDE (Monaco editor, file manager, AVA chat)..." -ForegroundColor Cyan
Write-Host "ADE Studio will be available at: http://localhost:8080" -ForegroundColor Green  
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
python webchat.py
