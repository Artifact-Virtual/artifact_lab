"""
Simplified ollama_interface module for ADE Desktop.
This version has robust error handling and fallback behavior.
"""
import subprocess
import os
import json
import requests


def get_config():
    """Load configuration with fallback behavior."""
    # Try to load from isolated config first
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Fallback to default config
        return {
            'ollama_host': 'localhost',
            'ollama_port': 11500,
            'ollama_model': 'codellama:7b',
            'model_provider': 'ollama'
        }


def query_model(prompt: str, model: str = None) -> str:
    """
    Query the LLM model with robust error handling.
    Falls back gracefully if Ollama is not available.
    """
    try:
        config = get_config()
        model = model or config.get('ollama_model', 'codellama:7b')
        host = config.get('ollama_host', 'localhost')
        port = config.get('ollama_port', 11500)
        
        # Try API approach first (more reliable)
        api_url = f"http://{host}:{port}/api/generate"
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }
        
        response = requests.post(api_url, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return result.get('response', 'No response from model')
        else:
            # Fallback to subprocess approach
            return query_ollama_subprocess(prompt, model)
            
    except requests.exceptions.RequestException:
        # If API fails, try subprocess
        try:
            return query_ollama_subprocess(prompt, model)
        except Exception as e:
            return f"Error: LLM service unavailable. Details: {str(e)}"
    except Exception as e:
        return f"Error: {str(e)}"


def query_ollama_subprocess(prompt: str, model: str = None) -> str:
    """Fallback method using subprocess."""
    try:
        config = get_config()
        model = model or config.get('ollama_model', 'codellama:7b')
        
        result = subprocess.run(
            ["ollama", "run", model],
            input=prompt.encode(),
            capture_output=True,
            timeout=60,
            check=True
        )
        
        return result.stdout.decode('utf-8')
        
    except subprocess.CalledProcessError as e:
        stderr_msg = e.stderr.decode('utf-8') if e.stderr else 'Unknown error'
        return f"Error running Ollama: {stderr_msg}"
    except subprocess.TimeoutExpired:
        return "Error: Ollama query timed out"
    except FileNotFoundError:
        return ("Error: Ollama command not found. "
                "Please ensure Ollama is installed and in PATH.")
    except Exception as e:
        return f"Error: {str(e)}"


def check_ollama_status() -> tuple:
    """Check if Ollama is available and responsive."""
    try:
        config = get_config()
        host = config.get('ollama_host', 'localhost')
        port = config.get('ollama_port', 11500)
        
        response = requests.get(f"http://{host}:{port}/api/version", timeout=5)
        
        if response.status_code == 200:
            return True, "Ollama is running and responsive"
        else:
            return False, f"Ollama responded with status {response.status_code}"
            
    except requests.exceptions.ConnectionError:
        return False, "Cannot connect to Ollama server"
    except requests.exceptions.Timeout:
        return False, "Ollama server timeout"
    except Exception as e:
        return False, f"Error: {str(e)}"


# For backwards compatibility
query_ollama = query_model

