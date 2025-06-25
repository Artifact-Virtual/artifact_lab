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
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Service management
  startServices: () => ipcRenderer.invoke('start-services'),
  stopServices: () => ipcRenderer.invoke('stop-services'),
  getServiceStatus: () => ipcRenderer.invoke('get-service-status'),
  
  // Settings
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  
  // Event listeners
  onServiceStatus: (callback) => {
    ipcRenderer.on('service-status', (event, status) => callback(status));
    return () => ipcRenderer.removeAllListeners('service-status');
  },
  
  onConnectionStatus: (callback) => {
    ipcRenderer.on('connection-status', (event, isConnected) => callback(isConnected));
    return () => ipcRenderer.removeAllListeners('connection-status');
  },
  
  onError: (callback) => {
    ipcRenderer.on('app-error', (event, error) => callback(error));
    return () => ipcRenderer.removeAllListeners('app-error');
  },
  
  onProgress: (callback) => {
    ipcRenderer.on('progress-update', (event, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('progress-update');
  },

  // Iframe management
  reloadIframe: () => ipcRenderer.invoke('reload-iframe'),
  updateIframeUrl: (url) => ipcRenderer.invoke('update-iframe-url', url),
  
  onReloadIframe: (callback) => {
    ipcRenderer.on('reload-iframe', callback);
    return () => ipcRenderer.removeAllListeners('reload-iframe');
  },
  
  onUpdateIframeUrl: (callback) => {
    ipcRenderer.on('update-iframe-url', (event, url) => callback(url));
    return () => ipcRenderer.removeAllListeners('update-iframe-url');
  },
  
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

// Legacy window controls (deprecated)
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => {
    ipcRenderer.invoke('minimize-window');
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
