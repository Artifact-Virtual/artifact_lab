#!/usr/bin/env python3
"""
Integration Bridge for Autonomous Research Lab Guardian
Connects the new guardian system with existing research infrastructure
"""

import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict


class ResearchLabBridge:
    """Bridge between Guardian system and existing research infrastructure"""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.bridge_active = False
        self.research_pipeline_queue = []

    async def start_bridge(self):
        """Start the research lab bridge"""
        self.logger.info("🌉 Starting Research Lab Integration Bridge...")

        try:
            # Check for existing research lab components
            existing_components = await self._discover_existing_components()

            # Setup integration points
            await self._setup_integration_points(existing_components)

            # Start data flow coordination
            await self._start_data_flow_coordination()

            self.bridge_active = True
            self.logger.info("✅ Research Lab Bridge is active")

        except Exception as e:
            self.logger.error(f"❌ Failed to start bridge: {e}")
            raise

    async def _discover_existing_components(self) -> Dict[str, bool]:
        """Discover existing research lab components"""
        components = {
            "secure_research_lab": False,
            "analysis_engine": False,
            "portal_api": False,
            "autonomous_research_team": False,
            "research_notebooks": False,
        }

        # Check for secure research lab
        secure_lab_path = Path("labs/secure_research_lab.py")
        if secure_lab_path.exists():
            components["secure_research_lab"] = True
            self.logger.info("✓ Found: Secure Research Lab")

        # Check for analysis engine
        analysis_path = Path("labs/analysis_engine.py")
        if analysis_path.exists():
            components["analysis_engine"] = True
            self.logger.info("✓ Found: Analysis Engine")

        # Check for portal API
        portal_path = Path("portal_api.py")
        if portal_path.exists():
            components["portal_api"] = True
            self.logger.info("✓ Found: Research Portal API")

        # Check for ART system
        art_path = Path("../modules/agents/autonomous_research_team")
        if art_path.exists():
            components["autonomous_research_team"] = True
            self.logger.info("✓ Found: Autonomous Research Team")

        # Check for research notebooks
        notebooks_path = Path("notebooks")
        if notebooks_path.exists():
            components["research_notebooks"] = True
            self.logger.info("✓ Found: Research Notebooks")

        return components

    async def _setup_integration_points(self, components: Dict[str, bool]):
        """Setup integration points between systems"""
        self.logger.info("🔗 Setting up integration points...")

        integration_config = {
            "guardian_to_secure_lab": components["secure_research_lab"],
            "guardian_to_analysis": components["analysis_engine"],
            "guardian_to_portal": components["portal_api"],
            "guardian_to_art": components["autonomous_research_team"],
            "guardian_to_notebooks": components["research_notebooks"],
        }

        # Create integration configuration file
        config_path = Path("integration_config.json")
        config_path.write_text(json.dumps(integration_config, indent=2))

        self.logger.info(
            f"📋 Integration config saved: {sum(integration_config.values())} active connections"
        )

    async def _start_data_flow_coordination(self):
        """Start coordinating data flow between systems"""
        self.logger.info("📊 Starting data flow coordination...")

        # Create shared directories for inter-system communication
        shared_dirs = [
            "shared_data",
            "shared_data/events",
            "shared_data/research_requests",
            "shared_data/analysis_results",
            "shared_data/action_points",
            "shared_data/research_papers",
        ]

        for dir_path in shared_dirs:
            Path(dir_path).mkdir(parents=True, exist_ok=True)

        # Start monitoring shared directories
        asyncio.create_task(self._monitor_shared_data())

    async def _monitor_shared_data(self):
        """Monitor shared data directories for inter-system communication"""
        while self.bridge_active:
            try:
                # Check for new research requests
                await self._process_research_requests()

                # Check for new analysis results
                await self._process_analysis_results()

                # Check for new action points
                await self._process_action_points()

                await asyncio.sleep(5)  # Check every 5 seconds

            except Exception as e:
                self.logger.error(f"❌ Error in data flow monitoring: {e}")
                await asyncio.sleep(10)

    async def _process_research_requests(self):
        """Process research requests from guardian to other systems"""
        requests_dir = Path("shared_data/research_requests")

        for request_file in requests_dir.glob("*.json"):
            try:
                request_data = json.loads(request_file.read_text())

                # Route to appropriate system based on request type
                if request_data.get("target_system") == "analysis_engine":
                    await self._route_to_analysis_engine(request_data)
                elif request_data.get("target_system") == "secure_lab":
                    await self._route_to_secure_lab(request_data)
                elif request_data.get("target_system") == "art":
                    await self._route_to_art_system(request_data)

                # Mark as processed
                processed_dir = requests_dir / "processed"
                processed_dir.mkdir(exist_ok=True)
                request_file.rename(processed_dir / request_file.name)

            except Exception as e:
                self.logger.error(f"❌ Error processing request {request_file}: {e}")

    async def _route_to_analysis_engine(self, request_data: Dict[str, Any]):
        """Route request to analysis engine"""
        self.logger.info(
            f"🔍 Routing to Analysis Engine: {request_data.get('request_id')}"
        )

        # Create analysis task file
        analysis_dir = Path("shared_data/analysis_tasks")
        analysis_dir.mkdir(exist_ok=True)

        analysis_task = {
            "task_id": f"analysis_{int(datetime.now().timestamp())}",
            "source_request": request_data,
            "priority": request_data.get("priority", "medium"),
            "analysis_type": "guardian_triggered",
            "timestamp": datetime.now().isoformat(),
        }

        task_file = analysis_dir / f"{analysis_task['task_id']}.json"
        task_file.write_text(json.dumps(analysis_task, indent=2))

    async def _route_to_secure_lab(self, request_data: Dict[str, Any]):
        """Route request to secure research lab"""
        self.logger.info(f"🔒 Routing to Secure Lab: {request_data.get('request_id')}")

        # Create secure lab task
        secure_dir = Path("shared_data/secure_tasks")
        secure_dir.mkdir(exist_ok=True)

        secure_task = {
            "task_id": f"secure_{int(datetime.now().timestamp())}",
            "source_request": request_data,
            "security_level": "CONFIDENTIAL",
            "task_type": "guardian_analysis",
            "timestamp": datetime.now().isoformat(),
        }

        task_file = secure_dir / f"{secure_task['task_id']}.json"
        task_file.write_text(json.dumps(secure_task, indent=2))

    async def _route_to_art_system(self, request_data: Dict[str, Any]):
        """Route request to Autonomous Research Team"""
        self.logger.info(f"🤖 Routing to ART System: {request_data.get('request_id')}")

        # Create ART task
        art_dir = Path("shared_data/art_tasks")
        art_dir.mkdir(exist_ok=True)

        art_task = {
            "task_id": f"art_{int(datetime.now().timestamp())}",
            "source_request": request_data,
            "agent_assignment": "auto",
            "research_type": "autonomous",
            "timestamp": datetime.now().isoformat(),
        }

        task_file = art_dir / f"{art_task['task_id']}.json"
        task_file.write_text(json.dumps(art_task, indent=2))

    async def _process_analysis_results(self):
        """Process analysis results from other systems back to guardian"""
        results_dir = Path("shared_data/analysis_results")

        for result_file in results_dir.glob("*.json"):
            try:
                result_data = json.loads(result_file.read_text())

                # Forward results to guardian system
                await self._forward_to_guardian(result_data)

                # Archive the result
                archive_dir = results_dir / "archived"
                archive_dir.mkdir(exist_ok=True)
                result_file.rename(archive_dir / result_file.name)

            except Exception as e:
                self.logger.error(f"❌ Error processing result {result_file}: {e}")

    async def _process_action_points(self):
        """Process action points generated by various systems"""
        action_points_dir = Path("shared_data/action_points")

        for action_file in action_points_dir.glob("*.json"):
            try:
                action_data = json.loads(action_file.read_text())

                # Consolidate action points
                await self._consolidate_action_points(action_data)

                # Archive the action points
                archive_dir = action_points_dir / "archived"
                archive_dir.mkdir(exist_ok=True)
                action_file.rename(archive_dir / action_file.name)

            except Exception as e:
                self.logger.error(
                    f"❌ Error processing action points {action_file}: {e}"
                )

    async def _forward_to_guardian(self, result_data: Dict[str, Any]):
        """Forward results back to the guardian system"""
        self.logger.info(
            f"👁️ Forwarding results to Guardian: {result_data.get('result_id')}"
        )

        # Create guardian notification
        guardian_dir = Path("shared_data/guardian_notifications")
        guardian_dir.mkdir(exist_ok=True)

        notification = {
            "notification_id": f"notify_{int(datetime.now().timestamp())}",
            "type": "analysis_result",
            "data": result_data,
            "timestamp": datetime.now().isoformat(),
            "priority": result_data.get("priority", "medium"),
        }

        notify_file = guardian_dir / f"{notification['notification_id']}.json"
        notify_file.write_text(json.dumps(notification, indent=2))

    async def _consolidate_action_points(self, action_data: Dict[str, Any]):
        """Consolidate action points from multiple systems"""
        self.logger.info(
            f"📋 Consolidating action points: {action_data.get('source_system')}"
        )

        # Create consolidated action points
        consolidated_dir = Path("shared_data/consolidated_actions")
        consolidated_dir.mkdir(exist_ok=True)

        consolidated = {
            "consolidation_id": f"consolidated_{int(datetime.now().timestamp())}",
            "action_points": action_data.get("action_points", []),
            "source_systems": [action_data.get("source_system", "unknown")],
            "priority_score": action_data.get("priority_score", 0.5),
            "timestamp": datetime.now().isoformat(),
            "status": "pending",
        }

        consolidated_file = (
            consolidated_dir / f"{consolidated['consolidation_id']}.json"
        )
        consolidated_file.write_text(json.dumps(consolidated, indent=2))

    async def shutdown_bridge(self):
        """Shutdown the integration bridge"""
        self.logger.info("🛑 Shutting down Research Lab Bridge...")
        self.bridge_active = False

        # Save final integration statistics
        stats = {
            "shutdown_time": datetime.now().isoformat(),
            "requests_processed": (
                len(
                    list(Path("shared_data/research_requests/processed").glob("*.json"))
                )
                if Path("shared_data/research_requests/processed").exists()
                else 0
            ),
            "results_processed": (
                len(list(Path("shared_data/analysis_results/archived").glob("*.json")))
                if Path("shared_data/analysis_results/archived").exists()
                else 0
            ),
            "bridge_uptime": "calculated_uptime",
        }

        stats_file = Path("shared_data/bridge_stats.json")
        stats_file.write_text(json.dumps(stats, indent=2))

        self.logger.info("✅ Bridge shutdown complete")


async def main():
    """Main entry point for the integration bridge"""
    print("🌉 Research Lab Integration Bridge")
    print("Connecting Guardian System with Existing Infrastructure")
    print("=" * 60)

    bridge = ResearchLabBridge()

    try:
        await bridge.start_bridge()

        print("✅ Integration bridge is active!")
        print("🔗 All systems are now connected and coordinated")
        print("Press Ctrl+C to shutdown...")

        # Keep bridge running
        while bridge.bridge_active:
            await asyncio.sleep(10)

    except KeyboardInterrupt:
        print("\n🛑 Shutdown signal received")
    except Exception as e:
        print(f"❌ Bridge error: {e}")
    finally:
        await bridge.shutdown_bridge()


if __name__ == "__main__":
    asyncio.run(main())
