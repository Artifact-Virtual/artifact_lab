import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Workflow } from "@shared/schema";
import {
  User, Brain, Wrench, Database, MessageSquare, Play,
  ChevronDown, ChevronUp, Minimize2, X, Menu, Plus, Save, Settings, ZoomIn, ZoomOut, Move, RotateCcw,
  Upload, Palette, Link, Unlink
} from "lucide-react";

interface Node {
  id: string;
  type: 'agent' | 'model' | 'tool' | 'data' | 'response' | 'user';
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  description: string;
  status: 'idle' | 'processing' | 'active' | 'error';
  expanded: boolean;
  collapsed: boolean;
  badge?: string;
  color: string;
  borderColor?: string;
  config?: Record<string, any>;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  fromPort: string;
  toPort: string;
}

interface ConnectionPort {
  nodeId: string;
  port: string;
  x: number;
  y: number;
}

const nodeTypes = {
  agent: { icon: User, color: '#00ff88' },
  model: { icon: Brain, color: '#0088ff' },
  tool: { icon: Wrench, color: '#ff8800' },
  data: { icon: Database, color: '#8800ff' },
  response: { icon: MessageSquare, color: '#ff0088' },
  user: { icon: User, color: '#ffffff' }
};

export default function CanvasSharp() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<ConnectionPort | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [isUploadingJSON, setIsUploadingJSON] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const executeWorkflow = useMutation({
    mutationFn: async (workflowId: number) => {
      await apiRequest(`/api/workflows/${workflowId}/execute`, "POST");
    },
    onSuccess: () => {
      console.log("Workflow executed successfully");
    },
  });

  const loadWorkflow = useCallback((workflowId: number) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    setSelectedWorkflow(workflowId);
    
    // Load nodes with fixed positioning
    const newNodes: Node[] = [
      {
        id: 'user-1',
        type: 'user',
        x: 50,
        y: 150,
        title: 'User Input',
        description: 'Initial user prompt',
        status: 'active',
        expanded: true,
        collapsed: false,
        color: nodeTypes.user.color,
        borderColor: '#ffffff',
        config: { prompt: 'Enter your message here...' }
      },
      {
        id: 'agent-1',
        type: 'agent',
        x: 450,
        y: 150,
        title: 'Processing Agent',
        subtitle: 'AI Assistant',
        description: workflow.description || 'Workflow processing agent',
        status: 'processing',
        expanded: true,
        collapsed: false,
        color: nodeTypes.agent.color,
        borderColor: '#00ff88',
        config: { 
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2048
        }
      },
      {
        id: 'model-1',
        type: 'model',
        x: 850,
        y: 50,
        title: 'Language Model',
        subtitle: 'GPT-4',
        description: 'Large language model for processing',
        status: 'active',
        expanded: true,
        collapsed: false,
        badge: 'gpt-4',
        color: nodeTypes.model.color,
        borderColor: '#0088ff',
        config: {
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2048
        }
      },
      {
        id: 'tool-1',
        type: 'tool',
        x: 850,
        y: 250,
        title: 'Data Tool',
        subtitle: 'Database Query',
        description: 'Tool for querying database',
        status: 'idle',
        expanded: true,
        collapsed: false,
        badge: 'sql',
        color: nodeTypes.tool.color,
        borderColor: '#ff8800',
        config: {
          type: 'database',
          query: 'SELECT * FROM users',
          timeout: 30
        }
      },
      {
        id: 'response-1',
        type: 'response',
        x: 1250,
        y: 150,
        title: 'Response',
        subtitle: 'Final Output',
        description: 'Generated response for user',
        status: 'active',
        expanded: true,
        collapsed: false,
        color: nodeTypes.response.color,
        borderColor: '#ff0088',
        config: {
          format: 'json',
          stream: true
        }
      }
    ];

    setNodes(newNodes);
    setConnections([
      { id: 'conn-1', from: 'user-1', to: 'agent-1', fromPort: 'output', toPort: 'input' },
      { id: 'conn-2', from: 'agent-1', to: 'model-1', fromPort: 'output', toPort: 'input' },
      { id: 'conn-3', from: 'agent-1', to: 'tool-1', fromPort: 'tool', toPort: 'input' },
      { id: 'conn-4', from: 'model-1', to: 'response-1', fromPort: 'output', toPort: 'input' },
      { id: 'conn-5', from: 'tool-1', to: 'response-1', fromPort: 'output', toPort: 'data' }
    ]);
  }, [workflows]);

  const addNode = useCallback((type: keyof typeof nodeTypes) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      x: 200 + Math.random() * 300,
      y: 200 + Math.random() * 200,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: `New ${type} node`,
      status: 'idle',
      expanded: false,
      collapsed: false,
      color: nodeTypes[type].color,
      borderColor: nodeTypes[type].color,
      config: {}
    };
    setNodes(prev => [...prev, newNode]);
  }, []);

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

  const updateNodeConfig = useCallback((nodeId: string, key: string, value: any) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { 
        ...node, 
        config: { ...node.config, [key]: value }
      } : node
    ));
  }, []);

  const updateNodeBorderColor = useCallback((nodeId: string, color: string) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, borderColor: color } : node
    ));
  }, []);

  const handlePortClick = useCallback((nodeId: string, port: string, x: number, y: number) => {
    const portData: ConnectionPort = { nodeId, port, x, y };
    
    if (connectingFrom) {
      // Complete connection
      if (connectingFrom.nodeId !== nodeId) {
        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          from: connectingFrom.nodeId,
          to: nodeId,
          fromPort: connectingFrom.port,
          toPort: port
        };
        setConnections(prev => [...prev, newConnection]);
      }
      setConnectingFrom(null);
    } else {
      // Start connection
      setConnectingFrom(portData);
    }
  }, [connectingFrom]);

  const handleConnectionDelete = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingJSON(true);
    setUploadError(null);

    try {
      const text = await file.text();
      console.log('File content (first 500 chars):', text.substring(0, 500));
      console.log('File size:', text.length, 'characters');
      console.log('File type:', file.type);
      console.log('File name:', file.name);
      
      // Check if file is empty
      if (!text.trim()) {
        throw new Error('File is empty');
      }
      
      // Check for common issues and clean text
      let cleanText = text;
      if (cleanText.includes('\ufeff')) {
        console.log('Removing BOM character');
        cleanText = cleanText.replace(/^\ufeff/, '');
      }
      
      let jsonData;
      try {
        jsonData = JSON.parse(cleanText.trim());
        console.log('Successfully parsed JSON. Type:', typeof jsonData);
        if (typeof jsonData === 'object' && jsonData !== null) {
          console.log('JSON keys:', Object.keys(jsonData));
          console.log('Has nodes?', 'nodes' in jsonData);
          console.log('Has connections?', 'connections' in jsonData);
          console.log('Sample structure:', JSON.stringify(jsonData, null, 2).substring(0, 1000));
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Text around error position:', text.substring(0, 200));
        throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}. Please ensure the file contains valid JSON.`);
      }
      
      // Convert JSON to workflow configuration
      const convertedNodes: Node[] = [];
      const convertedConnections: Connection[] = [];
      
      // Parse different JSON formats
      if (jsonData.nodes && Array.isArray(jsonData.nodes)) {
        console.log('Processing n8n/standard workflow format with', jsonData.nodes.length, 'nodes');
        
        // n8n workflow format detection
        const isN8nFormat = jsonData.nodes.some((node: any) => 
          node.typeVersion !== undefined || 
          node.position !== undefined ||
          node.parameters !== undefined
        );
        
        if (isN8nFormat) {
          console.log('Detected n8n workflow format');
          // n8n specific parsing
          jsonData.nodes.forEach((nodeData: any, index: number) => {
            // Map n8n node types to our types
            let nodeType: keyof typeof nodeTypes = 'agent';
            const n8nType = nodeData.type?.toLowerCase() || '';
            
            if (n8nType.includes('webhook') || n8nType.includes('trigger')) {
              nodeType = 'user';
            } else if (n8nType.includes('ai') || n8nType.includes('openai') || n8nType.includes('llm')) {
              nodeType = 'model';
            } else if (n8nType.includes('database') || n8nType.includes('mysql') || n8nType.includes('postgres')) {
              nodeType = 'data';
            } else if (n8nType.includes('http') || n8nType.includes('api') || n8nType.includes('tool')) {
              nodeType = 'tool';
            } else if (n8nType.includes('respond') || n8nType.includes('output')) {
              nodeType = 'response';
            }
            
            const node: Node = {
              id: nodeData.id || nodeData.name || `node-${index}`,
              type: nodeType,
              x: nodeData.position?.[0] || (index * 300 + 100),
              y: nodeData.position?.[1] || 200,
              title: nodeData.name || nodeData.type || `${nodeType} Node`,
              subtitle: nodeData.type,
              description: nodeData.notes || `n8n ${nodeData.type} node`,
              status: nodeData.disabled ? 'idle' : 'active',
              expanded: true,
              collapsed: false,
              color: nodeTypes[nodeType].color,
              borderColor: nodeTypes[nodeType].color,
              config: {
                n8nType: nodeData.type,
                parameters: nodeData.parameters || {},
                typeVersion: nodeData.typeVersion,
                disabled: nodeData.disabled || false
              }
            };
            convertedNodes.push(node);
          });
          
          // n8n connections
          if (jsonData.connections && typeof jsonData.connections === 'object') {
            console.log('Processing n8n connections');
            Object.entries(jsonData.connections).forEach(([fromNode, connections]: [string, any]) => {
              if (connections.main && Array.isArray(connections.main)) {
                connections.main.forEach((connArray: any[], outputIndex: number) => {
                  if (Array.isArray(connArray)) {
                    connArray.forEach((conn: any, connIndex: number) => {
                      const connection: Connection = {
                        id: `conn-${fromNode}-${conn.node}-${outputIndex}-${connIndex}`,
                        from: fromNode,
                        to: conn.node,
                        fromPort: `output-${outputIndex}`,
                        toPort: `input-${conn.input || 0}`
                      };
                      convertedConnections.push(connection);
                    });
                  }
                });
              }
            });
          }
        } else {
          // Standard workflow format
          jsonData.nodes.forEach((nodeData: any, index: number) => {
            const nodeType = (nodeData.type && nodeData.type in nodeTypes) ? nodeData.type as keyof typeof nodeTypes : 'agent';
            const node: Node = {
              id: nodeData.id || `node-${index}`,
              type: nodeType,
              x: nodeData.x || (index * 300 + 100),
              y: nodeData.y || 200,
              title: nodeData.title || nodeData.name || `${nodeType} Node`,
              subtitle: nodeData.subtitle,
              description: nodeData.description || '',
              status: nodeData.status || 'idle',
              expanded: true,
              collapsed: false,
              color: nodeData.color || nodeTypes[nodeType].color,
              borderColor: nodeData.borderColor || nodeData.color || nodeTypes[nodeType].color,
              config: nodeData.config || nodeData.settings || {}
            };
            convertedNodes.push(node);
          });

          if (jsonData.connections && Array.isArray(jsonData.connections)) {
            console.log('Processing', jsonData.connections.length, 'connections');
            jsonData.connections.forEach((connData: any, index: number) => {
              const connection: Connection = {
                id: connData.id || `conn-${index}`,
                from: connData.from || connData.source,
                to: connData.to || connData.target,
                fromPort: connData.fromPort || 'output',
                toPort: connData.toPort || 'input'
              };
              convertedConnections.push(connection);
            });
          }
        }
      } else if (jsonData.workflow && jsonData.workflow.nodes) {
        console.log('Processing workflow object format');
        // Nested workflow format
        const workflowData = jsonData.workflow;
        workflowData.nodes.forEach((nodeData: any, index: number) => {
          const nodeType = (nodeData.type && nodeData.type in nodeTypes) ? nodeData.type as keyof typeof nodeTypes : 'agent';
          const node: Node = {
            id: nodeData.id || `node-${index}`,
            type: nodeType,
            x: nodeData.x || (index * 300 + 100),
            y: nodeData.y || 200,
            title: nodeData.title || nodeData.name || `${nodeType} Node`,
            subtitle: nodeData.subtitle,
            description: nodeData.description || '',
            status: nodeData.status || 'idle',
            expanded: true,
            collapsed: false,
            color: nodeData.color || nodeTypes[nodeType].color,
            borderColor: nodeData.borderColor || nodeData.color || nodeTypes[nodeType].color,
            config: nodeData.config || nodeData.settings || {}
          };
          convertedNodes.push(node);
        });
        
        if (workflowData.connections) {
          workflowData.connections.forEach((connData: any, index: number) => {
            const connection: Connection = {
              id: connData.id || `conn-${index}`,
              from: connData.from || connData.source,
              to: connData.to || connData.target,
              fromPort: connData.fromPort || 'output',
              toPort: connData.toPort || 'input'
            };
            convertedConnections.push(connection);
          });
        }
      } else {
        console.log('Processing object-based format');
        // Auto-detect format and convert
        const keys = Object.keys(jsonData);
        keys.forEach((key, index) => {
          const data = jsonData[key];
          if (typeof data === 'object' && data !== null) {
            const nodeType = (data.type && data.type in nodeTypes) ? data.type as keyof typeof nodeTypes : 'agent';
            const node: Node = {
              id: key,
              type: nodeType,
              x: index * 300 + 100,
              y: 200,
              title: data.name || data.title || key,
              description: data.description || `Imported ${nodeType}`,
              status: 'idle',
              expanded: true,
              collapsed: false,
              color: nodeTypes[nodeType].color,
              borderColor: nodeTypes[nodeType].color,
              config: data
            };
            convertedNodes.push(node);
          }
        });
      }

      console.log('Final converted nodes:', convertedNodes.length);
      console.log('Final converted connections:', convertedConnections.length);

      if (convertedNodes.length === 0) {
        throw new Error('No valid nodes found in JSON file. Please check the format.');
      }

      setNodes(convertedNodes);
      setConnections(convertedConnections);
      
      // Clear any existing workflow selection since we're loading custom data
      setSelectedWorkflow(null);
      
      console.log('Successfully loaded JSON automation file');
      
    } catch (error) {
      console.error('Error processing JSON file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to parse JSON file');
    } finally {
      setIsUploadingJSON(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
  }, []);

  const resetCanvas = useCallback(() => {
    setCanvasOffset({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // Fixed mouse handlers with proper positioning
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (nodeId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      setIsDragging(true);
      // Calculate offset from mouse to node origin
      const nodeScreenX = node.x * zoom + canvasOffset.x;
      const nodeScreenY = node.y * zoom + canvasOffset.y;
      
      setDragOffset({
        x: e.clientX - nodeScreenX,
        y: e.clientY - nodeScreenY
      });
      setSelectedNode(nodeId);
    } else {
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
    }
  }, [canvasOffset, zoom, nodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && selectedNode) {
      // Calculate new position based on mouse position minus drag offset
      const newX = Math.max(0, (e.clientX - dragOffset.x - canvasOffset.x) / zoom);
      const newY = Math.max(0, (e.clientY - dragOffset.y - canvasOffset.y) / zoom);

      setNodes(prev => prev.map(node => 
        node.id === selectedNode ? { ...node, x: newX, y: newY } : node
      ));
    } else if (isPanning) {
      setCanvasOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isDragging, isPanning, selectedNode, dragOffset, zoom, panStart, canvasOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    }
  }, [handleZoom]);

  // Optimized render functions
  const renderNode = useCallback((node: Node) => {
    const { icon: Icon } = nodeTypes[node.type];
    const isSelected = selectedNode === node.id;
    
    const nodeStyle = {
      position: 'absolute' as const,
      left: `${node.x * zoom + canvasOffset.x}px`,
      top: `${node.y * zoom + canvasOffset.y}px`,
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
      zIndex: isSelected ? 1000 : 10
    };

    // Collapsed state (minimized to icon)
    if (node.collapsed) {
      return (
        <div
          key={node.id}
          className="cursor-pointer"
          style={nodeStyle}
          onClick={() => toggleNodeCollapse(node.id)}
          onMouseDown={(e) => handleMouseDown(e, node.id)}
        >
          <div className="w-8 h-8 cornered-node flex items-center justify-center hover:border-white/40 transition-colors">
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      );
    }

    // Expanded collapsed node (medium circle)
    if (!node.expanded) {
      return (
        <div
          key={node.id}
          className="cursor-pointer group"
          style={nodeStyle}
          onClick={() => toggleNodeExpansion(node.id)}
          onMouseDown={(e) => handleMouseDown(e, node.id)}
        >
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                 style={{
                   background: `linear-gradient(135deg, ${node.color}40, ${node.color}20)`,
                   boxShadow: `0 0 20px ${node.color}30`
                 }}>
              <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            {/* Connection ports for collapsed nodes */}
            <div 
              className="absolute -left-2 top-1/2 w-4 h-4 bg-gray-600 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
              style={{ transform: 'translateY(-50%)' }}
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                handlePortClick(node.id, 'input', rect.left, rect.top);
              }}
            />
            <div 
              className="absolute -right-2 top-1/2 w-4 h-4 bg-gray-600 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
              style={{ transform: 'translateY(-50%)' }}
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                handlePortClick(node.id, 'output', rect.left, rect.top);
              }}
            />
          </div>
        </div>
      );
    }

    // Fully expanded card - CORNERED EDGES
    return (
      <div
        key={node.id}
        className={`cornered-card border-2 transition-all duration-300 cursor-pointer ${
          isSelected ? 'ring-2 ring-white/30' : ''
        } ${isMobile ? 'w-80 max-w-[90vw]' : 'w-96'}`}
        style={{
          ...nodeStyle,
          borderColor: node.borderColor || '#ffffff'
        }}
        onClick={() => setSelectedNode(isSelected ? null : node.id)}
        onMouseDown={(e) => handleMouseDown(e, node.id)}
      >
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 cornered-node flex items-center justify-center text-white"
                   style={{ backgroundColor: node.color }}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-light text-lg sm:text-xl text-white">{node.title}</h3>
                {node.subtitle && (
                  <p className="text-gray-300 text-sm">{node.subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(showColorPicker === node.id ? null : node.id);
                }}
                className="text-gray-400 hover:text-white p-1 h-8 w-8"
              >
                <Palette className="w-4 h-4" />
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

          {/* Color Picker */}
          {showColorPicker === node.id && (
            <div className="mb-4 p-3 bg-black/50 border border-white/20">
              <label className="text-white text-sm mb-2 block">Border Color</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {['#ffffff', '#00ff88', '#0088ff', '#ff8800', '#8800ff', '#ff0088', '#ff0000', '#00ffff'].map(color => (
                  <div
                    key={color}
                    className="w-8 h-8 cursor-pointer border border-white/20"
                    style={{ backgroundColor: color }}
                    onClick={() => updateNodeBorderColor(node.id, color)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={node.borderColor || '#ffffff'}
                onChange={(e) => updateNodeBorderColor(node.id, e.target.value)}
                className="w-full h-8 bg-transparent border border-white/20"
              />
            </div>
          )}

          {/* Functional Content based on type */}
          {node.type === 'user' && (
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">User Input</label>
                <input
                  type="text"
                  value={node.config?.prompt || ''}
                  onChange={(e) => updateNodeConfig(node.id, 'prompt', e.target.value)}
                  placeholder="Type something..."
                  className="w-full bg-black/50 border border-white/20 text-white placeholder-gray-400 px-3 py-2 text-sm focus:outline-none focus:border-white/40"
                />
              </div>
            </div>
          )}

          {node.type === 'model' && (
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">Model</label>
                <select
                  value={node.config?.model || 'gpt-4'}
                  onChange={(e) => updateNodeConfig(node.id, 'model', e.target.value)}
                  className="w-full bg-black/50 border border-white/20 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/40"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3">Claude 3</option>
                  <option value="llama-3.2">Llama 3.2</option>
                </select>
              </div>
              <div>
                <label className="text-white text-sm mb-2 block">Temperature: {node.config?.temperature || 0.7}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={node.config?.temperature || 0.7}
                  onChange={(e) => updateNodeConfig(node.id, 'temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {node.type === 'tool' && (
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">Tool Type</label>
                <select
                  value={node.config?.type || 'database'}
                  onChange={(e) => updateNodeConfig(node.id, 'type', e.target.value)}
                  className="w-full cornered-input px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="database">Database</option>
                  <option value="api">API Call</option>
                  <option value="file">File System</option>
                  <option value="calculation">Calculation</option>
                </select>
              </div>
              <div>
                <label className="text-white text-sm mb-2 block">Configuration</label>
                <textarea
                  value={node.config?.query || ''}
                  onChange={(e) => updateNodeConfig(node.id, 'query', e.target.value)}
                  placeholder="Enter configuration..."
                  className="w-full cornered-input placeholder-gray-400 px-3 py-2 text-sm focus:outline-none h-20 resize-none"
                />
              </div>
            </div>
          )}

          {(node.type === 'agent' || node.type === 'data' || node.type === 'response') && (
            <div className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">Status</label>
                <div className="bg-black/50 border border-white/20 p-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 ${
                      node.status === 'active' ? 'bg-green-400' :
                      node.status === 'processing' ? 'bg-yellow-400' :
                      node.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-white text-sm capitalize">{node.status}</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">{node.description}</p>
                </div>
              </div>
              <div>
                <label className="text-white text-sm mb-2 block">Description</label>
                <input
                  type="text"
                  value={node.description}
                  onChange={(e) => setNodes(prev => prev.map(n => 
                    n.id === node.id ? { ...n, description: e.target.value } : n
                  ))}
                  className="w-full cornered-input px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Connection ports - FULLY FUNCTIONAL */}
          <div className="flex justify-between mt-4">
            <div 
              className="w-4 h-4 bg-gray-600 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                handlePortClick(node.id, 'input', rect.left, rect.top);
              }}
              title="Input Port"
            />
            <div 
              className="w-4 h-4 bg-gray-600 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                handlePortClick(node.id, 'output', rect.left, rect.top);
              }}
              title="Output Port"
            />
          </div>
        </div>
      </div>
    );
  }, [selectedNode, zoom, canvasOffset, isMobile, handleMouseDown, toggleNodeCollapse, toggleNodeExpansion, showColorPicker, updateNodeConfig, updateNodeBorderColor, handlePortClick]);

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      {/* Hidden file input for JSON upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-4 left-4 z-50 bg-black/80 backdrop-blur-sm border border-white/20"
        >
          <Menu className="w-4 h-4" />
        </Button>
      )}

      {/* Sidebar - Mobile/Desktop */}
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'relative'
      } ${sidebarCollapsed ? 'w-16' : 'w-80'} bg-black/95 backdrop-blur-xl border-r border-white/10 transition-all duration-300`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!sidebarCollapsed && (
            <h2 className="text-white font-light text-lg">Workflows</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSidebarCollapsed(!sidebarCollapsed);
              if (isMobile) setMobileMenuOpen(false);
            }}
            className="text-gray-400 hover:text-white p-2"
          >
            {sidebarCollapsed ? <ChevronDown className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <div className="p-4">
            {/* Upload JSON Button */}
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingJSON}
                className="w-full text-gray-400 hover:text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className={`w-4 h-4 mr-2 ${isUploadingJSON ? 'animate-spin' : ''}`} />
                {isUploadingJSON ? 'Processing...' : 'Upload JSON Automation'}
              </Button>
              
              {/* Upload Error Display */}
              {uploadError && (
                <div className="mt-2 p-2 bg-red-900/30 border border-red-500/50 text-red-400 text-xs">
                  {uploadError}
                </div>
              )}
              
              {/* Upload Success Message */}
              {!uploadError && !isUploadingJSON && nodes.length > 0 && !selectedWorkflow && (
                <div className="mt-2 p-2 bg-green-900/30 border border-green-500/50 text-green-400 text-xs">
                  ✓ JSON loaded: {nodes.length} nodes, {connections.length} connections
                </div>
              )}
            </div>

            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className={`p-4 border cursor-pointer transition-all duration-300 ${
                    selectedWorkflow === workflow.id
                      ? 'border-white/40 bg-white/5'
                      : 'border-white/20 hover:border-white/30'
                  }`}
                  onClick={() => loadWorkflow(workflow.id)}
                >
                  <h3 className="text-white font-light text-sm">{workflow.name}</h3>
                  <p className="text-gray-400 text-xs mt-1">{workflow.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-2 py-1 ${
                      workflow.status === 'active' ? 'bg-green-900/30 text-green-400' :
                      workflow.status === 'draft' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-gray-900/30 text-gray-400'
                    }`}>
                      {workflow.status}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        executeWorkflow.mutate(workflow.id);
                      }}
                      className="text-gray-400 hover:text-white p-1 h-6 w-6"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className={`${
          toolbarCollapsed ? 'h-12' : 'h-16'
        } bg-black/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 transition-all duration-300`}>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setToolbarCollapsed(!toolbarCollapsed)}
              className="text-gray-400 hover:text-white"
            >
              {toolbarCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
            
            {!toolbarCollapsed && selectedWorkflow && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400 hidden sm:block">
                  {workflows.find(w => w.id === selectedWorkflow)?.name}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => selectedWorkflow && executeWorkflow.mutate(selectedWorkflow)}
                  className="text-gray-400 hover:text-white"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Execute
                </Button>
              </div>
            )}
          </div>

          {!toolbarCollapsed && (
            <div className="flex items-center space-x-2">
              {/* Connection Mode Indicator */}
              {connectingFrom && (
                <div className="text-yellow-400 text-sm">
                  Connecting from {connectingFrom.nodeId}...
                </div>
              )}

              {/* Node Creation Buttons */}
              <div className="flex space-x-1">
                {(Object.keys(nodeTypes) as Array<keyof typeof nodeTypes>).map((type) => {
                  const { icon: Icon } = nodeTypes[type];
                  return (
                    <Button
                      key={type}
                      size="sm"
                      variant="ghost"
                      onClick={() => addNode(type)}
                      className="text-gray-400 hover:text-white p-2"
                      title={`Add ${type}`}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  );
                })}
              </div>

              {/* Canvas Controls */}
              <div className="flex space-x-1 border-l border-white/10 pl-2 ml-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleZoom(0.1)}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleZoom(-0.1)}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={resetCanvas}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-black cursor-move select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
        >
          {/* Grid Background */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`
            }}
          />

          {/* Render Connections - OPTIMIZED AND VISIBLE */}
          <svg 
            className="absolute inset-0 pointer-events-none" 
            style={{ zIndex: 1 }}
            width="100%" 
            height="100%"
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {connections.map((connection) => {
              const fromNode = nodes.find(n => n.id === connection.from);
              const toNode = nodes.find(n => n.id === connection.to);
              
              if (!fromNode || !toNode) return null;
              
              const startX = (fromNode.x + (fromNode.expanded ? 384 : fromNode.collapsed ? 32 : 80)) * zoom + canvasOffset.x;
              const startY = (fromNode.y + (fromNode.expanded ? 150 : fromNode.collapsed ? 16 : 40)) * zoom + canvasOffset.y;
              const endX = toNode.x * zoom + canvasOffset.x;
              const endY = (toNode.y + (toNode.expanded ? 150 : toNode.collapsed ? 16 : 40)) * zoom + canvasOffset.y;
              
              const controlX1 = startX + (endX - startX) * 0.5;
              const controlY1 = startY;
              const controlX2 = startX + (endX - startX) * 0.5;
              const controlY2 = endY;
              
              return (
                <g key={connection.id}>
                  {/* Main connection line - BRIGHT WHITE AND VISIBLE */}
                  <path
                    d={`M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`}
                    stroke="#ffffff"
                    strokeWidth="3"
                    fill="none"
                    opacity="0.8"
                    filter="url(#glow)"
                    className="transition-all duration-300 hover:opacity-100 hover:stroke-width-4"
                  />
                  {/* Connection delete button - appears on hover */}
                  <g 
                    className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity pointer-events-auto"
                    onClick={() => handleConnectionDelete(connection.id)}
                  >
                    <circle
                      cx={(startX + endX) / 2}
                      cy={(startY + endY) / 2}
                      r="10"
                      fill="#ff0000"
                      opacity="0.8"
                    />
                    <text
                      x={(startX + endX) / 2}
                      y={(startY + endY) / 2 + 3}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      ×
                    </text>
                  </g>
                </g>
              );
            })}
            
            {/* Active connection preview - bright yellow */}
            {connectingFrom && (
              <line
                x1={connectingFrom.x}
                y1={connectingFrom.y}
                x2={connectingFrom.x + 100}
                y2={connectingFrom.y}
                stroke="#ffff00"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.8"
              />
            )}
          </svg>

          {/* Render Nodes - OPTIMIZED */}
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            {nodes.map(renderNode)}
          </div>

          {/* Canvas Info */}
          <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm border border-white/20 px-3 py-2 text-xs text-gray-400 pointer-events-none">
            Zoom: {(zoom * 100).toFixed(0)}% | Nodes: {nodes.length} | Connections: {connections.length}
            {connectingFrom && <div className="text-yellow-400">Click a port to connect</div>}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}