// Advanced Dependency Indexer
// Creates comprehensive dependency trees and file relationships

import fs from 'fs-extra';
import path from 'path';
import { parse as parseJS } from '@babel/parser';
import traverse from '@babel/traverse';
import * as acorn from 'acorn';
import { simple as walkAST } from 'acorn-walk';
import { EventEmitter } from 'events';
import { glob } from 'glob';

class DependencyIndexer extends EventEmitter {
    constructor(config, llmProvider) {
        super();
        this.config = config;
        this.llmProvider = llmProvider;
        this.dependencyGraph = new Map();
        this.fileAnalysis = new Map();
        this.reverseIndex = new Map(); // Files that depend on this file
        this.moduleGraph = new Map();
        this.isRunning = false;
        
        this.stats = {
            filesAnalyzed: 0,
            dependenciesFound: 0,
            analysisTime: 0,
            lastUpdate: null
        };
    }

    async start(rootPath) {
        if (this.isRunning) return;
        
        this.rootPath = path.resolve(rootPath);
        this.isRunning = true;
        
        console.log(`🔍 Starting dependency analysis for: ${this.rootPath}`);
        
        const startTime = Date.now();
        await this.performFullAnalysis();
        
        this.stats.analysisTime = Date.now() - startTime;
        this.stats.lastUpdate = new Date();
        
        console.log(`✅ Dependency analysis complete in ${this.stats.analysisTime}ms`);
        this.emit('analysisComplete', this.getAnalysisReport());
    }

    async performFullAnalysis() {
        const patterns = this.config.monitoring?.watch_patterns || ['**/*.js', '**/*.ts', '**/*.py'];
        const allFiles = [];
        
        // Collect all files to analyze
        for (const pattern of patterns) {
            const files = glob.sync(pattern, {
                cwd: this.rootPath,
                ignore: this.config.monitoring?.ignore_patterns || [],
                absolute: true
            });
            allFiles.push(...files);
        }

        console.log(`📊 Analyzing ${allFiles.length} files...`);

        // Analyze files in batches
        const batchSize = this.config.monitoring?.analysis_batch_size || 50;
        for (let i = 0; i < allFiles.length; i += batchSize) {
            const batch = allFiles.slice(i, i + batchSize);
            await this.analyzeBatch(batch);
            
            // Progress update
            const progress = Math.round(((i + batch.length) / allFiles.length) * 100);
            console.log(`📈 Analysis progress: ${progress}%`);
        }

        // Build reverse index
        this.buildReverseIndex();
        
        // Generate AI-powered summaries
        await this.generateFileSummaries();
    }

    async analyzeBatch(files) {
        const promises = files.map(file => this.analyzeFile(file));
        await Promise.allSettled(promises);
    }

    async analyzeFile(filePath) {
        try {
            const relativePath = path.relative(this.rootPath, filePath);
            const content = await fs.readFile(filePath, 'utf8');
            const ext = path.extname(filePath).toLowerCase();
            
            let analysis = {
                path: relativePath,
                fullPath: filePath,
                type: this.getFileType(ext),
                size: content.length,
                lines: content.split('\n').length,
                dependencies: [],
                exports: [],
                imports: [],
                functions: [],
                classes: [],
                variables: [],
                lastAnalyzed: new Date()
            };

            // Parse dependencies based on file type
            switch (analysis.type) {
                case 'javascript':
                case 'typescript':
                    analysis = await this.analyzeJavaScript(content, analysis);
                    break;
                case 'python':
                    analysis = await this.analyzePython(content, analysis);
                    break;
                case 'json':
                    analysis = await this.analyzeJSON(content, analysis);
                    break;
                default:
                    analysis = await this.analyzeGeneric(content, analysis);
            }

            this.fileAnalysis.set(relativePath, analysis);
            this.dependencyGraph.set(relativePath, analysis.dependencies);
            this.stats.filesAnalyzed++;
            this.stats.dependenciesFound += analysis.dependencies.length;

            this.emit('fileAnalyzed', analysis);
            return analysis;

        } catch (error) {
            console.error(`❌ Error analyzing ${filePath}:`, error.message);
            return null;
        }
    }

