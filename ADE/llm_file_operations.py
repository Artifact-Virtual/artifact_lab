"""
LLM File Operations Handler
Enables the LLM to directly interact with the file system through structured commands
"""

import os
import json
import requests
from typing import Dict, List, Any, Optional

class LLMFileOperations:
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url
        
    def execute_command(self, command: str, **kwargs) -> Dict[str, Any]:
        """Execute a file operation command"""
        try:
            if command == "list_files":
                return self._list_files(kwargs.get('path', ''))
            elif command == "read_file":
                return self._read_file(kwargs.get('path', ''))
            elif command == "write_file":
                return self._write_file(kwargs.get('path', ''), kwargs.get('content', ''))
            elif command == "create_file":
                return self._create_file(kwargs.get('path', ''), kwargs.get('content', ''))
            elif command == "delete_file":
                return self._delete_file(kwargs.get('path', ''))
            elif command == "search_files":
                return self._search_files(kwargs.get('query', ''), kwargs.get('type', 'name'))
            else:
                return {"success": False, "error": f"Unknown command: {command}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _list_files(self, path: str) -> Dict[str, Any]:
        """List files in directory"""
        response = requests.get(f"{self.base_url}/api/files/list", params={"path": path})
        return response.json()
    
    def _read_file(self, path: str) -> Dict[str, Any]:
        """Read file contents"""
        response = requests.get(f"{self.base_url}/api/files/read", params={"path": path})
        return response.json()
    
    def _write_file(self, path: str, content: str) -> Dict[str, Any]:
        """Write file contents"""
        response = requests.post(f"{self.base_url}/api/files/write", 
                               json={"path": path, "content": content})
        return response.json()
    
    def _create_file(self, path: str, content: str = "") -> Dict[str, Any]:
        """Create new file"""
        response = requests.post(f"{self.base_url}/api/files/create", 
                               json={"path": path, "type": "file", "content": content})
        return response.json()
    
    def _delete_file(self, path: str) -> Dict[str, Any]:
        """Delete file or directory"""
        response = requests.delete(f"{self.base_url}/api/files/delete", 
                                 json={"path": path})
        return response.json()
    
    def _search_files(self, query: str, search_type: str = "name") -> Dict[str, Any]:
        """Search files"""
        response = requests.get(f"{self.base_url}/api/files/search", 
                              params={"query": query, "type": search_type})
        return response.json()

def enhance_llm_prompt_with_file_ops(base_prompt: str) -> str:
    """Enhance LLM prompt with file operation capabilities"""
    file_ops_instructions = """
You have access to file operations through these commands:
- list_files(path="") - List files and directories
- read_file(path="file/path") - Read file contents  
- write_file(path="file/path", content="new content") - Write to file
- create_file(path="new/file", content="content") - Create new file
- delete_file(path="file/path") - Delete file or directory
- search_files(query="search term", type="name|content") - Search files

To use these operations, format your response with:
FILE_OPERATION: command_name(param1="value1", param2="value2")

Example:
FILE_OPERATION: read_file(path="src/main.py")
FILE_OPERATION: write_file(path="src/main.py", content="# Updated code\\nprint('Hello World')")

You can perform multiple operations in sequence.
All operations are logged and auditable.
Always confirm what operations you performed.
"""
    
    return f"{base_prompt}\n\n{file_ops_instructions}"

def parse_llm_response_for_file_ops(response: str) -> List[Dict[str, Any]]:
    """Parse LLM response for file operations"""
    operations = []
    lines = response.split('\n')
    
    for line in lines:
        if line.strip().startswith('FILE_OPERATION:'):
            try:
                # Extract command from line
                cmd_part = line.replace('FILE_OPERATION:', '').strip()
                
                # Simple parsing - could be enhanced with proper AST parsing
                if '(' in cmd_part and ')' in cmd_part:
                    cmd_name = cmd_part.split('(')[0].strip()
                    params_str = cmd_part.split('(', 1)[1].rsplit(')', 1)[0]
                    
                    # Parse parameters (simple key="value" format)
                    params = {}
                    if params_str.strip():
                        for param in params_str.split(','):
                            if '=' in param:
                                key, value = param.split('=', 1)
                                key = key.strip()
                                value = value.strip().strip('"').strip("'")
                                params[key] = value
                    
                    operations.append({
                        'command': cmd_name,
                        'params': params
                    })
            except Exception as e:
                print(f"Failed to parse file operation: {line}, error: {e}")
    
    return operations

def execute_llm_file_operations(operations: List[Dict[str, Any]], 
                               file_ops: LLMFileOperations) -> List[Dict[str, Any]]:
    """Execute file operations from LLM response"""
    results = []
    
    for op in operations:
        try:
            result = file_ops.execute_command(op['command'], **op['params'])
            results.append({
                'operation': op,
                'result': result,
                'success': result.get('success', False)
            })
        except Exception as e:
            results.append({
                'operation': op,
                'result': {'success': False, 'error': str(e)},
                'success': False
            })
    
    return results

# Example usage
if __name__ == "__main__":
    # Example of enhanced LLM interaction
    file_ops = LLMFileOperations()
    
    # Test file operations
    print("Testing file operations...")
    
    # List files
    result = file_ops.execute_command("list_files", path="")
    print(f"List files result: {result}")
    
    # Create a test file
    result = file_ops.execute_command("create_file", 
                                    path="test_llm_file.txt", 
                                    content="This file was created by the LLM!")
    print(f"Create file result: {result}")
    
    # Read the file
    result = file_ops.execute_command("read_file", path="test_llm_file.txt")
    print(f"Read file result: {result}")
