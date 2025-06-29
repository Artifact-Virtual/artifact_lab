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
  MoreHorizontal,
  Brain,
  Users,
  Workflow as WorkflowIcon,
  ZoomIn,
  ZoomOut,
  Move,
  Minimize2,
  Maximize2,
  Link,
  Unlink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { Workflow } from "@shared/schema";

interface Node {
  id: string;
  type: 'agent' | 'model' | 'tool' | 'data' | 'response' | 'user';
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  description: string;
  status: 'active' | 'idle' | 'processing' | 'error';
  expanded: boolean;
  collapsed: boolean;
  badge?: string;
  color: string;
}

interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
}

interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle: string;
  targetHandle: string;
}

const NODE_TYPES = {
  agent: { 
    icon: Brain, 
    color: '#8b5cf6',
    gradient: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  model: { 
    icon: Cpu, 
    color: '#10b981',
    gradient: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
  tool: { 
    icon: Settings, 
    color: '#3b82f6',
    gradient: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  data: { 
    icon: Database, 
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  response: { 
    icon: ArrowRight, 
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30'
  },
  user: { 
    icon: Users, 
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30'
  }
};

const NODE_SIZE = {
  collapsed: { width: 60, height: 60 },
  expanded: { width: 280, height: 160 }
};

interface NodeComponentProps {
  node: Node;
  onDrag: (id: string, deltaX: number, deltaY: number) => void;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  connections: Connection[];
}

const NodeComponent = ({ node, onDrag, onToggleExpand, onDelete, isSelected, onSelect, connections }: NodeComponentProps) => {
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
        className={`absolute cursor-pointer select-none transition-all duration-300 ${
          isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
        }`}
        style={{
          left: node.x - size.width / 2,
          top: node.y - size.height / 2,
          width: size.width,
          height: size.height,
        }}
        onMouseDown={handleMouseDown}
        onClick={() => onToggleExpand(node.id)}
      >
        <div 
          className={`w-full h-full rounded-2xl bg-gradient-to-br ${nodeType.gradient} shadow-xl border-2 ${
            isSelected ? 'border-white/40 shadow-2xl' : 'border-white/20'
          } flex items-center justify-center relative transition-all duration-300 backdrop-blur-sm`}
          style={{
            boxShadow: isSelected 
              ? `0 20px 40px -10px ${nodeType.color}40, 0 8px 16px -4px ${nodeType.color}20`
              : `0 10px 20px -5px ${nodeType.color}30`
          }}
        >
          <Icon className="w-8 h-8 text-white drop-shadow-lg" />
          
          {/* Status indicator */}
          <div 
            className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 border-black ${
              node.status === 'active' ? 'bg-green-400 animate-pulse' :
              node.status === 'processing' ? 'bg-blue-400 animate-pulse' :
              node.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
            } shadow-lg`} 
          />
          
          {/* Connection handles */}
          <div className="absolute -left-2 top-1/2 w-4 h-4 bg-white/90 rounded-full transform -translate-y-1/2 border-2 border-gray-700" />
          <div className="absolute -right-2 top-1/2 w-4 h-4 bg-white/90 rounded-full transform -translate-y-1/2 border-2 border-gray-700" />
          
          {/* Glow effect */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-20 blur-xl"
            style={{ backgroundColor: nodeType.color }}
          />
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
    >
      <div 
        className={`w-full h-full bg-black/95 backdrop-blur-xl border-2 ${
          isSelected ? 'border-white/30 shadow-2xl' : 'border-white/10 hover:border-white/20'
        } rounded-2xl p-4 transition-all duration-300 relative overflow-hidden`}
        style={{
          boxShadow: isSelected 
            ? `0 25px 50px -10px ${nodeType.color}20, 0 10px 20px -5px ${nodeType.color}10`
            : `0 15px 30px -5px ${nodeType.color}15`
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${nodeType.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-semibold text-white truncate">{node.title}</h4>
                {node.badge && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 border-green-400/30">
                    {node.badge}
                  </Badge>
                )}
              </div>
              {node.subtitle && (
                <p className="text-xs text-gray-400 font-medium">{node.subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="w-7 h-7 p-0 hover:bg-white/10 transition-colors"
              onClick={() => onToggleExpand(node.id)}
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-7 h-7 p-0 hover:bg-red-500/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{node.description}</p>
          
          {/* Status section */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <Badge 
              variant="secondary" 
              className={`text-xs px-2 py-1 ${
                node.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-400/30' :
                node.status === 'processing' ? 'bg-blue-500/20 text-blue-400 border-blue-400/30' :
                node.status === 'error' ? 'bg-red-500/20 text-red-400 border-red-400/30' :
                'bg-gray-500/20 text-gray-400 border-gray-400/30'
              }`}
            >
              {node.status}
            </Badge>
            
            <div className="flex space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400/60 hover:bg-blue-400 transition-colors cursor-pointer" />
              <div className="w-2 h-2 rounded-full bg-blue-400/60 hover:bg-blue-400 transition-colors cursor-pointer" />
            </div>
          </div>
        </div>
        
        {/* Connection handles */}
        <div className="absolute -left-2 top-1/2 w-4 h-4 bg-blue-400 rounded-full transform -translate-y-1/2 border-2 border-black shadow-lg" />
        <div className="absolute -right-2 top-1/2 w-4 h-4 bg-blue-400 rounded-full transform -translate-y-1/2 border-2 border-black shadow-lg" />
        
        {/* Subtle gradient overlay */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-5 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${nodeType.color}20, transparent 70%)` }}
        />
      </div>
    </div>
  );
};

const ConnectionLine = ({ sourceNode, targetNode }: { sourceNode: Node; targetNode: Node }) => {
  const sourceSize = sourceNode.expanded ? NODE_SIZE.expanded : NODE_SIZE.collapsed;
  const targetSize = targetNode.expanded ? NODE_SIZE.expanded : NODE_SIZE.collapsed;
  
  const sourceX = sourceNode.x + sourceSize.width / 2;
  const sourceY = sourceNode.y;
  const targetX = targetNode.x - targetSize.width / 2;
  const targetY = targetNode.y;
  
  const distance = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
  const controlPointOffset = Math.min(distance * 0.4, 150);
  
  const midX1 = sourceX + controlPointOffset;
  const midY1 = sourceY;
  const midX2 = targetX - controlPointOffset;
  const midY2 = targetY;
  
  const path = `M ${sourceX} ${sourceY} C ${midX1} ${midY1}, ${midX2} ${midY2}, ${targetX} ${targetY}`;
  
  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 1 }}>
      <defs>
        <linearGradient id={`connection-gradient-${sourceNode.id}-${targetNode.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={NODE_TYPES[sourceNode.type]?.color || "#8b5cf6"} stopOpacity="0.8" />
          <stop offset="100%" stopColor={NODE_TYPES[targetNode.type]?.color || "#10b981"} stopOpacity="0.8" />
        </linearGradient>
        <filter id={`glow-${sourceNode.id}-${targetNode.id}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Main connection line */}
      <path
        d={path}
        stroke={`url(#connection-gradient-${sourceNode.id}-${targetNode.id})`}
        strokeWidth="3"
        fill="none"
        filter={`url(#glow-${sourceNode.id}-${targetNode.id})`}
        className="opacity-80"
      />
      
      {/* Animated data flow */}
      <circle r="4" className="opacity-90">
        <animateMotion dur="3s" repeatCount="indefinite" path={path} />
        <animate attributeName="fill" values={`${NODE_TYPES[sourceNode.type]?.color};${NODE_TYPES[targetNode.type]?.color};${NODE_TYPES[sourceNode.type]?.color}`} dur="3s" repeatCount="indefinite" />
      </circle>
      
      {/* Arrow marker */}
      <polygon
        points={`${targetX-10},${targetY-5} ${targetX},${targetY} ${targetX-10},${targetY+5}`}
        fill={NODE_TYPES[targetNode.type]?.color || "#10b981"}
        className="opacity-80"
      />
    </svg>
  );
};

