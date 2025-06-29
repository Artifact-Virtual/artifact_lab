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

interface Connection {
  id: string;
  from: string;
  to: string;
  animated: boolean;
}

interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
}

const defaultNodes: Node[] = [
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
    y: 200,
    title: 'Model',
    subtitle: 'GPT-4',
    description: 'Advanced language model with deep understanding of technical concepts and cloud infrastructure.',
    status: 'active',
    expanded: true,
    collapsed: false,
    badge: 'GPT-4',
    color: '#06b6d4'
  },
  {
    id: '4',
    type: 'tool',
    x: 950,
    y: 200,
    title: 'Tool',
    subtitle: 'Documentation',
    description: 'Comprehensive knowledge base with detailed information about cloud services and best practices.',
    status: 'idle',
    expanded: true,
    collapsed: false,
    badge: 'RAG',
    color: '#10b981'
  },
  {
    id: '5',
    type: 'response',
    x: 700,
    y: 450,
    title: 'Response',
    subtitle: 'Final Output',
    description: 'Structured and comprehensive explanation of cloud infrastructure benefits.',
    status: 'active',
    expanded: true,
    collapsed: false,
    color: '#f59e0b'
  }
];

const defaultConnections: Connection[] = [
  { id: 'c1', from: '1', to: '2', animated: true },
  { id: 'c2', from: '2', to: '3', animated: true },
  { id: 'c3', from: '3', to: '4', animated: true },
  { id: 'c4', from: '2', to: '5', animated: true }
];

