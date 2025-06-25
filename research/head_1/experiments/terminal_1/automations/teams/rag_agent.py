import logging

class RAGAgent:
    def __init__(self, index_agent):
        self.index_agent = index_agent
        self.logger = logging.getLogger('RAGAgent')

    def retrieve_context(self, task):
        # Simple RAG: search index for relevant files by keyword
        if not self.index_agent.index:
            self.logger.warning("No index available for RAG context retrieval.")
            return []
        query = task.get('query', '')
        all_files = self.index_agent.index.get('all_files', [])
        self.logger.info(f"RAGAgent: Indexed files count: {len(all_files)}")
        if all_files:
            self.logger.info(f"RAGAgent: Sample files: {[f['path'] for f in all_files[:5]]}")
        else:
            self.logger.warning("RAGAgent: all_files is empty!")
        # If query is empty or generic, return all files
        if not query or query.lower() in ['all', 'files', 'workspace', 'scripts']:
            self.logger.info(f"RAGAgent: Returning all {len(all_files)} files for generic query '{query}'")
            return all_files
        relevant = [f for f in all_files if query.lower() in f['path'].lower()]
        if not relevant:
            self.logger.info(f"RAGAgent: No relevant files found for query '{query}', returning all files as fallback.")
            return all_files
        self.logger.info(f"RAGAgent found {len(relevant)} relevant files for query '{query}'")
        return relevant
