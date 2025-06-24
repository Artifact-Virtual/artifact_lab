#!/usr/bin/env pwsh
# Test script for new ADE Desktop architecture

Write-Host "=== ADE Desktop Architecture Test ===" -ForegroundColor Cyan
Write-Host "Testing the new service orchestration setup..." -ForegroundColor Yellow

# Test 1: Check if startup script exists
Write-Host "`n1. Checking startup scripts..." -ForegroundColor Green
if (Test-Path "run.ps1") {
    Write-Host "✅ run.ps1 found" -ForegroundColor Green
} else {
    Write-Host "❌ run.ps1 missing" -ForegroundColor Red
}

if (Test-Path "run.sh") {
    Write-Host "✅ run.sh found" -ForegroundColor Green
} else {
    Write-Host "❌ run.sh missing" -ForegroundColor Red
}

# Test 2: Check ADE-Desktop structure
Write-Host "`n2. Checking ADE-Desktop structure..." -ForegroundColor Green
if (Test-Path "ADE-Desktop") {
    Write-Host "✅ ADE-Desktop directory found" -ForegroundColor Green
    
    if (Test-Path "ADE-Desktop/main.js") {
        Write-Host "✅ main.js found" -ForegroundColor Green
    } else {
        Write-Host "❌ main.js missing" -ForegroundColor Red
    }
    
    if (Test-Path "ADE-Desktop/package.json") {
        Write-Host "✅ package.json found" -ForegroundColor Green
    } else {
        Write-Host "❌ package.json missing" -ForegroundColor Red
    }
    
    if (Test-Path "ADE-Desktop/ade_core") {
        Write-Host "✅ ade_core directory found" -ForegroundColor Green
        
        if (Test-Path "ADE-Desktop/ade_core/webchat.py") {
            Write-Host "✅ isolated webchat.py found" -ForegroundColor Green
        } else {
            Write-Host "❌ isolated webchat.py missing" -ForegroundColor Red
        }
        
        if (Test-Path "ADE-Desktop/ade_core/config.json") {
            Write-Host "✅ isolated config.json found" -ForegroundColor Green
        } else {
            Write-Host "❌ isolated config.json missing" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ ade_core directory missing" -ForegroundColor Red
    }
} else {
    Write-Host "❌ ADE-Desktop directory missing" -ForegroundColor Red
}

# Test 3: Check port configuration
Write-Host "`n3. Checking port configuration..." -ForegroundColor Green
if (Test-Path "ADE-Desktop/ade_core/config.json") {
    $config = Get-Content "ADE-Desktop/ade_core/config.json" | ConvertFrom-Json
    if ($config.ollama_port -eq 11500) {
        Write-Host "✅ Ollama port correctly set to 11500" -ForegroundColor Green
    } else {
        Write-Host "❌ Ollama port not set to 11500 (found: $($config.ollama_port))" -ForegroundColor Red
    }
}

# Test 4: Check if processes are running
Write-Host "`n4. Checking if services are currently running..." -ForegroundColor Green
$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if ($ollamaProcess) {
    Write-Host "ℹ️  Ollama is currently running" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  Ollama is not running (will be started by run.ps1)" -ForegroundColor Yellow
}

$pythonProcesses = Get-Process -Name "python*" -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "ℹ️  Python processes detected ($($pythonProcesses.Count) processes)" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  No Python processes running (will be started by run.ps1)" -ForegroundColor Yellow
}

# Test 5: Check Node.js availability
Write-Host "`n5. Checking Node.js availability..." -ForegroundColor Green
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js available: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js not found in PATH" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Node.js not available" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "If all tests pass, you can run: ./run.ps1" -ForegroundColor Green
Write-Host "This will start all services and launch ADE Desktop automatically." -ForegroundColor Green
