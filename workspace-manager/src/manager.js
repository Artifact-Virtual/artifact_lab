// Main Manager - Orchestrates all components with redundancy
// Ensures watcher, indexer, monitor, and visualizer are always running

import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

import { AdvancedWatcher } from './watcher.js';
import { DependencyIndexer } from './indexer.js';
import { SystemMonitor } from './monitor.js';
import { TopologyVisualizer } from './visualizer.js';
import { LLMProvider } from '../language_model_abstraction/llm_provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkspaceManager {
    constructor(config) {
        this.config = config;
        this.isRunning = false;
        this.components = new Map();
        this.healthChecks = new Map();
        this.restartCounts = new Map();
        this.maxRestarts = 5;
        
        // Initialize logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                }),
                new winston.transports.File({ filename: 'workspace-manager.log' })
            ]
        });
        
        // Initialize LLM provider
        this.llmProvider = new LLMProvider(config);
        
        // Banner path
        this.bannerPath = path.join(__dirname, '..', 'assets', 'banner.txt');
        
        // Initialize components
        this.initializeComponents();
    }
    
    /**
     * Display the operational banner when system is fully loaded
     */
    async displayOperationalBanner() {
        try {
            // Wait a moment for all components to fully initialize
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            try {
                if (await fs.pathExists(this.bannerPath)) {
                    const banner = await fs.readFile(this.bannerPath, 'utf8');
                    console.log('\n' + banner);
                    console.log('\n■ WORKSPACE MANAGER - FULLY OPERATIONAL ■');
                    console.log('════════════════════════════════════════════════════════════════════════════════');
                    console.log('▣ DevCore Workspace Management System v2.0');
                    console.log('▣ All Components Initialized and Running');
                    console.log('▣ System Ready for Operations');
                    console.log(`▣ Dashboard: http://localhost:${this.port}`);
                    console.log(`▣ Topology: http://localhost:${this.port}/topology`);
                    console.log('════════════════════════════════════════════════════════════════════════════════\n');
                } else {
                    console.log('\n■ WORKSPACE MANAGER - FULLY OPERATIONAL ■');
                    console.log('════════════════════════════════════════════════════════════════════════════════');
                    console.log('▣ DevCore Workspace Management System v2.0 - Ready for Operations');
                    console.log('════════════════════════════════════════════════════════════════════════════════\n');
                }
            } catch (error) {
                console.log('◐ Banner display unavailable:', error.message);
            }
        } catch (error) {
            this.logger.warn('◐ Could not display operational banner:', error.message);
        }
    }

    initializeComponents() {
        // Initialize core components
        this.watcher = new AdvancedWatcher(this.config);
        this.indexer = new DependencyIndexer(this.config, this.llmProvider);
        this.monitor = new SystemMonitor(this.config);
        this.visualizer = new TopologyVisualizer(this.config, this.indexer);
        
        // Register components
        this.components.set('watcher', this.watcher);
        this.components.set('indexer', this.indexer);
        this.components.set('monitor', this.monitor);
        this.components.set('visualizer', this.visualizer);
        
        // Setup component event handlers
        this.setupComponentHandlers();
        
        this.logger.info('▣ Components initialized');
    }

    setupComponentHandlers() {
        // Watcher events
        this.watcher.on('fileChanged', async (event) => {
            this.logger.info(`▢ File changed: ${event.path}`);
            
            // Update indexer
            await this.indexer.updateFile(event.fullPath);
            
            // Update visualizer
            this.visualizer.updateFromIndexer();
            
            // Broadcast update
            this.broadcastUpdate('fileChanged', event);
        });

        this.watcher.on('fileAdded', async (event) => {
            this.logger.info(`▢ File added: ${event.path}`);
            
            // Update indexer
            await this.indexer.updateFile(event.fullPath);
            
            // Update visualizer
            this.visualizer.updateFromIndexer();
            
            // Update monitor workspace metrics
            const stats = this.watcher.getStats();
            this.monitor.setWorkspaceMetrics({
                files: stats.filesWatched,
                changes: stats.changesDetected
            });
            
            // Broadcast update
            this.broadcastUpdate('fileAdded', event);
        });

        this.watcher.on('error', (error) => {
            this.logger.error('🚨 Watcher error:', error);
            this.handleComponentError('watcher', error);
        });

        // Indexer events
        this.indexer.on('analysisComplete', (report) => {
            this.logger.info('▢ Analysis complete:', report.summary);
            this.broadcastUpdate('analysisComplete', report);
        });

        this.indexer.on('fileAnalyzed', (analysis) => {
            this.broadcastUpdate('fileAnalyzed', analysis);
        });

        // Monitor events
        this.monitor.on('metricsUpdate', (metrics) => {
            this.broadcastUpdate('metricsUpdate', metrics);
        });

        // Visualizer events
        this.visualizer.on('topologyGenerated', (visualization) => {
            this.logger.info('◇ Topology generated');
            this.broadcastUpdate('topologyGenerated', visualization);
        });
    }

    setupWebServer() {
        this.app = express();
        
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://d3js.org", "https://cdn.tailwindcss.com"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    connectSrc: ["'self'", "ws:", "wss:"]
                }
            }
        }));
        
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static(path.join(__dirname, '..', 'public')));
        
        // API routes
        this.setupAPIRoutes();
        
        this.port = this.config.workspace_port || 8081;
    }

    setupAPIRoutes() {
        // Status endpoint
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'running',
                uptime: process.uptime(),
                components: this.getComponentStatus(),
                config: {
                    provider: this.config.model_provider,
                    port: this.port
                }
            });
        });

        // System metrics
        this.app.get('/api/metrics', (req, res) => {
            res.json(this.monitor.getMetrics());
        });

        // File analysis
        this.app.get('/api/analysis', (req, res) => {
            res.json(this.indexer.getAnalysisReport());
        });

        // Topology data
        this.app.get('/api/topology', (req, res) => {
            res.json(this.visualizer.getVisualizationData());
        });

        // Topology visualization page
        this.app.get('/topology', async (req, res) => {
            try {
                const html = await this.visualizer.generateHTML();
                res.send(html);
            } catch (error) {
                this.logger.error('Error generating topology page:', error);
                res.status(500).json({ error: 'Failed to generate topology page' });
            }
        });

        // File operations
        this.app.get('/api/files/:path(*)', async (req, res) => {
            try {
                const filePath = path.join(this.rootPath, req.params.path);
                const content = await fs.readFile(filePath, 'utf8');
                res.json({ path: req.params.path, content });
            } catch (error) {
                res.status(404).json({ error: 'File not found' });
            }
        });

        // LLM query endpoint
        this.app.post('/api/query', async (req, res) => {
            try {
                const { prompt, options } = req.body;
                const response = await this.llmProvider.query(prompt, options);
                res.json({ response });
            } catch (error) {
                this.logger.error('LLM query error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Configuration endpoints
        this.app.get('/api/config', (req, res) => {
            res.json(this.config);
        });

        this.app.post('/api/config', async (req, res) => {
            try {
                Object.assign(this.config, req.body);
                await this.llmProvider.saveConfig();
                res.json({ success: true, config: this.config });
            } catch (error) {
                this.logger.error('Config update error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Component control
        this.app.post('/api/components/:component/restart', async (req, res) => {
            try {
                await this.restartComponent(req.params.component);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupWebSocket() {
        this.server = this.app.listen(this.port, () => {
            this.logger.info(`▶ Workspace Manager server running on port ${this.port}`);
            // Display banner when system is fully operational
            this.displayOperationalBanner();
        });

        this.wss = new WebSocketServer({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            this.logger.info('× WebSocket client connected');
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'initialState',
                data: {
                    status: this.getComponentStatus(),
                    metrics: this.monitor.getMetrics(),
                    topology: this.visualizer.getVisualizationData()
                }
            }));
            
            ws.on('close', () => {
                this.logger.info('× WebSocket client disconnected');
            });
            
            ws.on('error', (error) => {
                this.logger.error('WebSocket error:', error);
            });
        });
    }

    setupHealthMonitoring() {
        // Health check interval
        setInterval(() => {
            this.performHealthChecks();
        }, 10000); // Check every 10 seconds
        
        // Comprehensive health check every minute
        setInterval(() => {
            this.performComprehensiveHealthCheck();
        }, 60000);
    }

    async performHealthChecks() {
        for (const [name, component] of this.components) {
            try {
                const isHealthy = await this.checkComponentHealth(name, component);
                this.healthChecks.set(name, {
                    healthy: isHealthy,
                    lastCheck: new Date(),
                    consecutiveFailures: isHealthy ? 0 : (this.healthChecks.get(name)?.consecutiveFailures || 0) + 1
                });
                
                // Auto-restart if unhealthy
                const health = this.healthChecks.get(name);
                if (!isHealthy && health.consecutiveFailures >= 3) {
                    this.logger.warn(`○ Auto-restarting unhealthy component: ${name}`);
                    await this.restartComponent(name);
                }
                
            } catch (error) {
                this.logger.error(`Health check failed for ${name}:`, error);
            }
        }
    }

    async checkComponentHealth(name, component) {
        switch (name) {
            case 'watcher':
                return component.isRunning && component.getStats().filesWatched > 0;
            case 'indexer':
                return component.isRunning && component.fileAnalysis.size > 0;
            case 'monitor':
                return component.isRunning && component.metrics.cpu.usage >= 0;
            case 'visualizer':
                return component.isRunning;
            default:
                return true;
        }
    }

    async performComprehensiveHealthCheck() {
        const report = {
            timestamp: new Date(),
            overall: 'healthy',
            components: {},
            alerts: [],
            recommendations: []
        };
        
        // Check each component
        for (const [name, component] of this.components) {
            const health = this.healthChecks.get(name);
            const stats = component.getStats ? component.getStats() : {};
            
            report.components[name] = {
                healthy: health?.healthy || false,
                uptime: stats.uptime || 0,
                lastActivity: stats.lastActivity,
                restartCount: this.restartCounts.get(name) || 0
            };
            
            if (!health?.healthy) {
                report.overall = 'degraded';
                report.alerts.push(`Component ${name} is unhealthy`);
            }
        }
        
        // System resource checks
        const metrics = this.monitor.getMetrics();
        const alerts = this.monitor.checkAlerts();
        
        if (alerts.length > 0) {
            report.overall = 'warning';
            report.alerts.push(...alerts.map(a => a.message));
        }
        
        // Generate recommendations
        if (metrics.current.cpu.usage > 80) {
            report.recommendations.push('Consider reducing monitoring frequency or optimizing file processing');
        }
        
        if (metrics.current.memory.usage > 85) {
            report.recommendations.push('Memory usage is high, consider restarting components or reducing file analysis batch size');
        }
        
        this.logger.info('▢ Health check complete:', report);
        this.broadcastUpdate('healthCheck', report);
    }

    async start(rootPath) {
        if (this.isRunning) {
            this.logger.warn('Manager already running');
            return;
        }

        this.rootPath = path.resolve(rootPath);
        this.isRunning = true;
        
        this.logger.info(`▶ Starting Workspace Manager for: ${this.rootPath}`);
        
        try {
            // Setup Express and WebSocket
            this.setupWebServer();
            this.setupWebSocket();
            
            // Start all components
            await this.startAllComponents();
            
            this.logger.info('▣ Workspace Manager started successfully');
            this.logger.info(`○ Web interface available at: http://localhost:${this.port}`);
            this.logger.info(`◇ Topology viewer available at: http://localhost:${this.port}/topology`);
            
        } catch (error) {
            this.logger.error('× Failed to start Workspace Manager:', error);
            throw error;
        }
    }

    async startAllComponents() {
        const startPromises = [];
        
        // Start monitor first (no dependencies)
        startPromises.push(this.startComponent('monitor'));
        
        // Start watcher
        startPromises.push(this.startComponent('watcher'));
        
        // Wait for watcher to start before starting indexer
        await this.startComponent('watcher');
        await this.startComponent('indexer');
        
        // Start visualizer after indexer
        await this.startComponent('visualizer');
        
        this.logger.info('▣ All components started');
    }

    async startComponent(name) {
        try {
            const component = this.components.get(name);
            if (!component) {
                throw new Error(`Component ${name} not found`);
            }
            
            this.logger.info(`○ Starting component: ${name}`);
            
            if (name === 'watcher' || name === 'indexer') {
                await component.start(this.rootPath);
            } else {
                await component.start();
            }
            
            this.logger.info(`▣ Component started: ${name}`);
            
        } catch (error) {
            this.logger.error(`× Failed to start component ${name}:`, error);
            throw error;
        }
    }

    async restartComponent(name) {
        const restartCount = this.restartCounts.get(name) || 0;
        
        if (restartCount >= this.maxRestarts) {
            this.logger.error(`× Max restarts reached for component: ${name}`);
            return;
        }
        
        try {
            this.logger.info(`○ Restarting component: ${name}`);
            
            const component = this.components.get(name);
            if (component && component.stop) {
                await component.stop();
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
            
            await this.startComponent(name);
            
            this.restartCounts.set(name, restartCount + 1);
            this.logger.info(`▣ Component restarted: ${name}`);
            
        } catch (error) {
            this.logger.error(`× Failed to restart component ${name}:`, error);
            this.restartCounts.set(name, restartCount + 1);
        }
    }

    handleComponentError(componentName, error) {
        this.logger.error(`🚨 Component error (${componentName}):`, error);
        
        // Attempt automatic recovery
        setTimeout(async () => {
            await this.restartComponent(componentName);
        }, 5000);
    }

    broadcastUpdate(type, data) {
        const message = JSON.stringify({ type, data, timestamp: new Date() });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(message);
            }
        });
    }

    getComponentStatus() {
        const status = {};
        
        for (const [name, component] of this.components) {
            const health = this.healthChecks.get(name);
            const stats = component.getStats ? component.getStats() : {};
            
            status[name] = {
                running: component.isRunning || false,
                healthy: health?.healthy || false,
                lastCheck: health?.lastCheck,
                stats,
                restarts: this.restartCounts.get(name) || 0
            };
        }
        
        return status;
    }

    async generateReport() {
        const report = {
            timestamp: new Date(),
            workspace: this.rootPath,
            uptime: process.uptime(),
            components: this.getComponentStatus(),
            analysis: this.indexer.getAnalysisReport(),
            metrics: this.monitor.getMetrics(),
            topology: this.visualizer.getStats()
        };
        
        // Generate AI-powered summary
        try {
            const prompt = `Generate a comprehensive workspace analysis report based on this data:
            
${JSON.stringify(report, null, 2)}

Please provide a summary in the format:
"Deep Analysis of Workspace
Project Structure Overview
Critical Issues Identified
File-by-File Analysis
Dependencies
Configuration & Testing
Integration Points
Recommendations"`;

            const aiSummary = await this.llmProvider.query(prompt);
            report.aiSummary = aiSummary;
            
        } catch (error) {
            this.logger.error('Failed to generate AI summary:', error);
        }
        
        return report;
    }

    async stop() {
        if (!this.isRunning) return;
        
        this.logger.info('■ Stopping Workspace Manager...');
        
        // Stop all components
        for (const [name, component] of this.components) {
            try {
                if (component.stop) {
                    await component.stop();
                }
                this.logger.info(`▣ Stopped component: ${name}`);
            } catch (error) {
                this.logger.error(`× Error stopping component ${name}:`, error);
            }
        }
        
        // Close server
        if (this.server) {
            this.server.close();
        }
        
        this.isRunning = false;
        this.logger.info('▣ Workspace Manager stopped');
    }
}

export { WorkspaceManager };