    async analyzeJavaScript(content, analysis) {
        try {
            // Parse with Babel for better compatibility
            const ast = parseJS(content, {
                sourceType: 'module',
                allowImportExportEverywhere: true,
                allowReturnOutsideFunction: true,
                plugins: [
                    'jsx',
                    'typescript',
                    'decorators-legacy',
                    'classProperties',
                    'objectRestSpread',
                    'asyncGenerators',
                    'functionBind',
                    'exportDefaultFrom',
                    'exportNamespaceFrom',
                    'dynamicImport',
                    'nullishCoalescingOperator',
                    'optionalChaining'
                ]
            });

            traverse.default(ast, {
                ImportDeclaration(path) {
                    const source = path.node.source.value;
                    analysis.imports.push({
                        source,
                        specifiers: path.node.specifiers.map(spec => spec.local.name),
                        type: 'import'
                    });
                    
                    if (!source.startsWith('.') && !source.startsWith('/')) {
                        analysis.dependencies.push({
                            name: source,
                            type: 'external',
                            line: path.node.loc?.start.line
                        });
                    } else {
                        analysis.dependencies.push({
                            name: this.resolvePath(source, analysis.path),
                            type: 'internal',
                            line: path.node.loc?.start.line
                        });
                    }
                },

                ExportDeclaration(path) {
                    if (path.node.source) {
                        analysis.exports.push({
                            source: path.node.source.value,
                            type: 'reexport'
                        });
                    }
                },

                FunctionDeclaration(path) {
                    if (path.node.id) {
                        analysis.functions.push({
                            name: path.node.id.name,
                            line: path.node.loc?.start.line,
                            params: path.node.params.length
                        });
                    }
                },

                ClassDeclaration(path) {
                    if (path.node.id) {
                        analysis.classes.push({
                            name: path.node.id.name,
                            line: path.node.loc?.start.line,
                            methods: []
                        });
                    }
                },

                VariableDeclarator(path) {
                    if (path.node.id.type === 'Identifier') {
                        analysis.variables.push({
                            name: path.node.id.name,
                            line: path.node.loc?.start.line,
                            type: path.parent.kind
                        });
                    }
                }
            });

        } catch (parseError) {
            // Fallback to simpler regex-based analysis
            this.analyzeWithRegex(content, analysis);
        }

        return analysis;
    }

