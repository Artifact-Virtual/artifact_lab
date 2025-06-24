const { app, BrowserWindow, Menu, shell, ipcMain, dialog, globalShortcut } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { UpdateManager, CrashRecovery } = require('./update-manager');

// Keep a global reference of the window object
let mainWindow;
let ollamaProcess = null;
let adeProcess = null;
let splashWindow = null;
let updateManager = null;
let crashRecovery = null;
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
      serverUrl: 'http://localhost:8080',
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
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:8080') {
      event.preventDefault();
    }
  });  // Load the renderer HTML file instead of external URL initially
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Initialize update manager and crash recovery (not in development)
  if (!isDevelopment) {
    updateManager = new UpdateManager(mainWindow);
    crashRecovery = new CrashRecovery(mainWindow);
    
    // Try to restore session after crash
    crashRecovery.restoreSession();
  }
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

const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port);
    server.on('listening', () => {
      server.close();
      resolve(false); // Port is available
    });
    server.on('error', () => {
      resolve(true); // Port is in use
    });
  });
};

const waitForService = (url, maxAttempts = 30) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkService = () => {
      const http = require('http');
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          retry();
        }
      });
      
      req.on('error', retry);
      req.setTimeout(1000, retry);
      
      function retry() {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkService, 1000);
        } else {
          reject(new Error(`Service at ${url} not ready after ${maxAttempts} attempts`));
        }
      }
    };
    checkService();
  });
};

const startOllama = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if Ollama is already running
      const ollamaRunning = await checkPort(11434);
      if (ollamaRunning) {
        console.log('Ollama is already running');
        resolve();
        return;
      }

      console.log('Starting Ollama server...');
      ollamaProcess = spawn('ollama', ['serve'], {
        stdio: 'pipe',
        detached: false
      });

      ollamaProcess.on('error', (error) => {
        console.error('Error starting Ollama:', error);
        reject(error);
      });

      // Wait for Ollama to be ready
      try {
        await waitForService('http://localhost:11434/api/version');
        console.log('Ollama server is ready!');
        resolve();
      } catch (error) {
        console.error('Ollama failed to start:', error);
        reject(error);
      }
    } catch (error) {
      reject(error);
    }
  });
};

const startADEServices = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const adePath = path.join(__dirname, '..', 'ADE');
      
      console.log('Starting ADE services...');
      
      // Start main.py for background services
      const mainProcess = spawn('python', ['main.py'], {
        cwd: adePath,
        stdio: 'pipe',
        detached: false
      });

      // Start enhanced_visualizer.py
      const visualizerProcess = spawn('python', ['enhanced_visualizer.py'], {
        cwd: adePath,
        stdio: 'pipe',
        detached: false
      });

      // Start webchat.py for the main IDE
      adeProcess = spawn('python', ['webchat.py'], {
        cwd: adePath,
        stdio: 'pipe',
        detached: false
      });

      adeProcess.on('error', (error) => {
        console.error('Error starting ADE services:', error);
        reject(error);
      });

      // Wait for ADE Studio to be ready
      try {
        await waitForService('http://localhost:8080');
        console.log('ADE Studio is ready!');
        resolve();
      } catch (error) {
        console.error('ADE Studio failed to start:', error);
        reject(error);
      }
    } catch (error) {
      reject(error);
    }
  });
};

const startServicesAndLoad = async () => {
  try {
    // Update service status
    serviceStatus.ollama = 'starting';
    serviceStatus.ade = 'starting';
    notifyRenderer('service-status', { type: 'starting', service: 'ollama' });
    notifyRenderer('progress-update', { percentage: 10, message: 'Starting Ollama service...' });
    
    // Start Ollama first
    await startOllama();
    serviceStatus.ollama = 'running';
    notifyRenderer('service-status', { type: 'running', service: 'ollama' });
    notifyRenderer('progress-update', { percentage: 40, message: 'Starting ADE services...' });
    
    // Then start ADE services
    await startADEServices();
    serviceStatus.ade = 'running';
    notifyRenderer('service-status', { type: 'running', service: 'ade' });
    notifyRenderer('progress-update', { percentage: 80, message: 'Services started successfully...' });
    
    // Test connection
    const isConnected = await testConnection();
    notifyRenderer('connection-status', isConnected);
    
    if (isConnected) {
      notifyRenderer('progress-update', { percentage: 100, message: 'Ready to connect...' });
    } else {
      throw new Error('Unable to connect to ADE services');
    }
    
  } catch (error) {
    console.error('Failed to start services:', error);
    serviceStatus.ollama = 'error';
    serviceStatus.ade = 'error';
    notifyRenderer('service-status', { type: 'error', service: 'both' });
    notifyRenderer('app-error', { message: error.message });
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
    const http = require('http');
    const req = http.get('http://localhost:8080', (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.abort();
      resolve(false);
    });
  });
};

const restartOllama = async () => {
  if (ollamaProcess) {
    ollamaProcess.kill();
    ollamaProcess = null;
  }
  
  try {
    await startOllama();
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Ollama Restarted',
      message: 'Ollama server has been restarted successfully.',
      buttons: ['OK']
    });
  } catch (error) {
    dialog.showErrorBox('Restart Failed', `Failed to restart Ollama: ${error.message}`);
  }
};

const restartADEServices = async () => {
  if (adeProcess) {
    adeProcess.kill();
    adeProcess = null;
  }
  
  try {
    await startADEServices();
    mainWindow.reload();
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Services Restarted',
      message: 'ADE services have been restarted successfully.',
      buttons: ['OK']
    });
  } catch (error) {
    dialog.showErrorBox('Restart Failed', `Failed to restart ADE services: ${error.message}`);
  }
};

const stopServices = () => {
  if (ollamaProcess) {
    ollamaProcess.kill();
    ollamaProcess = null;
  }
  
  if (adeProcess) {
    adeProcess.kill();
    adeProcess = null;
  }
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

// IPC handlers for communication with renderer
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'JavaScript', extensions: ['js'] },
      { name: 'TypeScript', extensions: ['ts'] },
      { name: 'Python', extensions: ['py'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'Markdown', extensions: ['md'] },
      { name: 'Text', extensions: ['txt'] }
    ]
  });
  return result;
});

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'JavaScript', extensions: ['js'] },
      { name: 'TypeScript', extensions: ['ts'] },
      { name: 'Python', extensions: ['py'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'Markdown', extensions: ['md'] },
      { name: 'Text', extensions: ['txt'] }
    ]
  });
  return result;
});
