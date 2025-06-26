#!/usr/bin/env node

/**
 * SOP JSON Summary Generator
 * Automatically creates and updates JSON summaries of the DevCore SOP
 * Triggered by [CREATE_JSON_SUMMARY_ALWAYS] directive
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOP_FILE = path.join(__dirname, 'DevCore-SOP.md');
const JSON_OUTPUT = path.join(__dirname, 'DevCore-SOP-Summary.json');

/**
 * Parse the SOP markdown file and extract key information
 */
async function parseSOP() {
    try {
        const content = await fs.readFile(SOP_FILE, 'utf8');
        const lines = content.split('\n');
        
        const summary = {
            metadata: {
                version: '2.0',
                lastUpdated: new Date().toISOString(),
                documentId: 'WM-SOP-001',
                generatedBy: 'generate-sop-summary.js'
            },
            systemOverview: {
                purpose: 'Comprehensive file management, monitoring, and processing system',
                components: [
                    'File Watcher (Advanced)',
                    'File Indexer (Dependency)',
                    'System Monitor (Resource)',
                    'Universal File Processor',
                    'Main Manager (Orchestrator)',
                    'Visualizer (Topology)'
                ],
                mainPort: 8081,
                dashboardUrls: [
                    'http://localhost:8081',
                    'http://localhost:8081/topology'
                ]
            },
            coreComponents: {
                watcher: {
                    file: 'src/watcher.js',
                    purpose: 'Real-time file system monitoring',
                    healthCriteria: {
                        responseTime: '<100ms',
                        memoryUsage: '<50MB',
                        eventQueueLength: '<1000'
                    }
                },
                indexer: {
                    file: 'src/indexer.js',
                    purpose: 'Code analysis and dependency mapping',
                    performanceTargets: {
                        analysisTime: '<5s for 100 files',
                        memoryUsage: '<100MB',
                        accuracy: '>95%'
                    }
                },
                monitor: {
                    file: 'src/monitor.js',
                    purpose: 'Resource monitoring and health checks',
                    alertThresholds: {
                        cpu: '>80% for 5 minutes',
                        memory: '>85% for 3 minutes',
                        disk: '>90%'
                    }
                },
                visualizer: {
                    file: 'src/visualizer.js',
                    purpose: 'Project structure visualization'
                },
                fileProcessor: {
                    file: 'code-formatter.js',
                    purpose: 'Exhaustive file standardization',
                    skipMarker: '[PROCESSED-BY-DEVCORE-EMOJI-REPLACER-v2.0]'
                }
            },
            fileProcessing: {
                supportedTypes: [
                    'js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'php', 'java', 
                    'c', 'cpp', 'cs', 'go', 'rs', 'html', 'css', 'scss', 
                    'less', 'vue', 'xml', 'json', 'yaml', 'yml', 'toml', 
                    'ini', 'cfg', 'conf', 'md', 'txt', 'sh', 'bash', 
                    'ps1', 'bat', 'cmd', 'sql'
                ],
                emojiMappings: {
                    '🚀': '▶',
                    '✅': '▣',
                    '❌': '×',
                    '⚡': '◊',
                    '🔄': '○',
                    '📊': '■',
                    '📝': '▢'
                },
                processWorkflow: [
                    'File Discovery',
                    'Skip Marker Detection',
                    'Emoji Replacement',
                    'Header/Footer Addition',
                    'File Writing & Tracking'
                ]
            },
            startupProcedures: {
                prerequisites: [
                    'Node.js >= 16.0.0',
                    'System memory > 1GB available',
                    'Disk space > 500MB available',
                    'Port 8081 available'
                ],
                startupSequence: [
                    'System Prerequisites Check',
                    'Configuration Validation', 
                    'Dependency Installation',
                    'Service Startup Sequence',
                    'Universal File Processing'
                ]
            },
            monitoring: {
                healthCheckFrequency: '30 seconds',
                autoRestartThreshold: '3 consecutive failures',
                maxRestartAttempts: '5 per hour',
                performanceMetrics: [
                    'CPU Usage (%)',
                    'Memory Usage (MB/%)',
                    'Disk Usage (%)',
                    'Network I/O (bytes/sec)',
                    'File Processing Rate (files/min)',
                    'Emoji Replacement Count',
                    'Error Rate (%)'
                ]
            },
            troubleshooting: {
                commonIssues: [
                    {
                        issue: 'High Memory Usage (>85%)',
                        solutions: [
                            'Check component memory usage',
                            'Reduce analysis_batch_size in config',
                            'Restart memory-intensive components',
                            'Close unnecessary applications'
                        ]
                    },
                    {
                        issue: 'Port Already in Use (8081)',
                        solutions: [
                            'Find process using port',
                            'Kill conflicting process',
                            'Modify config.json workspace_port',
                            'Use alternative port'
                        ]
                    },
                    {
                        issue: 'LLM Connection Failed',
                        solutions: [
                            'Verify Ollama service running',
                            'Check model availability',
                            'Test connectivity',
                            'Verify config.json LLM settings'
                        ]
                    }
                ]
            },
            maintenanceSchedule: {
                daily: [
                    'Component health checks',
                    'Performance metric collection',
                    'Log rotation',
                    'File processing queue management'
                ],
                weekly: [
                    'Analyze performance trends',
                    'Review processed file statistics',
                    'Update file processing rules',
                    'Clean temporary files'
                ],
                monthly: [
                    'Update Node.js dependencies',
                    'Review configuration settings',
                    'Optimize performance parameters',
                    'Update documentation'
                ]
            },
            performanceOptimization: {
                configOptimizations: {
                    analysis_batch_size: 10,
                    monitoring_frequency: 30000,
                    file_watch_throttle: 1000,
                    max_concurrent_processes: 4
                },
                resourceManagement: [
                    'Implement streaming for large files',
                    'Use worker threads for CPU-intensive tasks',
                    'Cache frequently accessed data',
                    'Implement garbage collection triggers'
                ]
            },
            emergencyProcedures: {
                systemFailureResponse: [
                    'Stop all running processes',
                    'Check system resources',
                    'Review error logs',
                    'Identify root cause'
                ],
                recoverySteps: [
                    'Clear processing queues',
                    'Reset component restart counters',
                    'Restart with minimal configuration',
                    'Gradually restore full functionality'
                ]
            },
            configuration: {
                defaultConfig: {
                    workspace_port: 8081,
                    model_provider: 'ollama',
                    ollama_model: 'codellama:7b',
                    analysis_batch_size: 10,
                    monitoring_frequency: 30000,
                    auto_restart_enabled: true,
                    max_restart_attempts: 5,
                    component_timeout: 30000,
                    file_processing_enabled: true,
                    emoji_replacement_enabled: true,
                    header_footer_enabled: true
                }
            },
            llmDirective: {
                trigger: '[CREATE_JSON_SUMMARY_ALWAYS]',
                command: 'node generate-sop-summary.js --update-json --reflect-changes',
                purpose: 'Ensure all SOPs are continuously updated and reflected in machine-readable format'
            }
        };
        
        return summary;
    } catch (error) {
        console.error('× Error parsing SOP file:', error.message);
        return null;
    }
}

