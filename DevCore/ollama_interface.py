import subprocess
import os
import json
import torch

CONFIG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../workspace_manager/config.json'))


def get_config():
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def query_ollama(prompt: str, model: str = None) -> str:
    config = get_config()
    model = model or config.get('ollama_model', 'codellama:7b')
    result = subprocess.run(
        ["ollama", "run", model],
        input=prompt.encode(),
        capture_output=True,
        check=True
    )
    return result.stdout.decode().strip()


def query_pt_model(prompt: str, model_path: str = None) -> str:
    # Dummy implementation for .pt models (replace with actual inference logic)
    # Example: load a torch model and run inference
    # This is a placeholder for real model logic
    return f"[.pt model reply for: {prompt}]"


def query_model(prompt: str) -> str:
    config = get_config()
    provider = config.get('model_provider', 'ollama')
    if provider == 'pt':
        # Find a .pt model in the .pt_models directory
        pt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../.pt_models'))
        pt_models = [f for f in os.listdir(pt_dir) if f.endswith('.pt')]
        model_path = os.path.join(pt_dir, pt_models[0]) if pt_models else None
        return query_pt_model(prompt, model_path)
    else:
        return query_ollama(prompt)
