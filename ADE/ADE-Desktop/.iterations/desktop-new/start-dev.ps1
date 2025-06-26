# Artifact Desktop - Development Launch Script
# This script starts the new desktop application

Write-Host "🚀 Starting Artifact Desktop (New Implementation)" -ForegroundColor Cyan
Write-Host "Working Directory: $(Get-Location)" -ForegroundColor Gray

# Change to desktop directory
$desktopPath = "L:\devops\artifact_lab\desktop"
if (Test-Path $desktopPath) {
    Set-Location $desktopPath
    Write-Host "📁 Changed to desktop directory: $desktopPath" -ForegroundColor Green
} else {
    Write-Host "❌ Desktop directory not found: $desktopPath" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Start the application in development mode
Write-Host "🔧 Starting Artifact Desktop in development mode..." -ForegroundColor Cyan
$env:NODE_ENV = "development"
npm run dev