export default function ProfessionalCanvas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNodeData, setNewNodeData] = useState({
    type: 'agent' as keyof typeof NODE_TYPES,
    title: '',
    description: ''
  });
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isProcessingJson, setIsProcessingJson] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

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

    // Create professional sample nodes matching the attached design
    const sampleNodes: Node[] = [
      {
        id: '1',
        type: 'user',
        x: 200,
        y: 200,
        title: 'User',
        subtitle: 'Human Input',
        description: 'Explain the benefits of using cloud infrastructure.',
        status: 'active',
        expanded: false,
        collapsed: false,
        color: '#ec4899'
      },
      {
        id: '2',
        type: 'agent',
        x: 450,
        y: 200,
        title: 'Agent',
        subtitle: 'AI Assistant',
        description: 'Processes user requests and coordinates responses using advanced reasoning capabilities.',
        status: 'processing',
        expanded: true,
        collapsed: false,
        color: '#8b5cf6'
      },
      {
        id: '3',
        type: 'model',
        x: 700,
        y: 150,
        title: 'Model',
        subtitle: 'Language Model',
        description: 'NVIDIA language model for generating comprehensive and accurate responses.',
        status: 'active',
        expanded: true,
        badge: 'NVIDIA',
        collapsed: false,
        color: '#10b981'
      },
      {
        id: '4',
        type: 'tool',
        x: 700,
        y: 300,
        title: 'Tools',
        subtitle: 'Research Tools',
        description: 'Access to research databases, documentation, and external knowledge sources.',
        status: 'idle',
        expanded: true,
        badge: '7 added',
        collapsed: false,
        color: '#3b82f6'
      },
      {
        id: '5',
        type: 'response',
        x: 950,
        y: 200,
        title: 'Response',
        subtitle: 'Generated Output',
        description: 'Cloud infrastructure offers scalable, on-demand resources, reducing hardware costs and speeding up experimentation...',
        status: 'active',
        expanded: true,
        collapsed: false,
        color: '#06b6d4'
      }
    ];
    
    setNodes(sampleNodes);
    
    const sampleConnections: Connection[] = [
      { id: '1-2', sourceId: '1', targetId: '2', sourceHandle: 'right', targetHandle: 'left' },
      { id: '2-3', sourceId: '2', targetId: '3', sourceHandle: 'right', targetHandle: 'left' },
      { id: '2-4', sourceId: '2', targetId: '4', sourceHandle: 'right', targetHandle: 'left' },
      { id: '3-5', sourceId: '3', targetId: '5', sourceHandle: 'right', targetHandle: 'left' },
      { id: '4-5', sourceId: '4', targetId: '5', sourceHandle: 'right', targetHandle: 'left' }
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
    if (!newNodeData.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a node title.",
        variant: "destructive"
      });
      return;
    }

    const newNode: Node = {
      id: Date.now().toString(),
      type: newNodeData.type,
      x: 300 + Math.random() * 200,
      y: 200 + Math.random() * 100,
      title: newNodeData.title,
      description: newNodeData.description,
      status: 'idle',
      expanded: false,
      collapsed: false,
      color: NODE_TYPES[newNodeData.type].color
    };

    setNodes(prev => [...prev, newNode]);
    setIsCreateDialogOpen(false);
    setNewNodeData({ type: 'agent', title: '', description: '' });
    toast({ title: "Node Added", description: "New node created successfully." });
  }, [newNodeData, toast]);

  const handlePasteJson = useCallback(async () => {
    if (!jsonInput.trim()) return;

    setIsProcessingJson(true);
    setJsonError(null);

    try {
      const parsed = JSON.parse(jsonInput);
      
      // Convert JSON to nodes and connections
      const convertedNodes: Node[] = [];
      const convertedConnections: Connection[] = [];

      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        parsed.nodes.forEach((nodeData: any, index: number) => {
          const nodeType = nodeData.type || 'agent';
          const validType = Object.keys(NODE_TYPES).includes(nodeType) ? nodeType as keyof typeof NODE_TYPES : 'agent';
          
          const node: Node = {
            id: nodeData.id || `node-${index}`,
            type: validType,
            x: nodeData.x || 200 + (index * 150),
            y: nodeData.y || 200 + (index * 100),
            title: nodeData.title || nodeData.name || `Node ${index + 1}`,
            subtitle: nodeData.subtitle,
            description: nodeData.description || '',
            status: nodeData.status || 'idle',
            expanded: nodeData.expanded !== false,
            collapsed: nodeData.collapsed || false,
            color: nodeData.color || NODE_TYPES[validType].color,
            badge: nodeData.badge
          };
          convertedNodes.push(node);
        });
      }

      if (parsed.connections && Array.isArray(parsed.connections)) {
        parsed.connections.forEach((connData: any, index: number) => {
          const connection: Connection = {
            id: connData.id || `conn-${index}`,
            sourceId: connData.from || connData.source || connData.sourceId,
            targetId: connData.to || connData.target || connData.targetId,
            sourceHandle: connData.fromPort || connData.sourcePort || 'output',
            targetHandle: connData.toPort || connData.targetPort || 'input'
          };
          convertedConnections.push(connection);
        });
      }

      if (convertedNodes.length === 0) {
        throw new Error('No valid nodes found in JSON. Please check the format.');
      }

      setNodes(convertedNodes);
      setConnections(convertedConnections);
      setSelectedWorkflow(null);
      setIsPasteDialogOpen(false);
      setJsonInput('');
      
      toast({ 
        title: "JSON Loaded", 
        description: `Successfully loaded ${convertedNodes.length} nodes and ${convertedConnections.length} connections.` 
      });

    } catch (error) {
      console.error('Error parsing JSON:', error);
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
    } finally {
      setIsProcessingJson(false);
    }
  }, [jsonInput, toast]);

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
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex">
      <Sidebar collapsed={false} activeTab="canvas" onTabChange={() => {}} />
      
      <div className="flex-1 flex flex-col">
        <Header activeTab="canvas" />
        
        <div className="flex-1 flex flex-col bg-black">
          {/* Professional Toolbar */}
          <div className="border-b border-white/10 p-6 flex items-center justify-between bg-black/90 backdrop-blur-xl">
            <div className="flex items-center space-x-6">
              <div>
                <h1 className="text-2xl font-light text-white mb-1">Workflow Canvas</h1>
                <p className="text-sm text-gray-400">Drag. Drop. Deploy.</p>
              </div>
              
              <Select 
                value={selectedWorkflow?.toString() || ""} 
                onValueChange={(value) => loadWorkflow(parseInt(value))}
              >
                <SelectTrigger className="w-72 bg-white/5 border-white/20 backdrop-blur-sm">
                  <SelectValue placeholder="Select workflow..." />
                </SelectTrigger>
                <SelectContent className="bg-black/95 backdrop-blur-xl border-white/20">
                  {workflows.map((workflow: Workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id.toString()}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-3">
              <Dialog open={isPasteDialogOpen} onOpenChange={setIsPasteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white/5 border-white/20 backdrop-blur-sm hover:bg-white/10">
                    <FileText className="w-4 h-4 mr-2" />
                    Paste JSON
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black/95 backdrop-blur-xl border-white/20 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-light">Paste JSON Workflow</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-gray-300">JSON Code</Label>
                      <Textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder={`Paste your JSON workflow here...

Example format:
{
  "nodes": [
    {
      "id": "1",
      "type": "agent",
      "title": "My Agent",
      "x": 200,
      "y": 200,
      "description": "Agent description"
    }
  ],
  "connections": [
    {
      "id": "conn1",
      "sourceId": "1",
      "targetId": "2"
    }
  ]
}`}
                        rows={12}
                        className="bg-white/5 border-white/20 font-mono text-sm"
                      />
                    </div>
                    
                    {jsonError && (
                      <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-400 text-sm rounded">
                        {jsonError}
                      </div>
                    )}
                    
                    <div className="flex space-x-3">
                      <Button 
                        onClick={handlePasteJson} 
                        disabled={!jsonInput.trim() || isProcessingJson}
                        className="bg-purple-600 hover:bg-purple-700 flex-1"
                      >
                        {isProcessingJson ? "Processing..." : "Load JSON"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsPasteDialogOpen(false);
                          setJsonInput('');
                          setJsonError(null);
                        }} 
                        className="border-white/20"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white/5 border-white/20 backdrop-blur-sm hover:bg-white/10">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Node
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black/95 backdrop-blur-xl border-white/20">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-light">Add New Node</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <Label className="text-gray-300">Node Type</Label>
                      <Select 
                        value={newNodeData.type} 
                        onValueChange={(value: keyof typeof NODE_TYPES) => 
                          setNewNodeData(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 backdrop-blur-xl border-white/20">
                          {Object.entries(NODE_TYPES).map(([key, type]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center space-x-3">
                                <type.icon className="w-4 h-4" />
                                <span className="capitalize">{key}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-gray-300">Title</Label>
                      <Input
                        value={newNodeData.title}
                        onChange={(e) => setNewNodeData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter node title..."
                        className="bg-white/5 border-white/20"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-300">Description</Label>
                      <Textarea
                        value={newNodeData.description}
                        onChange={(e) => setNewNodeData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter description..."
                        rows={4}
                        className="bg-white/5 border-white/20"
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button onClick={handleAddNode} className="bg-purple-600 hover:bg-purple-700 flex-1">
                        Add Node
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-white/20">
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
                variant="outline"
                className="bg-white/5 border-white/20 backdrop-blur-sm hover:bg-white/10"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>

              <Button 
                onClick={() => selectedWorkflow && executeWorkflowMutation.mutate(selectedWorkflow)}
                disabled={!selectedWorkflow || executeWorkflowMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute
              </Button>
            </div>
          </div>

          {/* Professional Canvas */}
          <div className="flex-1 relative overflow-hidden">
            <div
              ref={canvasRef}
              className="absolute inset-0 cursor-default"
              onClick={handleCanvasClick}
              style={{
                background: `
                  radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
                  radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
                  radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.02), transparent),
                  radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.01), transparent),
                  radial-gradient(2px 2px at 90px 40px, rgba(255,255,255,0.01), transparent),
                  radial-gradient(2px 2px at 130px 80px, rgba(255,255,255,0.01), transparent)
                `,
                backgroundSize: '400px 400px, 400px 400px, 100px 100px, 100px 100px, 100px 100px, 100px 100px'
              }}
            >
              {/* Professional grid overlay */}
              <div className="absolute inset-0 opacity-[0.02]">
                <svg width="100%" height="100%">
                  <pattern
                    id="professional-grid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.5"
                    />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#professional-grid)" />
                </svg>
              </div>

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
                  connections={connections}
                />
              ))}

              {/* Professional empty state */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-8 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl animate-pulse" />
                      <WorkflowIcon className="w-20 h-20 text-gray-600 mx-auto absolute top-6 left-6" />
                    </div>
                    <h3 className="text-2xl font-light text-white mb-3">Professional Canvas</h3>
                    <p className="text-gray-400 mb-2">Select a workflow to start building</p>
                    <p className="text-sm text-gray-500">Drag. Drop. Deploy.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Professional status bar */}
          <div className="border-t border-white/10 px-6 py-3 flex items-center justify-between text-sm text-gray-400 bg-black/90 backdrop-blur-xl">
            <div className="flex items-center space-x-6">
              <span className="font-medium">Nodes: <span className="text-white">{nodes.length}</span></span>
              <span className="font-medium">Connections: <span className="text-white">{connections.length}</span></span>
              <span className="font-medium">Selected: <span className="text-white">{selectedNode || 'None'}</span></span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="font-medium">Ready</span>
              </div>
              <span className="text-xs text-gray-500">Professional Mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}