import { useState, useCallback } from 'react';
import { WorkflowNode, WorkflowConnection } from '@/types/workflow';

export function useWorkflowCanvas() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'rag-system',
      type: 'data',
      position: { x: 80, y: 80 },
      data: {
        title: 'Agentic RAG System',
        status: 'active',
        description: 'Processing 247 knowledge sources'
      }
    },
    {
      id: 'ai-cluster',
      type: 'agent',
      position: { x: 240, y: 240 },
      data: {
        title: 'AI Agent Cluster',
        status: 'active',
        description: '7 agents online • Task queue: 12'
      }
    },
    {
      id: 'windmill-automation',
      type: 'workflow',
      position: { x: 400, y: 80 },
      data: {
        title: 'Windmill Automation',
        status: 'active',
        description: '24 workflows active'
      }
    }
  ]);

  const [connections, setConnections] = useState<WorkflowConnection[]>([
    {
      id: 'conn-1',
      from: { x: 200, y: 120 },
      to: { x: 300, y: 280 }
    },
    {
      id: 'conn-2',
      from: { x: 400, y: 120 },
      to: { x: 300, y: 280 }
    }
  ]);

  const addNode = useCallback((node: WorkflowNode) => {
    setNodes(prev => [...prev, node]);
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ));
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(node => node.id !== id));
    setConnections(prev => prev.filter(conn => 
      !conn.id.includes(id)
    ));
  }, []);

  const addConnection = useCallback((connection: WorkflowConnection) => {
    setConnections(prev => [...prev, connection]);
  }, []);

  return {
    nodes,
    connections,
    addNode,
    updateNode,
    deleteNode,
    addConnection
  };
}
