from typing import Dict, Any
from DevCore.core.base_agent import BaseAgent
from DevCore.ollama_interface import query_model
import os


class CodeGenAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("CodeGen")

    def run(self, context: Dict[str, Any]) -> None:
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'workspace'))
        for f in context.get('files', []):
            prompt = (
                f"Write code for this file in the task:\n"
                f"Task: {context['task']}\nFilename: {f}"
            )
            response = query_model(prompt)
            file_path = os.path.join(base_path, f)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as fp:
                fp.write(response)
