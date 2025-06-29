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
  Settings,
  Circle,
  ArrowRight
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
  connections: string[];
  isExpanded?: boolean;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  points: { x: number; y: number; }[];
}

const nodeTypes = [
  { value: 'trigger', label: 'Trigger', icon: Zap, color: 'from-green-500 to-emerald-600' },
  { value: 'action', label: 'Action', icon: Cpu, color: 'from-blue-500 to-cyan-600' },
  { value: 'condition', label: 'Condition', icon: Settings, color: 'from-yellow-500 to-orange-600' },
  { value: 'data', label: 'Data', icon: Database, color: 'from-purple-500 to-pink-600' },
  { value: 'notification', label: 'Notification', icon: Bell, color: 'from-orange-500 to-red-600' },
  { value: 'api', label: 'API', icon: Globe, color: 'from-cyan-500 to-blue-600' }
];

const CollapsedNode = ({ node, nodeType, onExpand, onSelect, isSelected, onDrag, onDelete }: {
  node: WorkflowNode;
  nodeType: any;
  onExpand: () => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  onDrag: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const Icon = nodeType.icon;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className={`absolute cursor-move transition-all duration-300 ease-out transform hover:scale-110 ${
        isSelected ? 'scale-110' : ''
      }`}
      style={{
        left: node.x,
        top: node.y,
        transform: `translate(-50%, -50%)`,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={onExpand}
    >
      <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${nodeType.color} shadow-lg border-2 border-white/20 hover:border-glow-cyan/60 transition-all duration-300 group`}>
        {/* Status indicator */}
        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-black transition-all duration-300 ${
          node.status === 'active' ? 'bg-green-400 shadow-green-400/50 shadow-md' :
          node.status === 'error' ? 'bg-red-400 shadow-red-400/50 shadow-md' :
          'bg-gray-400'
        }`} />
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        
        {/* Hover glow effect */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${nodeType.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md`} />
      </div>
    </div>
  );
};

const ExpandedNode = ({ node, nodeType, onCollapse, onSelect, isSelected, onDrag, onDelete }: {
  node: WorkflowNode;
  nodeType: any;
  onCollapse: () => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  onDrag: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const Icon = nodeType.icon;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className={`absolute cursor-move transition-all duration-300 ease-out transform ${
        isSelected ? 'scale-105' : ''
      }`}
      style={{
        left: node.x,
        top: node.y,
        transform: `translate(-50%, -50%)`,
      }}
      onMouseDown={handleMouseDown}
      onMouseLeave={onCollapse}
    >
      <div className={`relative bg-black/90 backdrop-blur-md border-2 ${
        isSelected ? 'border-glow-cyan shadow-lg shadow-glow-cyan/20' : 'border-white/20 hover:border-white/40'
      } rounded-xl p-4 min-w-48 max-w-64 transition-all duration-300`}>
        
        {/* Header */}
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${nodeType.color} flex items-center justify-center relative`}>
            <Icon className="w-5 h-5 text-white" />
            {/* Status indicator */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-black ${
              node.status === 'active' ? 'bg-green-400' :
              node.status === 'error' ? 'bg-red-400' :
              'bg-gray-400'
            }`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate">{node.label}</h4>
            <p className="text-xs text-gray-400 truncate">{nodeType.label}</p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0 hover:bg-red-500/20 transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Description */}
        <p className="text-xs text-gray-300 mb-3 line-clamp-2">{node.description}</p>
        
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant={node.status === 'active' ? 'default' : 'secondary'} 
            className={`text-xs transition-colors duration-200 ${
              node.status === 'active' ? 'bg-green-600/20 text-green-400 border-green-400/30' :
              node.status === 'error' ? 'bg-red-600/20 text-red-400 border-red-400/30' :
              'bg-gray-600/20 text-gray-400 border-gray-400/30'
            }`}
          >
            {node.status}
          </Badge>
          
          {/* Connection points */}
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-glow-cyan/60 hover:bg-glow-cyan transition-colors duration-200" />
            <div className="w-2 h-2 rounded-full bg-glow-cyan/60 hover:bg-glow-cyan transition-colors duration-200" />
          </div>
        </div>
        
        {/* Holographic glow effect */}
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${nodeType.color} opacity-5 pointer-events-none`} />
      </div>
    </div>
  );
};

const SmartConnection = ({ connection, nodes }: { connection: Connection; nodes: WorkflowNode[] }) => {
  const fromNode = nodes.find(n => n.id === connection.from);
  const toNode = nodes.find(n => n.id === connection.to);
  
  if (!fromNode || !toNode) return null;
  
  // Calculate smart connection points
  const fromX = fromNode.x;
  const fromY = fromNode.y;
  const toX = toNode.x;
  const toY = toNode.y;
  
  // Calculate control points for smooth curve
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const controlOffset = Math.min(distance * 0.3, 100);
  const control1X = fromX + controlOffset;
  const control1Y = fromY;
  const control2X = toX - controlOffset;
  const control2Y = toY;
  
  const pathData = `M ${fromX} ${fromY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${toX} ${toY}`;
  
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <linearGradient id={`connection-gradient-${connection.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(34, 197, 94, 0.8)" />
          <stop offset="50%" stopColor="rgba(59, 130, 246, 0.8)" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.8)" />
        </linearGradient>
        <filter id={`glow-${connection.id}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Connection path with glow */}
      <path
        d={pathData}
        stroke={`url(#connection-gradient-${connection.id})`}
        strokeWidth="3"
        fill="none"
        filter={`url(#glow-${connection.id})`}
        className="animate-pulse"
      />
      
      {/* Animated data flow */}
      <circle r="4" fill="rgba(34, 197, 94, 0.9)">
        <animateMotion dur="3s" repeatCount="indefinite" path={pathData} />
      </circle>
      
      {/* Arrow head */}
      <polygon
        points={`${toX-8},${toY-4} ${toX},${toY} ${toX-8},${toY+4}`}
        fill="rgba(34, 197, 94, 0.9)"
      />
    </svg>
  );
};

export default function Canvas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
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
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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

    // Create optimized sample nodes with better positioning
    const sampleNodes: WorkflowNode[] = [
      {
        id: '1',
        type: 'trigger',
        label: 'Schedule Trigger',
        description: 'Runs every hour automatically',
        status: 'active',
        x: 200,
        y: 150,
        connections: ['2'],
        isExpanded: false
      },
      {
        id: '2',
        type: 'condition',
        label: 'Check Conditions',
        description: 'Validates data before processing',
        status: 'idle',
        x: 400,
        y: 150,
        connections: ['3', '4'],
        isExpanded: false
      },
      {
        id: '3',
        type: 'action',
        label: 'Process Data',
        description: 'Main data processing pipeline',
        status: 'idle',
        x: 600,
        y: 100,
        connections: ['5'],
        isExpanded: false
      },
      {
        id: '4',
        type: 'notification',
        label: 'Error Alert',
        description: 'Notify on validation failure',
        status: 'idle',
        x: 600,
        y: 200,
        connections: [],
        isExpanded: false
      },
      {
        id: '5',
        type: 'api',
        label: 'Send Results',
        description: 'Export processed data via API',
        status: 'idle',
        x: 800,
        y: 100,
        connections: [],
        isExpanded: false
      }
    ];
    
    setNodes(sampleNodes);
    
    // Create connections
    const newConnections: Connection[] = [
      { id: '1-2', from: '1', to: '2', points: [] },
      { id: '2-3', from: '2', to: '3', points: [] },
      { id: '2-4', from: '2', to: '4', points: [] },
      { id: '3-5', from: '3', to: '5', points: [] }
    ];
    
    setConnections(newConnections);
  }, [workflows]);

  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, x, y } : node
    ));
  }, []);

  const expandNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => new Set([...prev, nodeId]));
  }, []);

  const collapseNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      return newSet;
    });
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
      x: 300 + Math.random() * 200,
      y: 200 + Math.random() * 100,
      connections: [],
      isExpanded: false
    };

    setNodes(prev => [...prev, newNode]);
    createNodeMutation.mutate(newNode);
  }, [newNodeData, createNodeMutation, toast]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => conn.from !== nodeId && conn.to !== nodeId));
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      return newSet;
    });
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
        connections,
        version: Date.now(),
        panOffset,
        scale
      }
    });
  }, [selectedWorkflow, nodes, connections, panOffset, scale, saveWorkflowMutation, toast]);

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
      setExpandedNodes(new Set());
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
          {/* Enhanced Toolbar */}
          <div className="border-b border-white/10 p-4 flex items-center justify-between bg-black/50 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-extralight bg-gradient-to-r from-glow-cyan to-glow-blue bg-clip-text text-transparent">
                Enhanced Canvas
              </h1>
              
              <Select 
                value={selectedWorkflow?.toString() || ""} 
                onValueChange={(value) => loadWorkflow(parseInt(value))}
              >
                <SelectTrigger className="w-64 holographic-border bg-black/30 backdrop-blur-sm">
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
                  <Button variant="outline" size="sm" className="holographic-border bg-black/30 backdrop-blur-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Node
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black/90 backdrop-blur-md border-white/20">
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

              <Button onClick={saveWorkflow} disabled={saveWorkflowMutation.isPending} className="holographic-border bg-black/30 backdrop-blur-sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>

              <Button onClick={executeWorkflow} disabled={executeWorkflowMutation.isPending} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <Play className="w-4 h-4 mr-2" />
                Execute
              </Button>
            </div>
          </div>

          {/* Enhanced Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <div
              ref={canvasRef}
              className="absolute inset-0 cursor-default"
              onClick={handleCanvasClick}
              style={{
                backgroundImage: `
                  radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
                  radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
                  radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.03) 0%, transparent 70%)
                `
              }}
            >
              {/* Animated grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]">
                <svg width="100%" height="100%">
                  <pattern
                    id="enhanced-grid"
                    width="60"
                    height="60"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 60 0 L 0 0 0 60"
                      fill="none"
                      stroke="url(#grid-gradient)"
                      strokeWidth="0.5"
                    />
                  </pattern>
                  <defs>
                    <linearGradient id="grid-gradient">
                      <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
                      <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#enhanced-grid)" />
                </svg>
              </div>

              {/* Smart connections */}
              {connections.map(connection => (
                <SmartConnection
                  key={connection.id}
                  connection={connection}
                  nodes={nodes}
                />
              ))}

              {/* Optimized workflow nodes */}
              {nodes.map(node => {
                const nodeType = nodeTypes.find(t => t.value === node.type) || nodeTypes[0];
                const isExpanded = expandedNodes.has(node.id);
                
                return isExpanded ? (
                  <ExpandedNode
                    key={node.id}
                    node={node}
                    nodeType={nodeType}
                    onCollapse={() => collapseNode(node.id)}
                    onSelect={setSelectedNode}
                    isSelected={selectedNode === node.id}
                    onDrag={updateNodePosition}
                    onDelete={deleteNode}
                  />
                ) : (
                  <CollapsedNode
                    key={node.id}
                    node={node}
                    nodeType={nodeType}
                    onExpand={() => expandNode(node.id)}
                    onSelect={setSelectedNode}
                    isSelected={selectedNode === node.id}
                    onDrag={updateNodePosition}
                    onDelete={deleteNode}
                  />
                );
              })}

              {/* Enhanced empty state */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-glow-cyan/20 to-glow-blue/20 rounded-full animate-pulse" />
                      <FileText className="w-16 h-16 text-gray-600 mx-auto absolute top-4 left-4" />
                    </div>
                    <h3 className="text-lg font-light text-gray-400 mb-2">Enhanced Canvas Ready</h3>
                    <p className="text-gray-500 mb-4">Select a workflow to start building with improved nodes</p>
                    {!selectedWorkflow && (
                      <p className="text-sm text-gray-600">Choose a workflow from the dropdown above</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced status bar */}
          <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between text-sm text-gray-400 bg-black/50 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <span>Nodes: {nodes.length}</span>
              <span>Connections: {connections.length}</span>
              <span>Expanded: {Array.from(expandedNodes).length}</span>
              {selectedWorkflow && (
                <span>Workflow: {workflows.find((w: Workflow) => w.id === selectedWorkflow)?.name}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span>Scale: {Math.round(scale * 100)}%</span>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}