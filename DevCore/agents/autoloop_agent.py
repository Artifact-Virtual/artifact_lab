from typing import Dict, Any
from DevCore.core.base_agent import BaseAgent
from DevCore.ollama_interface import query_model
import os
import json


class AutoLoopAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("AutoLoop")
        self.max_iterations = 5
        self.current_iteration = 0

    def run(self, context: Dict[str, Any]) -> bool:
        """
        Automatically attempts to fix failing code using LLM feedback.
        Loops until tests pass or max iterations reached.
        """
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'workspace'))
        
        print(f"○ Starting auto-fix loop (max {self.max_iterations} iterations)...")
        
        from DevCore.agents.test_agent import TestAgent
        from DevCore.agents.codegen_agent import CodeGenAgent
        
        test_agent = TestAgent()
        codegen_agent = CodeGenAgent()
        
        for iteration in range(self.max_iterations):
            self.current_iteration = iteration + 1
            print(f"○ Auto-fix iteration {self.current_iteration}/{self.max_iterations}")
            
            # Run tests
            test_passed = test_agent.run(context)
            
            if test_passed:
                print("▣ Tests passed! Auto-fix loop complete")
                return True
            
            # If tests failed, try to fix the issues
            print(f"× Tests failed on iteration {self.current_iteration}")
            
            # Get test error details
            test_error = context.get('test_error', 'Unknown test failure')
            
            # Attempt to fix the issues
            if not self.attempt_fix(context, test_error, iteration + 1):
                print(f"× Failed to generate fixes on iteration {self.current_iteration}")
                continue
            
            # Regenerate code with fixes
            print("▢ Regenerating code with fixes...")
            codegen_agent.run(context)
        
        print(f"× Auto-fix loop completed without success after {self.max_iterations} iterations")
        return False

    def attempt_fix(self, context: Dict[str, Any], error_message: str, iteration: int) -> bool:
        """
        Attempt to fix code issues using LLM analysis.
        """
        try:
            # Gather context about the failing files
            files_info = self.gather_files_info(context)
            
            # Create fix prompt
            fix_prompt = self.create_fix_prompt(
                context['task'], 
                files_info, 
                error_message, 
                iteration
            )
            
            # Query LLM for fixes
            fix_response = query_model(fix_prompt)
            
            # Parse and apply fixes
            return self.apply_fixes(context, fix_response)
            
        except Exception as e:
            print(f"× Error in attempt_fix: {str(e)}")
            return False

    def gather_files_info(self, context: Dict[str, Any]) -> Dict[str, str]:
        """
        Gather information about files that need fixing.
        """
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'workspace'))
        files_info = {}
        
        for file_path in context.get('files', []):
            full_path = os.path.join(base_path, file_path)
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    files_info[file_path] = content
            except Exception as e:
                files_info[file_path] = f"Error reading file: {str(e)}"
        
        return files_info

    def create_fix_prompt(self, task: str, files_info: Dict[str, str], 
                         error_message: str, iteration: int) -> str:
        """
        Create a prompt for the LLM to fix the code issues.
        """
        prompt = f"""
You are an expert code fixer. A project has failing tests and needs to be fixed.

ORIGINAL TASK: {task}

CURRENT FILES AND THEIR CONTENT:
"""
        
        for file_path, content in files_info.items():
            prompt += f"\n--- FILE: {file_path} ---\n{content}\n"
        
        prompt += f"""
ERROR/TEST FAILURE: {error_message}

ITERATION: {iteration}

Please analyze the error and provide fixed versions of the problematic files.
Focus on:
1. Syntax errors
2. Import/dependency issues  
3. Logic errors
4. Missing functionality
5. Runtime errors

For each file that needs fixing, provide the complete corrected code.
Use this format:

FILE: filename.ext
```
corrected code here
```

Be comprehensive and ensure the fixes address the root cause of the failures.
"""
        return prompt

    def apply_fixes(self, context: Dict[str, Any], fix_response: str) -> bool:
        """
        Parse the LLM response and apply fixes to files.
        """
        try:
            base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'workspace'))
            
            # Parse the fix response to extract file fixes
            fixes = self.parse_fix_response(fix_response)
            
            if not fixes:
                print("▲ No fixes found in LLM response")
                return False
            
            # Apply fixes to files
            fixes_applied = 0
            for file_path, fixed_content in fixes.items():
                full_path = os.path.join(base_path, file_path)
                try:
                    # Backup original file
                    backup_path = full_path + f'.backup_{self.current_iteration}'
                    if os.path.exists(full_path):
                        with open(full_path, 'r', encoding='utf-8') as f:
                            original_content = f.read()
                        with open(backup_path, 'w', encoding='utf-8') as f:
                            f.write(original_content)
                    
                    # Write fixed content
                    os.makedirs(os.path.dirname(full_path), exist_ok=True)
                    with open(full_path, 'w', encoding='utf-8') as f:
                        f.write(fixed_content)
                    
                    print(f"▢ Applied fix to: {file_path}")
                    fixes_applied += 1
                    
                except Exception as e:
                    print(f"× Error applying fix to {file_path}: {str(e)}")
            
            if fixes_applied > 0:
                print(f"▣ Applied {fixes_applied} fixes")
                return True
            else:
                print("× No fixes were successfully applied")
                return False
                
        except Exception as e:
            print(f"× Error applying fixes: {str(e)}")
            return False

    def parse_fix_response(self, response: str) -> Dict[str, str]:
        """
        Parse the LLM response to extract file fixes.
        """
        fixes = {}
        lines = response.split('\n')
        current_file = None
        current_content = []
        in_code_block = False
        
        for line in lines:
            # Check for file marker
            if line.startswith('FILE:'):
                # Save previous file if exists
                if current_file and current_content:
                    fixes[current_file] = '\n'.join(current_content)
                
                # Start new file
                current_file = line.replace('FILE:', '').strip()
                current_content = []
                in_code_block = False
                continue
            
            # Check for code block markers
            if line.strip().startswith('```'):
                in_code_block = not in_code_block
                continue
            
            # Collect code content
            if current_file and in_code_block:
                current_content.append(line)
        
        # Save last file
        if current_file and current_content:
            fixes[current_file] = '\n'.join(current_content)
        
        return fixes

    def create_status_report(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a status report of the auto-fix process.
        """
        return {
            'agent': self.name,
            'max_iterations': self.max_iterations,
            'current_iteration': self.current_iteration,
            'files_processed': len(context.get('files', [])),
            'test_error': context.get('test_error', 'None'),
            'completed': self.current_iteration >= self.max_iterations
        }
