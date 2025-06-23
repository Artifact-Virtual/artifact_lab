import os
import sys
import json
import requests
from flask import Flask, render_template_string, request, jsonify

# Add DevCore to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'DevCore')))
from ollama_interface import query_model

app = Flask(__name__)

# Simple HTML template for the chat interface
CHAT_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ARTIFACT VIRTUAL ASSISTANT</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body {
            background-color: #000000;
            color: #FFFFFF;
            font-family: 'Manrope', sans-serif;
            height: 100vh;
            overflow: hidden;
        }
        
        .fade-container {
            width: 100%;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background:
                linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 5%),
                linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 5%),
                linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 5%),
                linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 5%);
        }
        
        .chat-container {
            width: 90%;
            max-width: 800px;
            height: 80%;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .chat-header {
            padding: 24px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .message {
            padding: 12px 18px;
            border-radius: 12px;
            max-width: 80%;
            word-wrap: break-word;
            font-size: 16px;
            line-height: 1.5;
            font-weight: 300;
        }
        
        .user-message {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            align-self: flex-end;
        }
        
        .bot-message {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            align-self: flex-start;
        }
        
        .chat-input-container {
            padding: 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            gap: 12px;
        }
        
        .chat-input {
            flex: 1;
            padding: 12px 18px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            font-size: 16px;
            font-family: 'Manrope', sans-serif;
            outline: none;
        }
        
        .send-button {
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 400;
            font-family: 'Manrope', sans-serif;
            transition: background-color 0.3s, border-color 0.3s;
        }
        
        .send-button:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.4);
        }
        
        .status {
            text-align: center;
            padding: 12px;
            font-size: 14px;
            font-weight: 300;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .status.ready {
            background: rgba(0, 255, 0, 0.1);
            color: #a0ffa0;
        }
        
        .status.error {
            background: rgba(255, 0, 0, 0.1);
            color: #ffa0a0;
        }
    </style>
</head>
<body>
    <div class="fade-container">
        <div class="chat-container">
            <div class="chat-header">
                <h1 class="text-2xl font-extralight">ARTIFACT VIRTUAL ASSISTANT</h1>
                <p class="text-sm font-light mt-2">Enhanced with File Management & Code Access</p>
            </div>
            <div id="status" class="status">
                Connecting to Ollama...
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="bot-message">
                    Hello! I'm AVA. I can help you with code editing, file management, and more. I have access to your codebase and can make changes directly.
                </div>
            </div>
            <div class="chat-input-container">
                <input type="text" class="chat-input" id="chatInput" 
                       placeholder="Type your message here..." disabled>
                <button class="send-button" id="sendButton" onclick="sendMessage()" disabled>
                    SEND
                </button>
            </div>
        </div>
    </div>

    <script>
        let isConnected = false;
        
        window.onload = function() {
            checkOllamaStatus();
        };
        
        async function checkOllamaStatus() {
            try {
                const response = await fetch('/status');
                const data = await response.json();
                
                const statusDiv = document.getElementById('status');
                const chatInput = document.getElementById('chatInput');
                const sendButton = document.getElementById('sendButton');
                
                if (data.status === 'ready') {
                    statusDiv.textContent = `Connected to Model: ${data.model}`;
                    statusDiv.className = 'status ready';
                    chatInput.disabled = false;
                    sendButton.disabled = false;
                    isConnected = true;
                } else {
                    statusDiv.textContent = `❌ ${data.message}`;
                    statusDiv.className = 'status error';
                    isConnected = false;
                }
            } catch (error) {
                const statusDiv = document.getElementById('status');
                statusDiv.textContent = '❌ Failed to connect to chat server';
                statusDiv.className = 'status error';
                isConnected = false;
            }
        }
        
        function addMessage(content, isUser = false) {
            const messagesDiv = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
            messageDiv.textContent = content;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        async function sendMessage() {
            if (!isConnected) {
                alert('Not connected to Ollama. Please check the server status.');
                return;
            }
            
            const chatInput = document.getElementById('chatInput');
            const sendButton = document.getElementById('sendButton');
            const message = chatInput.value.trim();
            
            if (!message) return;
            
            addMessage(message, true);
            chatInput.value = '';
            
            chatInput.disabled = true;
            sendButton.disabled = true;
            
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: message })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    addMessage(data.response);
                } else {
                    addMessage(`Error: ${data.error}`);
                }
            } catch (error) {
                addMessage(`Error: Failed to send message - ${error.message}`);
            }
            
            chatInput.disabled = false;
            sendButton.disabled = false;
            chatInput.focus();
        }
        
        document.getElementById('chatInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        setInterval(checkOllamaStatus, 30000);
    </script>
</body>
</html>
"""

class OllamaWebChat:
    def __init__(self):
        # Load config
        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
        except:
            config = {}
        
        self.config = config
        self.ollama_host = config.get('ollama_host', 'localhost')
        self.ollama_port = config.get('ollama_port', 11434)
        self.model = config.get('ollama_model', 'codellama:7b')
        self.base_url = f"http://{self.ollama_host}:{self.ollama_port}"
        self.model_provider = config.get('model_provider', 'ollama')

    def check_ollama_status(self):
        """Check if Ollama is running and responsive"""
        if self.model_provider == 'pt':
            pt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../.pt_models'))
            if os.path.exists(pt_dir):
                pt_models = [f for f in os.listdir(pt_dir) if f.endswith('.pt')]
                if pt_models:
                    return True, f"Ready with .pt model: {pt_models[0]}"
            return False, "No .pt models found in .pt_models directory"
        
        try:
            response = requests.get(f"{self.base_url}/api/version", timeout=5)
            if response.status_code == 200:
                models_response = requests.get(f"{self.base_url}/api/tags", timeout=5)
                if models_response.status_code == 200:
                    models = models_response.json().get('models', [])
                    model_names = [model['name'] for model in models]
                    if self.model in model_names:
                        return True, f"Ready with model {self.model}"
                    elif model_names:
                        return True, f"Ready with model {model_names[0]}"
                    else:
                        return False, "No models found on Ollama server"
                return True, "Connected but couldn't check models"
            return False, f"Ollama responded with status {response.status_code}"
        except requests.exceptions.ConnectionError:
            return False, "Cannot connect to Ollama server"
        except requests.exceptions.Timeout:
            return False, "Ollama server timeout"
        except Exception as e:
            return False, f"Error: {str(e)}"

    def send_message(self, message):
        """Send message to Ollama with enhanced file management context"""
        try:
            # Enhance message with file management instructions
            enhanced_message = f"""
{message}

SYSTEM CONTEXT: You are an AI assistant with advanced file management capabilities. You can:
- Help with code analysis and editing
- Suggest file modifications
- Assist with project structure
- Answer questions about codebases
- Provide programming guidance

Current workspace: w:\\worxpace\\artifact_lab
Available components: workspace_manager, DevCore, blacknet

Instructions: Be helpful and provide detailed assistance. If the user asks about files or code, provide comprehensive guidance.
"""
            
            response = query_model(enhanced_message)
            return True, response
        except Exception as e:
            return False, f"Error sending message: {str(e)}"

# Global chat instance
chat = OllamaWebChat()

@app.route('/')
def index():
    return render_template_string(CHAT_HTML)

@app.route('/status')
def status():
    is_ready, message = chat.check_ollama_status()
    model = None
    if is_ready:
        if chat.model_provider == 'pt':
            pt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../.pt_models'))
            if os.path.exists(pt_dir):
                pt_models = [f for f in os.listdir(pt_dir) if f.endswith('.pt')]
                model = pt_models[0] if pt_models else None
        else:
            model = chat.model
    return jsonify({
        'status': 'ready' if is_ready else 'error',
        'message': message,
        'model': model if is_ready else None
    })

@app.route('/chat', methods=['POST'])
def chat_endpoint():
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({'success': False, 'error': 'Empty message'})
        
        is_ready, status_msg = chat.check_ollama_status()
        if not is_ready:
            return jsonify({'success': False, 'error': f'Ollama not ready: {status_msg}'})
        
        success, response = chat.send_message(message)
        
        if success:
            return jsonify({'success': True, 'response': response})
        else:
            return jsonify({'success': False, 'error': response})
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'})

# File Management API Endpoints
import hashlib
import datetime
import shutil

AUDIT_LOG_FILE = os.path.join(os.path.dirname(__file__), 'file_operations_audit.log')

def log_file_operation(operation, path, user_id="system", success=True, error=None):
    """Log file operations for audit trail"""
    timestamp = datetime.datetime.now().isoformat()
    log_entry = {
        'timestamp': timestamp,
        'operation': operation,
        'path': path,
        'user_id': user_id,
        'success': success,
        'error': error,
        'hash': hashlib.md5(f"{timestamp}{operation}{path}".encode()).hexdigest()[:8]
    }
    
    try:
        with open(AUDIT_LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry) + '\n')
    except Exception as e:
        print(f"Failed to write audit log: {e}")

def get_workspace_root():
    """Get the workspace root directory"""
    return os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

def is_safe_path(path):
    """Check if path is within workspace and safe to access"""
    try:
        workspace_root = get_workspace_root()
        resolved_path = os.path.abspath(os.path.join(workspace_root, path.lstrip('/\\')))
        return resolved_path.startswith(workspace_root)
    except:
        return False

@app.route('/api/files/list', methods=['GET'])
def list_files():
    """List files and directories"""
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
                relative_path = os.path.relpath(item_path, workspace_root).replace('\\', '/')
                
                item_info = {
                    'name': item,
                    'path': relative_path,
                    'type': 'directory' if os.path.isdir(item_path) else 'file',
                    'size': os.path.getsize(item_path) if os.path.isfile(item_path) else 0,
                    'modified': datetime.datetime.fromtimestamp(os.path.getmtime(item_path)).isoformat()
                }
                items.append(item_info)
        
        log_file_operation('list', path, success=True)
        return jsonify({'success': True, 'items': items})
        
    except Exception as e:
        log_file_operation('list', path, success=False, error=str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/files/read', methods=['GET'])
def read_file():
    """Read file contents"""
    try:
        path = request.args.get('path', '')
        if not path or not is_safe_path(path):
            return jsonify({'success': False, 'error': 'Invalid path'}), 400
        
        workspace_root = get_workspace_root()
        full_path = os.path.join(workspace_root, path.lstrip('/\\'))
        
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return jsonify({'success': False, 'error': 'File does not exist'}), 404
        
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            content_type = 'text'
        except UnicodeDecodeError:
            with open(full_path, 'rb') as f:
                content = f.read()
            content_type = 'binary'
            content = content.hex()
        
        file_info = {
            'name': os.path.basename(full_path),
            'path': path,
            'content': content,
            'content_type': content_type,
            'size': os.path.getsize(full_path),
            'modified': datetime.datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat()
        }
        
        log_file_operation('read', path, success=True)
        return jsonify({'success': True, 'file': file_info})
        
    except Exception as e:
        log_file_operation('read', path, success=False, error=str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/files/write', methods=['POST'])
def write_file():
    """Write file contents"""
    try:
        data = request.get_json()
        path = data.get('path', '')
        content = data.get('content', '')
        create_dirs = data.get('create_dirs', True)
        
        if not path or not is_safe_path(path):
            return jsonify({'success': False, 'error': 'Invalid path'}), 400
        
        workspace_root = get_workspace_root()
        full_path = os.path.join(workspace_root, path.lstrip('/\\'))
        
        if create_dirs:
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        file_info = {
            'name': os.path.basename(full_path),
            'path': path,
            'size': os.path.getsize(full_path),
            'modified': datetime.datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat()
        }
        
        log_file_operation('write', path, success=True)
        return jsonify({'success': True, 'file': file_info})
        
    except Exception as e:
        log_file_operation('write', path, success=False, error=str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/files/create', methods=['POST'])
def create_file():
    """Create new file or directory"""
    try:
        data = request.get_json()
        path = data.get('path', '')
        item_type = data.get('type', 'file')
        content = data.get('content', '')
        
        if not path or not is_safe_path(path):
            return jsonify({'success': False, 'error': 'Invalid path'}), 400
        
        workspace_root = get_workspace_root()
        full_path = os.path.join(workspace_root, path.lstrip('/\\'))
        
        if os.path.exists(full_path):
            return jsonify({'success': False, 'error': 'Path already exists'}), 409
        
        if item_type == 'directory':
            os.makedirs(full_path, exist_ok=True)
        else:
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
        
        item_info = {
            'name': os.path.basename(full_path),
            'path': path,
            'type': item_type,
            'size': os.path.getsize(full_path) if item_type == 'file' else 0,
            'modified': datetime.datetime.fromtimestamp(os.path.getmtime(full_path)).isoformat()
        }
        
        log_file_operation('create', path, success=True)
        return jsonify({'success': True, 'item': item_info})
        
    except Exception as e:
        log_file_operation('create', path, success=False, error=str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/files/search', methods=['GET'])
def search_files():
    """Search for files by name or content"""
    try:
        query = request.args.get('query', '')
        search_type = request.args.get('type', 'name')
        path = request.args.get('path', '')
        
        if not query:
            return jsonify({'success': False, 'error': 'Search query required'}), 400
        
        if not is_safe_path(path):
            return jsonify({'success': False, 'error': 'Invalid path'}), 400
        
        workspace_root = get_workspace_root()
        search_path = os.path.join(workspace_root, path.lstrip('/\\'))
        
        results = []
        for root, dirs, files in os.walk(search_path):
            for file in files:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, workspace_root).replace('\\', '/')
                
                match = False
                if search_type == 'name':
                    match = query.lower() in file.lower()
                elif search_type == 'content':
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            match = query.lower() in content.lower()
                    except:
                        continue
                
                if match:
                    results.append({
                        'name': file,
                        'path': relative_path,
                        'size': os.path.getsize(file_path),
                        'modified': datetime.datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat()
                    })
        
        log_file_operation('search', f"{path}?query={query}&type={search_type}", success=True)
        return jsonify({'success': True, 'results': results})
        
    except Exception as e:
        log_file_operation('search', path, success=False, error=str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

def run_webchat():
    """Run the web chat server"""
    print("Starting Enhanced Ollama Web Chat on http://localhost:8080")
    print("Features: LLM Code Access, Enhanced Context, File Management Ready")
    app.run(host='0.0.0.0', port=8080, debug=False, threaded=True)

if __name__ == "__main__":
    run_webchat()
