#!/usr/bin/env python3
"""
Quick Start Script for Autonomous Research Lab Guardian System
"""

import asyncio
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from bootstrap_autonomous_lab import IntegratedResearchLabBootstrap


async def quick_start():
    """Quick start the research lab system"""
    print("🚀 Quick Starting Autonomous Research Lab...")
    print("👁️ Initializing hawk-like monitoring system...")

    bootstrap = IntegratedResearchLabBootstrap()
    success = await bootstrap.start_complete_system()

    if success:
        print("✅ Research lab is now active and watching everything!")
        await bootstrap.run_forever()
    else:
        print("❌ Failed to start research lab")
        return 1

    return 0


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(quick_start())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n🛑 Shutdown requested by user")
        sys.exit(0)
