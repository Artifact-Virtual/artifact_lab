import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, useSidebarState } from "@/lib/sidebar-state";
import Sidebar from "@/components/layout/sidebar";
import AIChat from "@/components/chat/ai-chat";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Knowledge from "@/pages/knowledge";
import MCP from "@/pages/mcp";
import Automation from "@/pages/automation";
import Scheduling from "@/pages/scheduling";
import Agents from "@/pages/agents";
import Canvas from "@/pages/canvas-sharp";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function MainLayout() {
  const [location, setLocation] = useLocation();
  
  const getActiveTab = (): string => {
    const path = location.slice(1) || 'dashboard';
    return path;
  };

  const handleTabChange = (tab: string) => {
    setLocation(tab === 'dashboard' ? '/' : `/${tab}`);
  };

  return (
    <div className="flex h-screen bg-black">
      <Sidebar 
        activeTab={getActiveTab()} 
        onTabChange={handleTabChange}
      />
      
      <main className="flex-1 overflow-hidden custom-scrollbar">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/knowledge" component={Knowledge} />
          <Route path="/mcp" component={MCP} />
          <Route path="/automation" component={Automation} />
          <Route path="/scheduling" component={Scheduling} />
          <Route path="/agents" component={Agents} />
          <Route path="/canvas" component={Canvas} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </main>

      <AIChat />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <div className="min-h-screen bg-black text-white font-primary font-light overflow-hidden">
            <Toaster />
            <MainLayout />
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
