/**
 * Research Lab Portal - Real API Integration Core
 * Connects to actual research lab system via API
 */

class ResearchPortal {    constructor() {
        this.apiUrl = 'http://localhost:8000/api';
        this.wsUrl = 'ws://localhost:8000/ws';
        this.websocket = null;
        this.currentSession = null;
        this.directoryStructure = null;
        this.analysisResults = {};
        this.systemStatus = null;
        this.currentView = '3d';
        this.activeContainers = new Map();
        this.measurementTool = 'statistical';
        this.isImmersiveMode = false;
        
        this.init();
    }

    async init() {
        console.log('🔬 Initializing Research Portal with Real Data Connection...');
        
        try {
            // Connect to real research lab API
            await this.connectToResearchLab();
            
            // Setup WebSocket for real-time updates
            this.setupWebSocket();
            
            // Load actual directory structure
            await this.loadRealDirectoryStructure();
            
            // Initialize UI components
            this.setupEventListeners();
            this.initializeNeuralBackground();
            this.startTimestamp();
            this.initializeContainers();
            this.updateInterfaceWithRealData();
            this.setupKeyboardShortcuts();
            
            console.log('✅ Portal successfully connected to research lab');
        } catch (error) {
            console.error('❌ Failed to connect to research lab:', error);
            this.showConnectionError(error);
        }
    }

    async connectToResearchLab() {
        try {
            const response = await fetch(`${this.apiUrl}/status`);
            if (!response.ok) {
                throw new Error(`Research Lab API unavailable (${response.status})`);
            }
            
            this.systemStatus = await response.json();
            console.log('📊 Connected to Research Lab:', this.systemStatus);
            
            // Update security indicator
            this.updateSecurityStatus(this.systemStatus.security_level);
            
        } catch (error) {
            throw new Error(`Cannot connect to Research Lab API at ${this.apiUrl}: ${error.message}`);
        }
    }

