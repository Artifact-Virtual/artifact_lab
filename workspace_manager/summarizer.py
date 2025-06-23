import os
import json
import glob
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'system', 'DevCore')))
from ollama_interface import query_model

SUMMARY_PATH = os.path.join(os.path.dirname(__file__), 'system_summary.json')
SRC_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

def summarize_codebase():
    py_files = glob.glob(os.path.join(SRC_PATH, '**', '*.py'), recursive=True)
    code_snippets = []
    for f in py_files:
        with open(f, 'r', encoding='utf-8') as file:
            code_snippets.append(file.read())
    codebase_text = '\n\n'.join(code_snippets)
    summary = query_model(f"Summarize the following codebase:\n{codebase_text[:8000]}")
    with open(SUMMARY_PATH, 'w', encoding='utf-8') as f:
        json.dump({'summary': summary}, f, indent=2)
