from typing import Dict, Any
from DevCore.core.base_agent import BaseAgent
from DevCore.agents.codegen_agent import CodeGenAgent
from DevCore.agents.test_agent import TestAgent


class AutoLoopAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("AutoLoop")

    def run(self, context: Dict[str, Any]) -> None:
        for _ in range(5):
            print("Retrying code generation...")
            CodeGenAgent().run(context)
            if TestAgent().run(context):
                print("Passed on retry.")
                return
        print("Still failing after retries.")
