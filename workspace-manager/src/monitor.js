// Advanced System Monitoring
// Real-time system stats and performance metrics

import si from 'systeminformation';
import { EventEmitter } from 'events';
import fs from 'fs-extra';
import path from 'path';

class SystemMonitor extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.isRunning = false;
        this.monitoringInterval = null;
        this.refreshRate = config.visualization?.refresh_rate || 1000;
        
        this.metrics = {
            cpu: { usage: 0, cores: 0, speed: 0 },
            memory: { total: 0, used: 0, free: 0, usage: 0 },
            disk: { total: 0, used: 0, free: 0, usage: 0 },
            network: { rx: 0, tx: 0 },
            process: { pid: process.pid, uptime: 0, memory: 0, cpu: 0 },
            system: { platform: process.platform, arch: process.arch, uptime: 0 },
            workspace: { files: 0, size: 0, changes: 0 }
        };
        
        this.history = {
            cpu: [],
            memory: [],
            network: [],
            maxHistory: 60 // Keep 60 data points
        };
    }

    async start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('📊 Starting system monitoring...');
        
        // Initial metrics gathering
        await this.gatherMetrics();
        
        // Start monitoring loop
        this.monitoringInterval = setInterval(async () => {
            await this.gatherMetrics();
            this.emit('metricsUpdate', this.metrics);
        }, this.refreshRate);
        
        this.emit('started');
        console.log('✅ System monitoring started');
    }

    async gatherMetrics() {
        try {
            // Gather all metrics in parallel
            const [
                cpu,
                memory,
                disk,
                network,
                processes,
                osInfo
            ] = await Promise.all([
                si.currentLoad(),
                si.mem(),
                si.fsSize(),
                si.networkStats(),
                si.processes(),
                si.osInfo()
            ]);

            // Update CPU metrics
            this.metrics.cpu = {
                usage: Math.round(cpu.currentLoad * 100) / 100,
                cores: cpu.cpus?.length || 0,
                speed: cpu.avgLoad || 0,
                user: Math.round(cpu.currentLoadUser * 100) / 100,
                system: Math.round(cpu.currentLoadSystem * 100) / 100,
                idle: Math.round(cpu.currentLoadIdle * 100) / 100
            };

            // Update Memory metrics
            this.metrics.memory = {
                total: Math.round(memory.total / 1024 / 1024 / 1024 * 100) / 100,
                used: Math.round(memory.used / 1024 / 1024 / 1024 * 100) / 100,
                free: Math.round(memory.free / 1024 / 1024 / 1024 * 100) / 100,
                usage: Math.round(memory.used / memory.total * 100 * 100) / 100,
                available: Math.round(memory.available / 1024 / 1024 / 1024 * 100) / 100
            };

            // Update Disk metrics (first disk)
            if (disk && disk.length > 0) {
                const mainDisk = disk[0];
                this.metrics.disk = {
                    total: Math.round(mainDisk.size / 1024 / 1024 / 1024 * 100) / 100,
                    used: Math.round(mainDisk.used / 1024 / 1024 / 1024 * 100) / 100,
                    free: Math.round((mainDisk.size - mainDisk.used) / 1024 / 1024 / 1024 * 100) / 100,
                    usage: Math.round(mainDisk.used / mainDisk.size * 100 * 100) / 100,
                    filesystem: mainDisk.fs,
                    mount: mainDisk.mount
                };
            }

            // Update Network metrics
            if (network && network.length > 0) {
                const totalRx = network.reduce((sum, iface) => sum + (iface.rx_bytes || 0), 0);
                const totalTx = network.reduce((sum, iface) => sum + (iface.tx_bytes || 0), 0);
                
                this.metrics.network = {
                    rx: Math.round(totalRx / 1024 / 1024 * 100) / 100,
                    tx: Math.round(totalTx / 1024 / 1024 * 100) / 100,
                    interfaces: network.length
                };
            }

            // Update Process metrics
            const currentProcess = processes.list.find(p => p.pid === process.pid);
            if (currentProcess) {
                this.metrics.process = {
                    pid: process.pid,
                    uptime: Math.round(process.uptime()),
                    memory: Math.round(currentProcess.mem_rss / 1024 / 1024 * 100) / 100,
                    cpu: Math.round(currentProcess.cpu * 100) / 100,
                    threads: currentProcess.threads || 1
                };
            }

            // Update System info
            this.metrics.system = {
                platform: osInfo.platform,
                arch: osInfo.arch,
                hostname: osInfo.hostname,
                uptime: Math.round(osInfo.uptime / 3600 * 100) / 100, // hours
                nodeVersion: process.version
            };

            // Update history
            this.updateHistory();
            
            // Update workspace metrics if available
            await this.updateWorkspaceMetrics();

        } catch (error) {
            console.error('❌ Error gathering system metrics:', error);
        }
    }

    updateHistory() {
        const timestamp = Date.now();
        
        // Add to CPU history
        this.history.cpu.push({
            timestamp,
            usage: this.metrics.cpu.usage,
            user: this.metrics.cpu.user,
            system: this.metrics.cpu.system
        });
        
        // Add to Memory history
        this.history.memory.push({
            timestamp,
            usage: this.metrics.memory.usage,
            used: this.metrics.memory.used,
            free: this.metrics.memory.free
        });
        
        // Add to Network history
        this.history.network.push({
            timestamp,
            rx: this.metrics.network.rx,
            tx: this.metrics.network.tx
        });
        
        // Trim history to max length
        Object.keys(this.history).forEach(key => {
            if (Array.isArray(this.history[key])) {
                if (this.history[key].length > this.history.maxHistory) {
                    this.history[key] = this.history[key].slice(-this.history.maxHistory);
                }
            }
        });
    }

    async updateWorkspaceMetrics() {
        // This will be updated by the watcher and indexer
        // For now, just placeholder
        this.metrics.workspace = {
            files: this.metrics.workspace.files || 0,
            size: this.metrics.workspace.size || 0,
            changes: this.metrics.workspace.changes || 0,
            lastUpdate: new Date()
        };
    }

    setWorkspaceMetrics(metrics) {
        this.metrics.workspace = {
            ...this.metrics.workspace,
            ...metrics
        };
    }

    getMetrics() {
        return {
            current: this.metrics,
            history: this.history,
            timestamp: new Date(),
            uptime: this.isRunning ? Date.now() - this.startTime : 0
        };
    }

    getSystemInfo() {
        return {
            platform: this.metrics.system.platform,
            architecture: this.metrics.system.arch,
            hostname: this.metrics.system.hostname,
            nodeVersion: this.metrics.system.nodeVersion,
            uptime: this.metrics.system.uptime,
            cores: this.metrics.cpu.cores,
            totalMemory: this.metrics.memory.total,
            totalDisk: this.metrics.disk.total
        };
    }

    getPerformanceReport() {
        const recent = {
            cpu: this.history.cpu.slice(-10),
            memory: this.history.memory.slice(-10),
            network: this.history.network.slice(-10)
        };

        const avgCpu = recent.cpu.reduce((sum, item) => sum + item.usage, 0) / recent.cpu.length;
        const avgMemory = recent.memory.reduce((sum, item) => sum + item.usage, 0) / recent.memory.length;
        
        return {
            averages: {
                cpu: Math.round(avgCpu * 100) / 100,
                memory: Math.round(avgMemory * 100) / 100
            },
            current: {
                cpu: this.metrics.cpu.usage,
                memory: this.metrics.memory.usage,
                disk: this.metrics.disk.usage
            },
            alerts: this.checkAlerts(),
            trends: this.analyzeTrends()
        };
    }

    checkAlerts() {
        const alerts = [];
        
        if (this.metrics.cpu.usage > 80) {
            alerts.push({
                type: 'warning',
                metric: 'cpu',
                message: `High CPU usage: ${this.metrics.cpu.usage}%`,
                severity: this.metrics.cpu.usage > 90 ? 'critical' : 'warning'
            });
        }
        
        if (this.metrics.memory.usage > 85) {
            alerts.push({
                type: 'warning',
                metric: 'memory',
                message: `High memory usage: ${this.metrics.memory.usage}%`,
                severity: this.metrics.memory.usage > 95 ? 'critical' : 'warning'
            });
        }
        
        if (this.metrics.disk.usage > 90) {
            alerts.push({
                type: 'warning',
                metric: 'disk',
                message: `High disk usage: ${this.metrics.disk.usage}%`,
                severity: 'warning'
            });
        }
        
        return alerts;
    }

    analyzeTrends() {
        const trends = {};
        
        // CPU trend
        if (this.history.cpu.length >= 10) {
            const recent = this.history.cpu.slice(-10);
            const older = this.history.cpu.slice(-20, -10);
            
            if (older.length > 0) {
                const recentAvg = recent.reduce((sum, item) => sum + item.usage, 0) / recent.length;
                const olderAvg = older.reduce((sum, item) => sum + item.usage, 0) / older.length;
                
                trends.cpu = {
                    direction: recentAvg > olderAvg ? 'up' : 'down',
                    change: Math.round((recentAvg - olderAvg) * 100) / 100
                };
            }
        }
        
        // Memory trend
        if (this.history.memory.length >= 10) {
            const recent = this.history.memory.slice(-10);
            const older = this.history.memory.slice(-20, -10);
            
            if (older.length > 0) {
                const recentAvg = recent.reduce((sum, item) => sum + item.usage, 0) / recent.length;
                const olderAvg = older.reduce((sum, item) => sum + item.usage, 0) / older.length;
                
                trends.memory = {
                    direction: recentAvg > olderAvg ? 'up' : 'down',
                    change: Math.round((recentAvg - olderAvg) * 100) / 100
                };
            }
        }
        
        return trends;
    }

    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.emit('stopped');
        console.log('✅ System monitoring stopped');
    }
}

export { SystemMonitor };
