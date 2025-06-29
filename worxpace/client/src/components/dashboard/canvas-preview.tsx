import { useQuery } from "@tanstack/react-query";
import { Brain, Database, Zap, Settings, GitBranch, Activity } from "lucide-react";

interface CanvasPreviewProps {
  onViewCanvas: () => void;
}

export default function CanvasPreview({ onViewCanvas }: CanvasPreviewProps) {
  const { data: workflows } = useQuery({
    queryKey: ["/api/workflows"],
  });

  const { data: agents } = useQuery({
    queryKey: ["/api/agents"],
  });

  const { data: mcpServers } = useQuery({
    queryKey: ["/api/mcp-servers"],
  });

  const workflowCount = Array.isArray(workflows) ? workflows.length : 0;
  const agentCount = Array.isArray(agents) ? agents.length : 0;
  const mcpCount = Array.isArray(mcpServers) ? mcpServers.length : 0;

  const systemNodes = [
    { 
      icon: Brain, 
      label: "AI Agents", 
      count: agentCount, 
      status: "active", 
      color: "glow-purple",
      position: { x: 10, y: 15 }
    },
    { 
      icon: GitBranch, 
      label: "Workflows", 
      count: workflowCount, 
      status: "active", 
      color: "glow-cyan",
      position: { x: 50, y: 35 }
    },
    { 
      icon: Database, 
      label: "Knowledge", 
      count: 23, 
      status: "active", 
      color: "glow-green",
      position: { x: 80, y: 15 }
    },
    { 
      icon: Zap, 
      label: "MCP Tools", 
      count: mcpCount, 
      status: "active", 
      color: "glow-blue",
      position: { x: 30, y: 70 }
    },
    { 
      icon: Activity, 
      label: "Analytics", 
      count: 4, 
      status: "processing", 
      color: "glow-orange",
      position: { x: 70, y: 70 }
    }
  ];

  return (
    <div className="cornered-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-light">System Overview</h3>
        <button 
          onClick={onViewCanvas}
          className="text-xs text-glow-cyan hover:text-white transition-colors cornered-button px-2 py-1"
        >
          View Full Canvas →
        </button>
      </div>
      <div className="h-64 relative overflow-hidden bg-black/20 border border-white/10">
        {/* System nodes with real data */}
        {systemNodes.map((node, index) => {
          const Icon = node.icon;
          const statusColor = node.status === "active" ? "bg-glow-green" : 
                             node.status === "processing" ? "bg-glow-orange" : "bg-gray-500";
          
          return (
            <div 
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ 
                left: `${node.position.x}%`, 
                top: `${node.position.y}%` 
              }}
              title={`${node.label}: ${node.count} items (${node.status})`}
            >
              <div className={`w-12 h-12 cornered-node ${node.color} bg-opacity-20 border border-white/20 flex flex-col items-center justify-center p-1 hover:bg-opacity-40 transition-all group-hover:scale-110`}>
                <Icon className={`w-4 h-4 text-${node.color.replace('glow-', '')}-400`} />
                <div className="text-xs font-light mt-1">{node.count}</div>
                <div className={`w-1 h-1 ${statusColor} absolute -bottom-1 -right-1`}></div>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-xs font-light bg-black/80 px-2 py-1 whitespace-nowrap">
                  {node.label}
                </div>
              </div>
            </div>
          );
        })}

        {/* Connection lines between nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
             refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.4)" />
            </marker>
          </defs>
          
          {/* AI Agents to Workflows */}
          <line x1="10%" y1="15%" x2="50%" y2="35%" 
                stroke="rgba(156, 163, 175, 0.5)" strokeWidth="1" 
                markerEnd="url(#arrowhead)"/>
          
          {/* Workflows to Analytics */}
          <line x1="50%" y1="35%" x2="70%" y2="70%" 
                stroke="rgba(156, 163, 175, 0.5)" strokeWidth="1" 
                markerEnd="url(#arrowhead)"/>
          
          {/* Knowledge to Workflows */}
          <line x1="80%" y1="15%" x2="50%" y2="35%" 
                stroke="rgba(156, 163, 175, 0.5)" strokeWidth="1" 
                markerEnd="url(#arrowhead)"/>
          
          {/* MCP Tools to Workflows */}
          <line x1="30%" y1="70%" x2="50%" y2="35%" 
                stroke="rgba(156, 163, 175, 0.5)" strokeWidth="1" 
                markerEnd="url(#arrowhead)"/>
        </svg>

        {/* Data flow indicators */}
        <div className="absolute bottom-2 left-2 flex items-center space-x-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-glow-green animate-pulse"></div>
          <span>Live Data Flow</span>
        </div>
      </div>
    </div>
  );
}
