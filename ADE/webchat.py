import os
import sys
import json
import requests
from flask import Flask, render_template_string, request, jsonify

# Add DevCore to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'DevCore')))
from ollama_interface import query_model

app = Flask(__name__)

# Enhanced HTML template with Monaco Editor and File Management
CHAT_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ARTIFACT VIRTUAL ASSISTANT</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" data-name="vs/editor/editor.main" href="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/editor/editor.main.min.css">
    <style>
        body {
            background-color: #000000;
            color: #FFFFFF;
            font-family: 'Arial', sans-serif;
            height: 100vh;
            overflow: hidden;
            margin: 0;
        }
        .main-container {
            display: flex;
            height: 100vh;
        }
        .sidebar {
            width: 300px;
            background: rgba(255, 255, 255, 0.02);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
        }
        .file-explorer {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
        }
        .file-item {
            padding: 4px 8px;
            cursor: pointer;
            border-radius: 4px;
            margin: 2px 0;
        }
        .file-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        .file-item.selected {
            background: rgba(0, 123, 255, 0.3);
        }
        .folder {
            font-weight: bold;
        }
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .editor-container {
            flex: 1;
            position: relative;
        }
        .chat-panel {
            width: 400px;
            background: rgba(255, 255, 255, 0.02);
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            flex-direction: column;
        }
        .chat-header {
            text-align: center;
            padding: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .message {
            padding: 8px 12px;
            border-radius: 8px;
            max-width: 85%;
            word-wrap: break-word;
            font-size: 14px;
        }
        .user-message {
            background: rgba(0, 123, 255, 0.2);
            align-self: flex-end;
        }
        .bot-message {
            background: rgba(255, 255, 255, 0.05);
            align-self: flex-start;
        }
        .chat-input-container {
            padding: 15px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            gap: 8px;
        }
        .chat-input {
            flex: 1;
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: white;
            outline: none;
            font-size: 14px;
        }
        .send-button {
            padding: 8px 16px;
            background: rgba(0, 123, 255, 0.3);
            color: white;
            border: 1px solid rgba(0, 123, 255, 0.5);
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        .send-button:hover {
            background: rgba(0, 123, 255, 0.4);
        }
        .status {
            text-align: center;
            padding: 8px;
            font-size: 12px;
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
        .toolbar {
            display: flex;
            padding: 8px;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            gap: 8px;
        }
        .toolbar button {
            padding: 6px 12px;
            background: rgba(255, 255, 255, 0.05);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        .toolbar button:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        #filePathDisplay {
            flex: 1;
            padding: 6px 12px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            font-size: 12px;
            color: #ccc;
        }
    </style>
</head>
<body>
    <div class="main-container">
        <!-- File Explorer -->        <div class="sidebar">
            <div style="padding: 10px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                <h3 style="margin: 0; font-size: 14px;">File Explorer</h3>
                <div id="debugInfo" style="font-size: 10px; color: #888; margin-top: 5px;"></div>
            </div>
            <div class="file-explorer" id="fileExplorer">
                Loading files...
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="main-content">
            <!-- Toolbar -->
            <div class="toolbar">
                <div id="filePathDisplay">No file selected</div>
                <button onclick="saveCurrentFile()">Save</button>
                <button onclick="refreshFiles()">Refresh</button>
            </div>
            
            <!-- Monaco Editor -->
            <div class="editor-container" id="editorContainer">
                <div id="monaco-editor" style="height: 100%; width: 100%;"></div>
            </div>
        </div>

        <!-- Chat Panel -->
        <div class="chat-panel">
            <div class="chat-header">
                <h2 style="margin: 0; font-size: 16px;">AVA Assistant</h2>
                <p style="margin: 5px 0 0 0; font-size: 12px;">AI Code Assistant</p>
            </div>
            <div id="status" class="status">Connecting...</div>
            <div class="chat-messages" id="chatMessages">
                <div class="bot-message">
                    Hello! I'm AVA, your AI assistant. I can help you with:
                    <br>• Code editing and analysis
                    <br>• File management operations  
                    <br>• Project structure navigation
                    <br>• Direct code modifications
                </div>
            </div>
            <div class="chat-input-container">
                <input type="text" class="chat-input" id="chatInput" placeholder="Ask me anything..." disabled>
                <button class="send-button" id="sendButton" onclick="sendMessage()" disabled>Send</button>
            </div>
        </div>
    </div>

    <!-- Monaco Editor -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js"></script>
    
    <script>        let isConnected = false;
        let editor = null;
        let currentFile = null;
        let fileContent = '';
        
        function debugLog(message) {
            console.log(message);
            const debugDiv = document.getElementById('debugInfo');
            if (debugDiv) {
                debugDiv.innerHTML = message + '<br>' + debugDiv.innerHTML;
            }
        }
        
        // Initialize Monaco Editor
        function initializeMonaco() {
            console.log('Initializing Monaco Editor...');
            require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
            require(['vs/editor/editor.main'], function () {
                console.log('Monaco loaded successfully');
                editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                    value: '// Welcome to AVA Code Assistant\n// Select a file from the explorer to start editing',
                    language: 'javascript',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on'
                });
                
                // Auto-save on content change
                editor.onDidChangeModelContent(function() {
                    if (currentFile && editor.getValue() !== fileContent) {
                        // Mark file as modified (could add * to title)
                    }
                });
            });
        }
          window.onload = function() {
            debugLog('Page loaded, initializing...');
            // Initialize without Monaco first
            checkOllamaStatus();
            loadFileExplorer();
            // Initialize Monaco Editor after other components
            setTimeout(initializeMonaco, 1000);
        };async function checkOllamaStatus() {
            debugLog('Checking Ollama status...');
            try {
                const response = await fetch('/status');
                debugLog(`Status response: ${response.status}`);
                const data = await response.json();
                debugLog(`Status data: ${JSON.stringify(data)}`);
                
                const statusDiv = document.getElementById('status');
                const chatInput = document.getElementById('chatInput');
                const sendButton = document.getElementById('sendButton');
                
                debugLog(`Elements found: status=${!!statusDiv}, input=${!!chatInput}, button=${!!sendButton}`);
                
                if (data.status === 'ready') {
                    statusDiv.textContent = `✅ Connected (${data.model})`;
                    statusDiv.className = 'status ready';
                    chatInput.disabled = false;
                    sendButton.disabled = false;
                    isConnected = true;
                    debugLog('Status set to ready');
                } else {
                    statusDiv.textContent = `❌ ${data.message}`;
                    statusDiv.className = 'status error';
                    isConnected = false;
                    debugLog('Status set to error');
                }
            } catch (error) {
                debugLog(`Error checking status: ${error.message}`);
                const statusDiv = document.getElementById('status');
                statusDiv.textContent = '❌ Failed to connect';
                statusDiv.className = 'status error';
                isConnected = false;
            }
        }        async function loadFileExplorer() {
            debugLog('Loading file explorer...');
            try {
                const response = await fetch('/api/files/list');
                debugLog(`File list response: ${response.status}`);
                const data = await response.json();
                debugLog(`File count: ${data.items ? data.items.length : 0}`);
                
                if (data.success) {
                    renderFileExplorer(data.items);
                } else {
                    document.getElementById('fileExplorer').innerHTML = `<div style="color: #ff6b6b; padding: 10px;">Error: ${data.error || 'Unknown error'}</div>`;
                }
            } catch (error) {
                debugLog(`Error loading files: ${error.message}`);
                document.getElementById('fileExplorer').innerHTML = `<div style="color: #ff6b6b; padding: 10px;">Failed to load files: ${error.message}</div>`;
            }
        }
          function renderFileExplorer(items) {
            console.log('Rendering file explorer with items:', items);
            const explorer = document.getElementById('fileExplorer');
            explorer.innerHTML = '';
            
            if (!items || items.length === 0) {
                explorer.innerHTML = '<div style="color: #888; padding: 10px;">No files found</div>';
                return;
            }
            
            // Sort: directories first, then files
            items.sort((a, b) => {
                if (a.type === 'directory' && b.type === 'file') return -1;
                if (a.type === 'file' && b.type === 'directory') return 1;
                return a.name.localeCompare(b.name);
            });
            
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'file-item';
                if (item.type === 'directory') {
                    div.className += ' folder';
                    div.innerHTML = `📁 ${item.name}`;
                } else {
                    div.innerHTML = `📄 ${item.name}`;
                    div.onclick = () => openFile(item.name);
                }
                explorer.appendChild(div);
            });
            
            console.log(`Rendered ${items.length} items in file explorer`);
        }
        
        async function openFile(fileName) {
            try {
                const response = await fetch(`/api/files/read?path=${encodeURIComponent(fileName)}`);
                const data = await response.json();
                
                if (data.success) {
                    currentFile = fileName;
                    fileContent = data.content;
                    
                    // Update editor content
                    if (editor) {
                        editor.setValue(data.content);
                        
                        // Set language based on file extension
                        const extension = fileName.split('.').pop().toLowerCase();
                        const languageMap = {
                            'js': 'javascript',
                            'ts': 'typescript', 
                            'py': 'python',
                            'html': 'html',
                            'css': 'css',
                            'json': 'json',
                            'md': 'markdown',
                            'yml': 'yaml',
                            'yaml': 'yaml',
                            'xml': 'xml',
                            'sql': 'sql',
                            'sh': 'shell',
                            'bat': 'bat',
                            'ps1': 'powershell'
                        };
                        
                        const language = languageMap[extension] || 'plaintext';
                        monaco.editor.setModelLanguage(editor.getModel(), language);
                    }
                    
                    // Update UI
                    document.getElementById('filePathDisplay').textContent = fileName;
                    
                    // Highlight selected file
                    document.querySelectorAll('.file-item').forEach(item => {
                        item.classList.remove('selected');
                        if (item.textContent.includes(fileName)) {
                            item.classList.add('selected');
                        }
                    });
                    
                    addMessage(`Opened file: ${fileName}`, false, true);
                }
            } catch (error) {
                addMessage(`Error opening file: ${error.message}`, false, true);
            }
        }
        
        async function saveCurrentFile() {
            if (!currentFile || !editor) {
                addMessage('No file is currently open', false, true);
                return;
            }
            
            try {
                const content = editor.getValue();
                const response = await fetch('/api/files/write', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: currentFile, content: content })
                });
                
                const data = await response.json();
                if (data.success) {
                    fileContent = content;
                    addMessage(`Saved: ${currentFile}`, false, true);
                } else {
                    addMessage(`Error saving: ${data.error}`, false, true);
                }
            } catch (error) {
                addMessage(`Error saving file: ${error.message}`, false, true);
            }
        }
        
        async function refreshFiles() {
            document.getElementById('fileExplorer').innerHTML = '<div style="color: #888; padding: 10px;">Loading files...</div>';
            await loadFileExplorer();
        }
        
        function addMessage(content, isUser = false, isSystem = false) {
            const messagesDiv = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            
            if (isSystem) {
                messageDiv.className = 'message bot-message';
                messageDiv.style.opacity = '0.7';
                messageDiv.style.fontStyle = 'italic';
            } else {
                messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
            }
            
            messageDiv.innerHTML = content.replace(/\n/g, '<br>');
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
            sendButton.textContent = 'Thinking...';
            
            try {
                // Include context about current file and editor state
                let contextMessage = message;
                if (currentFile && editor) {
                    contextMessage = `Current file: ${currentFile}\n\nUser message: ${message}\n\nCurrent file content:\n${editor.getValue()}`;
                }
                
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: contextMessage,
                        context: {
                            currentFile: currentFile,
                            hasEditor: !!editor
                        }
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    addMessage(data.response);
                    
                    // Check if response contains code that should be applied to editor
                    if (data.fileOperations) {
                        for (const op of data.fileOperations) {
                            if (op.type === 'update' && op.path === currentFile && editor) {
                                editor.setValue(op.content);
                                addMessage(`Updated ${currentFile} with suggested changes`, false, true);
                            }
                        }
                    }
                } else {
                    addMessage(`Error: ${data.error}`);
                }
            } catch (error) {
                addMessage(`Error: Failed to send message - ${error.message}`);
            }
            
            chatInput.disabled = false;
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
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

# Original chat endpoints
@app.route('/')
def index():
    """Serve the clean Monaco-based file manager as the main interface"""
    file_path = os.path.join(os.path.dirname(__file__), 'file_manager_clean.html')
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/file-manager')
def file_manager_redirect():
    """Redirect old file-manager URL to root for backwards compatibility"""
    from flask import redirect
    return redirect('/')

@app.route('/chat-old')
def old_chat():
    """Old chat interface if needed for reference"""
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
    print("Starting Enhanced Ollama Web Chat on http://localhost:8080")
    print("Features: LLM Code Access, File Management API")
    app.run(host='0.0.0.0', port=8080, debug=False, threaded=True)

@app.route('/test')
def test_page():
    """Test page for debugging"""
    with open('test.html', 'r', encoding='utf-8') as f:
        return f.read()

@app.route('/studio')
def studio():
    """Serve the AVA Studio interface with advanced integrations"""
    file_path = os.path.join(os.path.dirname(__file__), 'studio.html')
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

if __name__ == "__main__":
    run_webchat()
