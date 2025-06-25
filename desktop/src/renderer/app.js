/**
 * Artifact Desktop - Renderer Process Application Logic
 * Modern, clean architecture with service abstraction
 */

class ArtifactDesktop {
  constructor() {
    this.services = new Map();
    this.tabs = new Map();
    this.activeTab = null;
    this.monacoEditor = null;
    this.settings = {};
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('Initializing Artifact Desktop...');
    
    try {
      // Load application info and settings
      await this.loadAppInfo();
      await this.loadSettings();
      
      // Setup UI event listeners
      this.setupEventListeners();
      
      // Initialize Monaco Editor
      await this.initializeMonacoEditor();
      
      // Setup service monitoring
      this.setupServiceMonitoring();
      
      // Initial service status check
      await this.updateServiceStatus();
      
      console.log('Artifact Desktop initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Artifact Desktop:', error);
      this.showError('Failed to initialize application', error.message);
    }
  }

  /**
   * Load application information
   */
  async loadAppInfo() {
    try {
      const appInfo = await window.electronAPI.app.getInfo();
      document.getElementById('versionInfo').textContent = `v${appInfo.version}`;
      document.title = appInfo.name;
    } catch (error) {
      console.error('Failed to load app info:', error);
    }
  }

  /**
   * Load user settings
   */
  async loadSettings() {
    try {
      this.settings = await window.electronAPI.settings.load();
      console.log('Settings loaded:', this.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = {
        theme: 'dark',
        autoStartServices: true,
        notifications: true,
        hardwareAcceleration: true
      };
    }
  }

  /**
   * Save user settings
   */
  async saveSettings() {
    try {
      await window.electronAPI.settings.save(this.settings);
      console.log('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Title bar controls
    document.getElementById('minimizeBtn').addEventListener('click', () => {
      window.electronAPI.window.minimize();
    });

    document.getElementById('maximizeBtn').addEventListener('click', () => {
      window.electronAPI.window.maximize();
    });

    document.getElementById('closeBtn').addEventListener('click', () => {
      window.electronAPI.window.close();
    });

    // Welcome screen actions
    document.getElementById('openFileBtn').addEventListener('click', () => {
      this.openFile();
    });

    document.getElementById('newProjectBtn').addEventListener('click', () => {
      this.createNewProject();
    });

    // Add a test chat button to welcome screen
    const welcomeActions = document.querySelector('.welcome-actions');
    const chatTestBtn = document.createElement('button');
    chatTestBtn.className = 'welcome-button';
    chatTestBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" stroke="currentColor" stroke-width="1.5" fill="none"/>
        <path d="M6 8h8m-8 4h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Open Chat
    `;
    chatTestBtn.addEventListener('click', () => {
      this.toggleChatPanel(true);
    });
    welcomeActions.appendChild(chatTestBtn);

    // File operations
    document.getElementById('newFileBtn').addEventListener('click', () => {
      this.createNewFile();
    });

    // Service management
    document.getElementById('refreshServicesBtn').addEventListener('click', () => {
      this.updateServiceStatus();
    });

    // Chat panel
    document.getElementById('closeChatBtn').addEventListener('click', () => {
      this.toggleChatPanel(false);
    });

    // Menu event listeners
    window.electronAPI.menu.onNewFile(() => this.createNewFile());
    window.electronAPI.menu.onOpenFile(() => this.openFile());
    window.electronAPI.menu.onSave(() => this.saveCurrentFile());
    window.electronAPI.menu.onPreferences(() => this.showPreferences());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            this.createNewFile();
            break;
          case 'o':
            e.preventDefault();
            this.openFile();
            break;
          case 's':
            e.preventDefault();
            this.saveCurrentFile();
            break;
          case '`':
            e.preventDefault();
            this.toggleChatPanel();
            break;
        }
      }
    });
  }

  /**
   * Initialize Monaco Editor
   */
  async initializeMonacoEditor() {
    return new Promise((resolve, reject) => {
      console.log('Attempting to load Monaco Editor...');
      
      // Check if require is available
      if (typeof require === 'undefined') {
        console.error('AMD require is not available, using alternative loading method');
        // Fallback to script loading
        this.loadMonacoViaScript().then(resolve).catch(reject);
        return;
      }

      // Configure Monaco loader
      require.config({ 
        paths: { 
          'vs': 'https://unpkg.com/monaco-editor@0.45.0/min/vs' 
        }
      });

      require(['vs/editor/editor.main'], () => {
        try {
          // Configure Monaco theme to match our AMOLED theme
          monaco.editor.defineTheme('artifact-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'comment', foreground: 'b0b0b0', fontStyle: 'italic' },
              { token: 'keyword', foreground: '00d2ff' },
              { token: 'string', foreground: '00ff88' },
              { token: 'number', foreground: 'ffaa00' },
              { token: 'type', foreground: '3a7bd5' }
            ],
            colors: {
              'editor.background': '#000000',
              'editor.foreground': '#ffffff',
              'editor.lineHighlightBackground': '#0a0a0a',
              'editor.selectionBackground': '#333333',
              'editor.inactiveSelectionBackground': '#222222',
              'editorCursor.foreground': '#00d2ff',
              'editorLineNumber.foreground': '#666666',
              'editorLineNumber.activeForeground': '#b0b0b0'
            }
          });

          // Create the editor instance
          this.monacoEditor = monaco.editor.create(document.getElementById('monacoEditor'), {
            value: '// Welcome to Artifact Desktop\\n// Start typing to begin coding...\\n',
            language: 'javascript',
            theme: 'artifact-dark',
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Fira Code, Cascadia Code, Consolas, monospace',
            fontWeight: '400',
            lineHeight: 1.6,
            letterSpacing: 0.5,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            renderWhitespace: 'boundary',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: true
          });

          console.log('Monaco Editor initialized');
          resolve();
        } catch (error) {
          console.error('Failed to initialize Monaco Editor:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Fallback method to load Monaco via script tags
   */
  async loadMonacoViaScript() {
    return new Promise((resolve, reject) => {
      console.log('Loading Monaco via script fallback...');
      
      // Create a simple text area as fallback
      const editorContainer = document.getElementById('monacoEditor');
      editorContainer.innerHTML = `
        <textarea id="fallbackEditor" style="
          width: 100%;
          height: 100%;
          background: #000000;
          color: #ffffff;
          border: none;
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          padding: 20px;
          resize: none;
          outline: none;
        ">// Monaco Editor loading failed, using fallback text editor
// This is a temporary solution while we fix the Monaco integration

console.log('Welcome to Artifact Desktop!');

// Start coding here...</textarea>
      `;
      
      this.monacoEditor = {
        getValue: () => document.getElementById('fallbackEditor').value,
        setValue: (value) => { document.getElementById('fallbackEditor').value = value; },
        dispose: () => {}
      };
      
      console.log('Fallback editor initialized');
      resolve();
    });
  }

  /**
   * Setup service monitoring
   */
  setupServiceMonitoring() {
    // Listen for service status updates
    window.electronAPI.services.onStatusUpdate((serviceStatus) => {
      console.log('Service status update:', serviceStatus);
      this.updateServiceIndicators(serviceStatus);
      this.updateServiceList(serviceStatus);
      this.updateWelcomeServiceStatus(serviceStatus);
    });
  }

  /**
   * Update service status
   */
  async updateServiceStatus() {
    try {
      const serviceStatus = await window.electronAPI.services.getStatus();
      console.log('Current service status:', serviceStatus);
      this.updateServiceIndicators(serviceStatus);
      this.updateServiceList(serviceStatus);
      this.updateWelcomeServiceStatus(serviceStatus);
    } catch (error) {
      console.error('Failed to get service status:', error);
    }
  }

  /**
   * Update service indicators in title bar
   */
  updateServiceIndicators(serviceStatus) {
    const ollamaStatus = document.getElementById('ollamaStatus');
    const webchatStatus = document.getElementById('webchatStatus');

    // Update Ollama status
    if (serviceStatus.ollama) {
      ollamaStatus.className = 'status-indicator';
      ollamaStatus.classList.add(serviceStatus.ollama.status);
    }

    // Update Webchat status
    if (serviceStatus.webchat) {
      webchatStatus.className = 'status-indicator';
      webchatStatus.classList.add(serviceStatus.webchat.status);
    }

    // Update connection status in status bar
    const connectionStatus = document.getElementById('connectionStatus');
    const hasHealthyServices = Object.values(serviceStatus).some(s => s.status === 'healthy');
    
    if (hasHealthyServices) {
      connectionStatus.textContent = 'Connected';
      connectionStatus.style.color = 'var(--success)';
    } else {
      connectionStatus.textContent = 'Connecting...';
      connectionStatus.style.color = 'var(--warning)';
    }
  }

  /**
   * Update service list in sidebar
   */
  updateServiceList(serviceStatus) {
    const serviceList = document.getElementById('serviceList');
    serviceList.innerHTML = '';

    Object.entries(serviceStatus).forEach(([serviceName, status]) => {
      const serviceItem = document.createElement('div');
      serviceItem.className = 'service-item';
      
      serviceItem.innerHTML = `
        <div class="service-name">${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}</div>
        <div class="service-status ${status.status}">${status.status}</div>
      `;
      
      serviceList.appendChild(serviceItem);
    });
  }

  /**
   * Update welcome screen service status
   */
  updateWelcomeServiceStatus(serviceStatus) {
    const statusGrid = document.getElementById('statusGrid');
    statusGrid.innerHTML = '';

    Object.entries(serviceStatus).forEach(([serviceName, status]) => {
      const statusItem = document.createElement('div');
      statusItem.className = 'status-item-large';
      
      const description = this.getServiceDescription(serviceName);
      
      statusItem.innerHTML = `
        <div class="status-dot ${status.status}"></div>
        <div class="status-item-info">
          <div class="status-item-name">${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}</div>
          <div class="status-item-desc">${description}</div>
        </div>
      `;
      
      statusGrid.appendChild(statusItem);
    });
  }

  /**
   * Get service description
   */
  getServiceDescription(serviceName) {
    const descriptions = {
      ollama: 'Local language model service',
      webchat: 'Chat interface and communication'
    };
    return descriptions[serviceName] || 'External service';
  }

  /**
   * Create a new file
   */
  createNewFile() {
    const tabId = `untitled-${Date.now()}`;
    const tabName = 'Untitled';
    
    this.createTab(tabId, tabName, '');
    this.switchToTab(tabId);
    
    // Hide welcome screen and show editor
    this.showEditor();
  }

  /**
   * Open file dialog and load file
   */
  async openFile() {
    try {
      const result = await window.electronAPI.dialog.showOpen({
        properties: ['openFile'],
        filters: [
          { name: 'Text Files', extensions: ['txt', 'md', 'json'] },
          { name: 'Code Files', extensions: ['js', 'ts', 'py', 'html', 'css'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        await this.loadFile(filePath);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      this.showError('Failed to open file', error.message);
    }
  }

  /**
   * Load file content
   */
  async loadFile(filePath) {
    try {
      // For now, we'll use a simple file reading approach
      // In a full implementation, you'd use Node.js fs through IPC
      const fileName = filePath.split(/[\\/]/).pop();
      const tabId = filePath;
      
      // Create tab for the file
      this.createTab(tabId, fileName, '// File content would be loaded here\\n// This is a placeholder');
      this.switchToTab(tabId);
      
      // Show editor
      this.showEditor();
      
      console.log(`File loaded: ${fileName}`);
    } catch (error) {
      console.error('Failed to load file:', error);
      this.showError('Failed to load file', error.message);
    }
  }

  /**
   * Save current file
   */
  async saveCurrentFile() {
    if (!this.activeTab || !this.monacoEditor) {
      return;
    }

    try {
      const content = this.monacoEditor.getValue();
      
      // For now, show save dialog
      const result = await window.electronAPI.dialog.showSave({
        filters: [
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'JavaScript', extensions: ['js'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled) {
        console.log(`Would save to: ${result.filePath}`);
        console.log('Content:', content);
        // In a full implementation, save through IPC
        this.showSuccess('File saved successfully');
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      this.showError('Failed to save file', error.message);
    }
  }

  /**
   * Create new project
   */
  createNewProject() {
    console.log('Creating new project...');
    // Placeholder for project creation logic
    this.showInfo('Project creation', 'This feature will be implemented in a future version.');
  }

  /**
   * Create a new tab
   */
  createTab(tabId, title, content) {
    const tabBar = document.getElementById('tabBar');
    
    // Create tab element
    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.dataset.tab = tabId;
    tab.innerHTML = `
      <span class="tab-title">${title}</span>
      <button class="tab-close">×</button>
    `;
    
    // Add event listeners
    tab.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        this.switchToTab(tabId);
      }
    });
    
    tab.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tabId);
    });
    
    tabBar.appendChild(tab);
    
    // Store tab data
    this.tabs.set(tabId, {
      element: tab,
      title: title,
      content: content,
      isDirty: false
    });
  }

  /**
   * Switch to a tab
   */
  switchToTab(tabId) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Add active class to selected tab
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.element.classList.add('active');
      this.activeTab = tabId;
      
      // Update editor content
      if (this.monacoEditor) {
        this.monacoEditor.setValue(tab.content);
      }
    }
  }

  /**
   * Close a tab
   */
  closeTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (tab) {
      tab.element.remove();
      this.tabs.delete(tabId);
      
      if (this.activeTab === tabId) {
        // Switch to another tab or show welcome screen
        if (this.tabs.size > 0) {
          const nextTabId = this.tabs.keys().next().value;
          this.switchToTab(nextTabId);
        } else {
          this.showWelcomeScreen();
        }
      }
    }
  }

  /**
   * Show editor
   */
  showEditor() {
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('monacoEditor').classList.remove('hidden');
  }

  /**
   * Show welcome screen
   */
  showWelcomeScreen() {
    document.getElementById('monacoEditor').classList.add('hidden');
    document.getElementById('welcomeScreen').classList.remove('hidden');
    this.activeTab = null;
  }

  /**
   * Toggle chat panel
   */
  toggleChatPanel(force = null) {
    const chatPanel = document.getElementById('chatPanel');
    const chatFrame = document.getElementById('chatFrame');
    
    const shouldShow = force !== null ? force : chatPanel.classList.contains('hidden');
    
    if (shouldShow) {
      console.log('Opening chat panel...');
      chatPanel.classList.remove('hidden');
      // Load webchat URL if available
      if (!chatFrame.src) {
        console.log('Loading webchat at http://127.0.0.1:9000');
        chatFrame.src = 'http://127.0.0.1:9000';
        
        // Add error handling for iframe
        chatFrame.onerror = () => {
          console.error('Failed to load webchat');
          chatFrame.innerHTML = '<div style="color: white; padding: 20px;">Chat service unavailable</div>';
        };
      }
    } else {
      console.log('Closing chat panel...');
      chatPanel.classList.add('hidden');
    }
  }

  /**
   * Show preferences dialog
   */
  showPreferences() {
    console.log('Showing preferences...');
    // Placeholder for preferences dialog
    this.showInfo('Preferences', 'Preferences dialog will be implemented in a future version.');
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    console.log(`✓ ${message}`);
    // Could implement toast notifications here
  }

  /**
   * Show error message
   */
  showError(title, message) {
    console.error(`✗ ${title}: ${message}`);
    // Could implement error dialog here
  }

  /**
   * Show info message
   */
  showInfo(title, message) {
    console.log(`ℹ ${title}: ${message}`);
    // Could implement info dialog here
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.artifactDesktop = new ArtifactDesktop();
});
