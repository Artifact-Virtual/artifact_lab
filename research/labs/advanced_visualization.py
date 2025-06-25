#!/usr/bin/env python3
"""
Advanced Visualization Engine for Research Lab
Uses Apache ECharts, D3.js, and custom high-performance charting
Built for maximum security and sophisticated research visualization
"""

import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.animation import FuncAnimation
import seaborn as sns
from jinja2 import Template
import base64
from io import BytesIO

logger = logging.getLogger("research-visualization")

class VisualizationType:
    """Advanced visualization types for research analysis"""
    
    # Statistical Visualizations
    STATISTICAL_DISTRIBUTION = "statistical_distribution"
    CORRELATION_HEATMAP = "correlation_heatmap"
    REGRESSION_ANALYSIS = "regression_analysis"
    CONFIDENCE_INTERVALS = "confidence_intervals"
    
    # Behavioral Visualizations  
    BEHAVIORAL_TIMELINE = "behavioral_timeline"
    DECISION_PATTERNS = "decision_patterns"
    ADAPTATION_CURVES = "adaptation_curves"
    PERFORMANCE_METRICS = "performance_metrics"
    
    # Cognitive Visualizations
    COGNITIVE_NETWORK = "cognitive_network"
    MEMORY_FORMATION = "memory_formation"
    LEARNING_PROGRESSION = "learning_progression"
    ATTENTION_HEATMAP = "attention_heatmap"
    
    # Temporal Visualizations
    TIME_SERIES_ANALYSIS = "time_series_analysis"
    PHASE_TRANSITIONS = "phase_transitions"
    OSCILLATION_PATTERNS = "oscillation_patterns"
    TREND_DECOMPOSITION = "trend_decomposition"
    
    # Comparative Visualizations
    MULTI_AGENT_COMPARISON = "multi_agent_comparison"
    EXPERIMENT_VARIANTS = "experiment_variants"
    BASELINE_COMPARISON = "baseline_comparison"
    
    # Interactive Dashboards
    REAL_TIME_DASHBOARD = "real_time_dashboard"
    INTERACTIVE_EXPLORER = "interactive_explorer"
    DRILL_DOWN_ANALYSIS = "drill_down_analysis"

