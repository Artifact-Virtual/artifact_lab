const { app, BrowserWindow, Menu, shell, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const net = require('net');

// Keep a global reference of the window object
let mainWindow;
let splashWindow = null;
let serviceStatus = {
  ollama: 'stopped',
  ade: 'stopped'
};

// Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development';

// Settings storage
const Store = require('electron-store');
const store = new Store();

// IPC Handlers
function setupIPC() {
  // Window controls
  ipcMain.handle('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('maximize-window', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('close-window', () => {
    if (mainWindow) mainWindow.close();
  });

  // Service management
  ipcMain.handle('start-services', async () => {
    console.log('IPC: Starting services...');
    await startServicesAndLoad();
  });

  ipcMain.handle('stop-services', async () => {
    console.log('IPC: Stopping services...');
    stopServices();
  });

  ipcMain.handle('get-service-status', () => {
    return serviceStatus;
  });

  // Settings
  ipcMain.handle('save-settings', (event, settings) => {
    console.log('IPC: Saving settings:', settings);
    store.set('settings', settings);
    return true;
  });
  ipcMain.handle('load-settings', () => {
    const settings = store.get('settings', {
      serverUrl: 'http://localhost:9000',
      theme: 'dark',
      autoLaunch: false,
      hardwareAcceleration: true
    });
    console.log('IPC: Loading settings:', settings);
    return settings;
  });

  // App info
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // File dialogs
  ipcMain.handle('show-save-dialog', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return result;
  });

  ipcMain.handle('show-open-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return result;
  });
}

// Custom window controls and styling
const createWindow = () => {
  // Create the splash screen first
  createSplashScreen();

  // Create the main browser window with premium styling
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1200,
    minHeight: 800,
    frame: false, // Bezelless - no default frame
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#000000',
      symbolColor: '#ffffff',
      height: 30
    },
    backgroundColor: '#000000', // AMOLED black
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDevelopment,
      allowRunningInsecureContent: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    vibrancy: 'ultra-dark', // macOS vibrancy
    visualEffectState: 'active'
  });

  // Custom menu for premium experience
  createCustomMenu();

  // Handle window events
  mainWindow.on('ready-to-show', () => {
    // Hide splash and show main window with fade effect
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
    mainWindow.focus();
    
    // Smooth fade-in animation
    mainWindow.setOpacity(0);
    let opacity = 0;
    const fadeIn = setInterval(() => {
      opacity += 0.05;
      mainWindow.setOpacity(opacity);
      if (opacity >= 1) {
        clearInterval(fadeIn);
      }
    }, 16); // 60fps
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopServices();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Security: prevent navigation to external sites
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:9000') {
      event.preventDefault();
    }
  });  // Load the renderer HTML file instead of external URL initially
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
};

