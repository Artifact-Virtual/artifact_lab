// Advanced File System Watcher
// Monitors every file change down to single character level

import chokidar from 'chokidar';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

class AdvancedWatcher extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.watchedFiles = new Map();
        this.fileHashes = new Map();
        this.watchers = new Map();
        this.isRunning = false;
        this.watchPatterns = config.monitoring?.watch_patterns || ['**/*'];
        this.ignorePatterns = config.monitoring?.ignore_patterns || ['node_modules/**'];
        this.scanDepth = config.monitoring?.scan_depth || 10;
        
        // Performance tracking
        this.stats = {
            filesWatched: 0,
            changesDetected: 0,
            lastActivity: null,
            startTime: null
        };
    }

    async start(rootPath) {
        if (this.isRunning) {
            console.log('Watcher already running');
            return;
        }

        this.rootPath = path.resolve(rootPath);
        this.isRunning = true;
        this.stats.startTime = new Date();

        console.log(`◦ Starting advanced file watcher for: ${this.rootPath}`);

        // Initialize watcher with comprehensive options
        const watcher = chokidar.watch(this.watchPatterns, {
            cwd: this.rootPath,
            ignored: this.ignorePatterns,
            persistent: true,
            ignoreInitial: false,
            followSymlinks: true,
            cwd: this.rootPath,
            depth: this.scanDepth,
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: 50
            },
            usePolling: false,
            interval: 100,
            binaryInterval: 300,
            alwaysStat: true,
            atomic: true
        });

        // Set up event handlers
        this.setupEventHandlers(watcher);
        
        this.watchers.set('main', watcher);
        this.emit('started', { rootPath: this.rootPath });
        
        console.log('▣ Advanced watcher started successfully');
    }

    setupEventHandlers(watcher) {
        watcher
            .on('add', (filePath, stats) => this.handleFileAdd(filePath, stats))
            .on('change', (filePath, stats) => this.handleFileChange(filePath, stats))
            .on('unlink', (filePath) => this.handleFileDelete(filePath))
            .on('addDir', (dirPath, stats) => this.handleDirAdd(dirPath, stats))
            .on('unlinkDir', (dirPath) => this.handleDirDelete(dirPath))
            .on('error', (error) => this.handleError(error))
            .on('ready', () => this.handleReady());
    }

    async handleFileAdd(filePath, stats) {
        const fullPath = path.join(this.rootPath, filePath);
        const fileInfo = await this.analyzeFile(fullPath, stats);
        
        this.watchedFiles.set(filePath, fileInfo);
        this.stats.filesWatched++;
        this.stats.lastActivity = new Date();

        this.emit('fileAdded', {
            path: filePath,
            fullPath,
            info: fileInfo,
            timestamp: new Date()
        });

        console.log(`▢ Added: ${filePath}`);
    }

    async handleFileChange(filePath, stats) {
        const fullPath = path.join(this.rootPath, filePath);
        const oldInfo = this.watchedFiles.get(filePath);
        const newInfo = await this.analyzeFile(fullPath, stats);
        
        // Detect what changed
        const changes = this.detectChanges(oldInfo, newInfo);
        
        this.watchedFiles.set(filePath, newInfo);
        this.stats.changesDetected++;
        this.stats.lastActivity = new Date();

        this.emit('fileChanged', {
            path: filePath,
            fullPath,
            oldInfo,
            newInfo,
            changes,
            timestamp: new Date()
        });

        console.log(`▢ Changed: ${filePath} (${changes.length} changes)`);
    }

    handleFileDelete(filePath) {
        this.watchedFiles.delete(filePath);
        this.fileHashes.delete(filePath);
        this.stats.filesWatched--;
        this.stats.lastActivity = new Date();

        this.emit('fileDeleted', {
            path: filePath,
            timestamp: new Date()
        });

        console.log(`🗑️ Deleted: ${filePath}`);
    }

    async handleDirAdd(dirPath, stats) {
        this.emit('dirAdded', {
            path: dirPath,
            stats,
            timestamp: new Date()
        });

        console.log(`▢ Directory added: ${dirPath}`);
    }

    handleDirDelete(dirPath) {
        // Clean up files from this directory
        for (const [filePath] of this.watchedFiles) {
            if (filePath.startsWith(dirPath + path.sep)) {
                this.watchedFiles.delete(filePath);
                this.fileHashes.delete(filePath);
            }
        }

        this.emit('dirDeleted', {
            path: dirPath,
            timestamp: new Date()
        });

        console.log(`🗑️ Directory deleted: ${dirPath}`);
    }

    handleError(error) {
        console.error('🚨 Watcher error:', error);
        this.emit('error', error);
    }

    handleReady() {
        console.log(`▣ Initial scan complete. Watching ${this.stats.filesWatched} files`);
        this.emit('ready', {
            filesWatched: this.stats.filesWatched,
            timestamp: new Date()
        });
    }

    async analyzeFile(filePath, stats) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const hash = crypto.createHash('md5').update(content).digest('hex');
            
            return {
                path: filePath,
                size: stats.size,
                mtime: stats.mtime,
                ctime: stats.ctime,
                hash,
                lines: content.split('\n').length,
                chars: content.length,
                extension: path.extname(filePath),
                type: this.getFileType(filePath),
                encoding: 'utf8'
            };
        } catch (error) {
            // Handle binary files or permission errors
            return {
                path: filePath,
                size: stats.size,
                mtime: stats.mtime,
                ctime: stats.ctime,
                hash: null,
                lines: 0,
                chars: 0,
                extension: path.extname(filePath),
                type: this.getFileType(filePath),
                encoding: 'binary',
                error: error.message
            };
        }
    }

    detectChanges(oldInfo, newInfo) {
        const changes = [];
        
        if (!oldInfo) return [{ type: 'created' }];
        
        if (oldInfo.hash !== newInfo.hash) {
            changes.push({ type: 'content', oldHash: oldInfo.hash, newHash: newInfo.hash });
        }
        
        if (oldInfo.size !== newInfo.size) {
            changes.push({ 
                type: 'size', 
                oldSize: oldInfo.size, 
                newSize: newInfo.size,
                delta: newInfo.size - oldInfo.size 
            });
        }
        
        if (oldInfo.lines !== newInfo.lines) {
            changes.push({ 
                type: 'lines', 
                oldLines: oldInfo.lines, 
                newLines: newInfo.lines,
                delta: newInfo.lines - oldInfo.lines 
            });
        }

        return changes;
    }

    getFileType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const typeMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.md': 'markdown',
            '.txt': 'text',
            '.yml': 'yaml',
            '.yaml': 'yaml',
            '.xml': 'xml',
            '.sql': 'sql',
            '.sh': 'shell',
            '.bat': 'batch',
            '.ps1': 'powershell'
        };
        
        return typeMap[ext] || 'unknown';
    }

    async stop() {
        if (!this.isRunning) return;
        
        console.log('■ Stopping file watcher...');
        
        for (const [name, watcher] of this.watchers) {
            await watcher.close();
            console.log(`▣ Closed watcher: ${name}`);
        }
        
        this.watchers.clear();
        this.isRunning = false;
        this.emit('stopped');
        
        console.log('▣ File watcher stopped');
    }

    getStats() {
        return {
            ...this.stats,
            uptime: this.stats.startTime ? Date.now() - this.stats.startTime.getTime() : 0,
            isRunning: this.isRunning,
            watchedPaths: Array.from(this.watchedFiles.keys()),
            memoryUsage: process.memoryUsage()
        };
    }

    getWatchedFiles() {
        return Array.from(this.watchedFiles.entries()).map(([path, info]) => ({
            path,
            ...info
        }));
    }
}

export { AdvancedWatcher };
