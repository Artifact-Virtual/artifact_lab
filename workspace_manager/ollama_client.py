# This file is now deprecated. Use DevCore/ollama_interface.py for all model queries.
# Left for legacy reference only.

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'system', 'DevCore')))
from ollama_interface import query_model

def summarize(text):
    prompt = f"Summarize the following codebase:\n{text[:8000]}"
    return query_model(prompt)
