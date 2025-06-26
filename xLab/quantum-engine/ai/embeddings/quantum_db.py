# This file will implement the embedding database for quantum methods.

class QuantumDB:
    def __init__(self):
        self.embeddings = {}

    def add_embedding(self, method_name, embedding):
        """Add a new embedding for a quantum method."""
        self.embeddings[method_name] = embedding

    def get_embedding(self, method_name):
        """Retrieve the embedding for a specific quantum method."""
        return self.embeddings.get(method_name, None)

    def list_embeddings(self):
        """List all stored embeddings."""
        return list(self.embeddings.keys())

    def clear_embeddings(self):
        """Clear all stored embeddings."""
        self.embeddings.clear()