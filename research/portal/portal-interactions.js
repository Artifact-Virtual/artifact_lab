/**
 * Advanced Interactions Engine for Research Lab Portal
 * Handles user interactions, gesture controls, and immersive experiences
 */

class PortalInteractions {
    constructor() {
        this.activeAnalysis = null;
        this.dragState = null;
        this.gestureRecognizer = null;
        this.voiceCommands = null;
        this.contextMenus = {};
        this.shortcuts = {};
        
        this.initializeInteractionSystems();
    }

    initializeInteractionSystems() {
        console.log('🎮 Initializing Advanced Interaction Engine...');
        this.setupBasicInteractions();
        this.setupGestureRecognition();
        this.setupVoiceCommands();
        this.setupKeyboardShortcuts();
        this.setupContextMenus();
        this.setupDragAndDrop();
        this.setupTouchInteractions();
    }

    // Basic Click and Hover Interactions
    setupBasicInteractions() {
        // View control buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleViewChange(e.target.dataset.view);
            });
        });

        // Analysis tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleToolActivation(e.target.dataset.tool);
            });
        });

        // Floating action buttons
        document.getElementById('quickAnalyze')?.addEventListener('click', () => {
            this.triggerQuickAnalysis();
        });

        document.getElementById('exportResults')?.addEventListener('click', () => {
            this.exportCurrentResults();
        });

        document.getElementById('saveWorkspace')?.addEventListener('click', () => {
            this.saveWorkspaceState();
        });

        // Immersive overlay controls
        document.getElementById('closeOverlay')?.addEventListener('click', () => {
            this.closeImmersiveMode();
        });

        document.getElementById('startDeepAnalysis')?.addEventListener('click', () => {
            this.startDeepAnalysisMode();
        });

        // Analysis container interactions
        this.setupAnalysisContainerInteractions();
    }

    setupAnalysisContainerInteractions() {
        document.querySelectorAll('.analysis-container').forEach(container => {
            // Hover effects for containers
            container.addEventListener('mouseenter', (e) => {
                this.highlightContainer(e.target);
            });

            container.addEventListener('mouseleave', (e) => {
                this.unhighlightContainer(e.target);
            });

            // Double-click to enter immersive mode
            container.addEventListener('dblclick', (e) => {
                this.enterImmersiveAnalysis(e.target);
            });

            // Right-click context menu
            container.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContainerContextMenu(e.target, e.clientX, e.clientY);
            });
        });
    }

    handleViewChange(viewType) {
        console.log(`🔄 Switching to ${viewType} view`);
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewType}"]`).classList.add('active');

        // Switch visualization mode
        switch (viewType) {
            case '3d':
                this.activate3DView();
                break;
            case 'graph':
                this.activateGraphView();
                break;
            case 'tree':
                this.activateTreeView();
                break;
            case 'quantum':
                this.activateQuantumView();
                break;
        }
    }

    activate3DView() {
        const container = document.getElementById('directoryViewer');
        if (container && window.portalVisualization) {
            container.innerHTML = '';
            window.portalVisualization.createDirectoryVisualization(container);
        }
    }

    activateGraphView() {
        const container = document.getElementById('directoryViewer');
        if (container && window.portalVisualization) {
            container.innerHTML = '<div id="networkVisualization"></div>';
            window.portalVisualization.createNetworkGraph();
        }
    }

    activateTreeView() {
        const container = document.getElementById('directoryViewer');
        if (container) {
            container.innerHTML = this.generateTreeHTML();
        }
    }

    activateQuantumView() {
        const container = document.getElementById('directoryViewer');
        if (container && window.portalVisualization) {
            container.innerHTML = '';
            window.portalVisualization.createQuantumField(container);
        }
    }

    generateTreeHTML() {
        return `
            <div class="tree-visualization">
                <div class="tree-node root" data-path="research">
                    <i class="fas fa-folder-open"></i> research
                    <div class="tree-children">
                        <div class="tree-node" data-path="research/labs">
                            <i class="fas fa-flask"></i> labs
                        </div>
                        <div class="tree-node" data-path="research/head_1">
                            <i class="fas fa-brain"></i> head_1
                        </div>
                        <div class="tree-node" data-path="research/head_2">
                            <i class="fas fa-eye"></i> head_2
                        </div>
                        <div class="tree-node" data-path="research/head_3">
                            <i class="fas fa-cog"></i> head_3
                        </div>
                        <div class="tree-node" data-path="research/models">
                            <i class="fas fa-cube"></i> models
                        </div>
                        <div class="tree-node" data-path="research/journal">
                            <i class="fas fa-book"></i> journal
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    handleToolActivation(toolType) {
        console.log(`🔧 Activating ${toolType} analysis tool`);
        
        // Update active tool button
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${toolType}"]`).classList.add('active');

        // Activate analysis mode
        this.activeAnalysis = toolType;
        this.updateAnalysisDisplay(toolType);
    }

    updateAnalysisDisplay(toolType) {
        const containers = document.querySelectorAll('.analysis-container');
        containers.forEach(container => {
            container.classList.remove('active-analysis');
            if (container.dataset.analysis === toolType) {
                container.classList.add('active-analysis');
                this.animateContainerActivation(container);
            }
        });
    }

    animateContainerActivation(container) {
        container.style.transform = 'scale(1.02)';
        container.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.3)';
        
        setTimeout(() => {
            container.style.transform = 'scale(1)';
        }, 300);
    }

    // Gesture Recognition
    setupGestureRecognition() {
        this.gestureRecognizer = {
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            minSwipeDistance: 50
        };

        document.addEventListener('touchstart', (e) => {
            this.gestureRecognizer.startX = e.touches[0].clientX;
            this.gestureRecognizer.startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            this.gestureRecognizer.endX = e.changedTouches[0].clientX;
            this.gestureRecognizer.endY = e.changedTouches[0].clientY;
            this.processGesture();
        });
    }

    processGesture() {
        const deltaX = this.gestureRecognizer.endX - this.gestureRecognizer.startX;
        const deltaY = this.gestureRecognizer.endY - this.gestureRecognizer.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < this.gestureRecognizer.minSwipeDistance) return;

        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

        if (angle > -45 && angle < 45) {
            this.handleSwipeRight();
        } else if (angle > 45 && angle < 135) {
            this.handleSwipeDown();
        } else if (angle > 135 || angle < -135) {
            this.handleSwipeLeft();
        } else {
            this.handleSwipeUp();
        }
    }

    handleSwipeRight() {
        console.log('👆 Swipe Right: Next analysis');
        this.cycleAnalysisTools(1);
    }

    handleSwipeLeft() {
        console.log('👆 Swipe Left: Previous analysis');
        this.cycleAnalysisTools(-1);
    }

    handleSwipeUp() {
        console.log('👆 Swipe Up: Enter immersive mode');
        this.enterImmersiveMode();
    }

    handleSwipeDown() {
        console.log('👆 Swipe Down: Exit immersive mode');
        this.closeImmersiveMode();
    }

    // Voice Commands
    setupVoiceCommands() {
        if ('webkitSpeechRecognition' in window) {
            this.voiceCommands = new webkitSpeechRecognition();
            this.voiceCommands.continuous = true;
            this.voiceCommands.interimResults = false;
            this.voiceCommands.lang = 'en-US';

            this.voiceCommands.onresult = (event) => {
                const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
                this.processVoiceCommand(command);
            };

            // Voice activation hotkey
            document.addEventListener('keydown', (e) => {
                if (e.key === 'v' && e.ctrlKey && e.shiftKey) {
                    this.toggleVoiceRecognition();
                }
            });
        }
    }

    processVoiceCommand(command) {
        console.log(`🎤 Voice command: ${command}`);

        const commands = {
            'start analysis': () => this.triggerQuickAnalysis(),
            'deep mode': () => this.enterImmersiveMode(),
            'close analysis': () => this.closeImmersiveMode(),
            'save workspace': () => this.saveWorkspaceState(),
            'export results': () => this.exportCurrentResults(),
            'switch to 3d': () => this.handleViewChange('3d'),
            'switch to graph': () => this.handleViewChange('graph'),
            'switch to quantum': () => this.handleViewChange('quantum'),
            'statistical analysis': () => this.handleToolActivation('statistical'),
            'behavioral analysis': () => this.handleToolActivation('behavioral'),
            'temporal analysis': () => this.handleToolActivation('temporal')
        };

        Object.keys(commands).forEach(key => {
            if (command.includes(key)) {
                commands[key]();
            }
        });
    }

    toggleVoiceRecognition() {
        if (this.voiceCommands) {
            if (this.voiceCommands.isListening) {
                this.voiceCommands.stop();
                console.log('🎤 Voice recognition stopped');
            } else {
                this.voiceCommands.start();
                console.log('🎤 Voice recognition started');
            }
        }
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        this.shortcuts = {
            'ctrl+1': () => this.handleViewChange('3d'),
            'ctrl+2': () => this.handleViewChange('graph'),
            'ctrl+3': () => this.handleViewChange('tree'),
            'ctrl+4': () => this.handleViewChange('quantum'),
            'ctrl+a': () => this.triggerQuickAnalysis(),
            'ctrl+i': () => this.enterImmersiveMode(),
            'escape': () => this.closeImmersiveMode(),
            'ctrl+s': () => this.saveWorkspaceState(),
            'ctrl+e': () => this.exportCurrentResults(),
            'f1': () => this.handleToolActivation('statistical'),
            'f2': () => this.handleToolActivation('behavioral'),
            'f3': () => this.handleToolActivation('temporal'),
            'f4': () => this.handleToolActivation('spatial')
        };

        document.addEventListener('keydown', (e) => {
            const shortcut = this.getShortcutString(e);
            if (this.shortcuts[shortcut]) {
                e.preventDefault();
                this.shortcuts[shortcut]();
            }
        });
    }

    getShortcutString(event) {
        let shortcut = '';
        if (event.ctrlKey) shortcut += 'ctrl+';
        if (event.shiftKey) shortcut += 'shift+';
        if (event.altKey) shortcut += 'alt+';
        shortcut += event.key.toLowerCase();
        return shortcut;
    }

    // Context Menus
    setupContextMenus() {
        document.addEventListener('click', () => {
            this.hideAllContextMenus();
        });
    }

    showContainerContextMenu(container, x, y) {
        const menuId = 'container-context-menu';
        this.hideAllContextMenus();

        const menu = document.createElement('div');
        menu.id = menuId;
        menu.className = 'context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        menu.innerHTML = `
            <div class="context-menu-item" data-action="analyze">
                <i class="fas fa-microscope"></i> Deep Analysis
            </div>
            <div class="context-menu-item" data-action="export">
                <i class="fas fa-download"></i> Export Data
            </div>
            <div class="context-menu-item" data-action="share">
                <i class="fas fa-share"></i> Share Results
            </div>
            <div class="context-menu-item" data-action="duplicate">
                <i class="fas fa-copy"></i> Duplicate Container
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-item" data-action="settings">
                <i class="fas fa-cog"></i> Container Settings
            </div>
        `;

        document.body.appendChild(menu);

        menu.addEventListener('click', (e) => {
            const action = e.target.closest('.context-menu-item')?.dataset.action;
            if (action) {
                this.handleContextMenuAction(action, container);
            }
        });
    }

    handleContextMenuAction(action, container) {
        console.log(`📋 Context menu action: ${action}`);
        
        switch (action) {
            case 'analyze':
                this.enterImmersiveAnalysis(container);
                break;
            case 'export':
                this.exportContainerData(container);
                break;
            case 'share':
                this.shareContainerResults(container);
                break;
            case 'duplicate':
                this.duplicateContainer(container);
                break;
            case 'settings':
                this.showContainerSettings(container);
                break;
        }
        
        this.hideAllContextMenus();
    }

    hideAllContextMenus() {
        document.querySelectorAll('.context-menu').forEach(menu => {
            menu.remove();
        });
    }

    // Advanced Actions
    triggerQuickAnalysis() {
        console.log('⚡ Triggering quick analysis...');
        
        // Show loading state
        this.showAnalysisLoading();
        
        // Simulate analysis process
        setTimeout(() => {
            this.hideAnalysisLoading();
            this.showAnalysisResults();
        }, 2000);
    }

    enterImmersiveMode() {
        console.log('🌊 Entering immersive analysis mode...');
        document.getElementById('immersiveOverlay').classList.add('active');
        document.body.classList.add('immersive-mode');
    }

    closeImmersiveMode() {
        console.log('🌊 Exiting immersive analysis mode...');
        document.getElementById('immersiveOverlay').classList.remove('active');
        document.body.classList.remove('immersive-mode');
    }

    startDeepAnalysisMode() {
        const analysisType = document.getElementById('analysisType').value;
        const visualizationType = document.getElementById('visualizationType').value;
        
        console.log(`🔬 Starting deep analysis: ${analysisType} with ${visualizationType} visualization`);
        
        // Initialize deep analysis visualization
        this.initializeDeepAnalysis(analysisType, visualizationType);
    }

    initializeDeepAnalysis(analysisType, visualizationType) {
        const canvas = document.getElementById('deepAnalysisCanvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw analysis visualization based on type
        switch (visualizationType) {
            case '3d':
                this.draw3DAnalysis(ctx, analysisType);
                break;
            case 'network':
                this.drawNetworkAnalysis(ctx, analysisType);
                break;
            case 'timeline':
                this.drawTimelineAnalysis(ctx, analysisType);
                break;
            case 'heatmap':
                this.drawHeatmapAnalysis(ctx, analysisType);
                break;
        }
    }

    draw3DAnalysis(ctx, type) {
        // Simulate 3D data visualization
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        
        for (let i = 0; i < 100; i++) {
            const angle = (i / 100) * Math.PI * 2;
            const radius = 50 + Math.sin(angle * 3) * 30;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${i * 3.6}, 70%, 60%)`;
            ctx.fill();
        }
    }

    saveWorkspaceState() {
        console.log('💾 Saving workspace state...');
        
        const state = {
            timestamp: Date.now(),
            activeView: document.querySelector('.view-btn.active').dataset.view,
            activeTool: document.querySelector('.tool-btn.active')?.dataset.tool,
            analysisResults: this.activeAnalysis,
            containerStates: Array.from(document.querySelectorAll('.analysis-container')).map(container => ({
                id: container.id,
                active: container.classList.contains('active-analysis'),
                position: {
                    x: container.offsetLeft,
                    y: container.offsetTop
                }
            }))
        };
        
        localStorage.setItem('portalWorkspaceState', JSON.stringify(state));
        this.showNotification('Workspace saved successfully', 'success');
    }

    exportCurrentResults() {
        console.log('📤 Exporting current results...');
        
        const data = {
            timestamp: new Date().toISOString(),
            analysisType: this.activeAnalysis,
            results: this.gatherAnalysisResults(),
            visualizations: this.gatherVisualizationData()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `research-analysis-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Results exported successfully', 'success');
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
        }, 3000);
    }

    // Utility methods
    highlightContainer(container) {
        container.style.borderColor = '#00ff88';
        container.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.2)';
    }

    unhighlightContainer(container) {
        container.style.borderColor = '';
        container.style.boxShadow = '';
    }

    cycleAnalysisTools(direction) {
        const tools = ['statistical', 'behavioral', 'temporal', 'spatial'];
        const currentIndex = tools.indexOf(this.activeAnalysis || 'statistical');
        const newIndex = (currentIndex + direction + tools.length) % tools.length;
        this.handleToolActivation(tools[newIndex]);
    }

    gatherAnalysisResults() {
        // Simulate gathering analysis results
        return {
            accuracy: 0.94,
            precision: 0.91,
            recall: 0.89,
            f1Score: 0.90
        };
    }

    gatherVisualizationData() {
        // Simulate gathering visualization data
        return {
            chartType: 'neural_network',
            dataPoints: 150,
            dimensions: 3
        };
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.portalInteractions = new PortalInteractions();
});
