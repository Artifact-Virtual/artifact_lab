import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { 
  Play, 
  Save, 
  Plus, 
  Database, 
  Mail, 
  Globe, 
  Cpu,
  Zap, 
  Bell, 
  FileText, 
  Trash2,
  Settings 
} from "lucide-react";
import type { Workflow, Agent } from "@shared/schema";

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'data' | 'notification' | 'api';
  label: string;
  description: string;
  status: 'active' | 'idle' | 'error';
  x: number;
  y: number;
  width: number;
  height: number;
  connections: string[];
}

const nodeTypes = [
  { value: 'trigger', label: 'Trigger', icon: Zap, color: 'bg-green-500' },
  { value: 'action', label: 'Action', icon: Cpu, color: 'bg-blue-500' },
  { value: 'condition', label: 'Condition', icon: Settings, color: 'bg-yellow-500' },
  { value: 'data', label: 'Data', icon: Database, color: 'bg-purple-500' },
  { value: 'notification', label: 'Notification', icon: Bell, color: 'bg-orange-500' },
  { value: 'api', label: 'API', icon: Globe, color: 'bg-cyan-500' }
];

const WorkflowNodeComponent = ({ node, onSelect, isSelected, onDrag, onDelete, scale }: {
  node: WorkflowNode;
  onSelect: (id: string) => void;
  isSelected: boolean;
  onDrag: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  scale: number;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const nodeType = nodeTypes.find(t => t.value === node.type) || nodeTypes[0];
  const Icon = nodeType.icon;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - node.x, y: e.clientY - node.y });
    onSelect(node.id);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      onDrag(node.id, e.clientX - dragStart.x, e.clientY - dragStart.y);
    }
  }, [isDragging, dragStart, node.id, onDrag]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`absolute cursor-move bg-gray-900 border-2 rounded-lg p-3 min-w-48 transition-all select-none ${
        isSelected ? 'border-glow-cyan shadow-lg shadow-glow-cyan/20' : 'border-white/20 hover:border-white/40'
      }`}
      style={{
        left: node.x,
        top: node.y,
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-8 h-8 ${nodeType.color} rounded-full flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">{node.label}</h4>
          <p className="text-xs text-gray-400">{node.description}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-6 h-6 p-0 hover:bg-red-500/20"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <Badge variant={node.status === 'active' ? 'default' : 'secondary'} className="text-xs">
          {node.status}
        </Badge>
        <span className="text-xs text-gray-500">{nodeType.label}</span>
      </div>
    </div>
  );
};

const ConnectionLine = ({ from, to, nodes }: { from: string; to: string; nodes: WorkflowNode[] }) => {
  const fromNode = nodes.find(n => n.id === from);
  const toNode = nodes.find(n => n.id === to);
  
  if (!fromNode || !toNode) return null;
  
  const fromX = fromNode.x + fromNode.width / 2;
  const fromY = fromNode.y + fromNode.height / 2;
  const toX = toNode.x + toNode.width / 2;
  const toY = toNode.y + toNode.height / 2;
  
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="rgba(34, 197, 94, 0.6)"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <circle cx={toX} cy={toY} r="4" fill="rgb(34, 197, 94)" />
    </svg>
  );
};

