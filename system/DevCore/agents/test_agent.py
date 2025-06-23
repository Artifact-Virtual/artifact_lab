from typing import Dict, Any, Optional
from DevCore.core.base_agent import BaseAgent
import subprocess
import os


class TestAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("TestRunner")

    def run(self, context: Dict[str, Any]) -> Optional[bool]:
        errors = 0
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'workspace'))
        for f in context.get("files", []):
            # Only test .py files
            if not f.endswith('.py'):
                continue
            full_path = os.path.join(base_path, f)
            result = subprocess.run(
                ["python", "-m", "py_compile", full_path], check=True
            )
            if result.returncode != 0:
                print(f"Failed: {f}")
                errors += 1
        return errors == 0
