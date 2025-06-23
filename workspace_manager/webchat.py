import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'system', 'DevCore')))
from ollama_interface import query_model

import json
from flask import Flask, render_template_string, request, jsonify
import requests

app = Flask(__name__)

# HTML template for the chat interface
CHAT_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ARTIFACT VIRTUAL ASSISTANT</title>
    <link rel="icon" type="image/x-icon" href="/static/favicon.ico">
    <!-- Tailwind CSS CDN for easy styling -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Manrope font for a unique, modern, sleek feel -->
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background-color: #000000; /* Pure Black */
            color: #FFFFFF; /* Pure White */
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
            /* Create the disappearing edge effect using linear gradients */
            background:
                linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 5%),
                linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 5%),
                linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 5%),
                linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 5%);
            background-repeat: no-repeat;
            background-size: 100% 5%, 100% 5%, 5% 100%, 5% 100%;
            background-position: top, bottom, left, right;
        }
        
        .chat-container {
            width: 90%;
            max-width: 900px;
            height: 85vh;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            z-index: 1;
        }
        
        .chat-header {
            background: rgba(0, 0, 0, 0.8);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        }
        
        .chat-messages::-webkit-scrollbar {
            width: 6px;
        }
        
        .chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .chat-messages::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
        }
        
        .message {
            max-width: 80%;
            padding: 12px 18px;
            border-radius: 12px;
            word-wrap: break-word;
            font-weight: 300;
        }
        
        .user-message {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            align-self: flex-end;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .bot-message {
            background: rgba(255, 255, 255, 0.05);
            color: #e0e0e0;
            align-self: flex-start;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .chat-input-container {
            padding: 20px;
            background: rgba(0, 0, 0, 0.8);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            gap: 12px;
        }
        
        .chat-input {
            flex: 1;
            padding: 12px 18px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            font-size: 16px;
            outline: none;
            background: rgba(255, 255, 255, 0.05);
            color: white;
            font-family: 'Manrope', sans-serif;
            font-weight: 300;
            transition: border-color 0.3s, background-color 0.3s;
        }
        
        .chat-input:focus {
            border-color: rgba(255, 255, 255, 0.4);
            background: rgba(255, 255, 255, 0.1);
        }
        
        .chat-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
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
        
        .send-button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        
        .typing-indicator {
            padding: 12px 18px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            align-self: flex-start;
            border: 1px solid rgba(255, 255, 255, 0.1);
            font-style: italic;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 300;
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
            </div>
            <div id="status" class="status">
                Connecting to Ollama...
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="bot-message">
                    Hello! I'm AVA. How can I help you with you today?
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
        
        // Check Ollama status on page load
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
        
        function showTypingIndicator() {
            const messagesDiv = document.getElementById('chatMessages');
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator';
            typingDiv.id = 'typing';
            typingDiv.textContent = 'AI is thinking...';
            messagesDiv.appendChild(typingDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        function hideTypingIndicator() {
            const typingDiv = document.getElementById('typing');
            if (typingDiv) {
                typingDiv.remove();
            }
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
            
            // Add user message
            addMessage(message, true);
            chatInput.value = '';
            
            // Disable input while processing
            chatInput.disabled = true;
            sendButton.disabled = true;
            
            // Show typing indicator
            showTypingIndicator();
            
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: message })
                });
                
                const data = await response.json();
                
                // Hide typing indicator
                hideTypingIndicator();
                
                if (data.success) {
                    addMessage(data.response);
                } else {
                    addMessage(`Error: ${data.error}`);
                }
            } catch (error) {
                hideTypingIndicator();
                addMessage(`Error: Failed to send message - ${error.message}`);
            }
            
            // Re-enable input
            chatInput.disabled = false;
            sendButton.disabled = false;
            chatInput.focus();
        }
        
        // Send message on Enter key
        document.getElementById('chatInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Refresh status every 30 seconds
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
            # For .pt, just check if any .pt model exists
            pt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../.pt_models'))
            pt_models = [f for f in os.listdir(pt_dir) if f.endswith('.pt')]
            if pt_models:
                return True, f"Ready with .pt model: {pt_models[0]}"
            else:
                return False, "No .pt models found in .pt_models directory"
        
        try:
            response = requests.get(f"{self.base_url}/api/version", timeout=5)
            if response.status_code == 200:
                # Also check if our model is available
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
        """Send message to Ollama and get response"""
        # Use provider-agnostic query_model
        try:
            response = query_model(message)
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
    # Always report the actual model in use (from config or detected)
    model = None
    if is_ready:
        if chat.model_provider == 'pt':
            # Show the .pt model name if available
            pt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../.pt_models'))
            pt_models = [f for f in os.listdir(pt_dir) if f.endswith('.pt')]
            model = pt_models[0] if pt_models else None
        else:
            # For Ollama, show the actual model in use (from config or detected)
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
        
        # Check if Ollama is ready
        is_ready, status_msg = chat.check_ollama_status()
        if not is_ready:
            return jsonify({'success': False, 'error': f'Ollama not ready: {status_msg}'})
        
        # Send message to Ollama
        success, response = chat.send_message(message)
        
        if success:
            return jsonify({'success': True, 'response': response})
        else:
            return jsonify({'success': False, 'error': response})
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'})

def run_webchat():
    """Run the web chat server"""
    print("Starting Ollama Web Chat on http://localhost:8080")
    app.run(host='0.0.0.0', port=8080, debug=False, threaded=True)

if __name__ == "__main__":
    run_webchat()
