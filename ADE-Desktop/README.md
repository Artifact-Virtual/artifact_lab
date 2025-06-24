# ADE Studio Desktop

A professional, state-of-the-art desktop IDE built on Electron for the Artifact Development Engine (ADE).

## Features

### 🎨 **Premium Design**
- **Bezelless Interface**: Custom frameless window with native controls
- **AMOLED Dark Theme**: Professional dark theme optimized for modern displays
- **Smooth Animations**: Subtle, professional transitions and micro-interactions
- **Modern Typography**: Inter font family for optimal readability

### 🚀 **State-of-the-Art Architecture**
- **Native Desktop Experience**: No browser required - launches as a native app
- **Service Orchestration**: Automatically starts and manages ADE and Ollama services
- **Real-time Status**: Live connection and service status indicators
- **Error Recovery**: Intelligent error handling and connection retry logic

### 🔧 **Advanced Features**
- **Auto-Updates**: Automatic update checking and installation
- **Crash Recovery**: Session restoration after unexpected crashes
- **Settings Management**: Persistent user preferences and configuration
- **Cross-Platform**: Native builds for Windows, macOS, and Linux
- **System Integration**: Native notifications, system tray, and OS integration

### 🛡️ **Security & Performance**
- **Context Isolation**: Secure IPC communication between processes
- **Hardware Acceleration**: Optional GPU acceleration for better performance
- **Memory Management**: Efficient resource usage and cleanup
- **Sandboxed WebView**: Secure rendering of the ADE Studio interface

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Python 3.8+ (for ADE services)
- Ollama (installed automatically or manually)

### Development

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd ADE-Desktop
   npm install
   ```

2. **Start Development**
   ```bash
   npm run dev
   # or
   npm start
   ```

3. **Build for Production**
   ```bash
   # Build for current platform
   npm run build
   
   # Build for specific platforms
   npm run build-win    # Windows
   npm run build-mac    # macOS
   npm run build-linux  # Linux
   ```

### Installation Scripts

#### Automated Installation (Linux/macOS)
```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/ade-studio/main/scripts/install.sh | bash
```

#### Windows Installation
```powershell
# Run as administrator
.\scripts\install.ps1
```

#### Manual Installation
1. Download the appropriate package for your platform from the [releases page](https://github.com/your-repo/ade-studio/releases)
2. Install using your platform's package manager:
   - **Windows**: Run the `.exe` installer
   - **macOS**: Mount the `.dmg` and drag to Applications
   - **Linux**: Install the `.AppImage`, `.deb`, or `.rpm` package

## Project Structure

```
ADE-Desktop/
├── main.js                 # Electron main process
├── preload.js             # Secure IPC bridge
├── update-manager.js      # Auto-update and crash recovery
├── package.json          # Project configuration
├── renderer/             # Frontend application
│   ├── index.html       # Main UI layout
│   ├── styles.css       # Premium dark theme
│   └── renderer.js      # Frontend logic
├── scripts/             # Build and deployment scripts
│   ├── build.sh        # Cross-platform build
│   ├── build.bat       # Windows build
│   ├── dev.ps1         # Development helper
│   └── install.sh      # Installation script
└── assets/             # Application assets
    └── icon.svg        # Application icon
```

## Configuration

### Settings
The application stores settings in the user's data directory:
- **Windows**: `%APPDATA%/ade-studio/`  
- **macOS**: `~/Library/Application Support/ade-studio/`
- **Linux**: `~/.config/ade-studio/`

### Available Settings
- **Server URL**: ADE service endpoint (default: http://localhost:9000)
- **Theme**: Dark (AMOLED), Light, or Auto
- **Auto-launch**: Start with system boot
- **Hardware Acceleration**: Enable GPU acceleration

## Development

### Architecture
- **Main Process** (`main.js`): Electron main process, window management, service orchestration
- **Renderer Process** (`renderer/`): Frontend UI using HTML/CSS/JavaScript
- **Preload Script** (`preload.js`): Secure IPC communication bridge
- **Update Manager** (`update-manager.js`): Auto-updates and crash recovery

### Key Technologies
- **Electron**: Cross-platform desktop framework
- **Node.js**: Backend JavaScript runtime
- **HTML5/CSS3**: Modern web standards
- **IPC**: Inter-process communication for security
- **WebView**: Secure rendering of ADE Studio web interface

### Build Process
1. **Development**: Hot-reload with `npm run dev`
2. **Testing**: Manual testing across platforms
3. **Building**: electron-builder for packaging
4. **Distribution**: Platform-specific installers

## Deployment

### Build Targets
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG disk image (.dmg)
- **Linux**: AppImage (.AppImage), Debian (.deb), RPM (.rpm)

### CI/CD
The project includes GitHub Actions workflows for:
- Automated testing
- Cross-platform builds
- Release management
- Update server deployment

### Distribution Channels
- **GitHub Releases**: Primary distribution method
- **Auto-updater**: Automatic updates for installed applications
- **Package Managers**: Future integration with Homebrew, Chocolatey, etc.

## Troubleshooting

### Common Issues

#### Application Won't Start
1. Check if ADE services are running:
   ```bash
   # Check if Python is available
   python3 --version
   
   # Check if Ollama is installed
   ollama --version
   ```

2. Clear application cache:
   - Delete the settings directory (see Configuration section)
   - Restart the application

#### Connection Issues
1. Verify ADE server is running on http://localhost:9000
2. Check firewall settings
3. Try changing the server URL in settings

#### Performance Issues
1. Disable hardware acceleration in settings
2. Close other resource-intensive applications
3. Check system requirements

### Debug Mode
Run with debug logging:
```bash
# Linux/macOS
DEBUG=* npm start

# Windows
set DEBUG=* && npm start
```

### Logs Location
Application logs are stored in:
- **Windows**: `%APPDATA%/ade-studio/logs/`
- **macOS**: `~/Library/Logs/ade-studio/`
- **Linux**: `~/.local/share/ade-studio/logs/`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

### Development Guidelines
- Follow existing code style and conventions
- Add comments for complex functionality
- Test on multiple platforms before submitting
- Update documentation for new features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [Wiki](https://github.com/your-repo/ade-studio/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-repo/ade-studio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/ade-studio/discussions)
- **Email**: support@ade-studio.com

## Roadmap

### Version 1.1
- [ ] Plugin system for extensions
- [ ] Integrated terminal
- [ ] Git integration
- [ ] Workspace templates

### Version 1.2
- [ ] Cloud synchronization
- [ ] Collaboration features
- [ ] Mobile companion app
- [ ] Advanced debugging tools

### Version 2.0
- [ ] AI-powered code suggestions
- [ ] Multi-language support
- [ ] Advanced project management
- [ ] Enterprise features

---

**Built with ❤️ for developers by developers**

*ADE Studio Desktop - Professional Development Environment for the Modern Era*
