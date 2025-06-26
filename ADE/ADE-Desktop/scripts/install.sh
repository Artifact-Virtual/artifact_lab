#!/bin/bash

# ADE Studio Desktop - Installation Script
# Installs ADE Studio and its dependencies on various platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script info
ADE_STUDIO_VERSION="1.0.0"
INSTALL_DIR="/opt/ade-studio"
USER_INSTALL_DIR="$HOME/.local/share/ade-studio"
DESKTOP_FILE="$HOME/.local/share/applications/ade-studio.desktop"

# Functions
print_banner() {
    echo -e "${CYAN}"
    echo "  ╔═══════════════════════════════════════╗"
    echo "  ║          ADE Studio Desktop           ║"
    echo "  ║       Installation Script v1.0        ║"
    echo "  ║                                       ║"
    echo "  ║    Artifact Development Engine        ║"
    echo "  ╚═══════════════════════════════════════╝"
    echo -e "${NC}"
}

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

check_dependencies() {
    echo -e "${BLUE}🔍 Checking system dependencies...${NC}"
    
    local missing_deps=()
    
    # Check for required tools
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if ! command -v unzip &> /dev/null; then
        missing_deps+=("unzip")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("nodejs")
    fi
    
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing dependencies: ${missing_deps[*]}${NC}"
        echo -e "${YELLOW}Please install the missing dependencies and run this script again.${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ All dependencies are satisfied${NC}"
    return 0
}

install_ollama() {
    echo -e "${BLUE}📦 Installing Ollama...${NC}"
    
    if command -v ollama &> /dev/null; then
        echo -e "${GREEN}✅ Ollama is already installed${NC}"
        return 0
    fi
    
    # Install Ollama
    curl -fsSL https://ollama.ai/install.sh | sh
    
    if command -v ollama &> /dev/null; then
        echo -e "${GREEN}✅ Ollama installed successfully${NC}"
        
        # Start Ollama service
        echo -e "${BLUE}🚀 Starting Ollama service...${NC}"
        ollama serve &
        sleep 3
        
        # Pull a basic model
        echo -e "${BLUE}📥 Pulling basic model...${NC}"
        ollama pull llama2:7b
        
        return 0
    else
        echo -e "${RED}❌ Failed to install Ollama${NC}"
        return 1
    fi
}

download_ade_studio() {
    echo -e "${BLUE}📥 Downloading ADE Studio...${NC}"
    
    local os=$(detect_os)
    local download_url=""
    local filename=""
    
    case $os in
        "linux")
            download_url="https://github.com/your-repo/ade-studio/releases/latest/download/ade-studio-linux.AppImage"
            filename="ade-studio-linux.AppImage"
            ;;
        "macos")
            download_url="https://github.com/your-repo/ade-studio/releases/latest/download/ade-studio-macos.dmg"
            filename="ade-studio-macos.dmg"
            ;;
        *)
            echo -e "${RED}❌ Unsupported operating system: $os${NC}"
            return 1
            ;;
    esac
    
    # Create temporary directory
    local temp_dir=$(mktemp -d)
    cd "$temp_dir"
    
    # Download the file
    echo -e "${BLUE}📥 Downloading from: $download_url${NC}"
    if curl -L -o "$filename" "$download_url"; then
        echo -e "${GREEN}✅ Download completed${NC}"
        
        # Move to installation directory
        mkdir -p "$USER_INSTALL_DIR"
        mv "$filename" "$USER_INSTALL_DIR/"
        
        # Make executable (for Linux)
        if [[ $os == "linux" ]]; then
            chmod +x "$USER_INSTALL_DIR/$filename"
        fi
        
        echo -e "${GREEN}✅ ADE Studio installed to $USER_INSTALL_DIR${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to download ADE Studio${NC}"
        return 1
    fi
}

create_desktop_entry() {
    echo -e "${BLUE}🖥️  Creating desktop entry...${NC}"
    
    local os=$(detect_os)
    
    if [[ $os == "linux" ]]; then
        # Create desktop file
        mkdir -p "$(dirname "$DESKTOP_FILE")"
        cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=ADE Studio
Comment=Artifact Development Engine - Professional Desktop IDE
Exec=$USER_INSTALL_DIR/ade-studio-linux.AppImage
Icon=$USER_INSTALL_DIR/ade-studio.png
Terminal=false
Type=Application
Categories=Development;IDE;
StartupWMClass=ADE Studio
EOF
        
        # Make desktop file executable
        chmod +x "$DESKTOP_FILE"
        
        echo -e "${GREEN}✅ Desktop entry created${NC}"
        return 0
    fi
    
    return 0
}