const createSplashScreen = () => {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    resizable: false,
    center: true,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // Create splash HTML content
  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          color: #ffffff;
          overflow: hidden;
        }
        .logo {
          width: 120px;
          height: 120px;
          margin-bottom: 30px;
          border-radius: 20px;
          background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: bold;
          animation: pulse 2s infinite;
          box-shadow: 0 20px 40px rgba(0, 210, 255, 0.3);
        }
        .title {
          font-size: 32px;
          font-weight: 300;
          margin-bottom: 10px;
          letter-spacing: 2px;
        }
        .subtitle {
          font-size: 16px;
          opacity: 0.7;
          margin-bottom: 40px;
        }
        .loading {
          width: 300px;
          height: 4px;
          background: #333;
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }
        .loading::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, #00d2ff, transparent);
          animation: loading 2s infinite;
        }
        .status {
          margin-top: 20px;
          font-size: 14px;
          opacity: 0.8;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes loading {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="logo">ADE</div>
      <div class="title">Artifact Development Engine</div>
      <div class="subtitle">Premium Desktop IDE</div>
      <div class="loading"></div>
      <div class="status" id="status">Initializing services...</div>
      <script>
        const statusEl = document.getElementById('status');
        const statuses = [
          'Initializing services...',
          'Starting Ollama server...',
          'Loading Monaco Editor...',
          'Preparing workspace...',
          'Almost ready...'
        ];
        let i = 0;
        setInterval(() => {
          statusEl.textContent = statuses[i % statuses.length];
          i++;
        }, 1500);
      </script>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
};

const createCustomMenu = () => {
  const template = [
    {
      label: 'ADE',
      submenu: [
        {
          label: 'About ADE Studio',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About ADE Studio',
              message: 'Artifact Development Engine',
              detail: 'Premium Desktop IDE\nVersion 2.0\n\nBuilt with Electron and Monaco Editor',
              icon: path.join(__dirname, 'assets', 'icon.png')
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.executeJavaScript('if(window.showPreferences) window.showPreferences();');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit ADE',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.executeJavaScript('if(window.createNewFile) window.createNewFile();');
          }
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.executeJavaScript('if(window.openFile) window.openFile();');
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.executeJavaScript('if(window.saveCurrentFile) window.saveCurrentFile();');
          }
        },
        { type: 'separator' },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.webContents.executeJavaScript('if(window.closeCurrentTab) window.closeCurrentTab();');
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow.webContents.executeJavaScript('if(window.showFind) window.showFind();');
          }
        },
        {
          label: 'Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow.webContents.executeJavaScript('if(window.showReplace) window.showReplace();');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle AVA Chat',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => {
            mainWindow.webContents.executeJavaScript('if(window.toggleChat) window.toggleChat();');
          }
        },
        {
          label: 'Toggle File Explorer',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            mainWindow.webContents.executeJavaScript('if(window.toggleFileExplorer) window.toggleFileExplorer();');
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Command Palette',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => {
            mainWindow.webContents.executeJavaScript('if(window.showCommandPalette) window.showCommandPalette();');
          }
        },
        { type: 'separator' },
        {
          label: 'Restart Ollama',
          click: () => {
            restartOllama();
          }
        },
        {
          label: 'Restart ADE Services',
          click: () => {
            restartADEServices();
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [])
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'ADE Documentation',
          click: () => {
            shell.openExternal('https://github.com/your-repo/ADE-Desktop');
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            showKeyboardShortcuts();
          }
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/your-repo/ADE-Desktop/issues');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

const showKeyboardShortcuts = () => {
  const shortcuts = `
Keyboard Shortcuts:

File Operations:
• Ctrl+N - New File
• Ctrl+O - Open File  
• Ctrl+S - Save File
• Ctrl+W - Close Tab

Editing:
• Ctrl+F - Find
• Ctrl+H - Replace
• Ctrl+Z - Undo
• Ctrl+Y - Redo

View:
• Ctrl+Shift+A - Toggle AVA Chat
• Ctrl+Shift+E - Toggle File Explorer
• Ctrl+Shift+P - Command Palette
• F11 - Toggle Fullscreen

Navigation:
• Ctrl+Tab - Switch Tabs
• Ctrl+Shift+Tab - Switch Tabs (Reverse)
• Ctrl+G - Go to Line
  `;

  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Keyboard Shortcuts',
    message: 'ADE Studio Shortcuts',
    detail: shortcuts.trim(),
    buttons: ['OK']
  });
};

const OLLAMA_PORT = 11500;

// Service management functions (simplified - services now managed by run.sh/run.ps1)
const restartOllama = async () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Restart Services',
    message: 'To restart services, please close ADE Desktop and run ./run.sh or run.ps1 again.',
    detail: 'Services are now managed externally for better stability.',
    buttons: ['OK']
  });
};

const restartADEServices = async () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Restart Services', 
    message: 'To restart services, please close ADE Desktop and run ./run.sh or run.ps1 again.',
    detail: 'Services are now managed externally for better stability.',
    buttons: ['OK']
  });
};

const stopServices = () => {
  // Services are managed externally now, so just cleanup our references
  console.log('Cleanup: Service references cleared');
};

// Old startADEServices function removed - services now managed externally

