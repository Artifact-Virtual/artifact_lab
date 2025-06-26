#!/usr/bin/env node

// Startup script for Workspace Manager
// Handles environment setup, error checking, and service management

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import os from 'os';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration defaults
const DEFAULT_PORT = 8081;
const DEFAULT_WORKSPACE = process.cwd();

// Error codes for different failure types
const ERROR_CODES = {
    NODE_VERSION: 1,
    CONFIG_MISSING: 2,
    DEPENDENCIES_FAILED: 3,
    PORT_IN_USE: 4,
    LLM_CONNECTION: 5,
    PERMISSIONS: 6,
    UNKNOWN: 99
};

// Platform detection
const isWindows = os.platform() === 'win32';
const isLinux = os.platform() === 'linux';

function getNpmCommand() {
    return isWindows ? 'npm.cmd' : 'npm';
}

async function checkPort(port = DEFAULT_PORT) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.listen(port, () => {
            server.once('close', () => resolve(true));
            server.close();
        });
        
        server.on('error', () => resolve(false));
    });
}

async function checkSystemRequirements() {
    console.log('🔍 Checking system requirements...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (major < 16) {
        console.error('❌ Node.js 16+ required. Current version:', nodeVersion);
        console.error('   Download from: https://nodejs.org/');
        process.exit(ERROR_CODES.NODE_VERSION);
    }
    
    console.log('✅ Node.js version:', nodeVersion);
    
    // Check available memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
    
    if (memUsagePercent > 85) {
        console.warn('⚠️  High memory usage detected:', memUsagePercent.toFixed(1) + '%');
        console.warn('   Consider closing other applications or reducing analysis_batch_size');
    }
    
    // Check disk space
    const diskUsage = await checkDiskSpace();
    if (diskUsage > 90) {
        console.warn('⚠️  Low disk space:', diskUsage.toFixed(1) + '% used');
        console.warn('   File watching may stop if disk becomes full');
    }
    
    // Check port availability
    const portAvailable = await checkPort(DEFAULT_PORT);
    if (!portAvailable) {
        console.error('❌ Port', DEFAULT_PORT, 'is already in use');
        console.error('   Solution: Change workspace_port in config or stop the conflicting service');
        process.exit(ERROR_CODES.PORT_IN_USE);
    }
    
    console.log('✅ Port', DEFAULT_PORT, 'is available');
}
async function checkDiskSpace() {
    try {
        const stats = await fs.statSync(__dirname);
        // Simplified disk space check - return 0 if can't determine
        return 0;
    } catch (error) {
        return 0;
    }
}

async function checkConfiguration() {
    console.log('🔧 Checking configuration...');
    
    const configPath = path.join(__dirname, 'language_model_abstraction', 'config.json');
    if (!(await fs.pathExists(configPath))) {
        console.error('❌ Configuration file not found:', configPath);
        console.error('   Creating default configuration...');
        
        // Create default config
        await fs.ensureDir(path.dirname(configPath));
        const defaultConfig = {
            model_provider: "ollama",
            ollama_endpoint: "http://localhost:11434/api/generate",
            ollama_model: "codellama:7b",
            workspace_port: DEFAULT_PORT,
            monitoring: {
                watch_patterns: ["**/*.{js,ts,py,json}"],
                ignore_patterns: ["node_modules/**", "*.log", ".git/**"],
                scan_depth: 10,
                analysis_batch_size: 50
            }
        };
        
        await fs.writeJson(configPath, defaultConfig, { spaces: 2 });
        console.log('✅ Default configuration created');
    } else {
        console.log('✅ Configuration file found');
    }
    
    // Validate configuration
    try {
        const config = await fs.readJson(configPath);
        
        // Check LLM provider configuration
        if (config.model_provider === 'ollama') {
            await checkOllamaConnection(config);
        }
        
        console.log('✅ Configuration validated');
        return config;
    } catch (error) {
        console.error('❌ Configuration validation failed:', error.message);
        process.exit(ERROR_CODES.CONFIG_MISSING);
    }
}

async function checkOllamaConnection(config) {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(config.ollama_endpoint.replace('/api/generate', '/api/tags'), {
            timeout: 5000
        });
        
        if (!response.ok) {
            throw new Error('Ollama server not responding');
        }
        
        const data = await response.json();
        const hasModel = data.models.some(m => m.name.includes(config.ollama_model.split(':')[0]));
        
        if (!hasModel) {
            console.warn('⚠️  Model', config.ollama_model, 'not found in Ollama');
            console.warn('   Run: ollama pull', config.ollama_model);
        } else {
            console.log('✅ Ollama connection verified');
        }
    } catch (error) {
        console.warn('⚠️  Cannot connect to Ollama:', error.message);
        console.warn('   Make sure Ollama is running or switch to a different provider');
    }
}

async function installDependencies() {
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    
    if (!(await fs.pathExists(nodeModulesPath))) {
        console.log('📦 Installing dependencies...');
        
        return new Promise((resolve, reject) => {
            const npmCmd = getNpmCommand();
            const npm = spawn(npmCmd, ['install'], { 
                cwd: __dirname,
                stdio: 'inherit',
                shell: isWindows // Use shell on Windows to handle npm.cmd
            });
            
            npm.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Dependencies installed');
                    resolve();
                } else {
                    console.error('❌ Failed to install dependencies (exit code:', code + ')');
                    console.error('   Try running: npm install --verbose');
                    reject(new Error('npm install failed'));
                }
            });
            
            npm.on('error', (error) => {
                console.error('❌ npm command failed:', error.message);
                console.error('   Make sure npm is installed and in your PATH');
                reject(error);
            });
        });
    }
    
    console.log('✅ Dependencies are installed');
}

