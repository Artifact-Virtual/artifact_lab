import os
import sys
import json
import requests
from flask import Flask, request, jsonify  # removed render_template_string (unused)

# Add DevCore to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'DevCore')))
from ollama_interface import query_model

app = Flask(__name__)

# Removed CHAT_HTML and all legacy chat panel HTML/JS

# Removed /chat and /chat-old endpoints and all related logic

class OllamaWebChat:
    def __init__(self):
        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
        except:
            config = {}
        
        self.config = config
        self.ollama_host = config.get('ollama_host', 'localhost')
        self.ollama_port = config.get('ollama_port', 11500)
        self.model = config.get('ollama_model', 'codellama:7b')
        self.base_url = f"http://{self.ollama_host}:{self.ollama_port}"
        self.model_provider = config.get('model_provider', 'ollama')

    def check_ollama_status(self):
        try:
            response = requests.get(f"{self.base_url}/api/version", timeout=5)
            if response.status_code == 200:
                return True, f"Ready with model {self.model}"
            return False, f"Ollama responded with status {response.status_code}"
        except requests.exceptions.ConnectionError:
            return False, "Cannot connect to Ollama server"
        except requests.exceptions.Timeout:
            return False, "Ollama server timeout"
        except Exception as e:
            return False, f"Error: {str(e)}"

    def send_message(self, message):
        try:
            enhanced_message = f"""
{message}

SYSTEM CONTEXT: You are an AI assistant with file management capabilities. You can:
- Help with code analysis and editing
- Provide programming guidance
- Assist with project structure
- Answer questions about codebases

Current workspace: w:\\worxpace\\artifact_lab
Available components: ADE, DevCore, BlackNet

Instructions: Be helpful and provide detailed assistance.
"""
            
            response = query_model(enhanced_message)
            return True, response
        except Exception as e:
            return False, f"Error sending message: {str(e)}"

# Global chat instance
chat = OllamaWebChat()

# File Management API
import hashlib
import datetime

