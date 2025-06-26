#!/bin/bash

# ADE Studio Desktop - Cross-platform Build Script
# This script builds ADE Studio for Windows, macOS, and Linux

set -e

echo "🚀 ADE Studio Desktop - Cross-platform Build"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js and try again.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm and try again.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
rm -rf dist/

# Function to build for a specific platform
build_platform() {
    local platform=$1
    local arch=$2
    local description=$3
    
    echo -e "${YELLOW}🔨 Building for ${description}...${NC}"
    
    if npm run build-${platform}; then
        echo -e "${GREEN}✅ ${description} build completed successfully${NC}"
    else
        echo -e "${RED}❌ ${description} build failed${NC}"
        return 1
    fi
}

# Build for all platforms
echo -e "${BLUE}🏗️  Starting cross-platform build...${NC}"

# Windows
build_platform "win" "x64" "Windows"

# macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    build_platform "mac" "x64" "macOS"
else
    echo -e "${YELLOW}⚠️  Skipping macOS build (requires macOS host)${NC}"
fi

# Linux
build_platform "linux" "x64" "Linux"

echo -e "${GREEN}🎉 Build process completed!${NC}"
echo -e "${BLUE}📁 Built files are available in the 'dist' directory${NC}"

# List built files
echo -e "${BLUE}📋 Build artifacts:${NC}"
ls -la dist/ 2>/dev/null || echo "No dist directory found"

echo -e "${GREEN}✨ ADE Studio Desktop is ready for distribution!${NC}"
