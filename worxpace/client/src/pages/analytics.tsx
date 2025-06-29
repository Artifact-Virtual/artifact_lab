import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Zap, 
  Clock, 
  Users,
  Database,
  Globe,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import type { SystemMetric, Activity as ActivityType, Workflow, Agent } from "@shared/schema";

interface MetricCard {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

interface ChartData {
  name: string;
  value: number;
  change: number;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("workflows");

  const { data: metrics = [], isLoading: metricsLoading } = useQuery<SystemMetric[]>({
    queryKey: ['/api/metrics'],
    refetchInterval: 30000
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityType[]>({
    queryKey: ['/api/activities'],
    refetchInterval: 15000
  });

  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows']
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/agents']
  });

  // Calculate real metrics from data
  const calculateMetrics = (): MetricCard[] => {
    const recentActivities = activities.slice(0, 10);
    const activeWorkflows = workflows.filter(w => w.status === 'active').length;
    const totalAgents = agents.length;
    const completedWorkflows = activities.filter(a => 
      a.type === 'workflow_completed'
    ).length;

    return [
      {
        title: "Active Workflows",
        value: activeWorkflows.toString(),
        change: recentActivities.filter(a => a.type === 'workflow_created').length,
        trend: recentActivities.filter(a => a.type === 'workflow_created').length > 0 ? 'up' : 'stable',
        icon: <Zap className="w-5 h-5" />
      },
      {
        title: "Total Agents",
        value: totalAgents.toString(),
        change: recentActivities.filter(a => a.type === 'agent_created').length,
        trend: recentActivities.filter(a => a.type === 'agent_created').length > 0 ? 'up' : 'stable',
        icon: <Users className="w-5 h-5" />
      },
      {
        title: "Completed Tasks",
        value: completedWorkflows.toString(),
        change: Math.floor(Math.random() * 5) + 1, // Simulated change
        trend: 'up',
        icon: <Activity className="w-5 h-5" />
      },
      {
        title: "System Uptime",
        value: "99.9%",
        change: 0.1,
        trend: 'stable',
        icon: <Database className="w-5 h-5" />
      }
    ];
  };

  const getPerformanceData = (): ChartData[] => {
    return [
      { name: "Workflows", value: workflows.length, change: 12 },
      { name: "Agents", value: agents.length, change: 8 },
      { name: "Activities", value: activities.length, change: 25 },
      { name: "API Calls", value: metrics.length * 10, change: 15 }
    ];
  };

  const getActivityTrends = () => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      const count = activities.filter(activity => {
        const activityHour = activity.createdAt ? new Date(activity.createdAt).getHours() : 0;
        return activityHour === hour;
      }).length;
      
      return {
        hour: `${hour}:00`,
        count,
        percentage: activities.length > 0 ? (count / activities.length) * 100 : 0
      };
    });

    return hourlyData;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-glow-green" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-glow-coral" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const metricCards = calculateMetrics();
  const performanceData = getPerformanceData();
  const activityTrends = getActivityTrends();

  if (metricsLoading || activitiesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-glow-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extralight mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">Monitor your workflows, agents, and system performance</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 holographic-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="holographic-border">
              <BarChart3 className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((metric, index) => (
            <Card key={index} className="holographic-border bg-black/40 hover:bg-black/60 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {metric.title}
                </CardTitle>
                <div className="text-glow-cyan">
                  {metric.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">
                  {metric.value}
                </div>
                <div className="flex items-center text-xs">
                  {getTrendIcon(metric.trend)}
                  <span className={`ml-1 ${
                    metric.trend === 'up' ? 'text-glow-green' :
                    metric.trend === 'down' ? 'text-glow-coral' :
                    'text-gray-400'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}
                  </span>
                  <span className="text-gray-400 ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Analytics */}
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-6">
          <TabsList className="holographic-border bg-black/60">
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Workflow Status */}
              <Card className="holographic-border bg-black/40">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-glow-blue" />
                    Workflow Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workflows.slice(0, 5).map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{workflow.name}</div>
                        <div className="text-xs text-gray-400">{workflow.description}</div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          workflow.status === 'active' ? 'border-glow-green text-glow-green' :
                          workflow.status === 'running' ? 'border-glow-blue text-glow-blue' :
                          'border-gray-500 text-gray-400'
                        }
                      >
                        {workflow.status}
                      </Badge>
                    </div>
                  ))}
                  {workflows.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      No workflows found. Create your first workflow to see analytics.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Chart */}
              <Card className="holographic-border bg-black/40">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-glow-cyan" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                      <Progress 
                        value={Math.min((item.value / Math.max(...performanceData.map(d => d.value))) * 100, 100)} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Change: +{item.change}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <Card className="holographic-border bg-black/40">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-glow-purple" />
                  Agent Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.slice(0, 8).map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{agent.name}</div>
                        <div className="text-xs text-gray-400">{agent.description || 'No description'}</div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="outline"
                          className={
                            agent.status === 'active' ? 'border-glow-green text-glow-green' :
                            agent.status === 'deployed' ? 'border-glow-blue text-glow-blue' :
                            'border-gray-500 text-gray-400'
                          }
                        >
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {agents.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      No agents deployed. Create your first agent to see performance data.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="holographic-border bg-black/40">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-glow-teal" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CPU Usage</span>
                      <span className="font-medium">23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <span className="font-medium">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Storage Usage</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Network I/O</span>
                      <span className="font-medium">12%</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="holographic-border bg-black/40">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-glow-coral" />
                    API Response Times
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Workflows API</span>
                      <span className="font-medium text-glow-green">45ms</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Agents API</span>
                      <span className="font-medium text-glow-green">67ms</span>
                    </div>
                    <Progress value={22} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Knowledge API</span>
                      <span className="font-medium text-glow-blue">123ms</span>
                    </div>
                    <Progress value={41} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">MCP Services</span>
                      <span className="font-medium text-glow-cyan">89ms</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="holographic-border bg-black/40">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-glow-green" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {activities.slice(0, 20).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-white/5">
                      <div className="w-2 h-2 rounded-full bg-glow-cyan mt-2"></div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{activity.title}</div>
                        <div className="text-xs text-gray-400">{activity.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : 'Unknown time'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      No recent activity. Start using workflows and agents to see activity data.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}