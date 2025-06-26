# ADE Studio Desktop - Development and Release Scripts
# PowerShell script for Windows development

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "build", "clean", "install", "publish")]
    [string]$Action = "dev",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("win", "mac", "linux", "all")]
    [string]$Platform = "win"
)

# Colors for output
$RED = "Red"
$GREEN = "Green"
$YELLOW = "Yellow"
$BLUE = "Blue"

function Write-ColoredOutput {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-Prerequisites {
    Write-ColoredOutput "🔍 Checking prerequisites..." $BLUE
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-ColoredOutput "✅ Node.js: $nodeVersion" $GREEN
    } catch {
        Write-ColoredOutput "❌ Node.js is not installed" $RED
        return $false
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-ColoredOutput "✅ npm: $npmVersion" $GREEN
    } catch {
        Write-ColoredOutput "❌ npm is not installed" $RED
        return $false
    }
    
    return $true
}

function Install-Dependencies {
    Write-ColoredOutput "📦 Installing dependencies..." $BLUE
    
    try {
        npm install
        Write-ColoredOutput "✅ Dependencies installed successfully" $GREEN
        return $true
    } catch {
        Write-ColoredOutput "❌ Failed to install dependencies" $RED
        return $false
    }
}

function Start-Development {
    Write-ColoredOutput "🚀 Starting development mode..." $BLUE
    
    # Set development environment
    $env:NODE_ENV = "development"
    
    try {
        npm run dev
    } catch {
        Write-ColoredOutput "❌ Failed to start development mode" $RED
    }
}

function Build-Application {
    param($TargetPlatform)
    
    Write-ColoredOutput "🔨 Building ADE Studio for $TargetPlatform..." $BLUE
    
    # Clean previous builds
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-ColoredOutput "🧹 Cleaned previous builds" $YELLOW
    }
    
    try {
        switch ($TargetPlatform) {
            "win" { npm run build-win }
            "mac" { npm run build-mac }
            "linux" { npm run build-linux }
            "all" { npm run build }
        }
        
        Write-ColoredOutput "✅ Build completed successfully for $TargetPlatform" $GREEN
        
        # List build artifacts
        if (Test-Path "dist") {
            Write-ColoredOutput "📋 Build artifacts:" $BLUE
            Get-ChildItem "dist" | Format-Table Name, Length, LastWriteTime
        }
        
        return $true
    } catch {
        Write-ColoredOutput "❌ Build failed for $TargetPlatform" $RED
        return $false
    }
}

function Clean-Project {
    Write-ColoredOutput "🧹 Cleaning project..." $BLUE
    
    # Remove node_modules
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules"
        Write-ColoredOutput "✅ Removed node_modules" $GREEN
    }
    
    # Remove dist
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-ColoredOutput "✅ Removed dist directory" $GREEN
    }
    
    # Remove package-lock.json
    if (Test-Path "package-lock.json") {
        Remove-Item -Force "package-lock.json"
        Write-ColoredOutput "✅ Removed package-lock.json" $GREEN
    }
    
    Write-ColoredOutput "✨ Project cleaned successfully" $GREEN
}

function Publish-Release {
    Write-ColoredOutput "🚀 Publishing release..." $BLUE
    
    # This would integrate with GitHub releases, S3, etc.
    # For now, just show what would be published
    
    if (Test-Path "dist") {
        Write-ColoredOutput "📦 Files ready for release:" $BLUE
        Get-ChildItem "dist" -Recurse | Where-Object { $_.Extension -in @('.exe', '.dmg', '.AppImage', '.deb', '.rpm') } | Format-Table Name, Length, LastWriteTime
        
        Write-ColoredOutput "⚠️  Automatic publishing not yet implemented" $YELLOW
        Write-ColoredOutput "💡 Manually upload files from 'dist' directory to your release platform" $BLUE
    } else {
        Write-ColoredOutput "❌ No build artifacts found. Run build first." $RED
    }
}

# Main script logic
Write-ColoredOutput "🎯 ADE Studio Desktop - Development Script" $BLUE
Write-ColoredOutput "===========================================" $BLUE

if (-not (Test-Prerequisites)) {
    exit 1
}

switch ($Action) {
    "dev" {
        if (-not (Install-Dependencies)) { exit 1 }
        Start-Development
    }
    "build" {
        if (-not (Install-Dependencies)) { exit 1 }
        if (-not (Build-Application $Platform)) { exit 1 }
    }
    "clean" {
        Clean-Project
    }
    "install" {
        if (-not (Install-Dependencies)) { exit 1 }
    }
    "publish" {
        Publish-Release
    }
}

Write-ColoredOutput "✨ Script completed!" $GREEN
