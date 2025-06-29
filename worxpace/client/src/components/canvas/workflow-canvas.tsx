import { useState } from "react";
import CanvasToolbar from "./canvas-toolbar";
import WorkflowNode from "./workflow-node";
import { useWorkflowCanvas } from "@/hooks/use-workflow-canvas";

export default function WorkflowCanvas() {
  const { nodes, connections, addNode, updateNode, deleteNode } = useWorkflowCanvas();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleAddNode = (type: string) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 200, y: 200 },
      data: {
        title: `New ${type}`,
        status: 'active',
        description: `New ${type} node`
      }
    };
    addNode(newNode);
  };

  return (
    <div className="h-full flex">
      {/* Canvas Area */}
      <div className="flex-1 canvas-grid relative overflow-hidden">
        <CanvasToolbar onAddNode={handleAddNode} />

        {/* Workflow Nodes */}
        {nodes.map((node) => (
          <WorkflowNode
            key={node.id}
            node={node}
            isSelected={selectedNode === node.id}
            onSelect={() => setSelectedNode(node.id)}
            onUpdate={updateNode}
            onDelete={deleteNode}
          />
        ))}

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.5)"/>
            </marker>
          </defs>
          {connections.map((connection, index) => (
            <line
              key={index}
              x1={connection.from.x}
              y1={connection.from.y}
              x2={connection.to.x}
              y2={connection.to.y}
              stroke="rgba(0,212,255,0.5)"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          ))}
        </svg>
      </div>

      {/* Canvas Properties Panel */}
      <div className="w-80 holographic-border p-4 overflow-y-auto">
        <h3 className="text-lg font-light mb-4">Node Properties</h3>
        {selectedNode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-light text-gray-400 mb-2">Node Type</label>
              <select className="w-full bg-transparent border border-white border-opacity-20 rounded px-3 py-2 text-sm">
                <option value="agent">AI Agent</option>
                <option value="workflow">Workflow</option>
                <option value="tool">MCP Tool</option>
                <option value="data">Data Source</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-light text-gray-400 mb-2">Configuration</label>
              <textarea 
                className="w-full h-20 bg-transparent border border-white border-opacity-20 rounded px-3 py-2 text-sm resize-none" 
                placeholder="Node configuration JSON..."
              />
            </div>
            <div>
              <label className="block text-xs font-light text-gray-400 mb-2">Scheduling</label>
              <input 
                type="text" 
                className="w-full bg-transparent border border-white border-opacity-20 rounded px-3 py-2 text-sm" 
                placeholder="*/5 * * * *"
              />
            </div>
            <button className="w-full holographic-border py-2 rounded text-sm hover:bg-white/5 transition-all">
              Deploy Node
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-sm">Select a node to edit its properties</p>
          </div>
        )}
      </div>
    </div>
  );
}
