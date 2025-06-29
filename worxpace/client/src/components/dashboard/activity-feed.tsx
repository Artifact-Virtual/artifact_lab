import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Play, 
  CheckCircle, 
  Users, 
  Zap, 
  GitBranch, 
  Database, 
  Settings, 
  Calendar,
  X,
  Clock,
  AlertCircle
} from "lucide-react";

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'workflow_execution':
      return { Icon: Play, color: "bg-glow-cyan", textColor: "text-glow-cyan" };
    case 'workflow':
      return { Icon: CheckCircle, color: "bg-glow-green", textColor: "text-glow-green" };
    case 'workflow_completed':
      return { Icon: CheckCircle, color: "bg-glow-green", textColor: "text-glow-green" };
    case 'agent_deployed':
    case 'agent':
      return { Icon: Users, color: "bg-glow-purple", textColor: "text-glow-purple" };
    case 'mcp_discovery':
    case 'mcp':
      return { Icon: Zap, color: "bg-glow-blue", textColor: "text-glow-blue" };
    case 'knowledge_update':
    case 'knowledge':
      return { Icon: Database, color: "bg-glow-teal", textColor: "text-glow-teal" };
    case 'system_event':
    case 'system':
      return { Icon: Settings, color: "bg-glow-yellow", textColor: "text-glow-yellow" };
    case 'scheduled_task':
    case 'schedule':
      return { Icon: Calendar, color: "bg-glow-coral", textColor: "text-glow-coral" };
    default:
      return { Icon: GitBranch, color: "bg-glow-cyan", textColor: "text-glow-cyan" };
  }
};

interface Activity {
  id: number;
  type: string;
  title: string;
  description?: string;
  time?: string;
  metadata?: any;
}

export default function ActivityFeed() {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
    refetchInterval: 60000, // Update every minute
  });

  const displayActivities: Activity[] = Array.isArray(activities) ? activities : [];

  if (isLoading) {
    return (
      <div className="cornered-card p-4">
        <h3 className="text-lg font-light mb-4">Recent Activities</h3>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-2 animate-pulse">
              <div className="w-8 h-8 bg-white/10"></div>
              <div className="flex-1">
                <div className="h-4 bg-white/10 mb-1"></div>
                <div className="h-3 bg-white/10 w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="cornered-card p-4 h-full flex flex-col">
        <h3 className="text-lg font-light mb-4">Recent Activities</h3>
        <div className="flex-1 overflow-y-auto max-h-80 space-y-3 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
          {displayActivities.slice(0, 8).map((activity: Activity, index: number) => {
            const { Icon, color, textColor } = getActivityIcon(activity.type || 'workflow');
            
            return (
              <div 
                key={activity.id || index} 
                className="flex items-center space-x-3 p-2 cornered-sidebar-item transition-all cursor-pointer hover:bg-white/5 group"
                onClick={() => setSelectedActivity(activity)}
              >
                <div className={`w-8 h-8 ${color} bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-30 transition-all cornered-card`}>
                  <Icon className={`w-4 h-4 ${textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light truncate group-hover:text-white transition-colors">{activity.title}</p>
                  <p className="text-xs text-gray-400">{activity.time || 'Just now'}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <AlertCircle className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Activity Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/20 cornered-card p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light">Activity Details</h3>
              <button 
                onClick={() => setSelectedActivity(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {(() => {
                  const { Icon, color, textColor } = getActivityIcon(selectedActivity.type || 'workflow_execution');
                  return (
                    <div className={`w-10 h-10 ${color} bg-opacity-20 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${textColor}`} />
                    </div>
                  );
                })()}
                <div>
                  <p className="font-medium">{selectedActivity.title}</p>
                  <p className="text-sm text-gray-400">{selectedActivity.type || 'Activity'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Time:</span>
                  <span>{selectedActivity.time || 'Just now'}</span>
                </div>
                
                {selectedActivity.description && (
                  <div className="text-sm">
                    <span className="text-gray-400">Description:</span>
                    <p className="mt-1">{selectedActivity.description}</p>
                  </div>
                )}
                
                {selectedActivity.metadata && (
                  <div className="text-sm">
                    <span className="text-gray-400">Details:</span>
                    <pre className="mt-1 bg-white/5 p-2 text-xs overflow-x-auto">
                      {JSON.stringify(selectedActivity.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
