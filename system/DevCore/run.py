import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from DevCore.spinner import Spinner
from DevCore.core.agent_runner import run_pipeline

# Ensure the script runs from the DevCore directory
if os.path.dirname(__file__):
    os.chdir(os.path.dirname(__file__))

# Add the parent directory to sys.path for DevCore imports
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import compromise and related packages
try:
    import spacy
    import en_core_web_sm
    import textblob
    import nltk
    import re
    import string
except ImportError:
    print("Some NLP packages are missing. Please install them for full functionality.")

if __name__ == "__main__":
    print("========================================")
    print("         DevCore CLI is ready           ")
    print("========================================")
    print("Enter a project description to begin.")
    print("----------------------------------------")
    task = input("What should I build? > ")
    print("----------------------------------------")
    print(f"NLP Preprocessing: {task}")
    print("----------------------------------------")
    spinner = Spinner("Running pipeline")
    spinner.start()
    run_pipeline(task)
    spinner.stop()
    print("========================================")
    print("   DevCore pipeline execution complete  ")
    print("========================================")
