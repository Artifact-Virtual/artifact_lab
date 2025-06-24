// ADE Studio Desktop Renderer - Main Application Logic
class ADEStudioRenderer {
    constructor() {
        this.isConnected = false;
        this.isLoading = true;
        this.retryCount = 0;
        this.maxRetries = 5;        this.currentProgress = 0;
        this.settings = {
            serverUrl: 'http://localhost:9000',
            theme: 'dark',
            autoLaunch: false,
            hardwareAcceleration: true
        };
        
        this.init();
    }

    init() {
        console.log('ADE Studio Renderer: Initializing...');
        
        // Load settings
        this.loadSettings();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up IPC communication with main process
        this.setupIPC();
        
        // Start connection process
        this.startConnection();
        
        // Setup UI animations
        this.setupAnimations();
    }

    setupEventListeners() {
        // Window controls
        const minimizeBtn = document.getElementById('minimize-btn');
        const maximizeBtn = document.getElementById('maximize-btn');
        const closeBtn = document.getElementById('close-btn');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                window.electronAPI.minimizeWindow();
            });
            minimizeBtn.title = 'Minimize';
        }

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                window.electronAPI.maximizeWindow();
            });
            maximizeBtn.title = 'Maximize';
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                window.electronAPI.closeWindow();
            });
            closeBtn.title = 'Close';
        }

        // Error screen actions
        const retryBtn = document.getElementById('retry-btn');
        const settingsBtn = document.getElementById('settings-btn');

        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.retryConnection();
            });
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }

        // Settings panel
        const closeSettingsBtn = document.getElementById('close-settings');
        const saveSettingsBtn = document.getElementById('save-settings');
        const resetSettingsBtn = document.getElementById('reset-settings');

        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                this.hideSettings();
            });
        }

        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case ',':
                        e.preventDefault();
                        this.showSettings();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.retryConnection();
                        break;
                    case 'q':
                        e.preventDefault();
                        window.electronAPI.closeWindow();
                        break;
                }
            }
        });

        // WebView events
        const webview = document.getElementById('ade-webview');
        if (webview) {
            webview.addEventListener('dom-ready', () => {
                console.log('WebView DOM ready');
                this.onWebViewReady();
            });

            webview.addEventListener('did-fail-load', (event) => {
                console.error('WebView failed to load:', event.errorDescription);
                this.showError('Failed to load ADE Studio interface');
            });

            webview.addEventListener('did-finish-load', () => {
                console.log('WebView finished loading');
                this.onConnectionSuccess();
            });
        }
    }

    setupIPC() {
        // Listen for messages from main process
        if (window.electronAPI) {
            window.electronAPI.onServiceStatus((status) => {
                this.updateServiceStatus(status);
            });

            window.electronAPI.onConnectionStatus((isConnected) => {
                if (isConnected) {
                    this.onConnectionSuccess();
                } else {
                    this.onConnectionFailed();
                }
            });

            window.electronAPI.onError((error) => {
                this.showError(error.message);
            });

            window.electronAPI.onProgress((progress) => {
                this.updateProgress(progress.percentage, progress.message);
            });
        }
    }

    setupAnimations() {
        // Add smooth transitions to all interactive elements
        const interactiveElements = document.querySelectorAll('button, input, select, .toggle-label');
        interactiveElements.forEach(element => {
            element.style.transition = 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)';
        });

        // Add hover effects
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-1px)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });
        });
    }

    startConnection() {
        console.log('Starting connection to ADE services...');
        this.updateProgress(10, 'Checking ADE services...');
        
        // Request main process to start services
        if (window.electronAPI) {
            window.electronAPI.startServices();
        }

        // Simulate connection progress
        this.simulateProgress();
    }

    simulateProgress() {
        const steps = [
            { progress: 20, message: 'Starting Ollama service...' },
            { progress: 40, message: 'Initializing ADE core...' },
            { progress: 60, message: 'Loading workspace...' },
            { progress: 80, message: 'Connecting to services...' },
            { progress: 95, message: 'Almost ready...' }
        ];

        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                const step = steps[currentStep];
                this.updateProgress(step.progress, step.message);
                currentStep++;
            } else {
                clearInterval(interval);
                // Try to connect to the webview
                setTimeout(() => {
                    this.testConnection();
                }, 1000);
            }
        }, 1500);
    }

    testConnection() {
        console.log('Testing connection to ADE Studio...');
        
        // Test if the server is responding
        fetch(this.settings.serverUrl)
            .then(response => {
                if (response.ok) {
                    this.onConnectionSuccess();
                } else {
                    this.onConnectionFailed();
                }
            })
            .catch(error => {
                console.error('Connection test failed:', error);
                this.onConnectionFailed();
            });
    }

    onConnectionSuccess() {
        console.log('Successfully connected to ADE Studio');
        this.isConnected = true;
        this.isLoading = false;
        this.retryCount = 0;

        // Update UI
        this.updateConnectionStatus(true);
        this.updateProgress(100, 'Connected to ADE Studio');
        
        // Hide loading screen and show IDE
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showIDE();
            this.showNotification('Connected to ADE Studio', 'success');
        }, 500);
    }    onConnectionFailed() {
        console.log('Failed to connect to ADE Studio');
        this.isConnected = false;
        this.isLoading = false;

        // Update UI
        this.updateConnectionStatus(false);
        
        if (this.retryCount < this.maxRetries) {
            // Auto-retry
            this.retryCount++;
            this.showNotification(`Connection failed. Retrying... (${this.retryCount}/${this.maxRetries})`, 'warning');
            setTimeout(() => {
                this.retryConnection();
            }, 3000);
        } else {
            // Instead of showing error screen, show IDE with connection warning
            this.hideLoadingScreen();
            this.showIDE();
            this.showNotification('Unable to connect to ADE services. IDE will work in offline mode.', 'warning');
            
            // Update webview to show a local message instead of trying to connect
            const webview = document.getElementById('ade-webview');
            if (webview) {
                webview.style.display = 'none';
            }
            
            // Show a connection status message in the IDE container
            this.showOfflineMessage();
        }
    }

    showOfflineMessage() {
        const ideContainer = document.getElementById('ide-container');
        if (ideContainer) {
            ideContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;">⚠️</div>
                    <h2 style="color: #ffffff; margin-bottom: 16px; font-weight: 600;">ADE Services Offline</h2>
                    <p style="color: #b3b3b3; margin-bottom: 24px; max-width: 500px; line-height: 1.5;">
                        Unable to connect to ADE services. The desktop IDE is ready, but you'll need to start the ADE services manually.
                    </p>
                    <div style="display: flex; gap: 12px; margin-bottom: 32px;">
                        <button class="btn btn-primary" onclick="window.adeRenderer.retryConnection()">
                            Retry Connection
                        </button>
                        <button class="btn btn-secondary" onclick="window.adeRenderer.showSettings()">
                            Settings
                        </button>
                    </div>
                    <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; max-width: 600px;">
                        <h3 style="color: #ffffff; margin-bottom: 12px; font-size: 16px;">To start ADE services manually:</h3>
                        <ol style="color: #b3b3b3; text-align: left; padding-left: 20px; line-height: 1.6;">
                            <li>Open a terminal in your ADE directory</li>
                            <li>Run: <code style="background: #333; padding: 2px 6px; border-radius: 4px; color: #ffffff;">python main.py</code></li>
                            <li>In another terminal, run: <code style="background: #333; padding: 2px 6px; border-radius: 4px; color: #ffffff;">python webchat.py</code></li>
                            <li>Click "Retry Connection" above</li>
                        </ol>
                    </div>
                </div>
            `;
        }
    }

    retryConnection() {
        console.log('Retrying connection...');
        this.hideError();
        this.showLoadingScreen();
        this.isLoading = true;
        this.currentProgress = 0;
        this.startConnection();
    }

    updateProgress(percentage, message) {
        this.currentProgress = percentage;
        
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const loadingStatus = document.getElementById('loading-status');

        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `${percentage}%`;
        if (loadingStatus) loadingStatus.textContent = message;
    }

    updateServiceStatus(status) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusDot = statusIndicator?.querySelector('.status-dot');
        const statusText = statusIndicator?.querySelector('.status-text');

        if (statusDot && statusText) {
            statusDot.className = 'status-dot';
            
            switch (status.type) {
                case 'starting':
                    statusText.textContent = 'Starting...';
                    break;
                case 'running':
                    statusDot.classList.add('connected');
                    statusText.textContent = 'Running';
                    break;
                case 'error':
                    statusDot.classList.add('error');
                    statusText.textContent = 'Error';
                    break;
                default:
                    statusText.textContent = 'Unknown';
            }
        }
    }

    updateConnectionStatus(isConnected) {
        const connectionStatus = document.getElementById('connection-status');
        const connectionIcon = connectionStatus?.querySelector('.connection-icon');
        const connectionText = connectionStatus?.querySelector('.connection-text');

        if (connectionIcon && connectionText) {
            connectionIcon.className = 'connection-icon';
            
            if (isConnected) {
                connectionIcon.classList.add('connected');
                connectionText.textContent = 'Connected';
            } else {
                connectionIcon.classList.add('error');
                connectionText.textContent = 'Disconnected';
            }
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const errorScreen = document.getElementById('error-screen');
        const ideContainer = document.getElementById('ide-container');

        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            loadingScreen.classList.remove('hidden');
        }
        if (errorScreen) {
            errorScreen.style.display = 'none';
        }
        if (ideContainer) {
            ideContainer.style.display = 'none';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    showError(message) {
        const errorScreen = document.getElementById('error-screen');
        const errorMessage = document.getElementById('error-message');
        const loadingScreen = document.getElementById('loading-screen');
        const ideContainer = document.getElementById('ide-container');

        if (errorMessage) errorMessage.textContent = message;
        if (errorScreen) {
            errorScreen.style.display = 'flex';
            errorScreen.classList.add('visible');
        }
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        if (ideContainer) {
            ideContainer.style.display = 'none';
        }
    }

    hideError() {
        const errorScreen = document.getElementById('error-screen');
        if (errorScreen) {
            errorScreen.classList.remove('visible');
            setTimeout(() => {
                errorScreen.style.display = 'none';
            }, 300);
        }
    }

    showIDE() {
        const ideContainer = document.getElementById('ide-container');
        const webview = document.getElementById('ade-webview');
        
        if (ideContainer) {
            ideContainer.style.display = 'block';
            ideContainer.classList.add('visible');
        }
        
        if (webview) {
            // Ensure webview is loaded with current server URL
            webview.src = this.settings.serverUrl;
        }
    }

    onWebViewReady() {
        console.log('WebView is ready, injecting custom styles...');
        
        const webview = document.getElementById('ade-webview');
        if (webview) {
            // Inject custom styles to match desktop theme
            const css = `
                body { 
                    background: #000000 !important; 
                    color: #ffffff !important;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                }
                /* Add more custom styles as needed */
            `;
            
            webview.insertCSS(css);
        }
    }

    showSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.style.display = 'flex';
            settingsPanel.classList.add('visible');
            
            // Populate settings
            this.populateSettings();
        }
    }

    hideSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.remove('visible');
            setTimeout(() => {
                settingsPanel.style.display = 'none';
            }, 300);
        }
    }

    populateSettings() {
        const serverUrl = document.getElementById('server-url');
        const themeSelect = document.getElementById('theme-select');
        const autoLaunch = document.getElementById('auto-launch');
        const hardwareAcceleration = document.getElementById('hardware-acceleration');

        if (serverUrl) serverUrl.value = this.settings.serverUrl;
        if (themeSelect) themeSelect.value = this.settings.theme;
        if (autoLaunch) autoLaunch.checked = this.settings.autoLaunch;
        if (hardwareAcceleration) hardwareAcceleration.checked = this.settings.hardwareAcceleration;
    }

    saveSettings() {
        const serverUrl = document.getElementById('server-url');
        const themeSelect = document.getElementById('theme-select');
        const autoLaunch = document.getElementById('auto-launch');
        const hardwareAcceleration = document.getElementById('hardware-acceleration');

        // Update settings
        if (serverUrl) this.settings.serverUrl = serverUrl.value;
        if (themeSelect) this.settings.theme = themeSelect.value;
        if (autoLaunch) this.settings.autoLaunch = autoLaunch.checked;
        if (hardwareAcceleration) this.settings.hardwareAcceleration = hardwareAcceleration.checked;

        // Save to localStorage
        localStorage.setItem('adeStudioSettings', JSON.stringify(this.settings));
        
        // Send to main process
        if (window.electronAPI) {
            window.electronAPI.saveSettings(this.settings);
        }

        // Apply theme
        this.applyTheme();
        
        // Update webview URL if changed
        const webview = document.getElementById('ade-webview');
        if (webview && webview.src !== this.settings.serverUrl) {
            webview.src = this.settings.serverUrl;
        }

        this.hideSettings();
        this.showNotification('Settings saved successfully', 'success');
    }

    resetSettings() {        this.settings = {
            serverUrl: 'http://localhost:9000',
            theme: 'dark',
            autoLaunch: false,
            hardwareAcceleration: true
        };
        
        this.populateSettings();
        this.showNotification('Settings reset to defaults', 'success');
    }

    loadSettings() {
        const saved = localStorage.getItem('adeStudioSettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        }
        
        this.applyTheme();
    }

    applyTheme() {
        // Theme application logic
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        if (this.settings.theme === 'auto') {
            // Auto theme based on system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }

    showNotification(message, type = 'info', title = '') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            ${title ? `<div class="notification-title">${title}</div>` : ''}
            <div class="notification-message">${message}</div>
        `;

        container.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ADE Studio Renderer...');
    window.adeRenderer = new ADEStudioRenderer();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    // Could send error to main process for logging
});

// Prevent drag and drop
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());