class AdvancedVisualizationEngine:
    """
    High-performance visualization engine with Apache ECharts integration
    Designed for sophisticated research analysis and secure data presentation
    """
    
    def __init__(self, output_dir: Path, security_level: str = "CONFIDENTIAL"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.security_level = security_level
        self.chart_templates = self._load_chart_templates()
        
        # Configure matplotlib for high-quality output
        plt.style.use('seaborn-v0_8-whitegrid')
        plt.rcParams['figure.figsize'] = (12, 8)
        plt.rcParams['figure.dpi'] = 300
        plt.rcParams['font.size'] = 10
        
        logger.info(f"Advanced Visualization Engine initialized - Security: {security_level}")
    
    def _load_chart_templates(self) -> Dict[str, Template]:
        """Load Apache ECharts and D3.js templates"""
        templates = {}
        
        # Apache ECharts templates for interactive charts
        templates['echarts_base'] = Template("""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Research Analysis - {{ title }}</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
    <style>
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 20px;
            background: #f5f5f5;
        }
        .chart-container { 
            width: 100%; 
            height: 600px; 
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .security-banner {
            background: #dc3545;
            color: white;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .metadata {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="security-banner">{{ security_level }} - RESEARCH DATA</div>
    <h1>{{ title }}</h1>
    <div id="chart" class="chart-container"></div>
    <div class="metadata">
        <h3>Analysis Metadata</h3>
        <p><strong>Generated:</strong> {{ timestamp }}</p>
        <p><strong>Data Points:</strong> {{ data_points }}</p>
        <p><strong>Analysis Type:</strong> {{ analysis_type }}</p>
    </div>
    
    <script>
        var chartDom = document.getElementById('chart');
        var myChart = echarts.init(chartDom);
        var option = {{ chart_config | safe }};
        myChart.setOption(option);
        
        // Responsive resize
        window.addEventListener('resize', function() {
            myChart.resize();
        });
    </script>
</body>
</html>
        """)
        
        return templates
    
    async def generate_statistical_distribution(self, data: Dict[str, Any], 
                                              parameters: Dict[str, Any] = None) -> str:
        """Generate statistical distribution visualization"""
        
        # Extract data
        values = np.array(data.get('values', []))
        variable_name = data.get('variable_name', 'Variable')
        
        # Create matplotlib figure
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle(f'Statistical Distribution Analysis: {variable_name}', fontsize=16)
        
        # Histogram with KDE
        axes[0, 0].hist(values, bins=30, density=True, alpha=0.7, color='skyblue', edgecolor='black')
        sns.kdeplot(values, ax=axes[0, 0], color='red', linewidth=2)
        axes[0, 0].set_title('Distribution with KDE')
        axes[0, 0].set_xlabel(variable_name)
        axes[0, 0].set_ylabel('Density')
        
        # Q-Q Plot
        from scipy import stats
        stats.probplot(values, dist="norm", plot=axes[0, 1])
        axes[0, 1].set_title('Q-Q Plot (Normality Test)')
        
        # Box Plot
        box_plot = axes[1, 0].boxplot(values, patch_artist=True)
        box_plot['boxes'][0].set_facecolor('lightgreen')
        axes[1, 0].set_title('Box Plot')
        axes[1, 0].set_ylabel(variable_name)
        
        # Statistical Summary
        mean_val = np.mean(values)
        std_val = np.std(values)
        skew_val = stats.skew(values)
        kurtosis_val = stats.kurtosis(values)
        
        stats_text = f"""Statistical Summary:
Mean: {mean_val:.3f}
Std Dev: {std_val:.3f}
Skewness: {skew_val:.3f}
Kurtosis: {kurtosis_val:.3f}
Min: {np.min(values):.3f}
Max: {np.max(values):.3f}
        """
        
        axes[1, 1].text(0.1, 0.5, stats_text, transform=axes[1, 1].transAxes,
                        fontsize=12, verticalalignment='center',
                        bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))
        axes[1, 1].set_title('Statistical Summary')
        axes[1, 1].axis('off')
        
        # Save high-quality plot
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"statistical_distribution_{timestamp}.png"
        filepath = self.output_dir / filename
        
        plt.tight_layout()
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        # Generate interactive ECharts version
        interactive_file = await self._generate_interactive_distribution(values, variable_name)
        
        logger.info(f"Generated statistical distribution visualization: {filename}")
        return str(filepath)
    
    async def generate_behavioral_timeline(self, data: Dict[str, Any],
                                         parameters: Dict[str, Any] = None) -> str:
        """Generate behavioral timeline visualization"""
        
        timestamps = pd.to_datetime(data.get('timestamps', []))
        behaviors = data.get('behaviors', [])
        performance_scores = data.get('performance_scores', [])
        
        fig, axes = plt.subplots(3, 1, figsize=(15, 12))
        fig.suptitle('Behavioral Timeline Analysis', fontsize=16)
        
        # Behavior frequency over time
        behavior_counts = pd.Series(behaviors).value_counts()
        unique_behaviors = behavior_counts.index
        colors = plt.cm.Set3(np.linspace(0, 1, len(unique_behaviors)))
        
        for i, behavior in enumerate(unique_behaviors):
            behavior_times = [t for t, b in zip(timestamps, behaviors) if b == behavior]
            if behavior_times:
                axes[0].scatter(behavior_times, [i] * len(behavior_times), 
                              c=[colors[i]], s=60, alpha=0.7, label=behavior)
        
        axes[0].set_title('Behavior Occurrence Timeline')
        axes[0].set_ylabel('Behavior Type')
        axes[0].legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        
        # Performance score evolution
        if performance_scores:
            axes[1].plot(timestamps, performance_scores, linewidth=2, color='blue', marker='o')
            
            # Add trend line
            from scipy import stats
            x_numeric = np.arange(len(timestamps))
            slope, intercept, r_value, p_value, std_err = stats.linregress(x_numeric, performance_scores)
            trend_line = slope * x_numeric + intercept
            axes[1].plot(timestamps, trend_line, '--', color='red', linewidth=2, 
                        label=f'Trend (R²={r_value**2:.3f})')
            
            axes[1].set_title('Performance Score Evolution')
            axes[1].set_ylabel('Performance Score')
            axes[1].legend()
            axes[1].grid(True, alpha=0.3)
        
        # Behavior transition matrix
        if len(behaviors) > 1:
            transitions = {}
            for i in range(len(behaviors) - 1):
                current = behaviors[i]
                next_behavior = behaviors[i + 1]
                key = f"{current} → {next_behavior}"
                transitions[key] = transitions.get(key, 0) + 1
            
            transition_labels = list(transitions.keys())
            transition_counts = list(transitions.values())
            
            if transition_labels:
                bars = axes[2].barh(transition_labels, transition_counts, color='lightcoral')
                axes[2].set_title('Behavior Transition Frequency')
                axes[2].set_xlabel('Frequency')
                
                # Add value labels on bars
                for bar, count in zip(bars, transition_counts):
                    axes[2].text(bar.get_width() + 0.1, bar.get_y() + bar.get_height()/2,
                               str(count), ha='left', va='center')
        
        # Save visualization
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"behavioral_timeline_{timestamp}.png"
        filepath = self.output_dir / filename
        
        plt.tight_layout()
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Generated behavioral timeline: {filename}")
        return str(filepath)
    
    async def generate_cognitive_network(self, data: Dict[str, Any],
                                       parameters: Dict[str, Any] = None) -> str:
        """Generate cognitive network visualization"""
        
        nodes = data.get('nodes', [])
        edges = data.get('edges', [])
        node_weights = data.get('node_weights', {})
        edge_weights = data.get('edge_weights', {})
        
        # Create network visualization using matplotlib
        fig, ax = plt.subplots(figsize=(14, 10))
        
        # Position nodes in a circle for clear layout
        n_nodes = len(nodes)
        positions = {}
        for i, node in enumerate(nodes):
            angle = 2 * np.pi * i / n_nodes
            positions[node] = (np.cos(angle), np.sin(angle))
        
        # Draw edges
        for edge in edges:
            if len(edge) >= 2:
                start_pos = positions.get(edge[0])
                end_pos = positions.get(edge[1])
                if start_pos and end_pos:
                    weight = edge_weights.get(f"{edge[0]}-{edge[1]}", 1.0)
                    ax.plot([start_pos[0], end_pos[0]], [start_pos[1], end_pos[1]],
                           'b-', alpha=0.6, linewidth=weight * 3)
        
        # Draw nodes
        for node in nodes:
            pos = positions[node]
            weight = node_weights.get(node, 1.0)
            circle = plt.Circle(pos, radius=weight * 0.1, color='lightblue', 
                              edgecolor='darkblue', linewidth=2)
            ax.add_patch(circle)
            ax.text(pos[0], pos[1], node, ha='center', va='center', 
                   fontsize=8, fontweight='bold')
        
        ax.set_xlim(-1.5, 1.5)
        ax.set_ylim(-1.5, 1.5)
        ax.set_aspect('equal')
        ax.set_title('Cognitive Network Structure', fontsize=16)
        ax.axis('off')
        
        # Add legend
        legend_elements = [
            mpatches.Circle((0, 0), 0.1, facecolor='lightblue', edgecolor='darkblue', label='Cognitive Node'),
            mpatches.Patch(color='blue', alpha=0.6, label='Neural Connection')
        ]
        ax.legend(handles=legend_elements, loc='upper right')
        
        # Save visualization
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"cognitive_network_{timestamp}.png"
        filepath = self.output_dir / filename
        
        plt.savefig(filepath, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Generated cognitive network: {filename}")
        return str(filepath)
    
    async def _generate_interactive_distribution(self, values: np.ndarray, 
                                               variable_name: str) -> str:
        """Generate interactive Apache ECharts distribution chart"""
        
        # Calculate histogram data
        hist, bin_edges = np.histogram(values, bins=30, density=True)
        bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
        
        # Prepare ECharts configuration
        chart_config = {
            "title": {
                "text": f"Interactive Distribution: {variable_name}",
                "left": "center"
            },
            "tooltip": {
                "trigger": "axis",
                "formatter": "Value: {b}<br/>Density: {c}"
            },
            "xAxis": {
                "type": "value",
                "name": variable_name
            },
            "yAxis": {
                "type": "value",
                "name": "Density"
            },
            "series": [
                {
                    "name": "Distribution",
                    "type": "bar",
                    "data": [[float(x), float(y)] for x, y in zip(bin_centers, hist)],
                    "itemStyle": {
                        "color": "#5470c6"
                    }
                }
            ],
            "toolbox": {
                "feature": {
                    "saveAsImage": {"title": "Save"},
                    "dataZoom": {"title": {"zoom": "Zoom", "back": "Reset"}}
                }
            },
            "dataZoom": [
                {"type": "slider"},
                {"type": "inside"}
            ]
        }
        
        # Generate HTML file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"interactive_distribution_{timestamp}.html"
        filepath = self.output_dir / filename
        
        html_content = self.chart_templates['echarts_base'].render(
            title=f"Distribution Analysis: {variable_name}",
            security_level=self.security_level,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            data_points=len(values),
            analysis_type="Statistical Distribution",
            chart_config=json.dumps(chart_config, indent=2)
        )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"Generated interactive distribution chart: {filename}")
        return str(filepath)
    
    async def generate_real_time_dashboard(self, data: Dict[str, Any],
                                         parameters: Dict[str, Any] = None) -> str:
        """Generate real-time monitoring dashboard"""
        
        # Dashboard configuration for multiple metrics
        dashboard_config = {
            "title": {
                "text": "Research Lab - Real-Time Dashboard",
                "left": "center"
            },
            "grid": [
                {"left": "3%", "right": "48%", "top": "10%", "bottom": "60%"},
                {"left": "52%", "right": "3%", "top": "10%", "bottom": "60%"},
                {"left": "3%", "right": "48%", "top": "65%", "bottom": "5%"},
                {"left": "52%", "right": "3%", "top": "65%", "bottom": "5%"}
            ],
            "xAxis": [
                {"type": "category", "gridIndex": 0},
                {"type": "category", "gridIndex": 1},
                {"type": "category", "gridIndex": 2},
                {"type": "value", "gridIndex": 3}
            ],
            "yAxis": [
                {"type": "value", "gridIndex": 0},
                {"type": "value", "gridIndex": 1},
                {"type": "value", "gridIndex": 2},
                {"type": "value", "gridIndex": 3}
            ],
            "series": [
                {
                    "name": "Performance Metrics",
                    "type": "line",
                    "xAxisIndex": 0,
                    "yAxisIndex": 0,
                    "data": data.get('performance_data', [])
                },
                {
                    "name": "Cognitive Load",
                    "type": "bar",
                    "xAxisIndex": 1,
                    "yAxisIndex": 1,
                    "data": data.get('cognitive_load', [])
                },
                {
                    "name": "System Resources",
                    "type": "gauge",
                    "xAxisIndex": 2,
                    "yAxisIndex": 2,
                    "data": [{"value": data.get('cpu_usage', 0), "name": "CPU"}]
                },
                {
                    "name": "Memory Usage",
                    "type": "scatter",
                    "xAxisIndex": 3,
                    "yAxisIndex": 3,
                    "data": data.get('memory_usage', [])
                }
            ]
        }
        
        # Generate dashboard HTML
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"realtime_dashboard_{timestamp}.html"
        filepath = self.output_dir / filename
        
        html_content = self.chart_templates['echarts_base'].render(
            title="Real-Time Research Dashboard",
            security_level=self.security_level,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            data_points="Real-time",
            analysis_type="System Monitoring",
            chart_config=json.dumps(dashboard_config, indent=2)
        )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"Generated real-time dashboard: {filename}")
        return str(filepath)

# Usage example and testing
if __name__ == "__main__":
    import asyncio
    
    async def test_visualization_engine():
        """Test the visualization engine"""
        output_dir = Path("test_visualizations")
        engine = AdvancedVisualizationEngine(output_dir, "CONFIDENTIAL")
        
        # Test statistical distribution
        test_data = {
            'values': np.random.normal(100, 15, 1000).tolist(),
            'variable_name': 'Cognitive Performance Score'
        }
        
        result = await engine.generate_statistical_distribution(test_data)
        print(f"Generated visualization: {result}")
    
    # Run test
    asyncio.run(test_visualization_engine())