create_launcher_script() {
    echo -e "${BLUE}🚀 Creating launcher script...${NC}"
    
    local launcher_script="$USER_INSTALL_DIR/ade-studio.sh"
    
    cat > "$launcher_script" << 'EOF'
#!/bin/bash

# ADE Studio Launcher Script
# Starts all required services and launches ADE Studio

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting ADE Studio...${NC}"

# Check if Ollama is running
if ! pgrep ollama > /dev/null; then
    echo -e "${BLUE}📦 Starting Ollama service...${NC}"
    ollama serve &
    sleep 5
fi

# Start ADE Studio
ADE_STUDIO_DIR="$(dirname "$0")"
cd "$ADE_STUDIO_DIR"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    exec ./ade-studio-linux.AppImage
elif [[ "$OSTYPE" == "darwin"* ]]; then
    exec open ./ade-studio-macos.app
else
    echo -e "${RED}❌ Unsupported operating system${NC}"
    exit 1
fi
EOF
    
    chmod +x "$launcher_script"
    echo -e "${GREEN}✅ Launcher script created${NC}"
}

add_to_path() {
    echo -e "${BLUE}🔗 Adding ADE Studio to PATH...${NC}"
    
    local shell_rc=""
    if [[ -n "$BASH_VERSION" ]]; then
        shell_rc="$HOME/.bashrc"
    elif [[ -n "$ZSH_VERSION" ]]; then
        shell_rc="$HOME/.zshrc"
    else
        shell_rc="$HOME/.profile"
    fi
    
    # Add to PATH if not already there
    if ! grep -q "ade-studio" "$shell_rc" 2>/dev/null; then
        echo "" >> "$shell_rc"
        echo "# ADE Studio" >> "$shell_rc"
        echo "export PATH=\"$USER_INSTALL_DIR:\$PATH\"" >> "$shell_rc"
        echo "alias ade-studio=\"$USER_INSTALL_DIR/ade-studio.sh\"" >> "$shell_rc"
        
        echo -e "${GREEN}✅ Added ADE Studio to PATH${NC}"
        echo -e "${YELLOW}⚠️  Please restart your terminal or run: source $shell_rc${NC}"
    else
        echo -e "${GREEN}✅ ADE Studio already in PATH${NC}"
    fi
}

verify_installation() {
    echo -e "${BLUE}🔍 Verifying installation...${NC}"
    
    local errors=0
    
    # Check if ADE Studio files exist
    if [[ ! -d "$USER_INSTALL_DIR" ]]; then
        echo -e "${RED}❌ ADE Studio directory not found${NC}"
        ((errors++))
    fi
    
    # Check if Ollama is available
    if ! command -v ollama &> /dev/null; then
        echo -e "${RED}❌ Ollama not found${NC}"
        ((errors++))
    fi
    
    if [[ $errors -eq 0 ]]; then
        echo -e "${GREEN}✅ Installation verified successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Installation verification failed with $errors errors${NC}"
        return 1
    fi
}

show_completion_message() {
    echo -e "${GREEN}"
    echo "  ╔═══════════════════════════════════════╗"
    echo "  ║     🎉 Installation Complete! 🎉     ║"
    echo "  ╚═══════════════════════════════════════╝"
    echo -e "${NC}"
    echo
    echo -e "${BLUE}📍 ADE Studio has been installed to: $USER_INSTALL_DIR${NC}"
    echo
    echo -e "${BLUE}🚀 To start ADE Studio:${NC}"
    echo -e "   ${CYAN}ade-studio${NC}  (after restarting terminal)"
    echo -e "   ${CYAN}$USER_INSTALL_DIR/ade-studio.sh${NC}  (immediately)"
    echo
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo -e "   ${CYAN}https://github.com/your-repo/ade-studio/wiki${NC}"
    echo
    echo -e "${BLUE}🐛 Issues & Support:${NC}"
    echo -e "   ${CYAN}https://github.com/your-repo/ade-studio/issues${NC}"
    echo
}

# Main installation flow
main() {
    print_banner
    
    echo -e "${BLUE}🎯 Starting ADE Studio installation...${NC}"
    echo
    
    # Check if running as root
    if [[ $EUID -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  Running as root. Installing to system directory.${NC}"
        USER_INSTALL_DIR="$INSTALL_DIR"
        DESKTOP_FILE="/usr/share/applications/ade-studio.desktop"
    fi
    
    # Check dependencies
    if ! check_dependencies; then
        exit 1
    fi
    
    # Install Ollama
    if ! install_ollama; then
        echo -e "${YELLOW}⚠️  Ollama installation failed, but continuing...${NC}"
    fi
    
    # Download and install ADE Studio
    if ! download_ade_studio; then
        echo -e "${RED}❌ Failed to install ADE Studio${NC}"
        exit 1
    fi
    
    # Create desktop entry
    create_desktop_entry
    
    # Create launcher script
    create_launcher_script
    
    # Add to PATH
    add_to_path
    
    # Verify installation
    if ! verify_installation; then
        echo -e "${YELLOW}⚠️  Installation verification failed, but ADE Studio may still work${NC}"
    fi
    
    # Show completion message
    show_completion_message
}

# Run main function
main "$@"
