import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Zap, 
  Database, 
  Code, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Pause,
  Users
} from "lucide-react";

interface SystemStats {
  windmill: {
    connected: boolean;
    scriptsCount: number;
    activeJobs: number;
  };
  pythonAgents: {
    totalAgents: number;
    runningAgents: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  };
  ragSystem: {
    knowledgeSources: number;
    totalDocuments: number;
    indexedItems: number;
    queryVolume: number;
  };
}

export default function SystemOverview() {
  const { data: windmillStatus } = useQuery({
    queryKey: ["/api/windmill/status"],
    refetchInterval: 30000,
  });

  const { data: pythonStatus } = useQuery({
    queryKey: ["/api/python-agents/status"],
    refetchInterval: 30000,
  });

  const { data: knowledgeSources } = useQuery({
    queryKey: ["/api/knowledge-sources"],
    refetchInterval: 60000,
  });

  const systemStats: SystemStats = {
    windmill: {
      connected: (windmillStatus as any)?.connected || false,
      scriptsCount: (windmillStatus as any)?.scriptsCount || 0,
      activeJobs: (windmillStatus as any)?.activeJobs || 0
    },
    pythonAgents: {
      totalAgents: (pythonStatus as any)?.totalAgents || 0,
      runningAgents: (pythonStatus as any)?.runningAgents || 0,
      totalExecutions: (pythonStatus as any)?.totalExecutions || 0,
      successfulExecutions: (pythonStatus as any)?.successfulExecutions || 0,
      failedExecutions: (pythonStatus as any)?.failedExecutions || 0
    },
    ragSystem: {
      knowledgeSources: Array.isArray(knowledgeSources) ? knowledgeSources.length : 0,
      totalDocuments: 0,
      indexedItems: 0,
      queryVolume: 0
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Windmill Integration Status */}
      <Card className="cornered-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-light flex items-center">
            <Code className="w-4 h-4 mr-2 text-glow-blue" />
            Windmill Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Connection</span>
              <Badge variant={systemStats.windmill.connected ? "default" : "destructive"} className="text-xs">
                {systemStats.windmill.connected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Scripts Available</span>
              <span className="text-sm font-medium">{systemStats.windmill.scriptsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Active Jobs</span>
              <div className="flex items-center space-x-1">
                {systemStats.windmill.activeJobs > 0 && (
                  <Activity className="w-3 h-3 text-glow-cyan" />
                )}
                <span className="text-sm font-medium">{systemStats.windmill.activeJobs}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Python Agents Status */}
      <Card className="cornered-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-light flex items-center">
            <Bot className="w-4 h-4 mr-2 text-glow-purple" />
            Python Agents
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Total Agents</span>
              <span className="text-sm font-medium">{systemStats.pythonAgents.totalAgents}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Running</span>
              <div className="flex items-center space-x-1">
                {systemStats.pythonAgents.runningAgents > 0 && (
                  <Play className="w-3 h-3 text-glow-green" />
                )}
                <span className="text-sm font-medium">{systemStats.pythonAgents.runningAgents}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Success Rate</span>
              <span className="text-sm font-medium">
                {systemStats.pythonAgents.totalExecutions > 0 ? 
                  Math.round((systemStats.pythonAgents.successfulExecutions / systemStats.pythonAgents.totalExecutions) * 100) : 0}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agentic RAG System */}
      <Card className="cornered-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-light flex items-center">
            <Database className="w-4 h-4 mr-2 text-glow-teal" />
            Agentic RAG
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Knowledge Sources</span>
              <span className="text-sm font-medium">{systemStats.ragSystem.knowledgeSources}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Status</span>
              <Badge variant={systemStats.ragSystem.knowledgeSources > 0 ? "default" : "secondary"} className="text-xs">
                {systemStats.ragSystem.knowledgeSources > 0 ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Processing</span>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3 text-glow-yellow" />
                <span className="text-xs">Real-time</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}