    async analyzePython(content, analysis) {
        // Python dependency analysis using regex patterns
        const importRegex = /^(?:from\s+(\S+)\s+)?import\s+(.+)$/gm;
        const funcRegex = /^def\s+(\w+)\s*\(/gm;
        const classRegex = /^class\s+(\w+).*:/gm;
        
        let match;
        
        // Find imports
        while ((match = importRegex.exec(content)) !== null) {
            const module = match[1] || match[2].split(',')[0].trim();
            analysis.imports.push({
                source: module,
                type: 'import'
            });
            
            if (!module.startsWith('.')) {
                analysis.dependencies.push({
                    name: module,
                    type: 'external',
                    line: content.substring(0, match.index).split('\n').length
                });
            }
        }
        
        // Find functions
        while ((match = funcRegex.exec(content)) !== null) {
            analysis.functions.push({
                name: match[1],
                line: content.substring(0, match.index).split('\n').length
            });
        }
        
        // Find classes
        while ((match = classRegex.exec(content)) !== null) {
            analysis.classes.push({
                name: match[1],
                line: content.substring(0, match.index).split('\n').length
            });
        }
        
        return analysis;
    }

    async analyzeJSON(content, analysis) {
        try {
            const json = JSON.parse(content);
            
            // Analyze package.json
            if (path.basename(analysis.path) === 'package.json') {
                const deps = { ...json.dependencies, ...json.devDependencies };
                for (const [name, version] of Object.entries(deps)) {
                    analysis.dependencies.push({
                        name,
                        version,
                        type: 'package'
                    });
                }
            }
            
            analysis.structure = this.getJSONStructure(json);
        } catch (error) {
            analysis.error = 'Invalid JSON';
        }
        
        return analysis;
    }

    async analyzeGeneric(content, analysis) {
        // Basic text analysis
        analysis.words = content.split(/\s+/).length;
        analysis.characters = content.length;
        
        return analysis;
    }

    analyzeWithRegex(content, analysis) {
        // Fallback regex-based analysis
        const importRegex = /(?:import|require)\s*\(?['"`]([^'"`]+)['"`]\)?/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            const source = match[1];
            analysis.dependencies.push({
                name: source.startsWith('.') ? this.resolvePath(source, analysis.path) : source,
                type: source.startsWith('.') ? 'internal' : 'external'
            });
        }
    }

    resolvePath(importPath, currentFile) {
        const currentDir = path.dirname(currentFile);
        return path.normalize(path.join(currentDir, importPath));
    }

    buildReverseIndex() {
        console.log('🔄 Building reverse dependency index...');
        
        this.reverseIndex.clear();
        
        for (const [filePath, dependencies] of this.dependencyGraph) {
            for (const dep of dependencies) {
                if (dep.type === 'internal') {
                    if (!this.reverseIndex.has(dep.name)) {
                        this.reverseIndex.set(dep.name, []);
                    }
                    this.reverseIndex.get(dep.name).push(filePath);
                }
            }
        }
        
        console.log(`✅ Reverse index built with ${this.reverseIndex.size} entries`);
    }

    async generateFileSummaries() {
        if (!this.llmProvider) return;
        
        console.log('🤖 Generating AI-powered file summaries...');
        
        const files = Array.from(this.fileAnalysis.values());
        const batch = files.slice(0, 10); // Limit for demo
        
        for (const fileAnalysis of batch) {
            try {
                const prompt = this.createSummaryPrompt(fileAnalysis);
                const summary = await this.llmProvider.query(prompt);
                
                fileAnalysis.aiSummary = summary;
                this.emit('summaryGenerated', { file: fileAnalysis.path, summary });
                
            } catch (error) {
                console.error(`❌ Error generating summary for ${fileAnalysis.path}:`, error.message);
            }
        }
    }

    createSummaryPrompt(fileAnalysis) {
        return `Analyze this file and provide a concise summary:

File: ${fileAnalysis.path}
Type: ${fileAnalysis.type}
Lines: ${fileAnalysis.lines}
Functions: ${fileAnalysis.functions.map(f => f.name).join(', ')}
Classes: ${fileAnalysis.classes.map(c => c.name).join(', ')}
Dependencies: ${fileAnalysis.dependencies.map(d => d.name).join(', ')}

Provide a summary in this format:
Purpose: [What this file does]
Key Components: [Main functions/classes]
Dependencies: [Major dependencies]
Role: [Role in the project]`;
    }

    getFileType(ext) {
        const typeMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.json': 'json',
            '.html': 'html',
            '.css': 'css',
            '.md': 'markdown'
        };
        return typeMap[ext] || 'unknown';
    }

    getJSONStructure(obj, depth = 0, maxDepth = 3) {
        if (depth > maxDepth) return '[Object]';
        
        if (Array.isArray(obj)) {
            return `[Array(${obj.length})]`;
        }
        
        if (typeof obj === 'object' && obj !== null) {
            const keys = Object.keys(obj);
            if (keys.length === 0) return '{}';
            
            const structure = {};
            for (const key of keys.slice(0, 10)) { // Limit keys
                structure[key] = this.getJSONStructure(obj[key], depth + 1, maxDepth);
            }
            return structure;
        }
        
        return typeof obj;
    }

    async updateFile(filePath) {
        await this.analyzeFile(filePath);
        this.buildReverseIndex();
        this.emit('fileUpdated', filePath);
    }

    getDependencies(filePath) {
        return this.dependencyGraph.get(filePath) || [];
    }

    getDependents(filePath) {
        return this.reverseIndex.get(filePath) || [];
    }

    getAnalysisReport() {
        const totalFiles = this.fileAnalysis.size;
        const totalDeps = Array.from(this.dependencyGraph.values()).reduce((sum, deps) => sum + deps.length, 0);
        
        return {
            summary: {
                totalFiles,
                totalDependencies: totalDeps,
                analysisTime: this.stats.analysisTime,
                lastUpdate: this.stats.lastUpdate
            },
            fileTypes: this.getFileTypeDistribution(),
            topDependencies: this.getTopDependencies(),
            circularDependencies: this.findCircularDependencies(),
            orphanFiles: this.findOrphanFiles()
        };
    }

    getFileTypeDistribution() {
        const distribution = {};
        for (const analysis of this.fileAnalysis.values()) {
            distribution[analysis.type] = (distribution[analysis.type] || 0) + 1;
        }
        return distribution;
    }

    getTopDependencies() {
        const depCount = {};
        for (const deps of this.dependencyGraph.values()) {
            for (const dep of deps) {
                if (dep.type === 'external') {
                    depCount[dep.name] = (depCount[dep.name] || 0) + 1;
                }
            }
        }
        
        return Object.entries(depCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));
    }

    findCircularDependencies() {
        // Simple circular dependency detection
        const visited = new Set();
        const cycles = [];
        
        for (const [file] of this.dependencyGraph) {
            if (!visited.has(file)) {
                const cycle = this.detectCycle(file, [], visited);
                if (cycle.length > 0) {
                    cycles.push(cycle);
                }
            }
        }
        
        return cycles;
    }

    detectCycle(file, path, visited) {
        if (path.includes(file)) {
            return path.slice(path.indexOf(file));
        }
        
        if (visited.has(file)) {
            return [];
        }
        
        visited.add(file);
        const deps = this.getDependencies(file);
        
        for (const dep of deps) {
            if (dep.type === 'internal') {
                const cycle = this.detectCycle(dep.name, [...path, file], visited);
                if (cycle.length > 0) {
                    return cycle;
                }
            }
        }
        
        return [];
    }

    findOrphanFiles() {
        const allFiles = new Set(this.fileAnalysis.keys());
        const referencedFiles = new Set();
        
        for (const deps of this.dependencyGraph.values()) {
            for (const dep of deps) {
                if (dep.type === 'internal') {
                    referencedFiles.add(dep.name);
                }
            }
        }
        
        return Array.from(allFiles).filter(file => !referencedFiles.has(file));
    }

    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            totalFiles: this.fileAnalysis.size,
            totalDependencies: this.stats.dependenciesFound
        };
    }

    stop() {
        this.isRunning = false;
        this.emit('stopped');
        console.log('✅ Dependency indexer stopped');
    }
}

export { DependencyIndexer };