def log_file_operation(operation, path, success=True, error=None, user_context=None):
    """Enhanced file operation logging with audit trail"""
    timestamp = datetime.datetime.now().isoformat()
    
    log_entry = {
        'timestamp': timestamp,
        'operation': operation,
        'path': path,
        'success': success,
        'error': error,
        'user_context': user_context
    }
    
    # Log to console
    status = 'Success' if success else 'Failed'
    print(f"[{timestamp}] File operation: {operation} on {path} - {status}")
    if error:
        print(f"  Error: {error}")
    
    # Log to audit file
    audit_log_path = os.path.join(os.path.dirname(__file__), 'audit_log.json')
    try:
        # Read existing log entries
        if os.path.exists(audit_log_path):
            with open(audit_log_path, 'r', encoding='utf-8') as f:
                audit_log = json.load(f)
        else:
            audit_log = []
        
        # Add new entry
        audit_log.append(log_entry)
        
        # Keep only last 1000 entries to prevent log file from growing too large
        if len(audit_log) > 1000:
            audit_log = audit_log[-1000:]
        
        # Write back to file
        with open(audit_log_path, 'w', encoding='utf-8') as f:
            json.dump(audit_log, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Warning: Could not write to audit log: {e}")


def log_llm_interaction(message, response, context=None, file_operations=None):
    """Log LLM interactions for audit purposes"""
    timestamp = datetime.datetime.now().isoformat()
    
    log_entry = {
        'timestamp': timestamp,
        'type': 'llm_interaction',
        'message': message[:500] + '...' if len(message) > 500 else message,  # Truncate long messages
        'response': response[:500] + '...' if len(response) > 500 else response,
        'context': context,
        'file_operations': file_operations
    }
    
    print(f"[{timestamp}] LLM Interaction - Context: {context.get('currentFile', 'None') if context else 'None'}")
    
    # Log to audit file
    audit_log_path = os.path.join(os.path.dirname(__file__), 'llm_audit_log.json')
    try:
        if os.path.exists(audit_log_path):
            with open(audit_log_path, 'r', encoding='utf-8') as f:
                audit_log = json.load(f)
        else:
            audit_log = []
        
        audit_log.append(log_entry)
        
        # Keep only last 500 entries
        if len(audit_log) > 500:
            audit_log = audit_log[-500:]
        
        with open(audit_log_path, 'w', encoding='utf-8') as f:
            json.dump(audit_log, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Warning: Could not write to LLM audit log: {e}")

def get_workspace_root():
    return os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

def is_safe_path(path):
    try:
        workspace_root = get_workspace_root()
        resolved_path = os.path.abspath(os.path.join(workspace_root, path.lstrip('/\\')))
        return resolved_path.startswith(workspace_root)
    except:
        return False

@app.route('/api/files/list', methods=['GET'])
def list_files():
    try:
        path = request.args.get('path', '')
        if not is_safe_path(path):
            return jsonify({'success': False, 'error': 'Invalid path'}), 400
        
        workspace_root = get_workspace_root()
        full_path = os.path.join(workspace_root, path.lstrip('/\\'))
        
        if not os.path.exists(full_path):
            return jsonify({'success': False, 'error': 'Path does not exist'}), 404
        
        items = []
        if os.path.isdir(full_path):
            for item in os.listdir(full_path):
                item_path = os.path.join(full_path, item)
                items.append({
                    'name': item,
                    'type': 'directory' if os.path.isdir(item_path) else 'file',
                    'size': os.path.getsize(item_path) if os.path.isfile(item_path) else 0
                })
        
        log_file_operation('list', path, success=True)
        return jsonify({'success': True, 'items': items})
        
    except Exception as e:
        log_file_operation('list', path, success=False, error=str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/files/read', methods=['GET'])
def read_file():
    try:
        path = request.args.get('path', '')
        if not path or not is_safe_path(path):
            return jsonify({'success': False, 'error': 'Invalid path'}), 400
        
        workspace_root = get_workspace_root()
        full_path = os.path.join(workspace_root, path.lstrip('/\\'))
        
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return jsonify({'success': False, 'error': 'File does not exist'}), 404
        
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        log_file_operation('read', path, success=True)
        return jsonify({'success': True, 'content': content})
        
    except Exception as e:
        log_file_operation('read', path, success=False, error=str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/files/write', methods=['POST'])
def write_file():
    try:
        data = request.get_json()
        path = data.get('path', '')
        content = data.get('content', '')
        
        if not path or not is_safe_path(path):
            return jsonify({'success': False, 'error': 'Invalid path'}), 400
        
        workspace_root = get_workspace_root()
        full_path = os.path.join(workspace_root, path.lstrip('/\\'))
        
        os.makedirs(os.path.dirname(full_path), exist_ok=True);
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        log_file_operation('write', path, success=True)
        return jsonify({'success': True, 'message': 'File written successfully'})
        
    except Exception as e:
        log_file_operation('write', path, success=False, error=str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

# Audit log viewing endpoints
@app.route('/api/audit/files', methods=['GET'])
def get_file_audit_log():
    """Get file operation audit log"""
    try:
        audit_log_path = os.path.join(os.path.dirname(__file__), 'audit_log.json')
        if os.path.exists(audit_log_path):
            with open(audit_log_path, 'r', encoding='utf-8') as f:
                audit_log = json.load(f)
            
            # Get recent entries (last 50)
            recent_entries = audit_log[-50:] if len(audit_log) > 50 else audit_log
            return jsonify({'success': True, 'entries': recent_entries})
        else:
            return jsonify({'success': True, 'entries': []})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/audit/llm', methods=['GET'])
def get_llm_audit_log():
    """Get LLM interaction audit log"""  
    try:
        audit_log_path = os.path.join(os.path.dirname(__file__), 'llm_audit_log.json')
        if os.path.exists(audit_log_path):
            with open(audit_log_path, 'r', encoding='utf-8') as f:
                audit_log = json.load(f)
            
            # Get recent entries (last 25)
            recent_entries = audit_log[-25:] if len(audit_log) > 25 else audit_log
            return jsonify({'success': True, 'entries': recent_entries})
        else:
            return jsonify({'success': True, 'entries': []})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/')
def index():
    """Serve the AVA Studio interface as the main interface"""
    file_path = os.path.join(os.path.dirname(__file__), 'studio_enhanced.html')
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/file-manager')
def file_manager_redirect():
    """Redirect old file-manager URL to root for backwards compatibility"""
    from flask import redirect
    return redirect('/')

@app.route('/status')
def status():
    is_ready, message = chat.check_ollama_status()
    return jsonify({
        'status': 'ready' if is_ready else 'error',
        'message': message,
        'model': chat.model if is_ready else None
    })

@app.route('/chat', methods=['POST'])
def chat_endpoint():
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        context = data.get('context', {})
        
        if not message:
            return jsonify({'success': False, 'error': 'Empty message'})
        
        is_ready, status_msg = chat.check_ollama_status()
        if not is_ready:
            return jsonify({'success': False, 'error': f'Ollama not ready: {status_msg}'})
        
        # Enhanced message with system context
        enhanced_message = build_enhanced_message(message, context)
        
        success, response = chat.send_message(enhanced_message)
        
        if success:
            # Check if the response contains actionable file operations
            file_operations = parse_file_operations(response, context)
            
            # Log the interaction for audit purposes
            log_llm_interaction(message, response, context, file_operations)
            
            result = {
                'success': True, 
                'response': response
            }
            
            if file_operations:
                result['fileOperations'] = file_operations
            
            return jsonify(result)
        else:
            # Log failed interaction as well
            log_llm_interaction(message, f"Error: {response}", context)
            return jsonify({'success': False, 'error': response})
            
    except Exception as e:
        # Log system errors
        log_llm_interaction(message if 'message' in locals() else 'Unknown', f"System error: {str(e)}", context if 'context' in locals() else None)
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'})

def build_enhanced_message(message, context):
    """Build an enhanced message with system context for the LLM"""
    system_prompt = """You are AVA (Artifact Virtual Assistant), an advanced AI code assistant with direct access to the user's codebase. You can:

1. Analyze and understand code in any programming language
2. Suggest improvements, fixes, and optimizations
3. Help with debugging and troubleshooting
4. Explain complex code concepts
5. Assist with code refactoring and restructuring
6. Provide direct code modifications when requested

You have access to the complete project structure and can read/write files. When the user asks you to modify code, you can suggest specific changes or indicate that you can make direct modifications.

Be concise, helpful, and practical in your responses. If you suggest code changes, make them clear and actionable."""
    
    enhanced = f"{system_prompt}\n\n"
    # Add current file context if available
    if context.get('currentFile'):
        enhanced += f"Current file being edited: {context['currentFile']}\n"
    
    enhanced += f"User request: {message}"
    
    return enhanced

def parse_file_operations(response, context):
    """Parse LLM response for potential file operations"""
    operations = []
    
    # This is a simple implementation - could be enhanced with more sophisticated parsing
    # For now, we'll return empty as the frontend handles editor updates manually
    # In a full implementation, we could parse response for code blocks and apply them
    
    return operations

def run_webchat():
    print("Starting Enhanced Ollama Web Chat on http://localhost:9000")
    print("Features: LLM Code Access, File Management API")
    app.run(host='0.0.0.0', port=9000, debug=False, threaded=True)

@app.route('/test')
def test_page():
    """Test page for debugging"""
    with open('test.html', 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/studio')
def studio():
    """Serve the AVA Studio interface (legacy, for compatibility)"""
    file_path = os.path.join(os.path.dirname(__file__), 'studio_enhanced.html')
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

if __name__ == "__main__":
    run_webchat()
