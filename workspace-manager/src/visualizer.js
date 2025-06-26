// Advanced Topology Visualizer
// Creates interactive network topology maps with D3.js

import fs from 'fs-extra';
import path from 'path';
import { EventEmitter } from 'events';

class TopologyVisualizer extends EventEmitter {
    constructor(config, indexer) {
        super();
        this.config = config;
        this.indexer = indexer;
        this.nodes = new Map();
        this.edges = new Map();
        this.groups = new Map();
        this.isRunning = false;
        
        this.visualization = {
            fileTopology: null,
            dependencyGraph: null,
            lastUpdate: null,
            nodeCount: 0,
            edgeCount: 0
        };
    }

    async start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('🎨 Starting topology visualization...');
        
        await this.generateTopology();
        this.emit('started');
        
        console.log('✅ Topology visualization started');
    }

    async generateTopology() {
        if (!this.indexer || !this.indexer.fileAnalysis) {
            console.log('⚠️ No indexer data available for topology generation');
            return;
        }

        console.log('🔄 Generating topology from indexed data...');
        
        // Generate file topology
        this.visualization.fileTopology = await this.generateFileTopology();
        
        // Generate dependency graph
        this.visualization.dependencyGraph = await this.generateDependencyGraph();
        
        this.visualization.lastUpdate = new Date();
        this.visualization.nodeCount = this.nodes.size;
        this.visualization.edgeCount = this.edges.size;
        
        console.log(`✅ Topology generated: ${this.visualization.nodeCount} nodes, ${this.visualization.edgeCount} edges`);
        
        this.emit('topologyGenerated', this.visualization);
    }

    async generateFileTopology() {
        const fileNodes = [];
        const fileEdges = [];
        const directories = new Map();
        
        // Create nodes for each file
        for (const [filePath, analysis] of this.indexer.fileAnalysis) {
            const dir = path.dirname(filePath);
            const fileName = path.basename(filePath);
            
            // Create directory group if not exists
            if (!directories.has(dir)) {
                directories.set(dir, {
                    id: `dir_${dir}`,
                    name: dir || 'root',
                    type: 'directory',
                    files: [],
                    size: 0,
                    x: Math.random() * 800,
                    y: Math.random() * 600
                });
            }
            
            // Create file node
            const fileNode = {
                id: `file_${filePath}`,
                name: fileName,
                fullPath: filePath,
                type: 'file',
                fileType: analysis.type,
                size: analysis.size,
                lines: analysis.lines,
                group: dir,
                dependencies: analysis.dependencies?.length || 0,
                functions: analysis.functions?.length || 0,
                classes: analysis.classes?.length || 0,
                color: this.getFileTypeColor(analysis.type),
                x: Math.random() * 800 + 100,
                y: Math.random() * 600 + 100,
                radius: Math.max(5, Math.min(20, (analysis.size || 0) / 1000))
            };
            
            fileNodes.push(fileNode);
            directories.get(dir).files.push(fileNode.id);
            directories.get(dir).size += analysis.size || 0;
            
            this.nodes.set(fileNode.id, fileNode);
        }
        
        // Create directory nodes
        for (const [dirPath, dirData] of directories) {
            const dirNode = {
                id: dirData.id,
                name: dirData.name,
                type: 'directory',
                files: dirData.files,
                size: dirData.size,
                color: '#4A90E2',
                x: dirData.x,
                y: dirData.y,
                radius: Math.max(15, Math.min(40, dirData.files.length * 2))
            };
            
            this.nodes.set(dirNode.id, dirNode);
            this.groups.set(dirPath, dirNode);
        }
        
        return {
            nodes: Array.from(this.nodes.values()),
            groups: Array.from(this.groups.values()),
            edges: fileEdges,
            type: 'fileTopology'
        };
    }

    async generateDependencyGraph() {
        const depNodes = [];
        const depEdges = [];
        const nodeMap = new Map();
        
        // Create nodes for files with dependencies
        for (const [filePath, analysis] of this.indexer.fileAnalysis) {
            if (analysis.dependencies && analysis.dependencies.length > 0) {
                const node = {
                    id: `dep_${filePath}`,
                    name: path.basename(filePath),
                    fullPath: filePath,
                    type: 'file',
                    fileType: analysis.type,
                    dependencyCount: analysis.dependencies.length,
                    dependents: this.indexer.getDependents(filePath).length,
                    color: this.getDependencyColor(analysis.dependencies.length),
                    x: Math.random() * 800 + 100,
                    y: Math.random() * 600 + 100,
                    radius: Math.max(8, Math.min(25, analysis.dependencies.length * 2))
                };
                
                depNodes.push(node);
                nodeMap.set(filePath, node);
            }
        }
        
        // Create edges for dependencies
        let edgeId = 0;
        for (const [filePath, dependencies] of this.indexer.dependencyGraph) {
            const sourceNode = nodeMap.get(filePath);
            if (!sourceNode) continue;
            
            for (const dep of dependencies) {
                if (dep.type === 'internal') {
                    const targetNode = nodeMap.get(dep.name);
                    if (targetNode) {
                        const edge = {
                            id: `edge_${edgeId++}`,
                            source: sourceNode.id,
                            target: targetNode.id,
                            type: 'dependency',
                            weight: 1,
                            color: '#666'
                        };
                        
                        depEdges.push(edge);
                        this.edges.set(edge.id, edge);
                    }
                }
            }
        }
        
        return {
            nodes: depNodes,
            edges: depEdges,
            type: 'dependencyGraph'
        };
    }

    getFileTypeColor(type) {
        const colors = {
            'javascript': '#F7DF1E',
            'typescript': '#3178C6',
            'python': '#3776AB',
            'html': '#E34F26',
            'css': '#1572B6',
            'json': '#00D8FF',
            'markdown': '#083FA1',
            'text': '#808080',
            'unknown': '#999999'
        };
        
        return colors[type] || colors.unknown;
    }

    getDependencyColor(count) {
        if (count === 0) return '#E8E8E8';
        if (count <= 2) return '#90EE90';
        if (count <= 5) return '#FFD700';
        if (count <= 10) return '#FFA500';
        return '#FF6B6B';
    }

    async generateHTML() {
        const templatePath = path.join(process.cwd(), 'templates', 'topology.html');
        const template = await this.loadTemplate();
        
        const html = template
            .replace('{{TOPOLOGY_DATA}}', JSON.stringify(this.visualization))
            .replace('{{CONFIG}}', JSON.stringify(this.config))
            .replace('{{TIMESTAMP}}', new Date().toISOString());
        
        return html;
    }

    async loadTemplate() {
        const templatePath = path.join(process.cwd(), 'templates', 'topology.html');
        
        try {
            return await fs.readFile(templatePath, 'utf8');
        } catch (error) {
            // Return default template if file doesn't exist
            return this.getDefaultTemplate();
        }
    }

    getDefaultTemplate() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workspace Topology</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            color: #fff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            overflow: hidden;
        }
        
        .container {
            display: flex;
            height: 100vh;
        }
        
        .sidebar {
            width: 300px;
            background: #111;
            padding: 20px;
            overflow-y: auto;
            border-right: 1px solid #333;
        }
        
        .main-content {
            flex: 1;
            position: relative;
        }
        
        .tabs {
            display: flex;
            background: #222;
            border-bottom: 1px solid #333;
        }
        
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background: #222;
            color: #fff;
            font-size: 14px;
        }
        
        .tab.active {
            background: #333;
            border-bottom: 2px solid #4A90E2;
        }
        
        .tab:hover {
            background: #333;
        }
        
        .viz-container {
            width: 100%;
            height: calc(100vh - 50px);
            position: relative;
        }
        
        .node {
            cursor: pointer;
            stroke: #fff;
            stroke-width: 1.5px;
        }
        
        .node:hover {
            stroke-width: 3px;
        }
        
        .link {
            stroke: #666;
            stroke-opacity: 0.6;
            stroke-width: 1px;
        }
        
        .group {
            fill: none;
            stroke: #444;
            stroke-width: 2px;
            stroke-dasharray: 5,5;
        }
        
        .tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            pointer-events: none;
            z-index: 1000;
            font-size: 12px;
            max-width: 200px;
        }
        
        .stats {
            background: #222;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }
        
        .control-panel {
            background: #222;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        
        .control-item {
            margin: 10px 0;
        }
        
        .control-item label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
        }
        
        .control-item input {
            width: 100%;
            padding: 5px;
            background: #333;
            border: 1px solid #555;
            color: #fff;
            border-radius: 3px;
        }
        
        .legend {
            background: #222;
            padding: 15px;
            border-radius: 5px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            margin: 5px 0;
            font-size: 12px;
        }
        
        .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <h2>Workspace Topology</h2>
            
            <div class="stats">
                <h3>Statistics</h3>
                <div class="stat-item">
                    <span>Files:</span>
                    <span id="file-count">-</span>
                </div>
                <div class="stat-item">
                    <span>Dependencies:</span>
                    <span id="dep-count">-</span>
                </div>
                <div class="stat-item">
                    <span>Last Update:</span>
                    <span id="last-update">-</span>
                </div>
            </div>
            
            <div class="control-panel">
                <h3>Controls</h3>
                <div class="control-item">
                    <label>Node Size:</label>
                    <input type="range" id="node-size" min="0.5" max="3" step="0.1" value="1">
                </div>
                <div class="control-item">
                    <label>Link Distance:</label>
                    <input type="range" id="link-distance" min="20" max="200" step="10" value="50">
                </div>
                <div class="control-item">
                    <label>Charge Strength:</label>
                    <input type="range" id="charge-strength" min="-500" max="-50" step="10" value="-200">
                </div>
            </div>
            
            <div class="legend">
                <h3>Legend</h3>
                <div class="legend-item">
                    <div class="legend-color" style="background: #F7DF1E;"></div>
                    <span>JavaScript</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #3178C6;"></div>
                    <span>TypeScript</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #3776AB;"></div>
                    <span>Python</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #00D8FF;"></div>
                    <span>JSON</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #E34F26;"></div>
                    <span>HTML</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #1572B6;"></div>
                    <span>CSS</span>
                </div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="tabs">
                <button class="tab active" onclick="switchTab('topology')">File Topology</button>
                <button class="tab" onclick="switchTab('dependencies')">Dependencies</button>
            </div>
            
            <div class="viz-container">
                <svg id="topology-svg" width="100%" height="100%"></svg>
                <svg id="dependencies-svg" width="100%" height="100%" style="display: none;"></svg>
            </div>
        </div>
    </div>
    
    <div class="tooltip" id="tooltip" style="display: none;"></div>
    
    <script>
        const topologyData = {{TOPOLOGY_DATA}};
        const config = {{CONFIG}};
        
        let currentTab = 'topology';
        let simulation;
        let tooltip = d3.select('#tooltip');
        
        function switchTab(tab) {
            currentTab = tab;
            
            // Update tab buttons
            d3.selectAll('.tab').classed('active', false);
            d3.select(\`button[onclick="switchTab('\${tab}')"]\`).classed('active', true);
            
            // Show/hide SVGs
            d3.select('#topology-svg').style('display', tab === 'topology' ? 'block' : 'none');
            d3.select('#dependencies-svg').style('display', tab === 'dependencies' ? 'block' : 'none');
            
            // Render appropriate visualization
            if (tab === 'topology') {
                renderTopology();
            } else {
                renderDependencies();
            }
        }
        
        function renderTopology() {
            const svg = d3.select('#topology-svg');
            svg.selectAll('*').remove();
            
            if (!topologyData.fileTopology) return;
            
            const width = svg.node().clientWidth;
            const height = svg.node().clientHeight;
            
            const data = topologyData.fileTopology;
            
            // Create simulation
            simulation = d3.forceSimulation(data.nodes)
                .force('link', d3.forceLink([]).id(d => d.id).distance(50))
                .force('charge', d3.forceManyBody().strength(-200))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('collision', d3.forceCollide().radius(d => d.radius + 5));
            
            // Create groups for directories
            const groups = svg.append('g')
                .selectAll('circle')
                .data(data.groups)
                .enter().append('circle')
                .attr('class', 'group')
                .attr('r', d => d.radius)
                .attr('fill', 'none')
                .attr('stroke', '#444')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '5,5');
            
            // Create nodes
            const nodes = svg.append('g')
                .selectAll('circle')
                .data(data.nodes.filter(n => n.type === 'file'))
                .enter().append('circle')
                .attr('class', 'node')
                .attr('r', d => d.radius)
                .attr('fill', d => d.color)
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended))
                .on('mouseover', showTooltip)
                .on('mouseout', hideTooltip);
            
            // Update positions
            simulation.on('tick', () => {
                nodes
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y);
                    
                groups
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y);
            });
            
            updateStats();
        }
        
        function renderDependencies() {
            const svg = d3.select('#dependencies-svg');
            svg.selectAll('*').remove();
            
            if (!topologyData.dependencyGraph) return;
            
            const width = svg.node().clientWidth;
            const height = svg.node().clientHeight;
            
            const data = topologyData.dependencyGraph;
            
            // Create simulation
            simulation = d3.forceSimulation(data.nodes)
                .force('link', d3.forceLink(data.edges).id(d => d.id).distance(60))
                .force('charge', d3.forceManyBody().strength(-300))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('collision', d3.forceCollide().radius(d => d.radius + 5));
            
            // Create links
            const links = svg.append('g')
                .selectAll('line')
                .data(data.edges)
                .enter().append('line')
                .attr('class', 'link')
                .attr('stroke', d => d.color)
                .attr('stroke-width', 1);
            
            // Create nodes
            const nodes = svg.append('g')
                .selectAll('circle')
                .data(data.nodes)
                .enter().append('circle')
                .attr('class', 'node')
                .attr('r', d => d.radius)
                .attr('fill', d => d.color)
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended))
                .on('mouseover', showTooltip)
                .on('mouseout', hideTooltip);
            
            // Update positions
            simulation.on('tick', () => {
                links
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);
                    
                nodes
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y);
            });
            
            updateStats();
        }
        
        function showTooltip(event, d) {
            const tooltip = d3.select('#tooltip');
            
            let content = \`<strong>\${d.name}</strong><br>\`;
            content += \`Type: \${d.fileType || d.type}<br>\`;
            
            if (d.size) content += \`Size: \${d.size} bytes<br>\`;
            if (d.lines) content += \`Lines: \${d.lines}<br>\`;
            if (d.dependencies !== undefined) content += \`Dependencies: \${d.dependencies}<br>\`;
            if (d.dependents !== undefined) content += \`Dependents: \${d.dependents}<br>\`;
            if (d.functions !== undefined) content += \`Functions: \${d.functions}<br>\`;
            if (d.classes !== undefined) content += \`Classes: \${d.classes}<br>\`;
            
            tooltip
                .style('display', 'block')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .html(content);
        }
        
        function hideTooltip() {
            d3.select('#tooltip').style('display', 'none');
        }
        
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        
        function updateStats() {
            const fileCount = topologyData.fileTopology ? topologyData.fileTopology.nodes.filter(n => n.type === 'file').length : 0;
            const depCount = topologyData.dependencyGraph ? topologyData.dependencyGraph.edges.length : 0;
            const lastUpdate = topologyData.lastUpdate ? new Date(topologyData.lastUpdate).toLocaleString() : 'Never';
            
            d3.select('#file-count').text(fileCount);
            d3.select('#dep-count').text(depCount);
            d3.select('#last-update').text(lastUpdate);
        }
        
        // Control handlers
        d3.select('#node-size').on('input', function() {
            const scale = +this.value;
            d3.selectAll('.node').attr('r', d => d.radius * scale);
        });
        
        d3.select('#link-distance').on('input', function() {
            const distance = +this.value;
            if (simulation) {
                simulation.force('link').distance(distance);
                simulation.alpha(0.3).restart();
            }
        });
        
        d3.select('#charge-strength').on('input', function() {
            const strength = +this.value;
            if (simulation) {
                simulation.force('charge').strength(strength);
                simulation.alpha(0.3).restart();
            }
        });
        
        // Initialize
        renderTopology();
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            location.reload();
        }, 30000);
    </script>
</body>
</html>`;
    }

    async saveVisualization(outputPath) {
        const html = await this.generateHTML();
        await fs.writeFile(outputPath, html);
        console.log(`✅ Topology visualization saved to: ${outputPath}`);
    }

    updateFromIndexer() {
        if (this.isRunning) {
            this.generateTopology();
        }
    }

    getVisualizationData() {
        return this.visualization;
    }

    getStats() {
        return {
            isRunning: this.isRunning,
            nodeCount: this.visualization.nodeCount,
            edgeCount: this.visualization.edgeCount,
            lastUpdate: this.visualization.lastUpdate
        };
    }

    stop() {
        this.isRunning = false;
        this.emit('stopped');
        console.log('✅ Topology visualizer stopped');
    }
}

export { TopologyVisualizer };
