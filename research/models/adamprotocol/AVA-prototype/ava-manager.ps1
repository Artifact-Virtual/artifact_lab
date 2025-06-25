# AVA Constitutional Intelligence System - Monitoring & Management Script
# PowerShell script for managing the complete AVA deployment

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "deploy", "cleanup")]
    [string]$Action = "status",
    
    [Parameter(Mandatory=$false)]
    [string]$Container = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Production = $false
)

# Color output functions
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }

# Header
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "      AVA Constitutional Intelligence System Manager        " -ForegroundColor Magenta
Write-Host "             Artifact Virtual Ecosystem                    " -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-Success "Docker found: $dockerVersion"
    }
    catch {
        Write-Error "Docker not found. Please install Docker Desktop."
        exit 1
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-Success "Docker Compose found: $composeVersion"
    }
    catch {
        Write-Error "Docker Compose not found. Please install Docker Compose."
        exit 1
    }
    
    # Check if .env exists
    if (Test-Path ".env") {
        Write-Success ".env file found"
    }
    else {
        Write-Warning ".env file not found. Creating from template..."
        Copy-Item ".env.example" ".env"
        Write-Success ".env file created from template"
    }
    
    Write-Success "Prerequisites check completed successfully!"
    Write-Host ""
}

# Container status check
function Get-ContainerStatus {
    Write-Info "AVA Container Status:"
    Write-Host "------------------------------------------------------------"
    
    $containers = @(
        "ava_constitutional_core",
        "ava_memory_core", 
        "ava_perception_layer",
        "ava_action_layer",
        "ava_vault_system",
        "ava_evolver_module",
        "ava_redis",
        "ava_postgres",
        "ava_gateway",
        "ava_prometheus",
        "ava_grafana"
    )
    
    foreach ($container in $containers) {
        try {
            $status = docker ps -f "name=$container" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>$null
            if ($status -and $status -notlike "*NAMES*") {
                Write-Success "$container : RUNNING"
            }
            else {
                $exitedStatus = docker ps -a -f "name=$container" --format "table {{.Names}}\t{{.Status}}" 2>$null
                if ($exitedStatus -and $exitedStatus -notlike "*NAMES*") {
                    Write-Warning "$container : STOPPED"
                }
                else {
                    Write-Error "$container : NOT FOUND"
                }
            }
        }
        catch {
            Write-Error "$container : ERROR"
        }
    }
    Write-Host ""
}

# Deploy function
function Start-AVADeployment {
    Write-Info "Starting AVA Constitutional Intelligence System deployment..."
    Write-Host ""
    
    # Pre-deployment checks
    Test-Prerequisites
    
    # Create necessary directories
    Write-Info "Creating data directories..."
    $dirs = @("data\redis", "data\postgres", "data\grafana")
    foreach ($dir in $dirs) {
        if (!(Test-Path $dir)) {
            New-Item -Path $dir -ItemType Directory -Force | Out-Null
            Write-Success "Created directory: $dir"
        }
    }
    
    # Build and start containers
    Write-Info "Building and starting AVA containers..."
    try {
        if ($Production) {
            docker-compose -f docker-compose.yml up --build -d
        }
        else {
            docker-compose up --build -d
        }
        Write-Success "AVA deployment completed successfully!"
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        exit 1
    }
    
    # Wait for containers to be healthy
    Write-Info "Waiting for containers to initialize..."
    Start-Sleep -Seconds 30
    
    # Health check
    Get-ContainerStatus
    
    # Display access information
    Write-Info "AVA Access Information:"
    Write-Host "------------------------------------------------------------"
    Write-Success "Main API:         https://localhost (via nginx)"
    Write-Success "AVA Core:         http://localhost:3001"
    Write-Success "Prometheus:       http://localhost:9090"
    Write-Success "Grafana:          http://localhost:3000 (admin/admin)"
    Write-Host ""
    Write-Info "Constitutional Intelligence System is now operational!"
}

# Stop function
function Stop-AVADeployment {
    Write-Info "Stopping AVA Constitutional Intelligence System..."
    try {
        docker-compose down
        Write-Success "AVA system stopped successfully!"
    }
    catch {
        Write-Error "Failed to stop AVA system: $($_.Exception.Message)"
    }
}

# Restart function
function Restart-AVADeployment {
    Write-Info "Restarting AVA Constitutional Intelligence System..."
    Stop-AVADeployment
    Start-Sleep -Seconds 5
    Start-AVADeployment
}

# Logs function
function Get-AVALogs {
    if ($Container) {
        Write-Info "Showing logs for container: $Container"
        docker-compose logs -f $Container
    }
    else {
        Write-Info "Showing logs for all AVA containers:"
        docker-compose logs -f
    }
}

# Cleanup function
function Remove-AVADeployment {
    Write-Warning "This will remove all AVA containers and volumes. Are you sure? (y/N)"
    $confirmation = Read-Host
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        Write-Info "Removing AVA deployment..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        Write-Success "AVA deployment cleaned up successfully!"
    }
    else {
        Write-Info "Cleanup cancelled."
    }
}

# Main execution
switch ($Action.ToLower()) {
    "start" { 
        Start-AVADeployment 
    }
    "stop" { 
        Stop-AVADeployment 
    }
    "restart" { 
        Restart-AVADeployment 
    }
    "status" { 
        Get-ContainerStatus 
    }
    "logs" { 
        Get-AVALogs 
    }
    "deploy" { 
        Start-AVADeployment 
    }
    "cleanup" { 
        Remove-AVADeployment 
    }
    default {
        Write-Info "Usage: .\ava-manager.ps1 -Action [start|stop|restart|status|logs|deploy|cleanup]"
        Write-Info "Examples:"
        Write-Info "  .\ava-manager.ps1 -Action deploy"
        Write-Info "  .\ava-manager.ps1 -Action status"
        Write-Info "  .\ava-manager.ps1 -Action logs -Container ava-core"
        Write-Info "  .\ava-manager.ps1 -Action deploy -Production"
    }
}

Write-Host "============================================================" -ForegroundColor Magenta
