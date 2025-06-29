import { useState } from "react";
import { WorkflowNode as WorkflowNodeType } from "@/types/workflow";

interface WorkflowNodeProps {
  node: WorkflowNodeType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<WorkflowNodeType>) => void;
  onDelete: (id: string) => void;
}

const nodeStyles = {
  agent: "glow-cyan",
  workflow: "glow-purple", 
  tool: "glow-teal",
  data: "glow-green"
};

export default function WorkflowNode({ 
  node, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete 
}: WorkflowNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    onSelect();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    onUpdate(node.id, {
      position: {
        x: node.position.x + deltaX,
        y: node.position.y + deltaY
      }
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const shadowClass = nodeStyles[node.type as keyof typeof nodeStyles] || "glow-cyan";

  return (
    <div
      className={`absolute workflow-node ${shadowClass} ${isSelected ? 'ring-2 ring-white/50' : ''}`}
      style={{ 
        left: node.position.x, 
        top: node.position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-40 h-24 holographic-border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-light">{node.data.title}</h4>
          <div className={`w-2 h-2 rounded-full status-indicator ${
            node.data.status === 'active' ? 'bg-glow-green' : 
            node.data.status === 'warning' ? 'bg-glow-yellow' : 'bg-glow-coral'
          }`}></div>
        </div>
        <div className="text-xs text-gray-400">{node.data.description}</div>
        <div className="flex mt-2 space-x-1">
          <div className="w-1 h-1 bg-current rounded-full opacity-80"></div>
          <div className="w-1 h-1 bg-current rounded-full opacity-60"></div>
          <div className="w-1 h-1 bg-gray-600 rounded-full opacity-40"></div>
        </div>
      </div>
    </div>
  );
}
