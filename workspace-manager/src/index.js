// Main Entry Point - Workspace Manager
// Starts the complete workspace management system

import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { WorkspaceManager } from './manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadConfig() {
    const configPath = path.join(__dirname, '..', 'language_model_abstraction', 'config.json');
    
    try {
        const config = await fs.readJson(configPath);
        console.log('▣ Configuration loaded successfully');
        return config;
    } catch (error) {
        console.error('× Failed to load configuration:', error);
        process.exit(1);
    }
}

async function main() {
    try {
        // Load configuration
        const config = await loadConfig();
        
        // Get workspace path from command line or use current directory
        const workspacePath = process.argv[2] || process.cwd();
        
        if (!(await fs.pathExists(workspacePath))) {
            console.error(`× Workspace path does not exist: ${workspacePath}`);
            process.exit(1);
        }
        
        console.log(`▣ Workspace: ${workspacePath}`);
        console.log(`○ LLM Provider: ${config.model_provider}`);
        console.log(`○ Model: ${config[config.model_provider + '_model'] || 'default'}`);
        
        // Create and start workspace manager
        const manager = new WorkspaceManager(config);
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n■ Received SIGINT, shutting down gracefully...');
            await manager.stop();
            console.log('× Goodbye!');
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            console.log('\n■ Received SIGTERM, shutting down gracefully...');
            await manager.stop();
            process.exit(0);
        });
        
        // Start the manager
        await manager.start(workspacePath);
        
        // Generate initial report
        setTimeout(async () => {
            try {
                const report = await manager.generateReport();
                console.log('\n▢ Initial Analysis Report Generated');
                console.log('══════════════════════════════════════');
                console.log(`Files Analyzed: ${report.analysis.summary.totalFiles}`);
                console.log(`Dependencies Found: ${report.analysis.summary.totalDependencies}`);
                console.log(`Analysis Time: ${report.analysis.summary.analysisTime}ms`);
                
                if (report.aiSummary) {
                    console.log('\n○ AI Summary:');
                    console.log('═══════════════');
                    console.log(report.aiSummary);
                }
                
            } catch (error) {
                console.error('× Failed to generate initial report:', error);
            }
        }, 5000);
        
    } catch (error) {
        console.error('× Failed to start Workspace Manager:', error);
        process.exit(1);
    }
}

// Run the application
export { main };

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('× Unhandled error:', error);
        process.exit(1);
    });
}