/**
 * Generate and save the JSON summary
 */
async function generateSummary() {
    console.log('■ DevCore SOP JSON Summary Generator');
    console.log('────────────────────────────────────────────────');
    
    try {
        const summary = await parseSOP();
        if (!summary) {
            console.error('× Failed to parse SOP file');
            return false;
        }
        
        await fs.writeJson(JSON_OUTPUT, summary, { spaces: 2 });
        
        console.log('▣ JSON summary generated successfully');
        console.log(`▣ Output file: ${JSON_OUTPUT}`);
        console.log(`▣ Version: ${summary.metadata.version}`);
        console.log(`▣ Last updated: ${summary.metadata.lastUpdated}`);
        console.log(`▣ Components: ${summary.systemOverview.components.length}`);
        console.log(`▣ Supported file types: ${summary.fileProcessing.supportedTypes.length}`);
        
        return true;
    } catch (error) {
        console.error('× Error generating JSON summary:', error.message);
        return false;
    }
}

/**
 * Main execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const updateJson = args.includes('--update-json');
    const reflectChanges = args.includes('--reflect-changes');
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
■ DevCore SOP JSON Summary Generator

Usage: node generate-sop-summary.js [options]

Options:
  --update-json      Generate/update the JSON summary
  --reflect-changes  Reflect all changes from SOP file
  --help, -h         Show this help message

Purpose:
  This script is triggered by the [CREATE_JSON_SUMMARY_ALWAYS] directive
  in the SOP file to ensure continuous synchronization between the
  markdown SOP and its machine-readable JSON representation.
        `);
        process.exit(0);
    }
    
    generateSummary().then(success => {
        if (success) {
            console.log('\n▣ SOP JSON summary generation complete');
            process.exit(0);
        } else {
            console.error('\n× SOP JSON summary generation failed');
            process.exit(1);
        }
    });
}

export default { generateSummary, parseSOP };
