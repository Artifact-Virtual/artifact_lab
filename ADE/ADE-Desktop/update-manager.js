// Auto-updater and crash recovery for ADE Studio Desktop
const { autoUpdater } = require('electron-updater');
const { app, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

class UpdateManager {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.updateAvailable = false;
        this.updateDownloaded = false;
        this.checkingForUpdates = false;
        
        this.init();
    }

    init() {
        // Configure auto-updater
        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = true;
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check for updates on startup (delay to avoid interfering with app launch)
        setTimeout(() => {
            this.checkForUpdates();
        }, 30000); // 30 seconds after startup
        
        // Set up periodic update checks (every 4 hours)
        setInterval(() => {
            this.checkForUpdates();
        }, 4 * 60 * 60 * 1000);
    }

    setupEventListeners() {
        autoUpdater.on('checking-for-update', () => {
            console.log('Checking for updates...');
            this.checkingForUpdates = true;
            this.notifyRenderer('update-status', { type: 'checking' });
        });

        autoUpdater.on('update-available', (info) => {
            console.log('Update available:', info);
            this.updateAvailable = true;
            this.checkingForUpdates = false;
            this.notifyRenderer('update-status', { 
                type: 'available', 
                version: info.version,
                releaseNotes: info.releaseNotes 
            });
            
            // Show update notification
            this.showUpdateNotification(info);
        });

        autoUpdater.on('update-not-available', (info) => {
            console.log('Update not available:', info);
            this.checkingForUpdates = false;
            this.notifyRenderer('update-status', { type: 'not-available' });
        });

        autoUpdater.on('error', (err) => {
            console.error('Update error:', err);
            this.checkingForUpdates = false;
            this.notifyRenderer('update-status', { type: 'error', error: err.message });
        });

        autoUpdater.on('download-progress', (progressObj) => {
            const message = `Downloaded ${progressObj.percent.toFixed(1)}% (${progressObj.transferred}/${progressObj.total})`;
            console.log('Download progress:', message);
            this.notifyRenderer('update-progress', {
                percent: progressObj.percent,
                transferred: progressObj.transferred,
                total: progressObj.total
            });
        });

        autoUpdater.on('update-downloaded', (info) => {
            console.log('Update downloaded:', info);
            this.updateDownloaded = true;
            this.notifyRenderer('update-status', { type: 'downloaded', version: info.version });
            
            // Show install notification
            this.showInstallNotification(info);
        });

        // IPC handlers
        ipcMain.handle('check-for-updates', () => {
            return this.checkForUpdates();
        });

        ipcMain.handle('download-update', () => {
            return this.downloadUpdate();
        });

        ipcMain.handle('install-update', () => {
            return this.installUpdate();
        });

        ipcMain.handle('get-update-status', () => {
            return {
                checking: this.checkingForUpdates,
                available: this.updateAvailable,
                downloaded: this.updateDownloaded
            };
        });
    }

    async checkForUpdates() {
        if (this.checkingForUpdates) {
            return false;
        }

        try {
            const result = await autoUpdater.checkForUpdates();
            return result !== null;
        } catch (error) {
            console.error('Failed to check for updates:', error);
            return false;
        }
    }

    async downloadUpdate() {
        if (!this.updateAvailable) {
            return false;
        }

        try {
            await autoUpdater.downloadUpdate();
            return true;
        } catch (error) {
            console.error('Failed to download update:', error);
            return false;
        }
    }

    installUpdate() {
        if (!this.updateDownloaded) {
            return false;
        }

        // Save current state before update
        this.saveAppState();
        
        // Install and restart
        autoUpdater.quitAndInstall();
        return true;
    }

    showUpdateNotification(info) {
        const response = dialog.showMessageBoxSync(this.mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `ADE Studio v${info.version} is available`,
            detail: 'Would you like to download and install the update now?',
            buttons: ['Download Now', 'Download Later', 'Skip This Version'],
            defaultId: 0,
            cancelId: 2
        });

        switch (response) {
            case 0: // Download Now
                this.downloadUpdate();
                break;
            case 1: // Download Later
                // Remind in 24 hours
                setTimeout(() => {
                    this.showUpdateNotification(info);
                }, 24 * 60 * 60 * 1000);
                break;
            case 2: // Skip This Version
                // Don't show again for this version
                break;
        }
    }

    showInstallNotification(info) {
        const response = dialog.showMessageBoxSync(this.mainWindow, {
            type: 'info',
            title: 'Update Ready',
            message: `ADE Studio v${info.version} is ready to install`,
            detail: 'The update will be installed when you restart ADE Studio.',
            buttons: ['Restart Now', 'Restart Later'],
            defaultId: 0,
            cancelId: 1
        });

        if (response === 0) {
            this.installUpdate();
        }
    }

    saveAppState() {
        // Save current window state, open files, etc.
        const state = {
            timestamp: Date.now(),
            windowBounds: this.mainWindow.getBounds(),
            isMaximized: this.mainWindow.isMaximized(),
            isFullScreen: this.mainWindow.isFullScreen()
        };

        const stateFile = path.join(app.getPath('userData'), 'app-state.json');
        fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    }

    restoreAppState() {
        const stateFile = path.join(app.getPath('userData'), 'app-state.json');
        
        if (fs.existsSync(stateFile)) {
            try {
                const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
                
                // Restore window state
                if (state.windowBounds) {
                    this.mainWindow.setBounds(state.windowBounds);
                }
                
                if (state.isMaximized) {
                    this.mainWindow.maximize();
                }
                
                if (state.isFullScreen) {
                    this.mainWindow.setFullScreen(true);
                }
                
                // Clean up old state
                fs.unlinkSync(stateFile);
                
                return true;
            } catch (error) {
                console.error('Failed to restore app state:', error);
                return false;
            }
        }
        
        return false;
    }

    notifyRenderer(channel, data) {
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.send(channel, data);
        }
    }
}

