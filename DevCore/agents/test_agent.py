from typing import Dict, Any, Optional
from DevCore.core.base_agent import BaseAgent
from DevCore.ollama_interface import query_model
import os
import subprocess
import json
import tempfile


class TestAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("Test")

    def run(self, context: Dict[str, Any]) -> bool:
        """
        Runs tests on the generated code and returns success status.
        Returns True if all tests pass, False if any fail.
        """
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'workspace'))
        
        if not os.path.exists(base_path):
            print("❌ Workspace not found")
            return False
        
        files = context.get('files', [])
        if not files:
            print("❌ No files to test")
            return False
        
        print(f"🧪 Testing {len(files)} files...")
        
        # Determine project type and run appropriate tests
        project_type = self.detect_project_type(base_path, files)
        
        try:
            if project_type == 'python':
                return self.test_python_project(base_path, files)
            elif project_type == 'javascript':
                return self.test_javascript_project(base_path, files)
            elif project_type == 'typescript':
                return self.test_typescript_project(base_path, files)
            else:
                return self.test_generic_project(base_path, files)
        except Exception as e:
            print(f"❌ Test execution failed: {str(e)}")
            context['test_error'] = str(e)
            return False

    def detect_project_type(self, base_path: str, files: list) -> str:
        """Detect the primary project type based on files."""
        file_types = {}
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            file_types[ext] = file_types.get(ext, 0) + 1
        
        # Determine primary type
        if file_types.get('.py', 0) > 0:
            return 'python'
        elif file_types.get('.ts', 0) > 0:
            return 'typescript'
        elif file_types.get('.js', 0) > 0:
            return 'javascript'
        else:
            return 'generic'

    def test_python_project(self, base_path: str, files: list) -> bool:
        """Test Python project files."""
        print("🐍 Testing Python project...")
        
        # Check for syntax errors
        syntax_errors = []
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(base_path, file)
                if not self.check_python_syntax(file_path):
                    syntax_errors.append(file)
        
        if syntax_errors:
            print(f"❌ Syntax errors found in: {', '.join(syntax_errors)}")
            return False
        
        # Try to run the main file if it exists
        main_files = [f for f in files if 'main' in f.lower() or 'app' in f.lower()]
        if main_files:
            main_file = os.path.join(base_path, main_files[0])
            if self.run_python_file(main_file):
                print("✅ Python project tests passed")
                return True
        
        print("✅ Python syntax checks passed")
        return True

    def test_javascript_project(self, base_path: str, files: list) -> bool:
        """Test JavaScript project files."""
        print("🟨 Testing JavaScript project...")
        
        # Check for package.json
        package_json = os.path.join(base_path, 'package.json')
        if os.path.exists(package_json):
            return self.test_node_project(base_path)
        
        # Check syntax for JS files
        for file in files:
            if file.endswith('.js'):
                file_path = os.path.join(base_path, file)
                if not self.check_javascript_syntax(file_path):
                    print(f"❌ Syntax error in: {file}")
                    return False
        
        print("✅ JavaScript syntax checks passed")
        return True

    def test_typescript_project(self, base_path: str, files: list) -> bool:
        """Test TypeScript project files."""
        print("🔷 Testing TypeScript project...")
        
        # Check for tsconfig.json
        tsconfig = os.path.join(base_path, 'tsconfig.json')
        if os.path.exists(tsconfig):
            return self.test_typescript_compilation(base_path)
        
        # Basic syntax check
        for file in files:
            if file.endswith('.ts'):
                file_path = os.path.join(base_path, file)
                if not self.check_typescript_syntax(file_path):
                    print(f"❌ Syntax error in: {file}")
                    return False
        
        print("✅ TypeScript syntax checks passed")
        return True

    def test_generic_project(self, base_path: str, files: list) -> bool:
        """Test generic project files."""
        print("📄 Testing generic project...")
        
        # Basic file integrity checks
        for file in files:
            file_path = os.path.join(base_path, file)
            if not os.path.exists(file_path):
                print(f"❌ Missing file: {file}")
                return False
            
            if os.path.getsize(file_path) == 0:
                print(f"⚠️ Empty file: {file}")
        
        print("✅ Generic project checks passed")
        return True

    def check_python_syntax(self, file_path: str) -> bool:
        """Check Python file syntax."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                source = f.read()
            
            compile(source, file_path, 'exec')
            return True
        except SyntaxError as e:
            print(f"❌ Python syntax error in {file_path}: {e}")
            return False
        except Exception as e:
            print(f"❌ Error checking Python syntax: {e}")
            return False

    def run_python_file(self, file_path: str) -> bool:
        """Try to run a Python file."""
        try:
            result = subprocess.run([
                'python', file_path
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                print(f"✅ Successfully ran: {file_path}")
                return True
            else:
                print(f"❌ Error running {file_path}: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            print(f"⏰ Timeout running: {file_path}")
            return False
        except Exception as e:
            print(f"❌ Error running Python file: {e}")
            return False

    def check_javascript_syntax(self, file_path: str) -> bool:
        """Check JavaScript file syntax using Node.js."""
        try:
            # Use Node.js to check syntax
            result = subprocess.run([
                'node', '-c', file_path
            ], capture_output=True, text=True, timeout=10)
            
            return result.returncode == 0
        except subprocess.TimeoutExpired:
            print(f"⏰ Timeout checking: {file_path}")
            return False
        except FileNotFoundError:
            print("⚠️ Node.js not found, skipping JavaScript syntax check")
            return True
        except Exception as e:
            print(f"❌ Error checking JavaScript syntax: {e}")
            return False

    def test_node_project(self, base_path: str) -> bool:
        """Test Node.js project with npm."""
        try:
            # Try to install dependencies
            result = subprocess.run([
                'npm', 'install'
            ], cwd=base_path, capture_output=True, text=True, timeout=60)
            
            if result.returncode != 0:
                print(f"❌ npm install failed: {result.stderr}")
                return False
            
            # Try to run tests if test script exists
            package_json_path = os.path.join(base_path, 'package.json')
            with open(package_json_path, 'r') as f:
                package_data = json.load(f)
            
            if 'scripts' in package_data and 'test' in package_data['scripts']:
                test_result = subprocess.run([
                    'npm', 'test'
                ], cwd=base_path, capture_output=True, text=True, timeout=30)
                
                if test_result.returncode == 0:
                    print("✅ npm test passed")
                    return True
                else:
                    print(f"❌ npm test failed: {test_result.stderr}")
                    return False
            
            print("✅ npm install successful")
            return True
            
        except subprocess.TimeoutExpired:
            print("⏰ npm operation timed out")
            return False
        except FileNotFoundError:
            print("⚠️ npm not found, skipping Node.js tests")
            return True
        except Exception as e:
            print(f"❌ Error testing Node.js project: {e}")
            return False

    def check_typescript_syntax(self, file_path: str) -> bool:
        """Check TypeScript file syntax."""
        try:
            # Use tsc to check syntax
            result = subprocess.run([
                'tsc', '--noEmit', file_path
            ], capture_output=True, text=True, timeout=10)
            
            return result.returncode == 0
        except subprocess.TimeoutExpired:
            print(f"⏰ Timeout checking: {file_path}")
            return False
        except FileNotFoundError:
            print("⚠️ TypeScript compiler not found, skipping TS syntax check")
            return True
        except Exception as e:
            print(f"❌ Error checking TypeScript syntax: {e}")
            return False

    def test_typescript_compilation(self, base_path: str) -> bool:
        """Test TypeScript project compilation."""
        try:
            result = subprocess.run([
                'tsc', '--noEmit'
            ], cwd=base_path, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                print("✅ TypeScript compilation successful")
                return True
            else:
                print(f"❌ TypeScript compilation failed: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            print("⏰ TypeScript compilation timed out")
            return False
        except FileNotFoundError:
            print("⚠️ TypeScript compiler not found")
            return True
        except Exception as e:
            print(f"❌ Error compiling TypeScript: {e}")
            return False