async function createServiceFiles() {
    const args = process.argv.slice(2);
    const createPm2 = args.includes('--pm2') || args.includes('--service');
    const createSystemd = args.includes('--systemd') || args.includes('--service');
    
    if (createPm2) {
        await createPM2Config();
    }
    
    if (createSystemd) {
        await createSystemdService();
        if (!isLinux) {
            console.log('ℹ️  Note: Generated systemd service file on Windows - copy to Linux system to use');
        }
    }
}

async function createPM2Config() {
    console.log('🔧 Creating PM2 configuration...');
    
    const pm2Config = {
        apps: [{
            name: 'workspace-manager',
            script: path.join(__dirname, 'src/index.js'),
            cwd: __dirname,
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production'
            },
            log_file: path.join(__dirname, 'logs/workspace-manager.log'),
            error_file: path.join(__dirname, 'logs/workspace-manager-error.log'),
            out_file: path.join(__dirname, 'logs/workspace-manager-out.log'),
            time: true
        }]
    };
    
    await fs.ensureDir(path.join(__dirname, 'logs'));
    await fs.writeJson(path.join(__dirname, 'ecosystem.config.json'), pm2Config, { spaces: 2 });
    
    console.log('✅ PM2 configuration created: ecosystem.config.json');
    console.log('   Start with: pm2 start ecosystem.config.json');
    console.log('   Monitor with: pm2 monit');
    console.log('   Stop with: pm2 stop workspace-manager');
}

async function createSystemdService() {
    console.log('🔧 Creating systemd service...');
    
    const serviceContent = `[Unit]
Description=Workspace Manager - Real-time workspace monitoring
After=network.target

[Service]
Type=simple
User=${os.userInfo().username}
WorkingDirectory=${__dirname}
ExecStart=${process.execPath} ${path.join(__dirname, 'src/index.js')}
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
`;
    
    const servicePath = path.join(__dirname, 'workspace-manager.service');
    await fs.writeFile(servicePath, serviceContent);
    
    console.log('✅ Systemd service created: workspace-manager.service');
    console.log('   Install with: sudo cp workspace-manager.service /etc/systemd/system/');
    console.log('   Enable with: sudo systemctl enable workspace-manager');
    console.log('   Start with: sudo systemctl start workspace-manager');
    console.log('   Check status: sudo systemctl status workspace-manager');
}

async function main() {
    console.log('🚀 Workspace Manager Startup');
    console.log('════════════════════════════');
    
    const args = process.argv.slice(2);
    
    // Handle service creation commands first (before workspace path parsing)
    if (args.includes('--setup') || args.includes('--service') || args.includes('--pm2') || args.includes('--systemd')) {
        await createServiceFiles();
        return;
    }
    
    const workspacePath = args[0] || DEFAULT_WORKSPACE;
    
    try {
        await checkSystemRequirements();
        
        // Configuration check
        const config = await checkConfiguration();
        
        // Install dependencies if needed
        await installDependencies();
        
        console.log('✅ All prerequisites met');
        console.log('🎯 Starting Workspace Manager...');
        console.log('📁 Workspace:', workspacePath);
        console.log('🌐 Dashboard: http://localhost:' + (config.workspace_port || DEFAULT_PORT));
        console.log('🔗 Topology: http://localhost:' + (config.workspace_port || DEFAULT_PORT) + '/topology');
        
        // Set environment variables
        process.env.WORKSPACE_PATH = workspacePath;
        process.env.WORKSPACE_PORT = config.workspace_port || DEFAULT_PORT;
        
        // Import and start the main application
        const { main: startApp } = await import('./src/index.js');
        await startApp();
        
    } catch (error) {
        console.error('💥 Startup failed:', error.message);
        console.error('\n📋 Troubleshooting Guide:');
        
        // Specific error guidance
        if (error.code === 'ENOENT' && error.path === 'npm') {
            console.error('❌ npm not found in PATH');
            console.error('   • Reinstall Node.js from https://nodejs.org/');
            console.error('   • Or manually run: npm install');
        } else if (error.message.includes('EADDRINUSE')) {
            console.error('❌ Port already in use');
            console.error('   • Change workspace_port in language_model_abstraction/config.json');
            console.error('   • Or stop the conflicting service');
        } else if (error.message.includes('permission')) {
            console.error('❌ Permission denied');
            console.error('   • Run as administrator/sudo');
            console.error('   • Check file permissions');
        } else {
            console.error('❌ General troubleshooting:');
            console.error('   • Ensure Node.js 16+ is installed');
            console.error('   • Run "npm install" manually');
            console.error('   • Check language_model_abstraction/config.json');
            console.error('   • Verify Ollama is running (if using local models)');
            console.error('   • Check available disk space and memory');
        }
        
        process.exit(error.code || ERROR_CODES.UNKNOWN);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    process.exit(0);
});

main().catch(error => {
    console.error('💥 Unhandled startup error:', error);
    process.exit(ERROR_CODES.UNKNOWN);
});
