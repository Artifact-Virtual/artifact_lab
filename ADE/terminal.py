import subprocess
import os
import tempfile
import json
from pathlib import Path


class MultiLanguageTerminal:
    def __init__(self):
        self.supported_languages = {
            "python": {
                "extensions": [".py"],
                "run_command": "python {file}",
                "compile_command": None,
                "repl": "python",
            },
            "cpp": {
                "extensions": [".cpp", ".cc", ".cxx"],
                "run_command": "{executable}",
                "compile_command": "g++ -o {executable} {file}",
                "repl": None,
            },
            "c": {
                "extensions": [".c"],
                "run_command": "{executable}",
                "compile_command": "gcc -o {executable} {file}",
                "repl": None,
            },
            "go": {
                "extensions": [".go"],
                "run_command": "go run {file}",
                "compile_command": "go build {file}",
                "repl": None,
            },
            "rust": {
                "extensions": [".rs"],
                "run_command": "{executable}",
                "compile_command": "rustc {file} -o {executable}",
                "repl": None,
            },
            "java": {
                "extensions": [".java"],
                "run_command": "java {classname}",
                "compile_command": "javac {file}",
                "repl": None,
            },
            "typescript": {
                "extensions": [".ts"],
                "run_command": "ts-node {file}",
                "compile_command": "tsc {file}",
                "repl": "ts-node",
            },
            "javascript": {
                "extensions": [".js"],
                "run_command": "node {file}",
                "compile_command": None,
                "repl": "node",
            },
            "solidity": {
                "extensions": [".sol"],
                "run_command": None,
                "compile_command": "solc {file}",
                "repl": None,
            },
        }

    def detect_language(self, filename):
        """Detect programming language from file extension"""
        ext = Path(filename).suffix.lower()
        for lang, config in self.supported_languages.items():
            if ext in config["extensions"]:
                return lang
        return None

    def run_system_command(self, command):
        """Execute system command"""
        try:
            result = subprocess.run(
                command, shell=True, capture_output=True, text=True, cwd=os.getcwd()
            )
            return result.stdout, result.stderr, result.returncode
        except Exception as e:
            return "", str(e), 1

    def compile_file(self, filename, language):
        """Compile source file if needed"""
        config = self.supported_languages[language]
        if not config["compile_command"]:
            return True, ""

        # Generate executable name
        base_name = Path(filename).stem
        if os.name == "nt":  # Windows
            executable = f"{base_name}.exe"
        else:
            executable = base_name

        # Handle Java special case
        if language == "java":
            classname = base_name
            compile_cmd = config["compile_command"].format(file=filename)
        else:
            compile_cmd = config["compile_command"].format(
                file=filename, executable=executable
            )

        stdout, stderr, returncode = self.run_system_command(compile_cmd)

        if returncode == 0:
            return True, executable if language != "java" else base_name
        else:
            print(f"Compilation failed:\n{stderr}")
            return False, ""

    def run_file(self, filename):
        """Run a source code file"""
        if not os.path.exists(filename):
            print(f"File not found: {filename}")
            return

        language = self.detect_language(filename)
        if not language:
            print(f"Unsupported file type: {filename}")
            return

        config = self.supported_languages[language]

        # Compile if needed
        if config["compile_command"]:
            success, executable = self.compile_file(filename, language)
            if not success:
                return
        else:
            executable = None

        # Run the file
        if config["run_command"]:
            if language == "java":
                classname = Path(filename).stem
                run_cmd = config["run_command"].format(classname=classname)
            else:
                run_cmd = config["run_command"].format(
                    file=filename, executable=executable or filename
                )

            print(f"Running: {run_cmd}")
            stdout, stderr, returncode = self.run_system_command(run_cmd)

            if stdout:
                print(stdout, end="")
            if stderr:
                print(stderr, end="")
        else:
            print(f"Cannot run {language} files directly")

    def start_repl(self, language):
        """Start language REPL"""
        config = self.supported_languages.get(language)
        if not config or not config["repl"]:
            print(f"REPL not available for {language}")
            return

        print(f"Starting {language} REPL...")
        os.system(config["repl"])

    def create_template(self, filename, language):
        """Create template file for given language"""
        templates = {
            "python": """#!/usr/bin/env python3
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
""",
            "cpp": """#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
""",
            "c": """#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
""",
            "go": """package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
""",
            "rust": """fn main() {
    println!("Hello, World!");
}
""",
            "java": """public class {} {{
    public static void main(String[] args) {{
        System.out.println("Hello, World!");
    }}
}}
""",
            "typescript": """function main(): void {
    console.log("Hello, World!");
}

main();
""",
            "javascript": """function main() {
    console.log("Hello, World!");
}

main();
""",
            "solidity": """// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HelloWorld {
    string public message = "Hello, World!";
    
    function setMessage(string memory _message) public {
        message = _message;
    }
}
""",
        }

        template = templates.get(language, f"// {language} template\n")

        # Special handling for Java class name
        if language == "java":
            classname = Path(filename).stem
            template = template.format(classname)

        try:
            with open(filename, "w") as f:
                f.write(template)
            print(f"Created {language} template: {filename}")
        except Exception as e:
            print(f"Error creating template: {e}")

    def show_help(self):
        """Display help information"""
        help_text = """
Multi-Language Terminal Commands:
================================

System Commands:
  <command>                 - Execute system command
  cd <directory>           - Change directory
  ls / dir                 - List directory contents
  pwd                      - Show current directory
  clear / cls              - Clear screen

Language Commands:
  run <file>               - Compile and run source file
  compile <file>           - Compile source file only
  repl <language>          - Start language REPL
  template <file> <lang>   - Create template file

Supported Languages:
  - C/C++ (.c, .cpp)       - Compiled with gcc/g++
  - Python (.py)           - Interpreted
  - Go (.go)               - Compiled/interpreted with go
  - Rust (.rs)             - Compiled with rustc
  - Java (.java)           - Compiled with javac
  - TypeScript (.ts)       - Run with ts-node
  - JavaScript (.js)       - Run with node
  - Solidity (.sol)        - Compile with solc

Examples:
  run hello.py             - Run Python file
  run main.cpp             - Compile and run C++ file
  repl python             - Start Python REPL
  template hello.rs rust   - Create Rust template
  
Type 'exit' to quit.
        """
        print(help_text)

    def run(self):
        """Main terminal loop"""
        print("Multi-Language Programming Terminal")
        print("Type 'help' for available commands")

        while True:
            try:
                current_dir = os.getcwd()
                command = input(f"{Path(current_dir).name}> ").strip()

                if not command:
                    continue

                if command.lower() in ["exit", "quit"]:
                    break

                if command.lower() == "help":
                    self.show_help()
                    continue

                if command.lower() in ["clear", "cls"]:
                    os.system("cls" if os.name == "nt" else "clear")
                    continue

                # Parse command
                parts = command.split()
                cmd = parts[0].lower()

                if cmd == "cd":
                    if len(parts) > 1:
                        try:
                            os.chdir(parts[1])
                        except FileNotFoundError:
                            print(f"Directory not found: {parts[1]}")
                    else:
                        print("Usage: cd <directory>")

                elif cmd == "run":
                    if len(parts) > 1:
                        self.run_file(parts[1])
                    else:
                        print("Usage: run <filename>")

                elif cmd == "compile":
                    if len(parts) > 1:
                        filename = parts[1]
                        language = self.detect_language(filename)
                        if language:
                            self.compile_file(filename, language)
                        else:
                            print(f"Unsupported file type: {filename}")
                    else:
                        print("Usage: compile <filename>")

                elif cmd == "repl":
                    if len(parts) > 1:
                        self.start_repl(parts[1])
                    else:
                        print("Usage: repl <language>")
                        print("Available REPLs: python, javascript, typescript")

                elif cmd == "template":
                    if len(parts) >= 3:
                        filename, language = parts[1], parts[2]
                        if language in self.supported_languages:
                            self.create_template(filename, language)
                        else:
                            print(f"Unsupported language: {language}")
                    else:
                        print("Usage: template <filename> <language>")

                else:
                    # Execute as system command
                    stdout, stderr, returncode = self.run_system_command(command)
                    if stdout:
                        print(stdout, end="")
                    if stderr:
                        print(stderr, end="")

            except KeyboardInterrupt:
                print("\nUse 'exit' to quit")
            except EOFError:
                break


if __name__ == "__main__":
    terminal = MultiLanguageTerminal()
    terminal.run()
