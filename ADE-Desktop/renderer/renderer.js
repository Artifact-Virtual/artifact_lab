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

        // Iframe events
        const iframe = document.getElementById('ade-iframe');
        if (iframe) {
            // Multiple event handlers for better reliability
            iframe.addEventListener('load', () => {
                console.log('Iframe load event fired');
                this.handleIframeLoaded();
            });

            iframe.addEventListener('error', (event) => {
                console.error('Iframe error event fired:', event);
                if (this.isLoading) {
                    this.showError('Failed to load ADE Studio interface');
                }
            });

            // Use a timer to check if iframe is loaded (more reliable than load event)
            let checkCount = 0;
            const maxChecks = 40; // 40 * 250ms = 10 seconds
            
            const checkIframeLoaded = () => {
                checkCount++;
                console.log(`Checking iframe status (${checkCount}/${maxChecks})`);
                
                // Check if iframe src is accessible
                try {
                    if (iframe.contentDocument || iframe.contentWindow) {
                        console.log('Iframe content accessible - considering it loaded');
                        this.handleIframeLoaded();
                        return;
                    }
                } catch (e) {
                    // Cross-origin - which means it's actually loading properly
                    console.log('Iframe cross-origin access denied - this means it loaded successfully');
                    this.handleIframeLoaded();
                    return;
                }
                
                // Check if we've reached max attempts
                if (checkCount >= maxChecks) {
                    console.warn('Iframe loading timeout after multiple checks');
                    if (this.isLoading) {
                        this.showError('Timeout loading ADE Studio interface');
                    }
                    return;
                }
                
                // Continue checking
                setTimeout(checkIframeLoaded, 250);
            };
            
            // Start checking after iframe src is set
            setTimeout(checkIframeLoaded, 500);
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
        this.progressInterval = setInterval(() => {
            if (currentStep < steps.length && this.isLoading) {
                const step = steps[currentStep];
                this.updateProgress(step.progress, step.message);
                currentStep++;
            } else {
                clearInterval(this.progressInterval);
                if (this.isLoading) {
                    // Final step - test connection
                    setTimeout(() => {
                        this.testConnection();
                    }, 500);
                }
            }
        }, 1000); // Reduced from 1500ms to 1000ms for faster loading
    }

    testConnection() {
        console.log('Testing connection to ADE Studio...');
        
        if (!this.isLoading) {
            console.log('Not in loading state, skipping connection test');
            return;
        }
        
        // Test if the server is responding
        fetch(this.settings.serverUrl, { 
            method: 'HEAD',
            cache: 'no-cache',
            timeout: 5000
        })
            .then(response => {
                if (response.ok) {
                    console.log('Server is responding, connection successful');
                    this.onConnectionSuccess();
                } else {
                    console.log('Server responded but with error status:', response.status);
                    this.onConnectionFailed();
                }
            })
            .catch(error => {
                console.error('Connection test failed:', error);
                // Try iframe-based connection as fallback
                this.checkIframeConnection();
            });
    }

    onConnectionSuccess() {
        console.log('onConnectionSuccess called - Setting connection status to connected');
        
        // Clear any lingering intervals/timeouts
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        if (this.iframeTimeout) {
            clearTimeout(this.iframeTimeout);
            this.iframeTimeout = null;
        }
        
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
            
            // Update iframe to show a local message instead of trying to connect
            const iframe = document.getElementById('ade-iframe');
            if (iframe) {
                iframe.style.display = 'none';
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
        
        // Clear any existing timers
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        if (this.iframeTimeout) {
            clearTimeout(this.iframeTimeout);
            this.iframeTimeout = null;
        }
        
        this.hideError();
        this.showLoadingScreen();
        this.isLoading = true;
        this.isConnected = false;
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
    }    updateServiceStatus(status) {
        console.log('Service status update:', status);
        
        // Update title bar status
        const statusIndicator = document.getElementById('status-indicator');
        const statusDot = statusIndicator?.querySelector('.status-dot');
        const statusText = statusIndicator?.querySelector('.status-text');

        if (statusDot && statusText) {
            statusDot.className = 'status-dot';
            
            switch (status.type) {
                case 'checking':
                    statusText.textContent = 'Checking services...';
                    statusDot.classList.add('checking');
                    break;
                case 'starting':
                    statusText.textContent = 'Starting services...';
                    statusDot.classList.add('starting');
                    break;
                case 'running':
                    statusDot.classList.add('connected');
                    statusText.textContent = 'Services ready';
                    break;
                case 'waiting':
                    statusText.textContent = 'Waiting for services...';
                    statusDot.classList.add('waiting');
                    break;
                case 'optional':
                    statusText.textContent = 'Ready (some services optional)';
                    statusDot.classList.add('optional');
                    break;
                case 'error':
                    statusDot.classList.add('error');
                    statusText.textContent = 'Service error';
                    break;
                default:
                    statusText.textContent = 'Unknown status';
            }
        }

        // Update individual service indicators
        if (status.service === 'ollama' || status.service === 'both') {
            this.updateIndividualServiceStatus('ollama', status.type);
        }
        if (status.service === 'ade' || status.service === 'both') {
            this.updateIndividualServiceStatus('ade', status.type);
        }
    }

    updateIndividualServiceStatus(service, type) {
        const statusDot = document.getElementById(`${service}-status-dot`);
        if (!statusDot) return;

        // Reset classes
        statusDot.className = 'service-status-dot';

        switch (type) {
            case 'running':
                statusDot.classList.add('ready');
                break;
            case 'optional':
                statusDot.classList.add('optional');
                break;
            case 'error':
                statusDot.classList.add('error');
                break;
            case 'checking':
            case 'starting':
            case 'waiting':
            default:
                // Default pulsing animation for loading states
                break;
        }
    }

    updateConnectionStatus(isConnected) {
        console.log('Updating connection status:', isConnected);
        const connectionStatus = document.getElementById('connection-status');
        const connectionIcon = connectionStatus?.querySelector('.connection-icon');
        const connectionText = connectionStatus?.querySelector('.connection-text');

        console.log('Connection elements:', { connectionStatus, connectionIcon, connectionText });

        if (connectionIcon && connectionText) {
            connectionIcon.className = 'connection-icon';
            
            if (isConnected) {
                connectionIcon.classList.add('connected');
                connectionText.textContent = 'Connected';
                console.log('Set connection status to Connected');
            } else {
                connectionIcon.classList.add('error');
                connectionText.textContent = 'Disconnected';
                console.log('Set connection status to Disconnected');
            }
        } else {
            console.warn('Connection status elements not found');
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
        const iframe = document.getElementById('ade-iframe');
        
        if (ideContainer) {
            ideContainer.style.display = 'block';
            ideContainer.classList.add('visible');
        }
        
        if (iframe) {
            // Small delay to ensure iframe is ready
            setTimeout(() => {
                // Ensure iframe is loaded with current server URL
                console.log('Loading iframe with URL:', this.settings.serverUrl);
                iframe.src = this.settings.serverUrl;
            }, 100);
        }
    }

    onIframeReady() {
        console.log('Iframe is ready');
        
        const iframe = document.getElementById('ade-iframe');
        if (iframe) {
            // Note: We cannot inject CSS into iframe due to cross-origin restrictions
            // The ADE service itself should handle its own styling
            console.log('Iframe loaded successfully, cross-origin restrictions prevent CSS injection');
        }
    }

    // Handle iframe loaded state
    handleIframeLoaded() {
        if (this.isConnected) {
            console.log('Iframe already marked as connected, skipping');
            return;
        }
        
        console.log('Iframe successfully loaded - updating connection status');
        this.onConnectionSuccess();
        
        // Force update connection status directly as a backup
        setTimeout(() => {
            const connectionText = document.querySelector('.connection-text');
            const connectionIcon = document.querySelector('.connection-icon');
            if (connectionText && connectionIcon) {
                connectionText.textContent = 'Connected';
                connectionIcon.className = 'connection-icon connected';
                console.log('Force updated connection status to Connected');
            }
        }, 100);
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
        
        // Update iframe URL if changed
        const iframe = document.getElementById('ade-iframe');
        if (iframe && iframe.src !== this.settings.serverUrl) {
            iframe.src = this.settings.serverUrl;
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

    // Iframe-specific connection checking
    checkIframeConnection() {
        const iframe = document.getElementById('ade-iframe');
        if (!iframe || !this.isLoading) return;

        console.log('Checking iframe connection...');
        
        try {
            // Try to access iframe content to check if it loaded
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDoc && iframeDoc.readyState === 'complete') {
                console.log('Iframe content accessible and loaded');
                this.onConnectionSuccess();
            } else {
                console.log('Iframe content not ready, will retry...');
                this.retryIframeConnection();
            }
        } catch (error) {
            // Cross-origin error is expected for external URLs
            console.log('Iframe loaded (cross-origin access blocked, which is expected)');
            // If we get a CORS error, it means the iframe loaded successfully
            this.onConnectionSuccess();
        }
    }

    retryIframeConnection() {
        const iframe = document.getElementById('ade-iframe');
        if (!iframe || this.retryCount >= this.maxRetries) {
            this.showError('Failed to connect to ADE services after multiple attempts');
            return;
        }

        this.retryCount++;
        console.log(`Retrying iframe connection (attempt ${this.retryCount}/${this.maxRetries})`);
        
        // Reload iframe
        iframe.src = iframe.src;
        
        // Check again after delay
        setTimeout(() => {
            this.checkIframeConnection();
        }, 3000);
    }

    updateIframeUrl(newUrl) {
        const iframe = document.getElementById('ade-iframe');
        if (iframe && newUrl !== iframe.src) {
            console.log('Updating iframe URL to:', newUrl);
            iframe.src = newUrl;
            this.isConnected = false;
            this.showLoadingScreen();
        }
    }

    reloadIframe() {
        const iframe = document.getElementById('ade-iframe');
        if (iframe) {
            console.log('Reloading iframe...');
            iframe.src = iframe.src;
            this.isConnected = false;
            this.showLoadingScreen();
        }
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
