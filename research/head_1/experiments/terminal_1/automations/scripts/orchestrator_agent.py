import sys
from pathlib import Path
# Add workspace root to sys.path for absolute imports
WORKSPACE_ROOT = str(Path(__file__).resolve().parents[5])
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

import logging
from automations.teams.index_agent import IndexAgent
from automations.teams.rag_agent import RAGAgent
from automations.teams.reasoning_agent import ReasoningAgent
from automations.teams.code_agent import CodeAgent
from automations.teams.content_agent import ContentAgent
from automations.teams.vision_agent import VisionAgent

class OrchestratorAgent:
    def __init__(self, workspace_root):
        self.workspace_root = Path(workspace_root)
        self.index_agent = IndexAgent(self.workspace_root)
        self.rag_agent = RAGAgent(self.index_agent)
        self.reasoning_agent = ReasoningAgent(model="qwen3")
        self.code_agent = CodeAgent(model="codegeex4")
        self.content_agent = ContentAgent(model="gemma3")
        self.vision_agent = VisionAgent(model="llava")
        self.log = []
        self.error_log = []

    def run(self, task):
        try:
            self.index_agent.update_index()
            context = self.rag_agent.retrieve_context(task)
            if task["type"] == "reasoning":
                result = self.reasoning_agent.process(task, context)
            elif task["type"] == "code":
                result = self.code_agent.process(task, context)
            elif task["type"] == "content":
                result = self.content_agent.process(task, context)
            elif task["type"] == "vision":
                result = self.vision_agent.process(task, context)
            else:
                raise ValueError("Unknown task type")
            self.log.append({"task": task, "result": result})
            return result
        except Exception as e:
            logging.error(f"Error in OrchestratorAgent: {e}")
            self.error_log.append({"task": task, "error": str(e)})
            return None

    def enhance_workspace(self):
        improvements = self.reasoning_agent.propose_enhancements(self.index_agent.index)
        for imp in improvements:
            try:
                self.code_agent.implement(imp)
                self.log.append({"enhancement": imp, "status": "success"})
            except Exception as e:
                self.error_log.append({"enhancement": imp, "error": str(e)})

    def document_workspace(self):
        docs = self.content_agent.generate_docs(self.index_agent.index)
        for doc_path, content in docs.items():
            try:
                full_path = self.workspace_root / doc_path
                full_path.parent.mkdir(parents=True, exist_ok=True)
                with open(full_path, "w", encoding="utf-8") as f:
                    f.write(content)
                self.log.append({"doc": doc_path, "status": "updated"})
            except Exception as e:
                self.error_log.append({"doc": doc_path, "error": str(e)})

    def chart_workspace(self):
        charts = self.reasoning_agent.generate_charts(self.index_agent.index)
        for chart_path, chart_data in charts.items():
            try:
                full_path = self.workspace_root / chart_path
                full_path.parent.mkdir(parents=True, exist_ok=True)
                with open(full_path, "wb") as f:
                    f.write(chart_data)
                self.log.append({"chart": chart_path, "status": "created"})
            except Exception as e:
                self.error_log.append({"chart": chart_path, "error": str(e)})

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    orchestrator = OrchestratorAgent(workspace_root="..")
    orchestrator.run({"type": "reasoning", "query": "What are the most outdated scripts in this workspace?"})
    orchestrator.enhance_workspace()
    orchestrator.document_workspace()
    orchestrator.chart_workspace()
