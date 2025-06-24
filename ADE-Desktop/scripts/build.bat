@echo off
REM ADE Studio Desktop - Windows Build Script
REM This script builds ADE Studio for Windows

echo 🚀 ADE Studio Desktop - Windows Build
echo =====================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js and try again.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm and try again.
    exit /b 1
)

echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo 🧹 Cleaning previous builds...
if exist dist rmdir /s /q dist

echo 🔨 Building for Windows...
call npm run build-win
if %errorlevel% neq 0 (
    echo ❌ Windows build failed
    exit /b 1
)

echo ✅ Windows build completed successfully
echo 📁 Built files are available in the 'dist' directory

REM List built files
echo 📋 Build artifacts:
if exist dist (
    dir dist
) else (
    echo No dist directory found
)

echo ✨ ADE Studio Desktop for Windows is ready for distribution!
pause
