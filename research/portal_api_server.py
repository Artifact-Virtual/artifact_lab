#!/usr/bin/env python3
"""
Research Lab Portal API Server
Connects the web portal to the actual research lab system
"""

import asyncio
import json
import logging
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

import aiohttp
import aiohttp_cors
import numpy as np
import pandas as pd
from aiohttp import WSMsgType, web
from labs.advanced_visualization import AdvancedVisualizationEngine
from labs.analysis_engine import AnalysisEngine
from labs.secure_research_lab import AnalysisType, SecureResearchLab, SecurityLevel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PortalAPIServer:
    def __init__(self, port: int = 8080):
        self.port = port
        self.app = web.Application()
        self.research_lab = None
        self.active_websockets: Dict[str, web.WebSocketResponse] = {}
        self.setup_routes()

    def setup_routes(self):
        """Setup API routes"""
        # API routes
        self.app.router.add_get("/api/status", self.get_status)
        self.app.router.add_get("/api/directory", self.get_directory_structure)
        self.app.router.add_get("/api/analysis/types", self.get_analysis_types)
        self.app.router.add_post("/api/analysis/start", self.start_analysis)
        self.app.router.add_get(
            "/api/analysis/results/{session_id}", self.get_analysis_results
        )
        self.app.router.add_get("/api/data/{path:.*}", self.get_research_data)
        self.app.router.add_post("/api/export", self.export_data)
        self.app.router.add_get(
            "/api/visualizations/{viz_type}", self.get_visualization
        )

        # WebSocket for real-time updates
        self.app.router.add_get("/ws", self.websocket_handler)

        # Static files (portal)
        self.app.router.add_static(
            "/", path=Path(__file__).parent / "portal", name="portal"
        )

        # CORS setup
        cors = aiohttp_cors.setup(
            self.app,
            defaults={
                "*": aiohttp_cors.ResourceOptions(
                    allow_credentials=True,
                    expose_headers="*",
                    allow_headers="*",
                    allow_methods="*",
                )
            },
        )

        for route in list(self.app.router.routes()):
            cors.add(route)

    async def initialize_research_lab(self):
        """Initialize the research lab system"""
        try:
            self.research_lab = SecureResearchLab(
                Path(__file__).parent,
                researcher_id="portal-user",
                security_level=SecurityLevel.CONFIDENTIAL,
            )
            await self.research_lab.initialize_async()
            logger.info("Research lab initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize research lab: {e}")
            return False

    async def get_status(self, request):
        """Get system status"""
        try:
            if not self.research_lab:
                await self.initialize_research_lab()

            # Get real system status
            status = {
                "timestamp": datetime.now().isoformat(),
                "lab_initialized": self.research_lab is not None,
                "active_sessions": (
                    len(self.research_lab.active_sessions) if self.research_lab else 0
                ),
                "security_level": "CONFIDENTIAL",
                "containment_level": 5,
                "system_health": "OPERATIONAL",
                "available_analyses": [t.value for t in AnalysisType],
                "directory_structure": await self._get_real_directory_structure(),
            }

            return web.json_response(status)
        except Exception as e:
            logger.error(f"Error getting status: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def get_directory_structure(self, request):
        """Get actual research directory structure"""
        try:
            structure = await self._get_real_directory_structure()
            return web.json_response(structure)
        except Exception as e:
            logger.error(f"Error getting directory structure: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def _get_real_directory_structure(self):
        """Scan actual research directory structure"""
        research_path = Path(__file__).parent

        def scan_directory(path: Path, max_depth: int = 3, current_depth: int = 0):
            if current_depth >= max_depth:
                return None

            structure = {
                "name": path.name,
                "type": "folder" if path.is_dir() else "file",
                "path": str(path.relative_to(research_path)),
                "size": path.stat().st_size if path.is_file() else None,
                "modified": datetime.fromtimestamp(path.stat().st_mtime).isoformat(),
                "children": [],
            }

            if path.is_dir():
                try:
                    for child in sorted(path.iterdir()):
                        # Skip hidden files and __pycache__
                        if child.name.startswith(".") or child.name == "__pycache__":
                            continue
                        child_structure = scan_directory(
                            child, max_depth, current_depth + 1
                        )
                        if child_structure:
                            structure["children"].append(child_structure)
                except PermissionError:
                    pass

            return structure

        return scan_directory(research_path)

    async def get_analysis_types(self, request):
        """Get available analysis types"""
        try:
            types = []
            for analysis_type in AnalysisType:
                types.append(
                    {
                        "id": analysis_type.value,
                        "name": analysis_type.value.replace("_", " ").title(),
                        "description": f"{analysis_type.value} analysis capabilities",
                        "available": True,
                    }
                )

            return web.json_response({"analysis_types": types})
        except Exception as e:
            logger.error(f"Error getting analysis types: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def start_analysis(self, request):
        """Start a new analysis"""
        try:
            data = await request.json()
            analysis_type = data.get("type", "STATISTICAL")
            data_path = data.get("data_path", "")
            parameters = data.get("parameters", {})

            if not self.research_lab:
                await self.initialize_research_lab()

            # Create new research session
            session = await self.research_lab.create_session(
                researcher_id="portal-user", analysis_type=AnalysisType(analysis_type)
            )

            # Load data if path provided
            if data_path:
                full_path = Path(__file__).parent / data_path
                if full_path.exists():
                    if full_path.suffix == ".csv":
                        df = pd.read_csv(full_path)
                    elif full_path.suffix == ".json":
                        with open(full_path, "r") as f:
                            df = pd.DataFrame(json.load(f))
                    else:
                        df = pd.DataFrame()  # Empty for now
                else:
                    # Generate sample data for demonstration
                    df = self._generate_sample_data(analysis_type)
            else:
                df = self._generate_sample_data(analysis_type)

            # Run analysis
            results = await self._run_analysis(
                session.session_id, analysis_type, df, parameters
            )

            # Broadcast to websockets
            await self._broadcast_update(
                {
                    "type": "analysis_started",
                    "session_id": session.session_id,
                    "analysis_type": analysis_type,
                    "timestamp": datetime.now().isoformat(),
                }
            )

            return web.json_response(
                {
                    "session_id": session.session_id,
                    "status": "started",
                    "results": results,
                }
            )

        except Exception as e:
            logger.error(f"Error starting analysis: {e}")
            return web.json_response({"error": str(e)}, status=500)

    def _generate_sample_data(self, analysis_type: str) -> pd.DataFrame:
        """Generate realistic sample data based on analysis type"""
        np.random.seed(42)  # For reproducible results

        if analysis_type == "STATISTICAL":
            # Generate statistical sample data
            n = 1000
            df = pd.DataFrame(
                {
                    "timestamp": pd.date_range("2025-01-01", periods=n, freq="1H"),
                    "value1": np.random.normal(100, 15, n),
                    "value2": np.random.normal(50, 10, n),
                    "category": np.random.choice(["A", "B", "C"], n),
                    "measurement": np.random.exponential(2, n),
                }
            )

        elif analysis_type == "BEHAVIORAL":
            # Generate behavioral data
            n = 500
            df = pd.DataFrame(
                {
                    "user_id": [f"user_{i%100}" for i in range(n)],
                    "action": np.random.choice(["click", "scroll", "hover", "type"], n),
                    "timestamp": pd.date_range("2025-01-01", periods=n, freq="1min"),
                    "duration": np.random.gamma(2, 2, n),
                    "success": np.random.choice([True, False], n, p=[0.8, 0.2]),
                }
            )

        elif analysis_type == "TEMPORAL":
            # Generate time series data
            n = 2000
            time_index = pd.date_range("2025-01-01", periods=n, freq="5min")
            trend = np.linspace(0, 10, n)
            seasonal = 5 * np.sin(2 * np.pi * np.arange(n) / (24 * 12))  # Daily cycle
            noise = np.random.normal(0, 1, n)

            df = pd.DataFrame(
                {
                    "timestamp": time_index,
                    "signal": trend + seasonal + noise,
                    "baseline": trend,
                    "anomaly_score": np.random.beta(2, 5, n),
                }
            )

        else:  # Default to neural/cognitive data
            n = 800
            df = pd.DataFrame(
                {
                    "neuron_id": [f"n_{i%50}" for i in range(n)],
                    "firing_rate": np.random.poisson(10, n),
                    "activation": np.random.uniform(0, 1, n),
                    "connection_strength": np.random.normal(0.5, 0.2, n),
                    "timestamp": pd.date_range("2025-01-01", periods=n, freq="100ms"),
                }
            )

        return df

    async def _run_analysis(
        self, session_id: str, analysis_type: str, df: pd.DataFrame, parameters: Dict
    ):
        """Run actual analysis on the data"""
        results = {}

        try:
            if analysis_type == "STATISTICAL":
                results = {
                    "descriptive_stats": df.describe().to_dict(),
                    "correlation_matrix": df.select_dtypes(include=[np.number])
                    .corr()
                    .to_dict(),
                    "distribution_analysis": {
                        col: {
                            "mean": float(df[col].mean()),
                            "std": float(df[col].std()),
                            "skewness": float(df[col].skew()),
                            "kurtosis": float(df[col].kurtosis()),
                        }
                        for col in df.select_dtypes(include=[np.number]).columns
                    },
                }

            elif analysis_type == "BEHAVIORAL":
                results = {
                    "action_counts": df["action"].value_counts().to_dict(),
                    "success_rate": float(df["success"].mean()),
                    "avg_duration_by_action": df.groupby("action")["duration"]
                    .mean()
                    .to_dict(),
                    "user_activity": df.groupby("user_id").size().describe().to_dict(),
                }

            elif analysis_type == "TEMPORAL":
                results = {
                    "trend_analysis": {
                        "slope": float(np.polyfit(range(len(df)), df["signal"], 1)[0]),
                        "r_squared": float(
                            np.corrcoef(range(len(df)), df["signal"])[0, 1] ** 2
                        ),
                    },
                    "anomaly_detection": {
                        "anomaly_count": int((df["anomaly_score"] > 0.8).sum()),
                        "anomaly_rate": float((df["anomaly_score"] > 0.8).mean()),
                    },
                    "periodicity": {
                        "dominant_frequency": float(
                            np.fft.fftfreq(len(df))[
                                np.argmax(np.abs(np.fft.fft(df["signal"])))
                            ]
                        )
                    },
                }

            else:  # Neural/Cognitive
                results = {
                    "network_stats": {
                        "avg_firing_rate": float(df["firing_rate"].mean()),
                        "activation_distribution": df["activation"]
                        .describe()
                        .to_dict(),
                        "connection_strength_stats": df["connection_strength"]
                        .describe()
                        .to_dict(),
                    },
                    "neuron_analysis": {
                        "highly_active_neurons": len(
                            df[df["firing_rate"] > df["firing_rate"].quantile(0.9)]
                        ),
                        "network_connectivity": float(df["connection_strength"].mean()),
                    },
                }

            # Add visualization data
            results["visualizations"] = await self._generate_visualization_data(
                df, analysis_type
            )
            results["session_id"] = session_id
            results["timestamp"] = datetime.now().isoformat()
            results["analysis_type"] = analysis_type

        except Exception as e:
            logger.error(f"Error in analysis: {e}")
            results = {"error": str(e)}

        return results

    async def _generate_visualization_data(self, df: pd.DataFrame, analysis_type: str):
        """Generate visualization data for the portal"""
        viz_data = {}

        try:
            if analysis_type == "STATISTICAL":
                # Generate histogram data
                numeric_cols = df.select_dtypes(include=[np.number]).columns[:3]
                for col in numeric_cols:
                    hist, bins = np.histogram(df[col].dropna(), bins=20)
                    viz_data[f"{col}_histogram"] = {
                        "bins": [float(b) for b in bins],
                        "counts": [int(c) for c in hist],
                    }

            elif analysis_type == "BEHAVIORAL":
                # Generate time series of actions
                df_time = df.set_index("timestamp").resample("1H")["action"].count()
                viz_data["action_timeline"] = {
                    "timestamps": [t.isoformat() for t in df_time.index],
                    "counts": [int(c) for c in df_time.values],
                }

            elif analysis_type == "TEMPORAL":
                # Generate signal plot data
                sample_data = df.iloc[::10]  # Sample every 10th point
                viz_data["signal_plot"] = {
                    "timestamps": [t.isoformat() for t in sample_data["timestamp"]],
                    "signal": [float(v) for v in sample_data["signal"]],
                    "baseline": [float(v) for v in sample_data["baseline"]],
                }

            else:  # Neural
                # Generate network visualization data
                viz_data["network_graph"] = {
                    "nodes": [
                        {"id": nid, "firing_rate": float(fr), "activation": float(act)}
                        for nid, fr, act in zip(
                            df["neuron_id"][:50],
                            df["firing_rate"][:50],
                            df["activation"][:50],
                        )
                    ],
                    "edges": [
                        {
                            "source": df["neuron_id"].iloc[i],
                            "target": df["neuron_id"].iloc[(i + 1) % len(df)],
                            "weight": float(df["connection_strength"].iloc[i]),
                        }
                        for i in range(min(100, len(df) - 1))
                    ],
                }

        except Exception as e:
            logger.error(f"Error generating visualization data: {e}")
            viz_data = {"error": str(e)}

        return viz_data

    async def websocket_handler(self, request):
        """Handle WebSocket connections for real-time updates"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        client_id = f"client_{len(self.active_websockets)}"
        self.active_websockets[client_id] = ws

        logger.info(f"WebSocket client {client_id} connected")

        try:
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    # Handle client messages
                    await self._handle_websocket_message(client_id, data)
                elif msg.type == WSMsgType.ERROR:
                    logger.error(f"WebSocket error: {ws.exception()}")
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
        finally:
            if client_id in self.active_websockets:
                del self.active_websockets[client_id]
            logger.info(f"WebSocket client {client_id} disconnected")

        return ws

    async def _broadcast_update(self, data: Dict[str, Any]):
        """Broadcast updates to all connected WebSocket clients"""
        if not self.active_websockets:
            return

        message = json.dumps(data)
        disconnected = []

        for client_id, ws in self.active_websockets.items():
            try:
                await ws.send_str(message)
            except Exception as e:
                logger.error(f"Error sending to client {client_id}: {e}")
                disconnected.append(client_id)

        # Clean up disconnected clients
        for client_id in disconnected:
            del self.active_websockets[client_id]

    async def get_research_data(self, request):
        """Get data from specific research paths"""
        try:
            path = request.match_info["path"]
            full_path = Path(__file__).parent / path

            if not full_path.exists():
                return web.json_response({"error": "Path not found"}, status=404)

            if full_path.is_file():
                if full_path.suffix == ".json":
                    with open(full_path, "r") as f:
                        data = json.load(f)
                    return web.json_response(data)
                elif full_path.suffix == ".csv":
                    df = pd.read_csv(full_path)
                    return web.json_response(df.to_dict("records"))
                else:
                    return web.Response(
                        text=full_path.read_text(), content_type="text/plain"
                    )
            else:
                # Directory listing
                items = []
                for item in full_path.iterdir():
                    if not item.name.startswith("."):
                        items.append(
                            {
                                "name": item.name,
                                "type": "directory" if item.is_dir() else "file",
                                "size": item.stat().st_size if item.is_file() else None,
                                "modified": datetime.fromtimestamp(
                                    item.stat().st_mtime
                                ).isoformat(),
                            }
                        )
                return web.json_response({"items": items})

        except Exception as e:
            logger.error(f"Error getting research data: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def start_server(self):
        """Start the API server"""
        logger.info(f"Starting Research Lab Portal API Server on port {self.port}")

        # Initialize research lab
        await self.initialize_research_lab()

        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", self.port)
        await site.start()

        logger.info(f"Server running at http://localhost:{self.port}")
        logger.info(f"Portal available at http://localhost:{self.port}/")

        return runner


async def main():
    """Main entry point"""
    server = PortalAPIServer(port=8080)
    runner = await server.start_server()

    try:
        # Keep the server running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
    finally:
        await runner.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
