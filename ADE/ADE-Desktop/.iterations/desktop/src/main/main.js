/**
 * Artifact Desktop - Main Process
 * Modern Electron application with service abstraction and premium theming
 */

const { app, BrowserWindow, Menu, shell, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const { fileURLToPath } = require('url');

// Import our service manager (using require for CommonJS compatibility)
const { serviceManager } = require('../shared/services.js');
const { WINDOW_CONFIG, APP_INFO, THEME } = require('../shared/config.js');

// Keep references to window objects
let mainWindow = null;
let splashWindow = null;

// Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development';

// Settings storage
const Store = require('electron-store');
const store = new Store();

/**
 * Create the splash screen
 */
function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    resizable: false,
    center: true,
    backgroundColor: THEME.COLORS.BACKGROUND_PRIMARY,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Create splash screen content
  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;600&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          background: ${THEME.COLORS.BACKGROUND_PRIMARY};
          font-family: ${THEME.TYPOGRAPHY.FONT_FAMILY};
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          color: ${THEME.COLORS.TEXT_PRIMARY};
          overflow: hidden;
        }
        
        .logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 40px;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          margin-bottom: 20px;
          border-radius: 16px;
          background: ${THEME.COLORS.ACCENT_GRADIENT};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: ${THEME.TYPOGRAPHY.WEIGHT_SEMIBOLD};
          animation: pulse 2s infinite ease-in-out;
          box-shadow: 0 20px 40px rgba(0, 210, 255, 0.2);
        }
        
        .title {
          font-size: ${THEME.TYPOGRAPHY.SIZE_2XL};
          font-weight: ${THEME.TYPOGRAPHY.WEIGHT_LIGHT};
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }
        
        .subtitle {
          font-size: ${THEME.TYPOGRAPHY.SIZE_SM};
          font-weight: ${THEME.TYPOGRAPHY.WEIGHT_THIN};
          opacity: 0.7;
          margin-bottom: 60px;
          letter-spacing: 1px;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        
        .loading-bar {
          width: 200px;
          height: 2px;
          background: ${THEME.COLORS.BACKGROUND_TERTIARY};
          border-radius: 1px;
          overflow: hidden;
          position: relative;
        }
        
        .loading-progress {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: ${THEME.COLORS.ACCENT_GRADIENT};
          animation: loading 2s infinite ease-in-out;
        }
        
        .status {
          font-size: ${THEME.TYPOGRAPHY.SIZE_XS};
          font-weight: ${THEME.TYPOGRAPHY.WEIGHT_LIGHT};
          opacity: 0.6;
          text-align: center;
          min-height: 20px;
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 20px 40px rgba(0, 210, 255, 0.2);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 25px 50px rgba(0, 210, 255, 0.3);
          }
        }
        
        @keyframes loading {
          0% { left: -100%; }
          50% { left: 0%; }
          100% { left: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="logo-container">
        <div class="logo">A</div>
        <div class="title">Artifact</div>
        <div class="subtitle">Development Engine</div>
      </div>
      
      <div class="loading-container">
        <div class="loading-bar">
          <div class="loading-progress"></div>
        </div>
        <div class="status" id="status">Initializing...</div>
      </div>
      
      <script>
        const statusEl = document.getElementById('status');
        const statuses = [
          'Initializing services...',
          'Checking Ollama connection...',
          'Loading workspace...',
          'Preparing interface...',
          'Almost ready...'
        ];
        let statusIndex = 0;
        
        setInterval(() => {
          statusEl.textContent = statuses[statusIndex % statuses.length];
          statusIndex++;
        }, 800);
      </script>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
}

/**
 * Create the main application window
 */
function createMainWindow() {
  // Create splash screen first
  createSplashScreen();

  // Create the main window
  mainWindow = new BrowserWindow({
    width: WINDOW_CONFIG.DEFAULT_WIDTH,
    height: WINDOW_CONFIG.DEFAULT_HEIGHT,
    minWidth: WINDOW_CONFIG.MIN_WIDTH,
    minHeight: WINDOW_CONFIG.MIN_HEIGHT,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: THEME.COLORS.BACKGROUND_PRIMARY,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../shared/preload.js'),
      webSecurity: !isDevelopment,
      allowRunningInsecureContent: false
    },
    vibrancy: 'ultra-dark', // macOS vibrancy
    visualEffectState: 'active'
  });

  // Load the main renderer
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Handle window ready
  mainWindow.once('ready-to-show', async () => {
    // Close splash screen
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }

    // Show main window with fade-in effect
    mainWindow.show();
    mainWindow.focus();

    // Start service monitoring
    await initializeServices();
  });

  // Handle window events
  mainWindow.on('closed', () => {
    mainWindow = null;
    serviceManager.stopHealthMonitoring();
  });

  // Security: Handle external navigation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // Allow navigation to local renderer files only
    if (!navigationUrl.startsWith('file://') && parsedUrl.origin !== 'http://localhost:9000') {
      event.preventDefault();
    }
  });
}

