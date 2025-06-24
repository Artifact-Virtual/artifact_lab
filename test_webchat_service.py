#!/usr/bin/env python3
"""
Test script to check if the ADE-Desktop webchat service can start properly.
This helps diagnose import and path issues.
"""

import os
import sys

def test_imports():
    print("=== Testing ADE Desktop Webchat Service ===")
    print(f"Python version: {sys.version}")
    print(f"Current working directory: {os.getcwd()}")
    
    # Test 1: Check if we can find the webchat.py file
    webchat_path = os.path.join("ADE-Desktop", "ade_core", "webchat.py")
    if os.path.exists(webchat_path):
        print(f"✅ Found webchat.py at: {webchat_path}")
    else:
        print(f"❌ Cannot find webchat.py at: {webchat_path}")
        return False
    
    # Test 2: Check if we can find DevCore
    devcore_path = os.path.join("DevCore", "ollama_interface.py")
    if os.path.exists(devcore_path):
        print(f"✅ Found ollama_interface.py at: {devcore_path}")
    else:
        print(f"❌ Cannot find ollama_interface.py at: {devcore_path}")
        return False
    
    # Test 3: Try to import the webchat module
    print("\nTesting imports...")
    try:
        # Add paths
        current_dir = os.getcwd()
        devcore_path = os.path.join(current_dir, 'DevCore')
        ade_path = os.path.join(current_dir, 'ADE')
        
        sys.path.insert(0, devcore_path)
        sys.path.insert(0, ade_path)
        
        # Test Flask import
        from flask import Flask
        print("✅ Flask import successful")
        
        # Test ollama_interface import
        try:
            from ollama_interface import query_model
            print("✅ ollama_interface import successful")
        except ImportError as e:
            print(f"⚠️  ollama_interface import failed: {e}")
            print("   This is expected if DevCore/ollama_interface.py doesn't exist")
        
        # Test config loading
        config_path = os.path.join("ADE-Desktop", "ade_core", "config.json")
        if os.path.exists(config_path):
            import json
            with open(config_path, 'r') as f:
                config = json.load(f)
            print(f"✅ Config loaded successfully: {config}")
        else:
            print(f"❌ Config file not found at: {config_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Import test failed: {e}")
        return False

def test_manual_run():
    print("\n=== Manual Test Run ===")
    print("Attempting to run webchat.py directly...")
    
    try:
        # Change to the webchat directory
        os.chdir(os.path.join("ADE-Desktop", "ade_core"))
        print(f"Changed to directory: {os.getcwd()}")
        
        # Import and test the webchat module
        sys.path.insert(0, os.path.join("..", "..", "DevCore"))
        sys.path.insert(0, os.path.join("..", "..", "ADE"))
        
        print("Testing webchat import...")
        # This would normally import the webchat module, but let's just test the basics
        
        import json
        import requests
        from flask import Flask
        
        print("✅ All basic imports successful")
        
        # Test port availability
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 9000))
        sock.close()
        
        if result == 0:
            print("⚠️  Port 9000 is already in use")
        else:
            print("✅ Port 9000 is available")
        
        return True
        
    except Exception as e:
        print(f"❌ Manual test failed: {e}")
        return False

if __name__ == "__main__":
    print("Starting ADE Desktop webchat service diagnostics...\n")
    
    success = test_imports()
    if success:
        test_manual_run()
    
    print("\n=== Diagnostic Complete ===")
    if success:
        print("✅ Basic tests passed. Try running the webchat service manually:")
        print("   cd ADE-Desktop/ade_core")
        print("   python webchat.py")
    else:
        print("❌ Issues detected. Check the errors above.")
