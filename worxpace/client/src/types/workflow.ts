export interface WorkflowNode {
  id: string;
  type: 'agent' | 'workflow' | 'tool' | 'data';
  position: { x: number; y: number };
  data: {
    title: string;
    status: 'active' | 'inactive' | 'warning' | 'error';
    description: string;
    config?: Record<string, any>;
  };
}

export interface WorkflowConnection {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  sourceNodeId?: string;
  targetNodeId?: string;
}

export interface WorkflowMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

export interface WorkflowActivity {
  id: string;
  title: string;
  time: string;
  type: 'workflow' | 'agent' | 'tool' | 'knowledge';
  status: 'completed' | 'running' | 'error';
}
