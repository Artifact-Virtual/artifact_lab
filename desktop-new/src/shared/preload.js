/**
 * Preload script for secure IPC communication between main and renderer processes
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },

  // Service management
  services: {
    getStatus: () => ipcRenderer.invoke('services:get-status'),
    checkHealth: (serviceName) => ipcRenderer.invoke('services:check-health', serviceName),
    onStatusUpdate: (callback) => {
      ipcRenderer.on('service-status', (event, data) => callback(data));
    },
    removeStatusListener: () => {
      ipcRenderer.removeAllListeners('service-status');
    }
  },

  // Settings management
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings)
  },

  // App information
  app: {
    getInfo: () => ipcRenderer.invoke('app:get-info')
  },

  // File dialogs
  dialog: {
    showOpen: (options) => ipcRenderer.invoke('dialog:show-open', options),
    showSave: (options) => ipcRenderer.invoke('dialog:show-save', options)
  },

  // Menu event listeners
  menu: {
    onNewFile: (callback) => {
      ipcRenderer.on('menu:new-file', callback);
    },
    onOpenFile: (callback) => {
      ipcRenderer.on('menu:open-file', callback);
    },
    onSave: (callback) => {
      ipcRenderer.on('menu:save', callback);
    },
    onPreferences: (callback) => {
      ipcRenderer.on('menu:preferences', callback);
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('menu:new-file');
      ipcRenderer.removeAllListeners('menu:open-file');
      ipcRenderer.removeAllListeners('menu:save');
      ipcRenderer.removeAllListeners('menu:preferences');
    }
  }
});
