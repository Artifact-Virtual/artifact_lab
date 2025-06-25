#!/usr/bin/env python3
"""
Research Lab Management Interface
Command-line interface for the Advanced Research Lab System
"""

import asyncio
import json
import click
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any
import sys

# Add research lab modules to path
sys.path.append(str(Path(__file__).parent))

from secure_research_lab import SecureResearchLab, SecurityLevel, AnalysisType
from advanced_visualization import AdvancedVisualizationEngine
from analysis_engine import StatisticalAnalysisEngine, BehavioralAnalysisEngine

logger = logging.getLogger("research-lab-cli")

@click.group()
@click.option('--lab-dir', default='research_lab_workspace', help='Research lab directory')
@click.option('--security-level', default='CONFIDENTIAL', 
              type=click.Choice(['RESTRICTED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET']),
              help='Security classification level')
@click.pass_context
def cli(ctx, lab_dir: str, security_level: str):
    """Advanced Research Lab Management Interface"""
    ctx.ensure_object(dict)
    ctx.obj['lab_dir'] = lab_dir
    ctx.obj['security_level'] = SecurityLevel(security_level)
    
    # Initialize lab system
    ctx.obj['lab'] = SecureResearchLab(lab_dir)
    
    click.echo(f"🔬 Research Lab initialized")
    click.echo(f"📂 Directory: {lab_dir}")
    click.echo(f"🔒 Security Level: {security_level}")

@cli.command()
@click.option('--researcher-id', required=True, help='Researcher identification')
@click.option('--operations', default='read,analyze,visualize', help='Allowed operations (comma-separated)')
@click.pass_context
def create_session(ctx, researcher_id: str, operations: str):
    """Create a new research session"""
    
    async def _create_session():
        lab = ctx.obj['lab']
        security_level = ctx.obj['security_level']
        allowed_operations = operations.split(',')
        
        session_id = await lab.create_research_session(
            researcher_id, security_level, allowed_operations
        )
        
        click.echo(f"✅ Session created: {session_id}")
        click.echo(f"👤 Researcher: {researcher_id}")
        click.echo(f"⚡ Operations: {', '.join(allowed_operations)}")
        
        # Save session info for easy access
        session_file = Path(ctx.obj['lab_dir']) / f"session_{session_id}.json"
        with open(session_file, 'w') as f:
            json.dump({
                'session_id': session_id,
                'researcher_id': researcher_id,
                'security_level': security_level.value,
                'allowed_operations': allowed_operations,
                'created': datetime.now().isoformat()
            }, f, indent=2)
        
        return session_id
    
    return asyncio.run(_create_session())

@cli.command()
@click.option('--session-id', required=True, help='Research session ID')
@click.option('--data-file', required=True, type=click.Path(exists=True), help='Research data file (JSON)')
@click.option('--analysis-type', required=True,
              type=click.Choice(['statistical', 'behavioral', 'cognitive', 'temporal', 'comparative', 'predictive']),
              help='Type of analysis to perform')
@click.option('--output-name', help='Custom name for output files')
@click.pass_context
def analyze(ctx, session_id: str, data_file: str, analysis_type: str, output_name: str):
    """Run sophisticated analysis on research data"""
    
    async def _analyze():
        lab = ctx.obj['lab']
        
        # Load research data
        with open(data_file, 'r') as f:
            research_data = json.load(f)
        
        click.echo(f"📊 Starting {analysis_type} analysis...")
        click.echo(f"📂 Data file: {data_file}")
        
        # Run analysis
        analysis_enum = AnalysisType(analysis_type)
        result_id = await lab.run_analysis(session_id, analysis_enum, research_data)
        
        click.echo(f"✅ Analysis completed: {result_id}")
        
        # Generate visualizations
        viz_engine = AdvancedVisualizationEngine(
            Path(ctx.obj['lab_dir']) / "visualizations",
            ctx.obj['security_level'].value
        )
        
        if analysis_type == 'statistical':
            viz_file = await viz_engine.generate_statistical_distribution(research_data)
            click.echo(f"📈 Statistical visualization: {viz_file}")
            
        elif analysis_type == 'behavioral':
            viz_file = await viz_engine.generate_behavioral_timeline(research_data)
            click.echo(f"🧠 Behavioral visualization: {viz_file}")
            
        elif analysis_type == 'cognitive':
            viz_file = await viz_engine.generate_cognitive_network(research_data)
            click.echo(f"🔗 Cognitive network: {viz_file}")
        
        return result_id
    
    return asyncio.run(_analyze())

