import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from DevCore.spinner import Spinner
from DevCore.agents.scaffolder_agent import ScaffolderAgent
from DevCore.agents.codegen_agent import CodeGenAgent
from DevCore.agents.test_agent import TestAgent
from DevCore.agents.autoloop_agent import AutoLoopAgent


def run_pipeline(task: str) -> None:
    context = {"task": task}

    spinner = Spinner("Planning structure...")
    spinner.start()
    ScaffolderAgent().run(context)
    spinner.stop()
    print("Planning structure... done.")

    spinner = Spinner("Generating code...")
    spinner.start()
    CodeGenAgent().run(context)
    spinner.stop()
    print("Generating code... done.")

    spinner = Spinner("Running tests...")
    spinner.start()
    success: bool = TestAgent().run(context)
    spinner.stop()
    print("Running tests... done.")

    if not success:
        spinner = Spinner("Fixing in loop...")
        spinner.start()
        AutoLoopAgent().run(context)
        spinner.stop()
        print("Fixing in loop... done.")
    else:
        print("Project passed tests!")
