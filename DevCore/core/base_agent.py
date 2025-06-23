from typing import Dict, Any, Optional


class BaseAgent:
    def __init__(self, name: str) -> None:
        self.name = name

    def run(self, context: Dict[str, Any]) -> Optional[bool]:
        raise NotImplementedError("Each agent must implement a run() method.")
