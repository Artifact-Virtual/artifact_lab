import { Users, GitBranch, Zap } from "lucide-react";

interface CanvasToolbarProps {
  onAddNode: (type: string) => void;
}

export default function CanvasToolbar({ onAddNode }: CanvasToolbarProps) {
  return (
    <div className="absolute top-4 left-4 flex space-x-2 z-10">
      <button 
        onClick={() => onAddNode('agent')}
        className="holographic-border px-3 py-1 rounded text-xs hover:bg-white/5 transition-all"
      >
        <Users className="w-4 h-4 inline mr-1" />
        Add Agent
      </button>
      <button 
        onClick={() => onAddNode('workflow')}
        className="holographic-border px-3 py-1 rounded text-xs hover:bg-white/5 transition-all"
      >
        <GitBranch className="w-4 h-4 inline mr-1" />
        Add Workflow
      </button>
      <button 
        onClick={() => onAddNode('tool')}
        className="holographic-border px-3 py-1 rounded text-xs hover:bg-white/5 transition-all"
      >
        <Zap className="w-4 h-4 inline mr-1" />
        Add Tool
      </button>
    </div>
  );
}
