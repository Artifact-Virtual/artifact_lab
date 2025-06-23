from typing import Dict, Any
from DevCore.core.base_agent import BaseAgent
from DevCore.ollama_interface import query_model
import os
import re


class ScaffolderAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("Scaffolder")

    def run(self, context: Dict[str, Any]) -> None:
        import string
        prompt = f"Plan a file structure for this project:\n{context['task']}"
        response = query_model(prompt)
        print("File Plan:\n", response)

        # Set workspace as the base path for all created files and directories
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'workspace'))
        os.makedirs(base_path, exist_ok=True)
        lines = response.splitlines()
        files = []
        # Windows invalid chars: \\ / : * ? " < > |
        invalid_chars = r'[\\/:*?"<>|]'
        for line in lines:
            # Only process lines that look like tree structure (start with tree/indent/icon or whitespace)
            if not re.match(r'^[\s\|│├└─>📁📂📜]', line):
                continue
            # Remove leading tree/indentation and icon characters
            clean = re.sub(r'^[\s\|│├└─>]+', '', line)
            clean = re.sub(r'^[📁📂📜]+', '', clean).strip()
            if not clean or clean.startswith('...') or clean.startswith('('):
                continue
            # Sanitize path
            clean_path = re.sub(invalid_chars, '_', clean)
            # Directory (ends with / or has no extension and not a known file)
            if clean.endswith('/') or (not os.path.splitext(clean)[1] and not clean.lower().startswith('readme')):
                dir_path = os.path.join(base_path, clean_path.rstrip('/'))
                os.makedirs(dir_path, exist_ok=True)
            # File
            elif '.' in clean:
                file_path = os.path.join(base_path, clean_path)
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                with open(file_path, "w", encoding="utf-8") as fp:
                    fp.write("# stub\n")
                files.append(clean_path)
        print("Files created:", files)
        context['files'] = files