@cli.command()
@click.option('--session-id', required=True, help='Research session ID')
@click.option('--sample-type', default='statistical',
              type=click.Choice(['statistical', 'behavioral', 'cognitive', 'temporal']),
              help='Type of sample data to generate')
@click.option('--size', default=1000, help='Number of data points')
@click.pass_context
def generate_sample_data(ctx, session_id: str, sample_type: str, size: int):
    """Generate sample research data for testing"""
    
    import numpy as np
    import random
    from datetime import timedelta
    
    click.echo(f"🔬 Generating {sample_type} sample data ({size} points)...")
    
    if sample_type == 'statistical':
        data = {
            'values': np.random.normal(100, 15, size).tolist(),
            'variable_name': 'Cognitive Performance Score',
            'metadata': {
                'generated': datetime.now().isoformat(),
                'type': 'simulated_cognitive_performance',
                'distribution': 'normal',
                'mean': 100,
                'std': 15
            }
        }
    
    elif sample_type == 'behavioral':
        behaviors = ['explore', 'analyze', 'decide', 'act', 'reflect', 'adapt']
        timestamps = []
        current_time = datetime.now()
        
        for i in range(size):
            timestamps.append(current_time.isoformat())
            current_time += timedelta(seconds=random.randint(1, 300))
        
        data = {
            'behaviors': [random.choice(behaviors) for _ in range(size)],
            'timestamps': timestamps,
            'performance_scores': (np.random.beta(2, 5, size) * 100).tolist(),
            'metadata': {
                'generated': datetime.now().isoformat(),
                'type': 'simulated_behavioral_sequence',
                'behaviors': behaviors
            }
        }
    
    elif sample_type == 'cognitive':
        nodes = ['perception', 'memory', 'reasoning', 'decision', 'action', 'learning']
        edges = [
            ['perception', 'memory'],
            ['memory', 'reasoning'],
            ['reasoning', 'decision'],
            ['decision', 'action'],
            ['action', 'learning'],
            ['learning', 'memory'],
            ['perception', 'reasoning'],
            ['memory', 'decision']
        ]
        
        node_weights = {node: random.uniform(0.5, 2.0) for node in nodes}
        edge_weights = {f"{edge[0]}-{edge[1]}": random.uniform(0.3, 1.5) for edge in edges}
        
        data = {
            'nodes': nodes,
            'edges': edges,
            'node_weights': node_weights,
            'edge_weights': edge_weights,
            'metadata': {
                'generated': datetime.now().isoformat(),
                'type': 'simulated_cognitive_network'
            }
        }
    
    elif sample_type == 'temporal':
        # Generate time series data with trends and seasonality
        x = np.linspace(0, 4*np.pi, size)
        trend = 0.1 * x
        seasonal = 10 * np.sin(x) + 5 * np.cos(2*x)
        noise = np.random.normal(0, 2, size)
        values = 50 + trend + seasonal + noise
        
        timestamps = []
        current_time = datetime.now()
        for i in range(size):
            timestamps.append(current_time.isoformat())
            current_time += timedelta(hours=1)
        
        data = {
            'timestamps': timestamps,
            'values': values.tolist(),
            'variable_name': 'Temporal Performance Metric',
            'metadata': {
                'generated': datetime.now().isoformat(),
                'type': 'simulated_time_series',
                'components': ['trend', 'seasonal', 'noise']
            }
        }
    
    # Save sample data
    output_file = Path(ctx.obj['lab_dir']) / f"sample_{sample_type}_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    click.echo(f"✅ Sample data generated: {output_file}")
    click.echo(f"📊 Data points: {size}")
    click.echo(f"🔬 Type: {sample_type}")
    
    return str(output_file)

