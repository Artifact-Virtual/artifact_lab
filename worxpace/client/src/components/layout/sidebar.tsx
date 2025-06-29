import { useState } from "react";
import { 
  LayoutDashboard, 
  GitBranch, 
  BarChart3, 
  BookOpen, 
  Zap, 
  Settings2, 
  Calendar, 
  Users,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useSidebarState } from "@/lib/sidebar-state";
import avLogo from "@assets/av-black-logo_1751180174461.png";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  {
    section: "Operations",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-glow-cyan" },
      { id: "canvas", label: "Workflow Canvas", icon: GitBranch, color: "text-glow-coral" },
      { id: "analytics", label: "Analytics", icon: BarChart3, color: "text-glow-teal" },
    ]
  },
  {
    section: "Research",
    items: [
      { id: "knowledge", label: "Knowledge Base", icon: BookOpen, color: "text-glow-green" },
      { id: "mcp", label: "MCP Servers", icon: Zap, color: "text-glow-blue" },
    ]
  },
  {
    section: "Workflows",
    items: [
      { id: "automation", label: "Automation", icon: Settings2, color: "text-glow-purple" },
      { id: "scheduling", label: "Scheduling", icon: Calendar, color: "text-glow-yellow" },
    ]
  },
  {
    section: "System",
    items: [
      { id: "agents", label: "AI Agents", icon: Users, color: "text-glow-cyan" },
      { id: "settings", label: "Settings", icon: Settings, color: "text-gray-400" },
    ]
  }
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { collapsed, toggleSidebar } = useSidebarState();
  const isExpanded = !collapsed || isHovered;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 bg-black border border-white/20 flex items-center justify-center hover:border-white/40 transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div 
        className={`
          ${isExpanded ? 'w-64' : 'w-16'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative z-50 lg:z-auto
          holographic-border p-4 overflow-y-auto thin-scrollbar 
          transition-all duration-300 group h-full
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Desktop Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 bg-black border border-white border-opacity-20 rounded-full hidden lg:flex items-center justify-center hover:border-glow-cyan transition-all z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Mobile Close Button */}
      {isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 bg-black border border-white/20 lg:hidden flex items-center justify-center hover:border-white/40 transition-all z-20"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Logo and Brand */}
      <div className="flex items-center mb-8">
        <div className="w-8 h-8 relative flex-shrink-0">
          <img 
            src={avLogo} 
            alt="AV Logo" 
            className="w-8 h-8 object-contain opacity-85 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
        {isExpanded && (
          <h1 className="text-xl font-extralight tracking-wide ml-3 whitespace-nowrap">ARTIFACT VIRTUAL</h1>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="space-y-2">
        {navigationItems.map((section) => (
          <div key={section.section} className="mb-6">
            {/* Always reserve space for category header to maintain static positioning */}
            <div className="h-6 mb-3">
              {isExpanded && (
                <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider">
                  {section.section}
                </h3>
              )}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <div
                    key={item.id}
                    className={`flex items-center px-3 py-2 rounded text-sm cursor-pointer transition-all relative group/item ${
                      isActive 
                        ? "nav-item-active" 
                        : "hover:bg-white hover:bg-opacity-5"
                    }`}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileOpen(false);
                    }}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 ${isExpanded ? 'mr-3' : 'mx-auto'} ${item.color} flex-shrink-0`} />
                    {isExpanded && (
                      <span className="whitespace-nowrap">{item.label}</span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {!isExpanded && !isHovered && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-black border border-white border-opacity-20 rounded text-xs whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none z-50">
                        {item.label}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      </div>
    </>
  );
}
