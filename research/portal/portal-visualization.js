/**
 * Advanced Visualization Engine for Research Lab Portal
 * Handles 3D visualizations, complex graphs, and interactive charts
 */

class PortalVisualization {
    constructor() {
        this.scenes = {};
        this.renderers = {};
        this.cameras = {};
        this.animations = {};
        this.charts = {};
        this.currentVisualization = null;
        
        this.initializeVisualizationEngine();
    }

    initializeVisualizationEngine() {
        console.log('🔬 Initializing Advanced Visualization Engine...');
        this.setupThreeJS();
        this.setupECharts();
        this.setupD3Visualizations();
        this.initializeQuantumVisualization();
    }

    // Three.js 3D Visualization Setup
    setupThreeJS() {
        // Directory Navigator 3D Scene
        const navigatorContainer = document.getElementById('directoryViewer');
        if (navigatorContainer) {
            this.createDirectoryVisualization(navigatorContainer);
        }

        // Deep Analysis 3D Scene
        const analysisCanvas = document.getElementById('deepAnalysisCanvas');
        if (analysisCanvas) {
            this.createAnalysisVisualization(analysisCanvas);
        }
    }

    createDirectoryVisualization(container) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        // Create directory nodes as 3D objects
        const directoryStructure = this.buildDirectoryStructure();
        this.renderDirectoryNodes(scene, directoryStructure);

        // Camera positioning
        camera.position.z = 15;
        camera.position.y = 5;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        scene.add(ambientLight);
        scene.add(directionalLight);

        // Store references
        this.scenes.directory = scene;
        this.cameras.directory = camera;
        this.renderers.directory = renderer;