/**
 * Initialize services and start monitoring
 */
async function initializeServices() {
  console.log('Initializing services...');
  
  // Check initial service health
  const healthResults = await serviceManager.checkAllServices();
  console.log('Initial health check:', healthResults);
  
  // Send initial status to renderer
  if (mainWindow) {
    mainWindow.webContents.send('service-status', healthResults);
  }
  
  // Start periodic health monitoring
  serviceManager.startHealthMonitoring(15000); // Check every 15 seconds
  
  // Listen for health check updates
  serviceManager.addEventListener('health-check', (results) => {
    if (mainWindow) {
      mainWindow.webContents.send('service-status', results);
    }
  });
}

/**
 * Setup IPC handlers
 */
function setupIPC() {
  // Window controls
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
  });

  // Service management
  ipcMain.handle('services:get-status', async () => {
    return await serviceManager.checkAllServices();
  });

  ipcMain.handle('services:check-health', async (event, serviceName) => {
    const service = serviceManager.getService(serviceName);
    if (service) {
      return await service.checkHealth();
    }
    return false;
  });

  // Settings management
  ipcMain.handle('settings:load', () => {
    return store.get('settings', {
      theme: 'dark',
      autoStartServices: true,
      notifications: true,
      hardwareAcceleration: true
    });
  });

  ipcMain.handle('settings:save', (event, settings) => {
    store.set('settings', settings);
    return true;
  });

  // App info
  ipcMain.handle('app:get-info', () => {
    return {
      ...APP_INFO,
      version: app.getVersion()
    };
  });

  // File dialogs
  ipcMain.handle('dialog:show-open', async (event, options = {}) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Text Files', extensions: ['txt', 'md', 'json'] },
        { name: 'Code Files', extensions: ['js', 'ts', 'py', 'html', 'css'] }
      ],
      ...options
    });
    return result;
  });

  ipcMain.handle('dialog:show-save', async (event, options = {}) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ],
      ...options
    });
    return result;
  });
}

/**
 * Create application menu
 */
function createMenu() {
  const template = [
    {
      label: APP_INFO.NAME,
      submenu: [
        {
          label: `About ${APP_INFO.NAME}`,
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: `About ${APP_INFO.NAME}`,
              message: APP_INFO.NAME,
              detail: `${APP_INFO.DESCRIPTION}\\nVersion ${APP_INFO.VERSION}\\n\\nBuilt with modern Electron and service abstraction`,
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:preferences');
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:new-file');
            }
          }
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:open-file');
            }
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:save');
            }
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
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
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Setup global shortcuts
 */
function setupGlobalShortcuts() {
  // Developer tools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Fullscreen toggle
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });
}

// App event handlers
app.whenReady().then(() => {
  setupIPC();
  createMenu();
  setupGlobalShortcuts();
  createMainWindow();
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  serviceManager.stopHealthMonitoring();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle app protocol for deep linking (future feature)
app.setAsDefaultProtocolClient('artifact-desktop');