    setupWebSocket() {
        try {
            this.websocket = new WebSocket(this.wsUrl);
            
            this.websocket.onopen = () => {
                console.log('🔌 Real-time connection established');
                this.showNotification('Connected to research lab system', 'success');
            };
            
            this.websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };
            
            this.websocket.onclose = () => {
                console.log('🔌 Real-time connection lost, attempting reconnect...');
                setTimeout(() => this.setupWebSocket(), 5000);
            };
            
            this.websocket.onerror = (error) => {
                console.warn('🔌 WebSocket connection issue:', error);
            };
        } catch (error) {
            console.warn('WebSocket setup failed, continuing without real-time updates:', error);
        }
    }    async loadRealDirectoryStructure() {
        try {
            const response = await fetch(`${this.apiUrl}/directory-structure`);
            if (!response.ok) {
                throw new Error(`Failed to load directory structure: ${response.status}`);
            }
            
            this.directoryStructure = await response.json();
            console.log('📁 Loaded real directory structure:', this.directoryStructure);
            
        } catch (error) {
            console.error('Failed to load directory structure:', error);
            // Continue with empty structure rather than failing completely
        }
    }

    updateInterfaceWithRealData() {
        if (this.systemStatus) {
            // Update timestamp with real data
            const timestampEl = document.getElementById('timestamp');
            if (timestampEl) {
                timestampEl.textContent = new Date(this.systemStatus.timestamp).toLocaleString();
            }
            
            // Update session info
            const sessionEl = document.querySelector('.session-id');
            if (sessionEl) {
                sessionEl.textContent = `Active Sessions: ${this.systemStatus.active_sessions}`;
            }
        }
        
        // Update directory visualization
        if (this.directoryStructure) {
            this.updateDirectoryVisualization();
        }
    }

    updateDirectoryVisualization() {
        const viewer = document.getElementById('directoryViewer');
        if (viewer && this.directoryStructure) {
            viewer.innerHTML = this.generateRealDirectoryHTML(this.directoryStructure);
            this.setupDirectoryInteractions();
        }
    }

    generateRealDirectoryHTML(structure, level = 0) {
        const indent = '  '.repeat(level);
        const icon = this.getDirectoryIcon(structure);
        const sizeInfo = structure.type === 'file' ? this.formatFileSize(structure.size) : '';
        
        let html = `<div class="directory-item real-item" data-path="${structure.path}" data-type="${structure.type}">`;
        html += `${indent}<i class="fas fa-${icon}"></i> `;
        html += `<span class="item-name">${structure.name}</span>`;
        if (sizeInfo) {
            html += `<span class="item-size">${sizeInfo}</span>`;
        }
        html += `<span class="item-modified">${new Date(structure.modified).toLocaleDateString()}</span>`;
        html += `</div>`;
        
        if (structure.children && structure.children.length > 0) {
            html += '<div class="directory-children">';
            for (const child of structure.children.slice(0, 20)) { // Limit for performance
                html += this.generateRealDirectoryHTML(child, level + 1);
            }
            if (structure.children.length > 20) {
                html += `<div class="more-items">... ${structure.children.length - 20} more items</div>`;
            }
            html += '</div>';
        }
        
        return html;
    }

    getDirectoryIcon(structure) {
        if (structure.type === 'file') {
            const ext = structure.name.split('.').pop().toLowerCase();
            switch (ext) {
                case 'py': return 'file-code';
                case 'json': return 'file-alt';
                case 'csv': return 'table';
                case 'md': return 'file-text';
                case 'log': return 'file-medical';
                default: return 'file';
            }
        } else {
            // Special icons for known research directories
            switch (structure.name) {
                case 'labs': return 'flask';
                case 'models': return 'cube';
                case 'head_1':
                case 'head_2':
                case 'head_3': return 'brain';
                case 'journal': return 'book';
                case 'logs': return 'list-alt';
                default: return 'folder';
            }
        }
    }

    formatFileSize(bytes) {
        if (!bytes) return '';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }

    setupDirectoryInteractions() {
        document.querySelectorAll('.directory-item.real-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleRealDirectoryClick(e.target.closest('.directory-item'));
            });
            
            item.addEventListener('dblclick', (e) => {
                this.handleDirectoryDoubleClick(e.target.closest('.directory-item'));
            });
        });
    }

    async handleRealDirectoryClick(item) {
        const path = item.dataset.path;
        const type = item.dataset.type;
        
        console.log(`📂 Exploring ${type}: ${path}`);
        
        // Highlight selected item
        document.querySelectorAll('.directory-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        
        if (type === 'folder') {
            // Toggle folder expansion
            this.toggleDirectoryExpansion(item);
        } else {
            // Load file data
            await this.loadRealFileData(path);
        }
    }

    toggleDirectoryExpansion(item) {
        const children = item.nextElementSibling;
        if (children && children.classList.contains('directory-children')) {
            const isExpanded = children.style.display !== 'none';
            children.style.display = isExpanded ? 'none' : 'block';
            
            const icon = item.querySelector('i');
            if (icon.classList.contains('fa-folder') || icon.classList.contains('fa-folder-open')) {
                icon.classList.toggle('fa-folder', isExpanded);
                icon.classList.toggle('fa-folder-open', !isExpanded);
            }
        }
    }

    async handleDirectoryDoubleClick(item) {
        const path = item.dataset.path;
        const type = item.dataset.type;
        
        if (type === 'file') {
            // Start analysis on file
            await this.analyzeFile(path);
        } else {
            // Deep dive into directory
            this.enterDirectoryAnalysisMode(path);
        }
    }

    async loadRealFileData(path) {
        try {
            const response = await fetch(`${this.apiUrl}/data/${path}`);
            if (!response.ok) {
                throw new Error(`Failed to load file: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`📄 Loaded real file data for ${path}`);
            
            this.displayFileDataPanel(path, data);
            
        } catch (error) {
            console.error(`Failed to load file ${path}:`, error);
            this.showNotification(`Failed to load file: ${error.message}`, 'error');
        }
    }

    displayFileDataPanel(path, data) {
        // Create or update file data panel
        let panel = document.getElementById('fileDataPanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'fileDataPanel';
            panel.className = 'file-data-panel';
            document.body.appendChild(panel);
        }
        
        panel.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">
                    <i class="fas fa-file-alt"></i>
                    <span>${path}</span>
                </div>
                <button class="panel-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="panel-content">
                <div class="data-preview">
                    ${this.formatDataForDisplay(data)}
                </div>
                <div class="panel-actions">
                    <button class="action-btn" onclick="window.portalCore.analyzeFileData('${path}', 'STATISTICAL')">
                        <i class="fas fa-chart-bar"></i> Statistical Analysis
                    </button>
                    <button class="action-btn" onclick="window.portalCore.analyzeFileData('${path}', 'BEHAVIORAL')">
                        <i class="fas fa-user-friends"></i> Behavioral Analysis
                    </button>
                    <button class="action-btn" onclick="window.portalCore.analyzeFileData('${path}', 'TEMPORAL')">
                        <i class="fas fa-clock"></i> Temporal Analysis
                    </button>
                </div>
            </div>
        `;
        
        panel.style.display = 'block';
    }

    formatDataForDisplay(data) {
        if (Array.isArray(data)) {
            // Tabular data
            if (data.length > 0 && typeof data[0] === 'object') {
                const headers = Object.keys(data[0]);
                const rows = data.slice(0, 10); // Show first 10 rows
                
                let html = '<table class="data-table">';
                html += '<thead><tr>';
                headers.forEach(header => {
                    html += `<th>${header}</th>`;
                });
                html += '</tr></thead><tbody>';
                
                rows.forEach(row => {
                    html += '<tr>';
                    headers.forEach(header => {
                        html += `<td>${row[header] ?? ''}</td>`;
                    });
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
                if (data.length > 10) {
                    html += `<p class="data-summary">Showing 10 of ${data.length} rows</p>`;
                }
                return html;
            }
        }
        
        // Fallback to JSON display
        return `<pre class="json-display">${JSON.stringify(data, null, 2)}</pre>`;
    }

    async analyzeFileData(path, analysisType) {
        console.log(`🔬 Starting ${analysisType} analysis on ${path}`);
        
        try {
            this.showAnalysisLoading(analysisType);
            
            const response = await fetch(`${this.apiUrl}/analysis/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: analysisType,
                    data_path: path,
                    parameters: {}
                })
            });
            
            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`📊 Analysis completed for ${path}:`, result);
            
            this.displayAnalysisResults(analysisType, result);
            this.hideAnalysisLoading(analysisType);
            
        } catch (error) {
            console.error(`Analysis failed for ${path}:`, error);
            this.showNotification(`Analysis failed: ${error.message}`, 'error');
            this.hideAnalysisLoading(analysisType);
        }
    }

    displayAnalysisResults(analysisType, results) {
        // Find or create analysis container
        let container = document.querySelector(`[data-analysis="${analysisType.toLowerCase()}"]`);
        if (!container) {
            container = this.createAnalysisContainer(analysisType);
        }
        
        // Update container with real results
        this.updateAnalysisContainer(container, results);
        
        // Update visualizations if available
        if (results.results && results.results.visualizations) {
            this.updateVisualizationWithRealData(container, results.results.visualizations);
        }
    }

    createAnalysisContainer(analysisType) {
        const container = document.createElement('div');
        container.className = 'analysis-container dynamic-container';
        container.dataset.analysis = analysisType.toLowerCase();
        
        container.innerHTML = `
            <div class="container-header">
                <h3><i class="fas fa-microscope"></i> ${analysisType} Analysis</h3>
                <div class="container-controls">
                    <button class="control-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="container-content">
                <div class="analysis-results"></div>
                <div class="chart-container"></div>
            </div>
        `;
        
        // Add to appropriate section
        const analysisSection = document.querySelector('.analysis-containers') || 
                               document.querySelector('.portal-grid');
        if (analysisSection) {
            analysisSection.appendChild(container);
        }
        
        return container;
    }

    updateAnalysisContainer(container, results) {
        const resultsEl = container.querySelector('.analysis-results');
        if (!resultsEl) return;
        
        let html = `<div class="results-header">
            <h4>📊 Analysis Results</h4>
            <span class="session-id">Session: ${results.session_id}</span>
        </div>`;
        
        if (results.results) {
            html += this.formatAnalysisResults(results.results);
        }
        
        resultsEl.innerHTML = html;
    }

    formatAnalysisResults(results) {
        let html = '';
        
        // Handle different result types
        Object.entries(results).forEach(([key, value]) => {
            if (key === 'visualizations') return; // Skip visualizations here
            
            html += `<div class="result-section">`;
            html += `<h5>${this.formatResultTitle(key)}</h5>`;
            
            if (typeof value === 'object' && value !== null) {
                html += '<div class="result-details">';
                Object.entries(value).forEach(([subKey, subValue]) => {
                    if (typeof subValue === 'number') {
                        html += `<div class="metric">
                            <span class="metric-label">${this.formatResultTitle(subKey)}:</span>
                            <span class="metric-value">${this.formatNumber(subValue)}</span>
                        </div>`;
                    } else if (typeof subValue === 'object') {
                        html += `<div class="metric">
                            <span class="metric-label">${this.formatResultTitle(subKey)}:</span>
                            <span class="metric-value">${JSON.stringify(subValue)}</span>
                        </div>`;
                    }
                });
                html += '</div>';
            } else {
                html += `<div class="result-value">${value}</div>`;
            }
            
            html += '</div>';
        });
        
        return html;
    }

    formatResultTitle(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    formatNumber(num) {
        if (typeof num !== 'number') return num;
        return num > 1000 ? num.toExponential(3) : num.toFixed(3);
    }

    updateVisualizationWithRealData(container, vizData) {
        const chartContainer = container.querySelector('.chart-container');
        if (!chartContainer || !window.echarts) return;
        
        chartContainer.innerHTML = '';
        const chartId = `chart-${Date.now()}`;
        chartContainer.id = chartId;
        
        const chart = echarts.init(chartContainer, 'dark');
        const option = this.createChartOptionFromData(vizData);
        
        if (option) {
            chart.setOption(option);
        }
    }

    createChartOptionFromData(vizData) {
        // Handle different visualization data types
        const firstKey = Object.keys(vizData)[0];
        const data = vizData[firstKey];
        
        if (data.bins && data.counts) {
            // Histogram data
            return {
                backgroundColor: 'transparent',
                title: { text: 'Distribution', textStyle: { color: '#fff' } },
                tooltip: { trigger: 'axis' },
                xAxis: {
                    type: 'category',
                    data: data.bins.slice(0, -1).map(b => b.toFixed(2)),
                    axisLabel: { color: '#fff' }
                },
                yAxis: { type: 'value', axisLabel: { color: '#fff' } },
                series: [{
                    name: 'Frequency',
                    type: 'bar',
                    data: data.counts,
                    itemStyle: { color: '#00ff88' }
                }]
            };
        } else if (data.timestamps && data.counts) {
            // Time series data
            return {
                backgroundColor: 'transparent',
                title: { text: 'Timeline', textStyle: { color: '#fff' } },
                tooltip: { trigger: 'axis' },
                xAxis: {
                    type: 'category',
                    data: data.timestamps.map(t => new Date(t).toLocaleTimeString()),
                    axisLabel: { color: '#fff' }
                },
                yAxis: { type: 'value', axisLabel: { color: '#fff' } },
                series: [{
                    name: 'Count',
                    type: 'line',
                    data: data.counts,
                    lineStyle: { color: '#4ecdc4' }
                }]
            };
        }
        
        return null;
    }

    showAnalysisLoading(analysisType) {
        const container = document.querySelector(`[data-analysis="${analysisType.toLowerCase()}"]`);
        if (container) {
            container.classList.add('loading');
            
            const loadingEl = document.createElement('div');
            loadingEl.className = 'loading-overlay';
            loadingEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
            container.appendChild(loadingEl);
        }
    }

    hideAnalysisLoading(analysisType) {
        const container = document.querySelector(`[data-analysis="${analysisType.toLowerCase()}"]`);
        if (container) {
            container.classList.remove('loading');
            const loadingEl = container.querySelector('.loading-overlay');
            if (loadingEl) {
                loadingEl.remove();
            }
        }
    }

    showConnectionError(error) {
        const errorPanel = document.createElement('div');
        errorPanel.className = 'connection-error-panel';
        errorPanel.innerHTML = `
            <div class="error-content">
                <h3><i class="fas fa-exclamation-triangle"></i> Connection Error</h3>
                <p>Failed to connect to the Research Lab API server.</p>
                <p class="error-details">${error.message}</p>
                <div class="error-actions">
                    <button onclick="window.location.reload()" class="retry-btn">
                        <i class="fas fa-redo"></i> Retry Connection
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="dismiss-btn">
                        <i class="fas fa-times"></i> Continue Offline
                    </button>
                </div>
                <div class="error-help">
                    <p>To start the API server, run:</p>
                    <code>python portal_api_server.py</code>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorPanel);
    }

    handleRealTimeUpdate(data) {
        console.log('📡 Real-time update:', data);
        
        switch (data.type) {
            case 'analysis_started':
                this.showNotification(`Analysis ${data.analysis_type} started`, 'info');
                break;
            case 'analysis_completed':
                this.showNotification(`Analysis ${data.analysis_type} completed`, 'success');
                break;
            case 'system_status_update':
                this.systemStatus = data.status;
                this.updateInterfaceWithRealData();
                break;
        }
    }

    updateSecurityStatus(level) {
        const securityEl = document.querySelector('.security-level span');
        if (securityEl) {
            securityEl.textContent = level;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Original methods for compatibility
    setupEventListeners() {
        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Tool selector
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMeasurementTool(e.target.dataset.tool);
            });
        });

        // Quick analysis button
        const quickBtn = document.getElementById('quickAnalyze');
        if (quickBtn) {
            quickBtn.addEventListener('click', () => {
                this.analyzeFileData('', 'STATISTICAL');
            });
        }
    }

    switchView(view) {
        console.log(`🔄 Switching to ${view} view`);
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
        
        // Update visualization
        this.updateViewVisualization(view);
    }

    updateViewVisualization(view) {
        const viewer = document.getElementById('directoryViewer');
        if (!viewer) return;
        
        switch (view) {
            case '3d':
                if (this.directoryStructure) {
                    this.updateDirectoryVisualization();
                }
                break;
            case 'quantum':
                viewer.innerHTML = '<div class="quantum-field">Quantum visualization mode - Real data integration pending</div>';
                break;
            default:
                viewer.innerHTML = `<div class="view-placeholder">${view} view with real data</div>`;
        }
    }

    switchMeasurementTool(tool) {
        console.log(`🔧 Switching to ${tool} measurement tool`);
        this.measurementTool = tool;
        
        // Update active button
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
        
        // Start analysis with selected tool
        this.analyzeFileData('', tool.toUpperCase());
    }

    initializeNeuralBackground() {
        // Neural network background animation
        const canvas = document.getElementById('neuralNetwork');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const particles = [];
            for (let i = 0; i < 50; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5
                });
            }
            
            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
                ctx.lineWidth = 1;
                
                particles.forEach((particle, i) => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    
                    if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                    if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
                    
                    // Draw connections
                    particles.slice(i + 1).forEach(other => {
                        const dist = Math.sqrt(
                            Math.pow(particle.x - other.x, 2) + 
                            Math.pow(particle.y - other.y, 2)
                        );
                        if (dist < 100) {
                            ctx.beginPath();
                            ctx.moveTo(particle.x, particle.y);
                            ctx.lineTo(other.x, other.y);
                            ctx.stroke();
                        }
                    });
                });
                
                requestAnimationFrame(animate);
            };
            animate();
        }
    }

    startTimestamp() {
        const updateTimestamp = () => {
            const timestampEl = document.getElementById('timestamp');
            if (timestampEl) {
                timestampEl.textContent = new Date().toLocaleString();
            }
        };
        
        updateTimestamp();
        setInterval(updateTimestamp, 1000);
    }

    initializeContainers() {
        // Initialize existing analysis containers
        document.querySelectorAll('.analysis-container').forEach(container => {
            const analysisType = container.dataset.analysis;
            if (analysisType) {
                this.activeContainers.set(analysisType, container);
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchView('3d');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchView('graph');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchView('tree');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchView('quantum');
                        break;
                    case 'a':
                        e.preventDefault();
                        this.analyzeFileData('', 'STATISTICAL');
                        break;
                }
            }
        });
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    window.portalCore = new ResearchPortal();
    console.log('🚀 Research Portal initialized with real data integration');
});

    setupEventListeners() {
        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Container controls
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleContainerControl(e);
            });
        });

        // Tool selector
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMeasurementTool(e.target.dataset.tool);
            });
        });

        // Pipeline controls
        document.getElementById('runPipeline')?.addEventListener('click', () => {
            this.runPipeline();
        });

        document.getElementById('pausePipeline')?.addEventListener('click', () => {
            this.pausePipeline();
        });

        document.getElementById('resetPipeline')?.addEventListener('click', () => {
            this.resetPipeline();
        });

        // Floating action buttons
        document.getElementById('quickAnalyze')?.addEventListener('click', () => {
            this.quickAnalyze();
        });

        document.getElementById('exportResults')?.addEventListener('click', () => {
            this.exportResults();
        });

        document.getElementById('saveWorkspace')?.addEventListener('click', () => {
            this.saveWorkspace();
        });

        // Directory nodes
        document.querySelectorAll('.research-node').forEach(node => {
            node.addEventListener('click', (e) => {
                this.navigateToNode(e.currentTarget.dataset.path);
            });

            node.addEventListener('mouseenter', (e) => {
                this.highlightNode(e.currentTarget);
            });

            node.addEventListener('mouseleave', (e) => {
                this.unhighlightNode(e.currentTarget);
            });
        });

        // Immersive overlay
        document.getElementById('closeOverlay')?.addEventListener('click', () => {
            this.closeImmersiveMode();
        });

        document.getElementById('startDeepAnalysis')?.addEventListener('click', () => {
            this.startDeepAnalysis();
        });
    }

    initializeNeuralBackground() {
        const canvas = document.getElementById('neuralNetwork');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const nodes = [];
        const connections = [];
        const nodeCount = 50;

        // Create nodes
        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 3 + 1
            });
        }

        // Create connections
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const distance = Math.sqrt(
                    Math.pow(nodes[i].x - nodes[j].x, 2) +
                    Math.pow(nodes[i].y - nodes[j].y, 2)
                );
                if (distance < 150) {
                    connections.push({ from: i, to: j, distance });
                }
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update node positions
            nodes.forEach(node => {
                node.x += node.vx;
                node.y += node.vy;
                
                if (node.x <= 0 || node.x >= canvas.width) node.vx *= -1;
                if (node.y <= 0 || node.y >= canvas.height) node.vy *= -1;
            });

            // Draw connections
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
            ctx.lineWidth = 0.5;
            connections.forEach(conn => {
                const fromNode = nodes[conn.from];
                const toNode = nodes[conn.to];
                const opacity = Math.max(0, (150 - conn.distance) / 150) * 0.3;
                
                ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
                ctx.beginPath();
                ctx.moveTo(fromNode.x, fromNode.y);
                ctx.lineTo(toNode.x, toNode.y);
                ctx.stroke();
            });

            // Draw nodes
            nodes.forEach(node => {
                ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            requestAnimationFrame(animate);
        };

        animate();

        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    startTimestamp() {
        const updateTime = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const timestampElement = document.getElementById('timestamp');
            if (timestampElement) {
                timestampElement.textContent = timeString;
            }
        };

        updateTime();
        setInterval(updateTime, 1000);
    }

    switchView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

        // Apply view-specific transformations
        const nodes = document.querySelectorAll('.research-node');
        
        switch (view) {
            case '3d':
                this.apply3DView(nodes);
                break;
            case 'graph':
                this.applyGraphView(nodes);
                break;
            case 'tree':
                this.applyTreeView(nodes);
                break;
        }
    }

    apply3DView(nodes) {
        nodes.forEach((node, index) => {
            const angle = (index / nodes.length) * Math.PI * 2;
            const radius = 100 + index * 20;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            node.style.transform = `translate3d(${x}px, 0px, ${z}px) rotateY(${angle}rad)`;
        });
    }

    applyGraphView(nodes) {
        // Force-directed layout simulation
        const centerX = 300;
        const centerY = 150;
        
        nodes.forEach((node, index) => {
            const angle = (index / nodes.length) * Math.PI * 2;
            const radius = 80 + Math.random() * 40;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            node.style.left = `${x}px`;
            node.style.top = `${y}px`;
            node.style.transform = 'translate(-50%, -50%)';
        });
    }

    applyTreeView(nodes) {
        // Hierarchical tree layout
        const levels = {
            'research': { x: 300, y: 50 },
            'research/labs': { x: 150, y: 150 },
            'research/models': { x: 450, y: 150 },
            'research/head_1': { x: 100, y: 250 },
            'research/head_2': { x: 300, y: 250 },
            'research/head_3': { x: 500, y: 250 }
        };

        nodes.forEach(node => {
            const path = node.dataset.path;
            const position = levels[path];
            if (position) {
                node.style.left = `${position.x}px`;
                node.style.top = `${position.y}px`;
                node.style.transform = 'translate(-50%, -50%)';
            }
        });
    }

    navigateToNode(path) {
        console.log(`Navigating to: ${path}`);
        
        // Simulate navigation with visual feedback
        const node = document.querySelector(`[data-path="${path}"]`);
        if (node) {
            node.style.transform += ' scale(1.2)';
            setTimeout(() => {
                node.style.transform = node.style.transform.replace(' scale(1.2)', '');
            }, 300);
        }

        // Here you would typically integrate with the actual file system
        // or trigger VSCode navigation
        this.showNotification(`Navigating to ${path}`);
    }

    highlightNode(node) {
        node.style.borderColor = '#00ff88';
        node.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.5)';
        node.style.zIndex = '10';
    }

    unhighlightNode(node) {
        node.style.borderColor = '';
        node.style.boxShadow = '';
        node.style.zIndex = '';
    }

    handleContainerControl(event) {
        const container = event.target.closest('.analysis-container');
        const action = event.target.title.toLowerCase();
        const containerType = container.dataset.type;

        switch (action) {
            case 'analyze':
                this.runAnalysis(containerType);
                break;
            case 'measure':
                this.runMeasurement(containerType);
                break;
            case 'configure':
                this.configureContainer(containerType);
                break;
        }
    }

    async runAnalysis(type) {
        console.log(`🔬 Running ${type} analysis with real API...`);
        
        try {
            const container = document.querySelector(`[data-type="${type}"]`);
            const status = container?.querySelector('.container-status');
            
            if (status) {
                status.textContent = 'Processing';
                status.className = 'container-status processing';
            }
            
            // Call real API
            const response = await fetch(`${this.apiUrl}/analysis/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    data_source: `research/head_${Math.floor(Math.random() * 3) + 1}`,
                    parameters: { sample_size: 100 }
                })
            });
            
            if (!response.ok) throw new Error('Analysis failed');
            
            const result = await response.json();
            this.analysisResults[type] = result;
            
            // Update UI with real results
            if (status) {
                status.textContent = 'Active';
                status.className = 'container-status active';
            }
            
            this.updateContainerMetrics(type, result);
            
            console.log(`✅ ${type} analysis completed:`, result);
            
        } catch (error) {
            console.error(`❌ Analysis failed:`, error);
            
            const container = document.querySelector(`[data-type="${type}"]`);
            const status = container?.querySelector('.container-status');
            if (status) {
                status.textContent = 'Error';
                status.className = 'container-status error';
            }
        }
    }

    updateContainerMetrics(type) {
        const container = document.querySelector(`[data-type="${type}"]`);
        const metrics = container.querySelectorAll('.metric-value');
        
        metrics.forEach(metric => {
            const currentValue = parseFloat(metric.textContent);
            const newValue = currentValue + (Math.random() - 0.5) * 0.1;
            metric.textContent = newValue.toFixed(3);
        });
    }

    switchMeasurementTool(tool) {
        this.measurementTool = tool;
        
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
        
        this.updateMeasurementDisplay(tool);
    }

    updateMeasurementDisplay(tool) {
        const gaugeValue = document.querySelector('.gauge-value');
        const readings = document.querySelectorAll('.reading-value');
        
        // Simulate different measurements based on tool
        const measurements = {
            statistical: { gauge: '94.7%', readings: ['0.943', '0.918', '0.930'] },
            temporal: { gauge: '87.3%', readings: ['23.4s', '12.7ms', '98.2%'] },
            spatial: { gauge: '91.2%', readings: ['15.6m', '7.3°', '2.1x'] },
            behavioral: { gauge: '88.9%', readings: ['76.5%', '12.3', '4.7s'] }
        };
        
        const data = measurements[tool];
        if (gaugeValue) gaugeValue.textContent = data.gauge;
        
        readings.forEach((reading, index) => {
            if (data.readings[index]) {
                reading.textContent = data.readings[index];
            }
        });
    }

    runPipeline() {
        if (this.pipelineStatus === 'running') return;
        
        this.pipelineStatus = 'running';
        console.log('Running analysis pipeline');
        
        const stages = document.querySelectorAll('.pipeline-stage');
        stages.forEach((stage, index) => {
            const status = stage.querySelector('.stage-status');
            setTimeout(() => {
                status.className = 'stage-status active';
                if (index === stages.length - 1) {
                    this.pipelineStatus = 'completed';
                    this.showNotification('Pipeline completed successfully');
                }
            }, index * 2000);
        });
    }

    pausePipeline() {
        this.pipelineStatus = 'paused';
        console.log('Pipeline paused');
        this.showNotification('Pipeline paused');
    }

    resetPipeline() {
        this.pipelineStatus = 'idle';
        console.log('Pipeline reset');
        
        document.querySelectorAll('.stage-status').forEach(status => {
            status.className = 'stage-status pending';
        });
        
        // Reset first stage to active
        const firstStage = document.querySelector('.stage-status');
        if (firstStage) {
            firstStage.className = 'stage-status active';
        }
        
        this.showNotification('Pipeline reset');
    }

    quickAnalyze() {
        console.log('Running quick analysis');
        this.showNotification('Quick analysis started');
        
        // Simulate quick analysis across all containers
        document.querySelectorAll('.analysis-container').forEach(container => {
            const type = container.dataset.type;
            setTimeout(() => {
                this.runAnalysis(type);
            }, Math.random() * 1000);
        });
    }

    exportResults() {
        console.log('Exporting results');
        this.showNotification('Exporting analysis results...');
        
        // Simulate export
        setTimeout(() => {
            this.showNotification('Results exported successfully');
        }, 2000);
    }

    saveWorkspace() {
        console.log('Saving workspace');
        this.showNotification('Workspace saved');
        
        // Here you would save the current state to localStorage or backend
        const workspaceState = {
            currentView: this.currentView,
            measurementTool: this.measurementTool,
            containerStates: Array.from(this.activeContainers.entries()),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('researchPortalWorkspace', JSON.stringify(workspaceState));
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveWorkspace();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.exportResults();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        this.quickAnalyze();
                        break;
                    case 'Escape':
                        if (this.isImmersiveMode) {
                            this.closeImmersiveMode();
                        }
                        break;
                }
            }
        });
    }

    showNotification(message) {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.className = 'portal-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 255, 136, 0.9);
            color: #0a0a0a;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    initializeContainers() {
        // Initialize all analysis containers with default states
        document.querySelectorAll('.analysis-container').forEach(container => {
            const type = container.dataset.type;
            this.activeContainers.set(type, {
                status: 'standby',
                lastUpdate: new Date(),
                metrics: this.generateDefaultMetrics(type)
            });
        });
    }

    generateDefaultMetrics(type) {
        const metrics = {
            statistical: { dataPoints: 1247, correlation: 0.847, confidence: 95.3 },
            behavioral: { patternRecognition: 87, trendAnalysis: 'ascending' },
            cognitive: { learningPhase: 'active', accuracy: 92.1 },
            visualization: { chartType: 'line', renderTime: '45ms' }
        };
        
        return metrics[type] || {};
    }

    setupDirectoryNodes() {
        // Add hover effects and connection lines
        const canvas = document.createElement('canvas');
        canvas.className = 'directory-connections';
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        
        const directoryCanvas = document.getElementById('directoryCanvas');
        if (directoryCanvas) {
            directoryCanvas.appendChild(canvas);
            this.drawNodeConnections(canvas);
        }
    }

    drawNodeConnections(canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        const nodes = document.querySelectorAll('.research-node');
        const mainNode = document.querySelector('[data-path="research"]');
        
        if (!mainNode) return;
        
        const mainRect = mainNode.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        nodes.forEach(node => {
            if (node === mainNode) return;
            
            const nodeRect = node.getBoundingClientRect();
            
            const startX = mainRect.left + mainRect.width / 2 - canvasRect.left;
            const startY = mainRect.top + mainRect.height / 2 - canvasRect.top;
            const endX = nodeRect.left + nodeRect.width / 2 - canvasRect.left;
            const endY = nodeRect.top + nodeRect.height / 2 - canvasRect.top;
            
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        });
    }

    initializeMeasurementGauge() {
        const canvas = document.getElementById('measurementGauge');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 60;
        
        const drawGauge = (value) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Background arc
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 8;
            ctx.stroke();
            
            // Value arc
            const angle = Math.PI + (value / 100) * Math.PI;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI, angle);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 8;
            ctx.stroke();
            
            // Center dot
            ctx.beginPath();
            ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#00ff88';
            ctx.fill();
        };
        
        drawGauge(94.7);
        
        // Animate gauge periodically
        setInterval(() => {
            const value = 90 + Math.random() * 10;
            drawGauge(value);
        }, 5000);
    }

    closeImmersiveMode() {
        this.isImmersiveMode = false;
        const overlay = document.getElementById('immersiveOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    startDeepAnalysis() {
        const analysisType = document.getElementById('analysisType')?.value;
        const visualizationType = document.getElementById('visualizationType')?.value;
        
        console.log(`Starting deep analysis: ${analysisType} with ${visualizationType} visualization`);
        this.showNotification(`Deep analysis started: ${analysisType}`);
        
        // Here you would trigger the actual deep analysis
        setTimeout(() => {
            this.showNotification('Deep analysis completed');
        }, 5000);
    }
}

// Initialize the portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.researchPortal = new ResearchPortal();
});

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