export default function EnhancedProfessionalCanvas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempConnection, setTempConnection] = useState<{ fromId: string; x: number; y: number } | null>(null);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [nodes, setNodes] = useState<Node[]>(defaultNodes);
  const [connections, setConnections] = useState<Connection[]>(defaultConnections);
  const [canvasState, setCanvasState] = useState<CanvasState>({ zoom: 1, panX: 0, panY: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const { data: workflows = [] } = useQuery({
    queryKey: ["/api/workflows"],
  });

  const executeWorkflow = useMutation({
    mutationFn: async (workflowId: number) => {
      await apiRequest(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workflow executed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive",
      });
    },
  });

  // Zoom functions
  const zoomIn = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 3)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, 0.3)
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setCanvasState({ zoom: 1, panX: 0, panY: 0 });
  }, []);

  // Pan functions
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+click
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasState.panX, y: e.clientY - canvasState.panY });
      e.preventDefault();
    }
  }, [canvasState.panX, canvasState.panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasState(prev => ({
        ...prev,
        panX: e.clientX - panStart.x,
        panY: e.clientY - panStart.y
      }));
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setCanvasState(prev => ({
        ...prev,
        zoom: Math.max(0.3, Math.min(3, prev.zoom * delta))
      }));
    }
  }, []);

  // Node expansion/collapse
  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, expanded: !node.expanded } : node
    ));
  }, []);

  const toggleNodeCollapse = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId ? { ...node, collapsed: !node.collapsed } : node
    ));
  }, []);

  // Connection management
  const startConnection = useCallback((nodeId: string) => {
    setIsConnecting(true);
    setConnectionStart(nodeId);
  }, []);

  const endConnection = useCallback((nodeId: string) => {
    if (isConnecting && connectionStart && connectionStart !== nodeId) {
      const newConnection: Connection = {
        id: `c${Date.now()}`,
        from: connectionStart,
        to: nodeId,
        animated: true
      };
      setConnections(prev => [...prev, newConnection]);
    }
    setIsConnecting(false);
    setConnectionStart(null);
  }, [isConnecting, connectionStart]);

  const removeConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, []);

  // Component collapse functions
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const toggleToolbar = useCallback(() => {
    setToolbarCollapsed(prev => !prev);
  }, []);

  const loadWorkflow = useCallback((workflowId: number) => {
    const workflow = workflows.find((w: Workflow) => w.id === workflowId);
    if (!workflow) return;

    setSelectedWorkflow(workflowId);
    setNodes(defaultNodes);
    setConnections(defaultConnections);
    setCanvasState({ zoom: 1, panX: 0, panY: 0 });

    toast({
      title: "Workflow Loaded",
      description: `${workflow.name} has been loaded to the canvas`,
    });
  }, [workflows, toast]);

  const getNodeIcon = (type: Node['type']) => {
    switch (type) {
      case 'user': return Users;
      case 'agent': return Brain;
      case 'model': return Cpu;
      case 'tool': return Zap;
      case 'data': return Database;
      case 'response': return FileText;
      default: return Database;
    }
  };

  const renderNode = (node: Node) => {
    const Icon = getNodeIcon(node.type);
    const isSelected = selectedNode === node.id;
    const nodeStyle = {
      transform: `translate(${node.x}px, ${node.y}px)`,
      zIndex: isSelected ? 10 : 1,
    };

    if (node.collapsed) {
      return (
        <div
          key={node.id}
          className="absolute cursor-pointer"
          style={nodeStyle}
          onClick={() => toggleNodeCollapse(node.id)}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
               style={{ backgroundColor: node.color }}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      );
    }

    if (!node.expanded) {
      return (
        <div
          key={node.id}
          className="absolute cursor-pointer group"
          style={nodeStyle}
          onClick={() => toggleNodeExpansion(node.id)}
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-110"
                 style={{
                   background: `linear-gradient(135deg, ${node.color}40, ${node.color}20)`,
                   boxShadow: `0 0 30px ${node.color}40`
                 }}>
              <Icon className="w-10 h-10" />
            </div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
              <div className="text-xs text-white font-light">{node.title}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={node.id}
        className={`absolute bg-black/80 backdrop-blur-xl border rounded-2xl shadow-2xl transition-all duration-500 cursor-pointer ${
          isSelected ? 'border-white/40 shadow-white/20' : 'border-white/20'
        }`}
        style={nodeStyle}
        onClick={() => setSelectedNode(isSelected ? null : node.id)}
      >
        <div className="p-6 w-80">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                   style={{ backgroundColor: node.color }}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-light text-lg">{node.title}</h3>
                {node.subtitle && (
                  <p className="text-gray-400 text-sm">{node.subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeCollapse(node.id);
                }}
                className="text-gray-400 hover:text-white p-1 h-8 w-8"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeExpansion(node.id);
                }}
                className="text-gray-400 hover:text-white p-1 h-8 w-8"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p className="text-gray-300 text-sm mb-4 leading-relaxed">
            {node.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                node.status === 'active' ? 'bg-green-400' :
                node.status === 'processing' ? 'bg-yellow-400 animate-pulse' :
                node.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
              }`} />
              <span className="text-xs text-gray-400 capitalize">{node.status}</span>
              {node.badge && (
                <Badge variant="secondary" className="text-xs px-2 py-1 bg-white/10 text-white border-white/20">
                  {node.badge}
                </Badge>
              )}
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  startConnection(node.id);
                }}
                className="text-gray-400 hover:text-white p-1 h-8 w-8"
                title="Create Connection"
              >
                <Link className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  // Remove all connections from this node
                  setConnections(prev => prev.filter(conn => conn.from !== node.id && conn.to !== node.id));
                }}
                className="text-gray-400 hover:text-white p-1 h-8 w-8"
                title="Remove Connections"
              >
                <Unlink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConnection = (connection: Connection) => {
    const fromNode = nodes.find(n => n.id === connection.from);
    const toNode = nodes.find(n => n.id === connection.to);
    
    if (!fromNode || !toNode) return null;

    const fromX = fromNode.x + (fromNode.expanded ? 160 : fromNode.collapsed ? 24 : 40);
    const fromY = fromNode.y + (fromNode.expanded ? 80 : fromNode.collapsed ? 24 : 40);
    const toX = toNode.x + (toNode.expanded ? 160 : toNode.collapsed ? 24 : 40);
    const toY = toNode.y + (toNode.expanded ? 80 : toNode.collapsed ? 24 : 40);

    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const midX = fromX + dx * 0.5;
    const midY = fromY + dy * 0.5;

    const controlX1 = fromX + dx * 0.3;
    const controlY1 = fromY;
    const controlX2 = toX - dx * 0.3;
    const controlY2 = toY;

    const pathData = `M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`;

    return (
      <g key={connection.id}>
        <defs>
          <linearGradient id={`gradient-${connection.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: fromNode.color, stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: toNode.color, stopOpacity: 0.8 }} />
          </linearGradient>
          {connection.animated && (
            <circle id={`dot-${connection.id}`} r="3" fill="white">
              <animateMotion dur="2s" repeatCount="indefinite" path={pathData} />
            </circle>
          )}
        </defs>
        <path
          d={pathData}
          stroke={`url(#gradient-${connection.id})`}
          strokeWidth="2"
          fill="none"
          className="drop-shadow-lg cursor-pointer hover:stroke-white/60"
          onClick={() => removeConnection(connection.id)}
        />
        {connection.animated && <use href={`#dot-${connection.id}`} />}
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Collapsible Sidebar */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-80'}`}>
        <div className="h-full bg-black/50 backdrop-blur-xl border-r border-white/10 p-4">
          <div className="flex items-center justify-between mb-6">
            {!sidebarCollapsed && <h2 className="text-xl font-light">Workflows</h2>}
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white"
            >
              {sidebarCollapsed ? <ChevronDown className="w-4 h-4 rotate-90" /> : <ChevronUp className="w-4 h-4 rotate-90" />}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <div className="space-y-4">
              {workflows.map((workflow: Workflow) => (
                <div
                  key={workflow.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedWorkflow === workflow.id
                      ? 'border-purple-500/50 bg-purple-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                  onClick={() => loadWorkflow(workflow.id)}
                >
                  <h3 className="font-medium text-white">{workflow.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{workflow.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {workflow.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        executeWorkflow.mutate(workflow.id);
                      }}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Collapsible Toolbar */}
        <div className={`transition-all duration-300 ${toolbarCollapsed ? 'h-16' : 'h-20'} bg-black/50 backdrop-blur-xl border-b border-white/10`}>
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleToolbar}
                className="text-gray-400 hover:text-white"
              >
                {toolbarCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              {!toolbarCollapsed && (
                <>
                  <div className="flex items-center space-x-2 border-r border-white/10 pr-4">
                    <Button size="sm" variant="ghost" onClick={zoomOut} className="text-gray-400 hover:text-white">
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-400 min-w-[4rem] text-center">
                      {Math.round(canvasState.zoom * 100)}%
                    </span>
                    <Button size="sm" variant="ghost" onClick={zoomIn} className="text-gray-400 hover:text-white">
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={resetZoom} className="text-gray-400 hover:text-white">
                      <Move className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Node
                    </Button>
                  </div>
                </>
              )}
            </div>

            {!toolbarCollapsed && selectedWorkflow && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {workflows.find((w: Workflow) => w.id === selectedWorkflow)?.name}
                </span>
                <Button
                  size="sm"
                  onClick={() => executeWorkflow.mutate(selectedWorkflow)}
                  disabled={executeWorkflow.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Workflow
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${canvasState.zoom}) translate(${canvasState.panX}px, ${canvasState.panY}px)`,
              transformOrigin: '0 0'
            }}
          >
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%" className="absolute inset-0">
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {connections.map(renderConnection)}
            </svg>

            {/* Nodes */}
            <div className="relative">
              {nodes.map(renderNode)}
            </div>

            {/* Empty State */}
            {!selectedWorkflow && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl animate-pulse" />
                    <WorkflowIcon className="w-20 h-20 text-gray-600 mx-auto absolute top-6 left-6" />
                  </div>
                  <h3 className="text-2xl font-light text-white mb-3">Enhanced Professional Canvas</h3>
                  <p className="text-gray-400 mb-2">Select a workflow to start building</p>
                  <p className="text-sm text-gray-500">Drag. Drop. Connect. Deploy.</p>
                </div>
              </div>
            )}
          </div>

          {/* Connection Mode Indicator */}
          {isConnecting && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
              Click another node to create connection
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsConnecting(false);
                  setConnectionStart(null);
                }}
                className="ml-2 text-white hover:text-gray-200"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}