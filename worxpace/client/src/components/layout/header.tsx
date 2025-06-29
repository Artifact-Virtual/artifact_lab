import { Home, User } from "lucide-react";

interface HeaderProps {
  activeTab: string;
}

const tabTitles = {
  dashboard: "Workflow Dashboard",
  canvas: "Workflow Canvas",
  analytics: "Analytics & Insights",
  knowledge: "Knowledge Base",
  mcp: "MCP Servers",
  automation: "Automation Hub",
  scheduling: "Task Scheduling",
  agents: "AI Agents",
  settings: "System Settings",
};

export default function Header({ activeTab }: HeaderProps) {
  const title = tabTitles[activeTab as keyof typeof tabTitles] || "Dashboard";

  return (
    <header className="holographic-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-extralight">{title}</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-glow-green rounded-full status-indicator"></div>
          <span className="text-xs text-gray-400">Real-time monitoring active</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 rounded-full bg-glow-blue bg-opacity-20 flex items-center justify-center">
          <Home className="w-4 h-4 text-glow-blue" />
        </div>
        <span className="text-sm font-light">Admin User</span>
      </div>
    </header>
  );
}