const startServicesAndLoad = async () => {
  try {
    // Give services a moment to fully start up
    console.log('Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
    
    // Update service status - we assume services are already started by run.sh/run.ps1
    serviceStatus.ollama = 'checking';
    serviceStatus.ade = 'checking';
    notifyRenderer('service-status', { type: 'checking', service: 'ollama' });
    notifyRenderer('progress-update', { percentage: 20, message: 'Checking service availability...' });
    
    // Check if Ollama is available (but don't start it)
    try {
      console.log('Testing Ollama connection...');
      const ollamaAvailable = await testOllamaConnection();
      console.log('Ollama test result:', ollamaAvailable);
      if (ollamaAvailable) {
        serviceStatus.ollama = 'running';
        notifyRenderer('service-status', { type: 'running', service: 'ollama' });
        console.log('Ollama service detected and ready');
      } else {
        serviceStatus.ollama = 'optional';
        notifyRenderer('service-status', { type: 'optional', service: 'ollama' });
        console.log('Ollama service not available (optional)');
      }
    } catch (error) {
      console.log('Ollama service check failed (continuing without it):', error.message);
      serviceStatus.ollama = 'optional';
      notifyRenderer('service-status', { type: 'optional', service: 'ollama' });
    }
    
    notifyRenderer('progress-update', { percentage: 60, message: 'Checking ADE service...' });
    
    // Check if ADE services are available (but don't start them)
    try {
      console.log('Testing ADE connection...');
      const adeAvailable = await testConnection();
      console.log('ADE test result:', adeAvailable);
      if (adeAvailable) {
        serviceStatus.ade = 'running';
        notifyRenderer('service-status', { type: 'running', service: 'ade' });
        notifyRenderer('progress-update', { percentage: 90, message: 'Services connected successfully...' });
        console.log('ADE service detected and ready');
      } else {
        serviceStatus.ade = 'waiting';
        notifyRenderer('service-status', { type: 'waiting', service: 'ade' });
        notifyRenderer('progress-update', { percentage: 90, message: 'Waiting for ADE service to start...' });
        console.log('ADE service not yet available, will connect when ready');
      }
    } catch (error) {
      console.log('ADE service check failed (will retry when user accesses):', error.message);
      serviceStatus.ade = 'waiting';
      notifyRenderer('service-status', { type: 'waiting', service: 'ade' });
      notifyRenderer('progress-update', { percentage: 90, message: 'Ready (will connect to services when available)...' });
    }
    
    notifyRenderer('progress-update', { percentage: 100, message: 'Ready!' });
    notifyRenderer('connection-status', serviceStatus.ade === 'running');
    
  } catch (error) {
    console.error('Service check failed:', error);
    serviceStatus.ollama = 'unknown';
    serviceStatus.ade = 'unknown';
    notifyRenderer('service-status', { type: 'unknown', service: 'both' });
    notifyRenderer('progress-update', { percentage: 100, message: 'Ready (services will connect when available)...' });
    notifyRenderer('connection-status', false);
  }
};

// Helper function to notify renderer
const notifyRenderer = (channel, data) => {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data);
  }
};

// Test connection to ADE services
const testConnection = () => {
  return new Promise((resolve) => {
    console.log('Testing ADE service at http://127.0.0.1:9000');
    const http = require('http');
    const req = http.get({
      hostname: '127.0.0.1',
      port: 9000,
      path: '/',
      family: 4 // Force IPv4
    }, (res) => {
      console.log('ADE service responded with status:', res.statusCode);
      resolve(res.statusCode === 200);
    });
    
    req.on('error', (error) => {
      console.log('ADE service connection error:', error.message);
      resolve(false);
    });
    
    req.setTimeout(8000, () => {
      console.log('ADE service connection timeout');
      req.abort();
      resolve(false);
    });
  });
};

// Test connection to Ollama services
const testOllamaConnection = () => {
  return new Promise((resolve) => {
    console.log('Testing Ollama service at http://127.0.0.1:11500/api/version');
    const http = require('http');
    const req = http.get({
      hostname: '127.0.0.1',
      port: 11500,
      path: '/api/version',
      family: 4 // Force IPv4
    }, (res) => {
      console.log('Ollama service responded with status:', res.statusCode);
      resolve(res.statusCode === 200);
    });
    
    req.on('error', (error) => {
      console.log('Ollama service connection error:', error.message);
      resolve(false);
    });
    
    req.setTimeout(8000, () => {
      console.log('Ollama service connection timeout');
      req.abort();
      resolve(false);
    });
  });
};

// App event handlers
app.whenReady().then(() => {
  // Setup IPC handlers
  setupIPC();
  
  // Create the main window
  createWindow();
  
  // Global shortcuts
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });
  
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  // Register protocol for deep linking (future feature)
  app.setAsDefaultProtocolClient('ade-studio');
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  stopServices();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopServices();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
