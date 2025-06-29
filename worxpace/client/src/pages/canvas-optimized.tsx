import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Settings,
  ArrowRight,
  MoreHorizontal
} from "lucide-react";
import type { Workflow } from "@shared/schema";

interface Node {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'data' | 'notification' | 'api';
  x: number;
  y: number;
  label: string;
  description: string;
  status: 'active' | 'idle' | 'error';
  expanded: boolean;
}

interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

const NODE_TYPES = {
  trigger: { icon: Zap, color: '#10b981', bgColor: 'bg-emerald-500' },
  action: { icon: Cpu, color: '#3b82f6', bgColor: 'bg-blue-500' },
  condition: { icon: Settings, color: '#f59e0b', bgColor: 'bg-amber-500' },
  data: { icon: Database, color: '#8b5cf6', bgColor: 'bg-purple-500' },
  notification: { icon: Bell, color: '#ef4444', bgColor: 'bg-red-500' },
  api: { icon: Globe, color: '#06b6d4', bgColor: 'bg-cyan-500' }
};

const NODE_SIZE = {
  collapsed: { width: 48, height: 48 },
  expanded: { width: 200, height: 120 }
};

interface NodeComponentProps {
  node: Node;
  onDrag: (id: string, deltaX: number, deltaY: number) => void;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const NodeComponent = ({ node, onDrag, onToggleExpand, onDelete, isSelected, onSelect }: NodeComponentProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  
  const nodeType = NODE_TYPES[node.type];
  const Icon = nodeType.icon;
  const size = node.expanded ? NODE_SIZE.expanded : NODE_SIZE.collapsed;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    onSelect(node.id);
  }, [node.id, onSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    onDrag(node.id, deltaX, deltaY);
    setDragStart({ x: e.clientX, y: e.clientY });
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

  if (!node.expanded) {
    return (
      <div
        ref={nodeRef}
        className={`absolute cursor-pointer select-none transition-all duration-200 ${
          isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
        }`}
        style={{
          left: node.x - size.width / 2,
          top: node.y - size.height / 2,
          width: size.width,
          height: size.height,
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={() => onToggleExpand(node.id)}
      >
        <div 
          className={`w-full h-full rounded-full ${nodeType.bgColor} shadow-lg border-2 ${
            isSelected ? 'border-white shadow-white/20' : 'border-white/20 hover:border-white/40'
          } flex items-center justify-center relative transition-all duration-200`}
        >
          <Icon className="w-6 h-6 text-white" />
          
          {/* Status indicator */}
          <div 
            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-black ${
              node.status === 'active' ? 'bg-green-400' :
              node.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
            }`} 
          />
          
          {/* Connection points */}
          <div className="absolute -left-1 top-1/2 w-2 h-2 bg-white/60 rounded-full transform -translate-y-1/2" />
          <div className="absolute -right-1 top-1/2 w-2 h-2 bg-white/60 rounded-full transform -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={nodeRef}
      className={`absolute cursor-pointer select-none transition-all duration-300 ${
        isSelected ? 'z-20' : 'z-10'
      }`}
      style={{
        left: node.x - size.width / 2,
        top: node.y - size.height / 2,
        width: size.width,
        height: size.height,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => onToggleExpand(node.id)}
    >
      <div 
        className={`w-full h-full bg-black/90 backdrop-blur-sm border-2 ${
          isSelected ? 'border-white shadow-lg shadow-white/10' : 'border-white/20 hover:border-white/30'
        } rounded-xl p-3 transition-all duration-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full ${nodeType.bgColor} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-white truncate">{node.label}</h4>
              <p className="text-xs text-gray-400 capitalize">{node.type}</p>
            </div>
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
            <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400" />
          </Button>
        </div>
        
        {/* Description */}
        <p className="text-xs text-gray-300 mb-3 line-clamp-2">{node.description}</p>
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="secondary" 
            className={`text-xs ${
              node.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-400/30' :
              node.status === 'error' ? 'bg-red-500/20 text-red-400 border-red-400/30' :
              'bg-gray-500/20 text-gray-400 border-gray-400/30'
            }`}
          >
            {node.status}
          </Badge>
          
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-blue-400/60" />
            <div className="w-2 h-2 rounded-full bg-blue-400/60" />
          </div>
        </div>
        
        {/* Connection points */}
        <div className="absolute -left-1 top-1/2 w-2 h-2 bg-blue-400 rounded-full transform -translate-y-1/2" />
        <div className="absolute -right-1 top-1/2 w-2 h-2 bg-blue-400 rounded-full transform -translate-y-1/2" />
      </div>
    </div>
  );
};

const ConnectionLine = ({ sourceNode, targetNode }: { sourceNode: Node; targetNode: Node }) => {
  const sourceX = sourceNode.x + (sourceNode.expanded ? NODE_SIZE.expanded.width / 2 : NODE_SIZE.collapsed.width / 2);
  const sourceY = sourceNode.y;
  const targetX = targetNode.x - (targetNode.expanded ? NODE_SIZE.expanded.width / 2 : NODE_SIZE.collapsed.width / 2);
  const targetY = targetNode.y;
  
  const midX = (sourceX + targetX) / 2;
  const path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;
  
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.6)" />
          <stop offset="100%" stopColor="rgba(16, 185, 129, 0.6)" />
        </linearGradient>
      </defs>
      <path
        d={path}
        stroke="url(#connection-gradient)"
        strokeWidth="2"
        fill="none"
        className="drop-shadow-sm"
      />
      <circle r="3" fill="#10b981" className="animate-pulse">
        <animateMotion dur="2s" repeatCount="indefinite" path={path} />
      </circle>
    </svg>
  );
};

export default function OptimizedCanvas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNodeData, setNewNodeData] = useState({
    type: 'trigger' as keyof typeof NODE_TYPES,
    label: '',
    description: ''
  });

  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows']
  });

  const saveWorkflowMutation = useMutation({
    mutationFn: async ({ id, config }: { id: number; config: any }) => {
      return apiRequest('PATCH', `/api/workflows/${id}`, { config });
    },
    onSuccess: () => {
      toast({ title: "Workflow Saved", description: "Canvas layout saved successfully." });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    },
    onError: (error) => {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    }
  });

  const executeWorkflowMutation = useMutation({
    mutationFn: async (workflowId: number) => {
      return apiRequest('POST', `/api/workflows/${workflowId}/execute`);
    },
    onSuccess: () => {
      toast({ title: "Workflow Executed", description: "Workflow started successfully." });
    },
    onError: (error) => {
      toast({ title: "Execution Failed", description: error.message, variant: "destructive" });
    }
  });

  const loadWorkflow = useCallback((workflowId: number) => {
    const workflow = workflows.find((w: Workflow) => w.id === workflowId);
    if (!workflow) return;

    setSelectedWorkflow(workflowId);

    // Create sample nodes for the workflow
    const sampleNodes: Node[] = [
      {
        id: '1',
        type: 'trigger',
        x: 150,
        y: 200,
        label: 'Schedule Trigger',
        description: 'Runs automatically every hour',
        status: 'active',
        expanded: false
      },
      {
        id: '2',
        type: 'condition',
        x: 350,
        y: 200,
        label: 'Check Conditions',
        description: 'Validates incoming data',
        status: 'idle',
        expanded: false
      },
      {
        id: '3',
        type: 'action',
        x: 550,
        y: 150,
        label: 'Process Data',
        description: 'Main processing pipeline',
        status: 'idle',
        expanded: false
      },
      {
        id: '4',
        type: 'notification',
        x: 550,
        y: 250,
        label: 'Error Alert',
        description: 'Send error notifications',
        status: 'idle',
        expanded: false
      },
      {
        id: '5',
        type: 'api',
        x: 750,
        y: 150,
        label: 'Export Results',
        description: 'Send data via API',
        status: 'idle',
        expanded: false
      }
    ];
    
    setNodes(sampleNodes);
    
    const sampleConnections: Connection[] = [
      { id: '1-2', sourceId: '1', targetId: '2' },
      { id: '2-3', sourceId: '2', targetId: '3' },
      { id: '2-4', sourceId: '2', targetId: '4' },
      { id: '3-5', sourceId: '3', targetId: '5' }
    ];
    
    setConnections(sampleConnections);
  }, [workflows]);

  const handleNodeDrag = useCallback((nodeId: string, deltaX: number, deltaY: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, x: node.x + deltaX, y: node.y + deltaY }
        : node
    ));
  }, []);

  const handleToggleExpand = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, expanded: !node.expanded }
        : node
    ));
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => 
      conn.sourceId !== nodeId && conn.targetId !== nodeId
    ));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
    toast({ title: "Node Deleted", description: "Node removed from canvas." });
  }, [selectedNode, toast]);

  const handleAddNode = useCallback(() => {
    if (!newNodeData.label.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a node label.",
        variant: "destructive"
      });
      return;
    }

    const newNode: Node = {
      id: Date.now().toString(),
      type: newNodeData.type,
      x: 300 + Math.random() * 200,
      y: 200 + Math.random() * 100,
      label: newNodeData.label,
      description: newNodeData.description,
      status: 'idle',
      expanded: false
    };

    setNodes(prev => [...prev, newNode]);
    setIsCreateDialogOpen(false);
    setNewNodeData({ type: 'trigger', label: '', description: '' });
    toast({ title: "Node Added", description: "New node created successfully." });
  }, [newNodeData, toast]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedNode(null);
    }
  }, []);

  // Auto-load first workflow
  useEffect(() => {
    if (workflows.length > 0 && !selectedWorkflow) {
      loadWorkflow(workflows[0].id);
    }
  }, [workflows, selectedWorkflow, loadWorkflow]);

  const connectionsToRender = useMemo(() => {
    return connections.map(conn => {
      const sourceNode = nodes.find(n => n.id === conn.sourceId);
      const targetNode = nodes.find(n => n.id === conn.targetId);
      return sourceNode && targetNode ? { sourceNode, targetNode } : null;
    }).filter(Boolean);
  }, [connections, nodes]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex">
      <Sidebar collapsed={false} activeTab="canvas" onTabChange={() => {}} />
      
      <div className="flex-1 flex flex-col">
        <Header activeTab="canvas" />
        
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="border-b border-white/10 p-4 flex items-center justify-between bg-black/80 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-light text-white">Workflow Canvas</h1>
              
              <Select 
                value={selectedWorkflow?.toString() || ""} 
                onValueChange={(value) => loadWorkflow(parseInt(value))}
              >
                <SelectTrigger className="w-64 bg-white/5 border-white/20">
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
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Node
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black/95 backdrop-blur-md border-white/20">
                  <DialogHeader>
                    <DialogTitle>Add New Node</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Node Type</Label>
                      <Select 
                        value={newNodeData.type} 
                        onValueChange={(value: keyof typeof NODE_TYPES) => 
                          setNewNodeData(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(NODE_TYPES).map(([key, type]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center space-x-2">
                                <type.icon className="w-4 h-4" />
                                <span className="capitalize">{key}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={newNodeData.label}
                        onChange={(e) => setNewNodeData(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Enter node name..."
                      />
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newNodeData.description}
                        onChange={(e) => setNewNodeData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter description..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button onClick={handleAddNode}>Add Node</Button>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={() => selectedWorkflow && saveWorkflowMutation.mutate({
                  id: selectedWorkflow,
                  config: { nodes, connections }
                })} 
                disabled={!selectedWorkflow || saveWorkflowMutation.isPending}
                className="bg-white/5 border-white/20"
                variant="outline"
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>

              <Button 
                onClick={() => selectedWorkflow && executeWorkflowMutation.mutate(selectedWorkflow)}
                disabled={!selectedWorkflow || executeWorkflowMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden bg-black">
            <div
              ref={canvasRef}
              className="absolute inset-0 cursor-default"
              onClick={handleCanvasClick}
              style={{
                backgroundImage: `
                  radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)
                `,
                backgroundSize: '30px 30px'
              }}
            >
              {/* Connections */}
              {connectionsToRender.map((conn, index) => 
                conn ? (
                  <ConnectionLine
                    key={index}
                    sourceNode={conn.sourceNode}
                    targetNode={conn.targetNode}
                  />
                ) : null
              )}

              {/* Nodes */}
              {nodes.map(node => (
                <NodeComponent
                  key={node.id}
                  node={node}
                  onDrag={handleNodeDrag}
                  onToggleExpand={handleToggleExpand}
                  onDelete={handleDeleteNode}
                  isSelected={selectedNode === node.id}
                  onSelect={setSelectedNode}
                />
              ))}

              {/* Empty state */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg text-gray-400 mb-2">Canvas Ready</h3>
                    <p className="text-gray-500">Select a workflow to start building</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between text-sm text-gray-400 bg-black/80">
            <div className="flex items-center space-x-4">
              <span>Nodes: {nodes.length}</span>
              <span>Connections: {connections.length}</span>
              <span>Selected: {selectedNode || 'None'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}