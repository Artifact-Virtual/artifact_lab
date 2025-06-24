Write-Host "Starting ADE (Artifact Development Engine) Desktop..." -ForegroundColor Cyan

# Check if Ollama is running on the dedicated ADE port
Write-Host "Checking for Ollama on port 11500..." -ForegroundColor Yellow
$ollamaProcess = Get-NetTCPConnection -LocalPort 11500 -ErrorAction SilentlyContinue
if (-not $ollamaProcess) {
    # Check if Ollama is running on any port
    $anyOllamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
    if ($anyOllamaProcess) {
        Write-Host "Ollama is running on a different port. Will use existing instance." -ForegroundColor Yellow    } else {
        Write-Host "Starting Ollama server on dedicated port 11500..." -ForegroundColor Yellow
        $env:OLLAMA_HOST = "127.0.0.1:11500"
        Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
        
        Write-Host "Waiting for Ollama to be ready..." -ForegroundColor Yellow
        $maxWait = 30
        for ($i = 1; $i -le $maxWait; $i++) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:11500/api/version" -TimeoutSec 2 -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Write-Host "Ollama server is ready!" -ForegroundColor Green
                    break
                }
            } catch {
                # Continue waiting
            }
            Start-Sleep -Seconds 2
            if ($i -eq $maxWait) {
                Write-Host "Warning: Ollama may not be fully ready yet, continuing..." -ForegroundColor Yellow
            }
        }
    }
} else {
    Write-Host "Ollama server is already running on port 11500" -ForegroundColor Green
}

# Store the original location and change to workspace root
$originalLocation = Get-Location
if (Test-Path "ADE") {
    # Already in workspace root
    $workspaceRoot = Get-Location
} elseif (Test-Path "..\ADE") {
    # In ADE-Desktop subdirectory
    Set-Location -Path ".."
    $workspaceRoot = Get-Location
} else {
    Write-Host "ERROR: Cannot find ADE directory. Please run from workspace root or ADE-Desktop." -ForegroundColor Red
    exit 1
}

# Start ONLY the ADE webchat service on port 9000 (for Electron integration)
Write-Host "Starting ADE webchat service on port 9000..." -ForegroundColor Yellow
Start-Process -FilePath "python" -ArgumentList "ADE-Desktop\ade_core\webchat.py" -WindowStyle Hidden

# Give the service a moment to start
Start-Sleep -Seconds 5

Write-Host "ADE service should be ready!" -ForegroundColor Green

# Launch the Electron desktop app
Write-Host "Launching ADE Desktop application..." -ForegroundColor Cyan
Set-Location -Path "ADE-Desktop"

if (Test-Path "node_modules") {
    Write-Host "Starting ADE Desktop..." -ForegroundColor Green
    npm start
} else {
    Write-Host "Installing dependencies first..." -ForegroundColor Yellow
    npm install
    Write-Host "Starting ADE Desktop..." -ForegroundColor Green
    npm start
}