        // Start animation loop
        this.startDirectoryAnimation();
    }

    buildDirectoryStructure() {
        return {
            name: 'research',
            type: 'folder',
            children: [
                { name: 'labs', type: 'folder', analysis: 'active' },
                { name: 'head_1', type: 'folder', analysis: 'neural' },
                { name: 'head_2', type: 'folder', analysis: 'behavioral' },
                { name: 'head_3', type: 'folder', analysis: 'cognitive' },
                { name: 'models', type: 'folder', analysis: 'ml' },
                { name: 'journal', type: 'folder', analysis: 'temporal' },
                { name: 'docs', type: 'folder', analysis: 'static' },
                { name: 'cookbooks', type: 'folder', analysis: 'procedural' }
            ]
        };
    }

    renderDirectoryNodes(scene, structure, position = { x: 0, y: 0, z: 0 }, level = 0) {
        const nodeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const nodeColors = {
            'active': 0x00ff00,
            'neural': 0xff6b6b,
            'behavioral': 0x4ecdc4,
            'cognitive': 0x45b7d1,
            'ml': 0xf39c12,
            'temporal': 0x9b59b6,
            'static': 0x95a5a6,
            'procedural': 0xe67e22
        };

        const color = nodeColors[structure.analysis] || 0x3498db;
        const nodeMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });

        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set(position.x, position.y, position.z);
        node.userData = { name: structure.name, type: structure.type, analysis: structure.analysis };

        // Add pulsing animation for active directories
        if (structure.analysis === 'active') {
            this.addPulsingAnimation(node);
        }

        scene.add(node);

        // Render children in a circular pattern
        if (structure.children) {
            const radius = 3 + level * 2;
            const angleStep = (Math.PI * 2) / structure.children.length;
            
            structure.children.forEach((child, index) => {
                const angle = index * angleStep;
                const childPosition = {
                    x: position.x + Math.cos(angle) * radius,
                    y: position.y + (level + 1) * 2,
                    z: position.z + Math.sin(angle) * radius
                };
                this.renderDirectoryNodes(scene, child, childPosition, level + 1);
            });
        }
    }

    addPulsingAnimation(object) {
        const originalScale = object.scale.clone();
        const animationId = setInterval(() => {
            const time = Date.now() * 0.005;
            const scale = 1 + Math.sin(time) * 0.1;
            object.scale.set(scale, scale, scale);
        }, 16);
        
        this.animations[object.uuid] = animationId;
    }

    startDirectoryAnimation() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            if (this.scenes.directory && this.cameras.directory && this.renderers.directory) {
                // Rotate the entire scene slowly
                this.scenes.directory.rotation.y += 0.005;
                this.renderers.directory.render(this.scenes.directory, this.cameras.directory);
            }
        };
        animate();
    }

    // Quantum Visualization Mode
    initializeQuantumVisualization() {
        this.quantumField = {
            particles: [],
            connections: [],
            energy: 0
        };
    }

    createQuantumField(container) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000011, 1);
        container.appendChild(renderer.domElement);

        // Create quantum particles
        const particleCount = 500;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20;
            positions[i + 1] = (Math.random() - 0.5) * 20;
            positions[i + 2] = (Math.random() - 0.5) * 20;
            
            colors[i] = Math.random();
            colors[i + 1] = Math.random() * 0.5 + 0.5;
            colors[i + 2] = 1;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);

        camera.position.z = 15;
        
        this.scenes.quantum = scene;
        this.cameras.quantum = camera;
        this.renderers.quantum = renderer;

        this.startQuantumAnimation();
    }

    startQuantumAnimation() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            if (this.scenes.quantum && this.cameras.quantum && this.renderers.quantum) {
                const time = Date.now() * 0.001;
                this.scenes.quantum.rotation.x = time * 0.1;
                this.scenes.quantum.rotation.y = time * 0.2;
                this.renderers.quantum.render(this.scenes.quantum, this.cameras.quantum);
            }
        };
        animate();
    }

    // ECharts Integration
    setupECharts() {
        this.initializeAnalysisCharts();
        this.initializeProgressCharts();
        this.initializeNetworkGraphs();
    }

    initializeAnalysisCharts() {
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach((container, index) => {
            const chartId = `analysis-chart-${index}`;
            container.id = chartId;
            this.createAnalysisChart(chartId);
        });
    }

    createAnalysisChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const chart = echarts.init(container, 'dark');
        
        const option = {
            backgroundColor: 'transparent',
            title: {
                text: 'Neural Analysis',
                textStyle: { color: '#fff', fontSize: 14 }
            },
            tooltip: { trigger: 'axis' },
            legend: {
                data: ['Accuracy', 'Loss', 'Precision'],
                textStyle: { color: '#fff' }
            },
            xAxis: {
                type: 'category',
                data: ['Epoch 1', 'Epoch 2', 'Epoch 3', 'Epoch 4', 'Epoch 5'],
                axisLabel: { color: '#fff' }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: '#fff' }
            },
            series: [
                {
                    name: 'Accuracy',
                    type: 'line',
                    data: [0.85, 0.88, 0.91, 0.93, 0.95],
                    lineStyle: { color: '#00ff88' },
                    itemStyle: { color: '#00ff88' }
                },
                {
                    name: 'Loss',
                    type: 'line',
                    data: [0.45, 0.35, 0.25, 0.18, 0.12],
                    lineStyle: { color: '#ff6b6b' },
                    itemStyle: { color: '#ff6b6b' }
                },
                {
                    name: 'Precision',
                    type: 'line',
                    data: [0.82, 0.86, 0.89, 0.92, 0.94],
                    lineStyle: { color: '#4ecdc4' },
                    itemStyle: { color: '#4ecdc4' }
                }
            ]
        };

        chart.setOption(option);
        this.charts[containerId] = chart;
        
        // Animate chart updates
        this.animateChartData(chart);
    }

    animateChartData(chart) {
        setInterval(() => {
            const option = chart.getOption();
            option.series.forEach(series => {
                series.data = series.data.map(value => 
                    Math.max(0, Math.min(1, value + (Math.random() - 0.5) * 0.02))
                );
            });
            chart.setOption(option);
        }, 2000);
    }

    // D3.js Visualizations
    setupD3Visualizations() {
        this.createNetworkGraph();
        this.createTimelineVisualization();
        this.createHeatmapVisualization();
    }

    createNetworkGraph() {
        const container = d3.select('#networkVisualization');
        if (container.empty()) return;

        const width = 400;
        const height = 300;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const nodes = [
            { id: 'research', group: 1 },
            { id: 'labs', group: 2 },
            { id: 'models', group: 2 },
            { id: 'analysis', group: 3 },
            { id: 'neural', group: 3 },
            { id: 'behavioral', group: 3 }
        ];

        const links = [
            { source: 'research', target: 'labs' },
            { source: 'research', target: 'models' },
            { source: 'labs', target: 'analysis' },
            { source: 'models', target: 'neural' },
            { source: 'analysis', target: 'behavioral' }
        ];

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2));

        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('stroke', '#4ecdc4')
            .attr('stroke-width', 2);

        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter().append('circle')
            .attr('r', 8)
            .attr('fill', d => d.group === 1 ? '#ff6b6b' : d.group === 2 ? '#4ecdc4' : '#45b7d1')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        });

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
    }

    // Resize handler
    handleResize() {
        Object.keys(this.renderers).forEach(key => {
            const renderer = this.renderers[key];
            const camera = this.cameras[key];
            const container = renderer.domElement.parentElement;
            
            if (container) {
                const width = container.clientWidth;
                const height = container.clientHeight;
                
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            }
        });

        Object.keys(this.charts).forEach(key => {
            this.charts[key].resize();
        });
    }

    // Cleanup
    destroy() {
        Object.values(this.animations).forEach(animationId => {
            clearInterval(animationId);
        });
        
        Object.values(this.charts).forEach(chart => {
            chart.dispose();
        });
        
        Object.values(this.renderers).forEach(renderer => {
            renderer.dispose();
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.portalVisualization = new PortalVisualization();
    
    // Handle resize events
    window.addEventListener('resize', () => {
        window.portalVisualization.handleResize();
    });
});
