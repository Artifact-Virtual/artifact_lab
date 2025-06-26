# Artifact Desktop v3.0

Modern, premium desktop IDE built with Electron and clean architecture principles.

## Features

- **AMOLED Black Theme**: Pure black background with sharp white text
- **Service Abstraction**: Clean separation between UI and backend services
- **Monaco Editor**: Professional code editing experience
- **Modern Architecture**: Built with latest Electron best practices
- **Service Monitoring**: Real-time status of Ollama and Webchat services

## Architecture

```
desktop/
├── src/
│   ├── main/           # Electron main process
│   │   └── main.js     # Application entry point
│   ├── renderer/       # UI and frontend logic
│   │   ├── index.html  # Main HTML structure
│   │   ├── styles.css  # AMOLED theme styling
│   │   └── app.js      # Application logic
│   └── shared/         # Shared utilities
│       ├── config.js   # Configuration constants
│       ├── services.js # Service abstraction layer
│       └── preload.js  # Secure IPC bridge
├── assets/             # Application assets
└── package.json        # Dependencies and scripts
```

## Service Abstraction

The application uses a clean service abstraction layer that allows easy swapping of backend services:

- **ServiceManager**: Coordinates all services and health monitoring
- **OllamaService**: Interfaces with Ollama LLM service
- **WebchatService**: Manages chat interface integration
- **BaseService**: Foundation for all service implementations

## Theme

The application features a premium AMOLED theme:
- **Background**: Pure black (#000000)
- **Text**: Sharp white with thin/light font weights
- **Accents**: Minimal blue gradient for highlights
- **Typography**: Inter font family for UI, JetBrains Mono for code

## Development

1. Ensure backend services are running (Ollama on port 11500, Webchat on port 9000)
2. Run development script:
   ```
   ./start-dev.ps1
   ```
3. The application will automatically detect and connect to available services

## Service Configuration

Services are configured in `src/shared/config.js`:
- Ollama: `http://127.0.0.1:11500`
- Webchat: `http://127.0.0.1:9000`

The abstraction layer allows easy modification of service endpoints and implementations.

## Security

- Context isolation enabled
- Node integration disabled
- Secure IPC communication via preload script
- External navigation protection

## Building

```bash
npm run build          # Build for current platform
npm run build:win      # Build for Windows
npm run build:mac      # Build for macOS
npm run build:linux    # Build for Linux
```

## Status

✅ **Backend Services**: Robust and isolated  
🚧 **Desktop Application**: New implementation in progress  
🎯 **Goal**: Production-ready desktop IDE with modern architecture
