"""
ADE Studio Desktop App - Native window for the IDE
Uses webview to create a bezelless, native desktop experience
"""
import webview
import threading
import time
import requests
import sys
import os

# Add ADE to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ADE'))

def start_flask_server():
    """Start the Flask server in a separate thread"""
    from ADE import webchat
    try:
        # Start the Flask app
        webchat.app.run(host='0.0.0.0', port=8080, debug=False, use_reloader=False)
    except Exception as e:
        print(f"Flask server error: {e}")

def wait_for_server():
    """Wait for the Flask server to be ready"""
    max_attempts = 30
    for i in range(max_attempts):
        try:
            response = requests.get('http://localhost:8080', timeout=1)
            if response.status_code == 200:
                return True
        except:
            pass
        time.sleep(1)
    return False

def main():
    """Main function to start the ADE Studio desktop app"""
    print("Starting ADE Studio Desktop App...")
    
    # Start Flask server in background thread
    server_thread = threading.Thread(target=start_flask_server, daemon=True)
    server_thread.start()
    
    # Wait for server to be ready
    print("Waiting for ADE Studio to be ready...")
    if not wait_for_server():
        print("Error: Could not start ADE Studio server")
        return
    
    print("ADE Studio is ready! Opening desktop app...")
    
    # Create the webview window
    webview.create_window(
        title='ADE Studio - Artifact Development Engine',
        url='http://localhost:8080',
        width=1400,
        height=900,
        min_size=(1200, 800),
        resizable=True,
        fullscreen=False,
        minimized=False,
        on_top=False,
        shadow=True,
        vibrancy=False
    )
    
    # Start the webview
    webview.start(debug=False)

if __name__ == '__main__':
    main()
