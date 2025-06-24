const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File operations
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  
  // System info
  platform: process.platform,
  
  // Development mode
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Custom events
  onWindowResize: (callback) => {
    ipcRenderer.on('window-resize', callback);
  },
  
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Expose system theme detection
contextBridge.exposeInMainWorld('systemTheme', {
  shouldUseDarkColors: () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  
  onThemeChange: (callback) => {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', callback);
      return () => mediaQuery.removeEventListener('change', callback);
    }
    return () => {};
  }
});

// Window controls for frameless window
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => {
    const { remote } = require('electron');
    remote.getCurrentWindow().minimize();
  },
  
  maximize: () => {
    const { remote } = require('electron');
    const win = remote.getCurrentWindow();
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  },
  
  close: () => {
    const { remote } = require('electron');
    remote.getCurrentWindow().close();
  },
  
  isMaximized: () => {
    const { remote } = require('electron');
    return remote.getCurrentWindow().isMaximized();
  }
});

// Enhanced security and performance logging
console.log('🔒 ADE Desktop preload script loaded with security context bridge');
console.log('🚀 Electron API exposed for secure renderer communication');