export default function Canvas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNodeData, setNewNodeData] = useState({
    type: 'trigger',
    label: '',
    description: ''
  });
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows']
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['/api/agents']
  });

  const saveWorkflowMutation = useMutation({
    mutationFn: async ({ id, config }: { id: number; config: any }) => {
      return apiRequest('PATCH', `/api/workflows/${id}`, { config });
    },
    onSuccess: () => {
      toast({
        title: "Workflow Saved",
        description: "Canvas layout has been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const executeWorkflowMutation = useMutation({
    mutationFn: async (workflowId: number) => {
      return apiRequest('POST', `/api/workflows/${workflowId}/execute`);
    },
    onSuccess: () => {
      toast({
        title: "Workflow Executed",
        description: "Workflow has been started successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createNodeMutation = useMutation({
    mutationFn: async (nodeData: any) => {
      // For now, just add to local state
      return nodeData;
    },
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      setNewNodeData({ type: 'trigger', label: '', description: '' });
      toast({
        title: "Node Added",
        description: "New workflow node has been created."
      });
    }
  });

  const loadWorkflow = useCallback((workflowId: number) => {
    const workflow = workflows.find((w: Workflow) => w.id === workflowId);
    if (!workflow) return;

    setSelectedWorkflow(workflowId);

    // Load nodes from workflow config or create sample nodes
    const config = workflow.config as any;
    if (config?.nodes) {
      setNodes(config.nodes);
    } else {
      // Create sample nodes based on workflow
      const sampleNodes: WorkflowNode[] = [
        {
          id: '1',
          type: 'trigger',
          label: 'Schedule Trigger',
          description: 'Runs every hour',
          status: 'active',
          x: 50,
          y: 50,
          width: 192,
          height: 80,
          connections: ['2']
        },
        {
          id: '2',
          type: 'action',
          label: 'Process Data',
          description: 'Main processing step',
          status: 'idle',
          x: 300,
          y: 50,
          width: 192,
          height: 80,
          connections: ['3']
        },
        {
          id: '3',
          type: 'notification',
          label: 'Send Results',
          description: 'Notify completion',
          status: 'idle',
          x: 550,
          y: 50,
          width: 192,
          height: 80,
          connections: []
        }
      ];
      setNodes(sampleNodes);
    }

    if (config?.panOffset) setPanOffset(config.panOffset);
    if (config?.scale) setScale(config.scale);
  }, [workflows]);

  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, x, y } : node
    ));
  }, []);

  const addNode = useCallback(() => {
    if (!newNodeData.label.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a node label.",
        variant: "destructive"
      });
      return;
    }

    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type: newNodeData.type as any,
      label: newNodeData.label,
      description: newNodeData.description,
      status: 'idle',
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 192,
      height: 80,
      connections: []
    };

    setNodes(prev => [...prev, newNode]);
    createNodeMutation.mutate(newNode);
  }, [newNodeData, createNodeMutation, toast]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
    toast({
      title: "Node Deleted",
      description: "Node has been removed from the canvas."
    });
  }, [selectedNode, toast]);

  const saveWorkflow = useCallback(() => {
    if (!selectedWorkflow) {
      toast({
        title: "No Workflow Selected",
        description: "Please select a workflow first.",
        variant: "destructive"
      });
      return;
    }

    saveWorkflowMutation.mutate({
      id: selectedWorkflow,
      config: {
        nodes,
        version: Date.now(),
        panOffset,
        scale
      }
    });
  }, [selectedWorkflow, nodes, panOffset, scale, saveWorkflowMutation, toast]);

  const executeWorkflow = useCallback(() => {
    if (!selectedWorkflow) {
      toast({
        title: "No Workflow Selected",
        description: "Please select a workflow first.",
        variant: "destructive"
      });
      return;
    }
    executeWorkflowMutation.mutate(selectedWorkflow);
  }, [selectedWorkflow, executeWorkflowMutation, toast]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedNode(null);
    }
  }, []);

  // Auto-load first workflow on mount
  useEffect(() => {
    if (workflows.length > 0 && !selectedWorkflow) {
      loadWorkflow(workflows[0].id);
    }
  }, [workflows, selectedWorkflow, loadWorkflow]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-glow-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading workflow canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex">
      <Sidebar collapsed={sidebarCollapsed} activeTab="canvas" onTabChange={() => {}} />
      
      <div className="flex-1 flex flex-col">
        <Header activeTab="canvas" />
        
        <div className="flex-1 flex flex-col bg-black">
          {/* Toolbar */}
          <div className="border-b border-white/10 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-extralight">Workflow Canvas</h1>
              
              <Select 
                value={selectedWorkflow?.toString() || ""} 
                onValueChange={(value) => loadWorkflow(parseInt(value))}
              >
                <SelectTrigger className="w-64 holographic-border">
                  <SelectValue placeholder="Select workflow..." />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map((workflow: Workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id.toString()}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="holographic-border">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Node
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black border-white/20">
                  <DialogHeader>
                    <DialogTitle>Add New Node</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="node-type">Node Type</Label>
                      <Select 
                        value={newNodeData.type} 
                        onValueChange={(value) => setNewNodeData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {nodeTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="node-label">Label</Label>
                      <Input
                        id="node-label"
                        value={newNodeData.label}
                        onChange={(e) => setNewNodeData(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Enter node name..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="node-description">Description</Label>
                      <Textarea
                        id="node-description"
                        value={newNodeData.description}
                        onChange={(e) => setNewNodeData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter description..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button onClick={addNode} disabled={createNodeMutation.isPending}>
                        {createNodeMutation.isPending ? 'Adding...' : 'Add Node'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={saveWorkflow} disabled={saveWorkflowMutation.isPending} className="holographic-border">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>

              <Button onClick={executeWorkflow} disabled={executeWorkflowMutation.isPending} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Execute
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={handleCanvasClick}
              style={{
                backgroundImage: `
                  radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
                `
              }}
            >
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                  <pattern
                    id="grid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Connection lines */}
              {nodes.map(node => 
                node.connections.map(connectionId => (
                  <ConnectionLine
                    key={`${node.id}-${connectionId}`}
                    from={node.id}
                    to={connectionId}
                    nodes={nodes}
                  />
                ))
              )}

              {/* Workflow nodes */}
              {nodes.map(node => (
                <WorkflowNodeComponent
                  key={node.id}
                  node={node}
                  onSelect={setSelectedNode}
                  isSelected={selectedNode === node.id}
                  onDrag={updateNodePosition}
                  onDelete={deleteNode}
                  scale={scale}
                />
              ))}

              {/* Empty state */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-light text-gray-400 mb-2">Empty Canvas</h3>
                    <p className="text-gray-500 mb-4">Select a workflow to start building</p>
                    {!selectedWorkflow && (
                      <p className="text-sm text-gray-600">Choose a workflow from the dropdown above</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Nodes: {nodes.length}</span>
              <span>Connections: {nodes.reduce((acc, node) => acc + node.connections.length, 0)}</span>
              {selectedWorkflow && (
                <span>Workflow: {workflows.find((w: Workflow) => w.id === selectedWorkflow)?.name}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span>Scale: {Math.round(scale * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}