@cli.command()
@click.option('--session-id', required=True, help='Research session ID')
@click.pass_context
def dashboard(ctx, session_id: str):
    """Launch real-time research dashboard"""
    
    async def _launch_dashboard():
        lab = ctx.obj['lab']
        
        # Generate dashboard data
        dashboard_data = {
            'performance_data': [[i, 50 + i*2 + random.randint(-10, 10)] for i in range(24)],
            'cognitive_load': [[f"Task {i}", random.randint(20, 80)] for i in range(1, 8)],
            'cpu_usage': random.randint(30, 80),
            'memory_usage': [[random.randint(1, 100), random.randint(1, 100)] for _ in range(50)]
        }
        
        viz_engine = AdvancedVisualizationEngine(
            Path(ctx.obj['lab_dir']) / "dashboards",
            ctx.obj['security_level'].value
        )
        
        dashboard_file = await viz_engine.generate_real_time_dashboard(dashboard_data)
        
        click.echo(f"🚀 Dashboard generated: {dashboard_file}")
        click.echo(f"🌐 Open in browser to view real-time metrics")
        
        return dashboard_file
    
    return asyncio.run(_launch_dashboard())

@cli.command()
@click.pass_context
def status(ctx):
    """Show research lab system status"""
    
    lab_dir = Path(ctx.obj['lab_dir'])
    
    click.echo("🔬 Research Lab System Status")
    click.echo("=" * 40)
    
    # Check directories
    directories = ['encrypted_data', 'analysis_results', 'visualizations', 'logs', 'cognitive_models']
    for dir_name in directories:
        dir_path = lab_dir / dir_name
        status = "✅" if dir_path.exists() else "❌"
        file_count = len(list(dir_path.glob('*'))) if dir_path.exists() else 0
        click.echo(f"{status} {dir_name}: {file_count} files")
    
    # Check active sessions
    session_files = list(lab_dir.glob('session_*.json'))
    click.echo(f"👥 Active sessions: {len(session_files)}")
    
    # Check database
    db_file = lab_dir / "research_data.db"
    db_status = "✅" if db_file.exists() else "❌"
    click.echo(f"{db_status} Database: {db_file.name}")
    
    # Security status
    key_file = lab_dir / ".master_key"
    security_status = "🔒" if key_file.exists() else "🔓"
    click.echo(f"{security_status} Security: {'Encrypted' if key_file.exists() else 'Not configured'}")

@cli.command()
@click.option('--format', default='json', type=click.Choice(['json', 'csv', 'html']),
              help='Export format')
@click.pass_context
def export_results(ctx, format: str):
    """Export all research results"""
    
    lab_dir = Path(ctx.obj['lab_dir'])
    results_dir = lab_dir / "analysis_results"
    
    if not results_dir.exists():
        click.echo("❌ No results directory found")
        return
    
    export_dir = lab_dir / "exports"
    export_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    if format == 'json':
        # Combine all JSON results
        combined_results = {}
        for result_file in results_dir.glob('*.json'):
            with open(result_file, 'r') as f:
                combined_results[result_file.stem] = json.load(f)
        
        export_file = export_dir / f"research_export_{timestamp}.json"
        with open(export_file, 'w') as f:
            json.dump(combined_results, f, indent=2)
    
    elif format == 'html':
        # Generate HTML report
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Research Lab Export - {timestamp}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .security {{ background: #dc3545; color: white; padding: 10px; }}
                .result {{ margin: 20px 0; border: 1px solid #ddd; padding: 15px; }}
            </style>
        </head>
        <body>
            <div class="security">CONFIDENTIAL - RESEARCH DATA</div>
            <h1>Research Lab Export</h1>
            <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>Security Level: {ctx.obj['security_level'].value}</p>
            <!-- Results would be populated here -->
        </body>
        </html>
        """
        
        export_file = export_dir / f"research_report_{timestamp}.html"
        with open(export_file, 'w') as f:
            f.write(html_content)
    
    click.echo(f"📤 Results exported: {export_file}")

if __name__ == "__main__":
    cli()
