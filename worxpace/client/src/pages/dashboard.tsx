import MetricsGrid from "@/components/dashboard/metrics-grid";
import ActivityFeed from "@/components/dashboard/activity-feed";
import CanvasPreview from "@/components/dashboard/canvas-preview";
import SystemOverview from "@/components/dashboard/system-overview";
import WindmillPanel from "@/components/dashboard/windmill-panel";
import PythonAgentsPanel from "@/components/dashboard/python-agents-panel";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const handleCanvasView = () => {
    setLocation('/canvas');
  };

  return (
    <div className="h-full p-3 sm:p-4 lg:p-6 overflow-y-auto">
      <MetricsGrid />
      
      {/* System Overview Section */}
      <SystemOverview />
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="space-y-4 sm:space-y-6">
          <ActivityFeed />
        </div>
        
        {/* Middle Column */}
        <div className="space-y-4 sm:space-y-6">
          <WindmillPanel />
        </div>
        
        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          <PythonAgentsPanel />
          <div className="min-h-[300px] sm:min-h-[350px]">
            <CanvasPreview onViewCanvas={handleCanvasView} />
          </div>
        </div>
      </div>
    </div>
  );
}