class CrashRecovery {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.crashLogFile = path.join(app.getPath('userData'), 'crash-logs.json');
        this.sessionFile = path.join(app.getPath('userData'), 'session.json');
        
        this.init();
    }

    init() {
        // Set up crash handlers
        process.on('uncaughtException', (error) => {
            this.handleCrash('uncaughtException', error);
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.handleCrash('unhandledRejection', reason);
        });

        // Save session periodically
        setInterval(() => {
            this.saveSession();
        }, 30000); // Every 30 seconds

        // Clean up old crash logs
        this.cleanupOldLogs();
    }

    handleCrash(type, error) {
        console.error(`${type}:`, error);
        
        // Log crash details
        const crashLog = {
            timestamp: Date.now(),
            type: type,
            error: {
                message: error.message || String(error),
                stack: error.stack || 'No stack trace available'
            },
            systemInfo: {
                platform: process.platform,
                arch: process.arch,
                version: process.version,
                electronVersion: process.versions.electron,
                chromeVersion: process.versions.chrome
            }
        };

        this.logCrash(crashLog);
        
        // Try to save current session
        this.saveSession();
        
        // Show crash dialog
        this.showCrashDialog(crashLog);
    }

    logCrash(crashLog) {
        try {
            let logs = [];
            
            if (fs.existsSync(this.crashLogFile)) {
                const data = fs.readFileSync(this.crashLogFile, 'utf8');
                logs = JSON.parse(data);
            }
            
            logs.push(crashLog);
            
            // Keep only last 10 crash logs
            if (logs.length > 10) {
                logs = logs.slice(-10);
            }
            
            fs.writeFileSync(this.crashLogFile, JSON.stringify(logs, null, 2));
        } catch (error) {
            console.error('Failed to log crash:', error);
        }
    }

    saveSession() {
        try {
            const session = {
                timestamp: Date.now(),
                windowState: {
                    bounds: this.mainWindow.getBounds(),
                    isMaximized: this.mainWindow.isMaximized(),
                    isFullScreen: this.mainWindow.isFullScreen()
                }
                // Add more session data as needed (open files, tabs, etc.)
            };

            fs.writeFileSync(this.sessionFile, JSON.stringify(session, null, 2));
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }

    restoreSession() {
        if (fs.existsSync(this.sessionFile)) {
            try {
                const session = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8'));
                
                // Check if session is recent (within last 24 hours)
                if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
                    // Restore window state
                    if (session.windowState) {
                        this.mainWindow.setBounds(session.windowState.bounds);
                        
                        if (session.windowState.isMaximized) {
                            this.mainWindow.maximize();
                        }
                        
                        if (session.windowState.isFullScreen) {
                            this.mainWindow.setFullScreen(true);
                        }
                    }
                    
                    return true;
                }
            } catch (error) {
                console.error('Failed to restore session:', error);
            }
        }
        
        return false;
    }

    showCrashDialog(crashLog) {
        const response = dialog.showMessageBoxSync(this.mainWindow, {
            type: 'error',
            title: 'ADE Studio Crashed',
            message: 'ADE Studio encountered an unexpected error and needs to restart.',
            detail: `Error: ${crashLog.error.message}\n\nWould you like to restart ADE Studio and restore your session?`,
            buttons: ['Restart', 'Quit', 'Send Report'],
            defaultId: 0,
            cancelId: 1
        });

        switch (response) {
            case 0: // Restart
                app.relaunch();
                app.exit(0);
                break;
            case 1: // Quit
                app.quit();
                break;
            case 2: // Send Report
                this.openCrashReportDialog(crashLog);
                break;
        }
    }

    openCrashReportDialog(crashLog) {
        // Future: implement crash report submission
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Crash Report',
            message: 'Crash reporting is not yet implemented.',
            detail: 'In the future, you will be able to send crash reports to help improve ADE Studio.',
            buttons: ['OK']
        });
    }

    cleanupOldLogs() {
        try {
            if (fs.existsSync(this.crashLogFile)) {
                const data = fs.readFileSync(this.crashLogFile, 'utf8');
                const logs = JSON.parse(data);
                
                // Remove logs older than 30 days
                const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                const filteredLogs = logs.filter(log => log.timestamp > thirtyDaysAgo);
                
                if (filteredLogs.length !== logs.length) {
                    fs.writeFileSync(this.crashLogFile, JSON.stringify(filteredLogs, null, 2));
                }
            }
        } catch (error) {
            console.error('Failed to cleanup old logs:', error);
        }
    }

    getCrashLogs() {
        try {
            if (fs.existsSync(this.crashLogFile)) {
                const data = fs.readFileSync(this.crashLogFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to get crash logs:', error);
        }
        
        return [];
    }
}

module.exports = { UpdateManager, CrashRecovery };
