Write-Host "■ DevCore Artifact Lab - Unified Entry Point" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan

# Store the original location
$originalLocation = Get-Location
$workspaceRoot = $PSScriptRoot

# Function to display help
function Show-Help {
    Write-Host ""
    Write-Host "Usage: .\run.ps1 [command] [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  ade              Start ADE Desktop application (default)"
    Write-Host "  workspace        Start Workspace Manager"
    Write-Host "  format           Run Code Formatter"
    Write-Host "  format-watch     Run Code Formatter in watch mode"
    Write-Host "  backup           Create codebase backup"
    Write-Host "  backup-list      List available backups"
    Write-Host "  backup-clean     Clean old backups"
    Write-Host "  changelog        Update changelog from git commits"
    Write-Host "  changelog-hooks  Install git hooks for automatic changelog"
    Write-Host "  all              Run all services"
    Write-Host "  help             Show this help message"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  --verbose        Show detailed output"
    Write-Host "  --no-ollama      Skip Ollama startup"
    Write-Host ""
    exit 0
}

# Parse arguments
$command = $args[0]
$verbose = $args -contains "--verbose"
$noOllama = $args -contains "--no-ollama"

if ($command -eq "help" -or $command -eq "-h" -or $command -eq "--help") {
    Show-Help
}

# Default command
if (-not $command) {
    $command = "ade"
}

Write-Host "◦ Command: $command" -ForegroundColor Gray
Write-Host "◦ Workspace Root: $workspaceRoot" -ForegroundColor Gray
Write-Host ""

# Function to check if a service is running
function Test-ServiceRunning {
    param([int]$Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $null -ne $connection
    } catch {
        return $false
    }
}

# Function to start Ollama if needed
function Start-Ollama {
    if ($noOllama) {
        Write-Host "○ Skipping Ollama startup (--no-ollama)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "◦ Checking for Ollama on port 11500..." -ForegroundColor Gray
    if (Test-ServiceRunning -Port 11500) {
        Write-Host "▣ Ollama server is already running on port 11500" -ForegroundColor Green
    } else {
        $anyOllamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
        if ($anyOllamaProcess) {
            Write-Host "▣ Ollama is running on a different port. Will use existing instance." -ForegroundColor Green
        } else {
            Write-Host "◦ Starting Ollama server on dedicated port 11500..." -ForegroundColor Gray
            $env:OLLAMA_HOST = "127.0.0.1:11500"
            Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
            
            Write-Host "◦ Waiting for Ollama to be ready..." -ForegroundColor Gray
            $maxWait = 30
            for ($i = 1; $i -le $maxWait; $i++) {
                try {
                    $response = Invoke-WebRequest -Uri "http://localhost:11500/api/version" -TimeoutSec 2 -ErrorAction SilentlyContinue
                    if ($response.StatusCode -eq 200) {
                        Write-Host "▣ Ollama server is ready!" -ForegroundColor Green
                        break
                    }
                } catch {
                    # Continue waiting
                }
                Start-Sleep -Seconds 2
                if ($i -eq $maxWait) {
                    Write-Host "▲ Warning: Ollama may not be fully ready yet, continuing..." -ForegroundColor Yellow
                }
            }
        }
    }
}

# Function to execute workspace manager commands
function Invoke-WorkspaceManager {
    param([string]$Action)
    
    Set-Location "$workspaceRoot\workspace-manager"
    
    switch ($Action) {
        "format" { 
            Write-Host "◦ Running Code Formatter..." -ForegroundColor Gray
            node code-formatter.js
        }
        "format-watch" { 
            Write-Host "◦ Running Code Formatter in watch mode..." -ForegroundColor Gray
            node code-formatter.js --watch
        }
        "backup" { 
            Write-Host "◦ Creating codebase backup..." -ForegroundColor Gray
            node backup-manager.js backup
        }
        "backup-list" { 
            Write-Host "◦ Listing available backups..." -ForegroundColor Gray
            node backup-manager.js list
        }
        "backup-clean" { 
            Write-Host "◦ Cleaning old backups..." -ForegroundColor Gray
            node backup-manager.js clean
        }
        "changelog" { 
            Write-Host "◦ Updating changelog..." -ForegroundColor Gray
            node changelog-automation.js
        }
        "changelog-hooks" { 
            Write-Host "◦ Installing git hooks..." -ForegroundColor Gray
            node changelog-automation.js --install-hooks
        }
        "workspace" {
            Write-Host "◦ Starting Workspace Manager..." -ForegroundColor Gray
            npm start
        }
    }
}

# Execute commands
switch ($command) {
    "ade" {
        Start-Ollama
        
        # Check workspace location
        if (Test-Path "$workspaceRoot\ADE") {
            # Already in workspace root
        } elseif (Test-Path "$workspaceRoot\..\ADE") {
            # In subdirectory
            $workspaceRoot = Split-Path $workspaceRoot -Parent
        } else {
            Write-Host "× ERROR: Cannot find ADE directory. Please run from workspace root." -ForegroundColor Red
            exit 1
        }
        
        # Start ADE webchat service
        Write-Host "◦ Starting ADE webchat service on port 9000..." -ForegroundColor Gray
        Start-Process -FilePath "python" -ArgumentList "$workspaceRoot\ADE-Desktop\ade_core\webchat.py" -WindowStyle Hidden
        
        Start-Sleep -Seconds 5
        Write-Host "▣ ADE service should be ready!" -ForegroundColor Green
        
        # Launch Electron app
        Write-Host "◦ Launching ADE Desktop application..." -ForegroundColor Gray
        Set-Location "$workspaceRoot\ADE-Desktop"
        
        if (Test-Path "node_modules") {
            Write-Host "▣ Starting ADE Desktop..." -ForegroundColor Green
            npm start
        } else {
            Write-Host "◦ Installing dependencies first..." -ForegroundColor Gray
            npm install
            Write-Host "▣ Starting ADE Desktop..." -ForegroundColor Green
            npm start
        }
    }
    
    "workspace" { Invoke-WorkspaceManager "workspace" }
    "format" { Invoke-WorkspaceManager "format" }
    "format-watch" { Invoke-WorkspaceManager "format-watch" }
    "backup" { Invoke-WorkspaceManager "backup" }
    "backup-list" { Invoke-WorkspaceManager "backup-list" }
    "backup-clean" { Invoke-WorkspaceManager "backup-clean" }
    "changelog" { Invoke-WorkspaceManager "changelog" }
    "changelog-hooks" { Invoke-WorkspaceManager "changelog-hooks" }
    
    "all" {
        Write-Host "◦ Starting all services..." -ForegroundColor Gray
        Start-Ollama
        
        # Start workspace manager in background
        Write-Host "◦ Starting Workspace Manager..." -ForegroundColor Gray
        Set-Location "$workspaceRoot\workspace-manager"
        Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden
        
        # Run code formatter once
        Write-Host "◦ Running Code Formatter..." -ForegroundColor Gray
        node code-formatter.js
        
        # Create backup
        Write-Host "◦ Creating codebase backup..." -ForegroundColor Gray
        node backup-manager.js backup
        
        # Update changelog
        Write-Host "◦ Updating changelog..." -ForegroundColor Gray
        node changelog-automation.js
        
        Write-Host "▣ All services started!" -ForegroundColor Green
    }
    
    default {
        Write-Host "× Unknown command: $command" -ForegroundColor Red
        Write-Host "Use '.\run.ps1 help' for usage information." -ForegroundColor Gray
        exit 1
    }
}

# Restore original location
Set-Location $originalLocation