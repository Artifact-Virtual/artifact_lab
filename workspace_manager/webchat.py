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
    <style>
        body {
            background-color: #000000;
            color: #FFFFFF;
            font-family: 'Arial', sans-serif;
            height: 100vh;
            overflow: hidden;
        }
        .chat-container {
            max-width: 800px;
            height: 100vh;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .chat-header {
            text-align: center;
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .message {
            padding: 12px 18px;
            border-radius: 12px;
            max-width: 80%;
            word-wrap: break-word;
        }
        .user-message {
            background: rgba(255, 255, 255, 0.1);
            align-self: flex-end;
        }
        .bot-message {
            background: rgba(255, 255, 255, 0.05);
            align-self: flex-start;
        }
        .chat-input-container {
            padding: 20px;
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
            outline: none;
        }
        .send-button {
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            cursor: pointer;
        }
        .status {
            text-align: center;
            padding: 12px;
            font-size: 14px;
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
    <div class="chat-container">
        <div class="chat-header">
            <h1>ARTIFACT VIRTUAL ASSISTANT</h1>
            <p>Enhanced with File Management & Code Access</p>
        </div>
        <div id="status" class="status">Connecting...</div>
        <div class="chat-messages" id="chatMessages">
            <div class="bot-message">
                Hello! I'm AVA. I can help you with code editing, file management, and more. I have access to your codebase and can make changes directly.
            </div>
        </div>
        <div class="chat-input-container">
            <input type="text" class="chat-input" id="chatInput" placeholder="Type your message here..." disabled>
            <button class="send-button" id="sendButton" onclick="sendMessage()" disabled>SEND</button>
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
                    statusDiv.textContent = `✅ Connected (Model: ${data.model})`;
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
                statusDiv.textContent = '❌ Failed to connect';
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
            if (e.key === 'Enter') {
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
Available components: workspace_manager, DevCore, blacknet

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

def log_file_operation(operation, path, success=True, error=None):
    timestamp = datetime.datetime.now().isoformat()
    print(f"[{timestamp}] File operation: {operation} on {path} - {'Success' if success else 'Failed'}")

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
        
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        log_file_operation('write', path, success=True)
        return jsonify({'success': True, 'message': 'File written successfully'})
        
    except Exception as e:
        log_file_operation('write', path, success=False, error=str(e))
        return jsonify({'success': False, 'error': str(e)}), 500

# Original chat endpoints
@app.route('/')
def index():
    return render_template_string(CHAT_HTML)

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

def run_webchat():
    print("Starting Enhanced Ollama Web Chat on http://localhost:8080")
    print("Features: LLM Code Access, File Management API")
    app.run(host='0.0.0.0', port=8080, debug=False, threaded=True)

if __name__ == "__main__":
    run_webchat()
