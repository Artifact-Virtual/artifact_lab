import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bot, 
  Play, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Cpu,
  Activity,
  Zap
} from "lucide-react";

interface PythonAgent {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'error' | 'deploying';
  capabilities: string[];
  executionMode: 'sync' | 'async' | 'scheduled' | 'event-driven';
  executionCount: number;
  averageExecutionTime: number;
  lastExecution?: string;
}

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
}

export default function PythonAgentsPanel() {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<PythonAgent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['/api/python-agents'],
    refetchInterval: 15000
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['/api/python-agents/templates']
  });

  const { data: status } = useQuery({
    queryKey: ['/api/python-agents/status'],
    refetchInterval: 10000
  });

  const deployAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      return apiRequest('POST', `/api/python-agents/${agentId}/deploy`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/python-agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/python-agents/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    }
  });

  const executeAgentMutation = useMutation({
    mutationFn: async ({ agentId, inputs }: { agentId: string; inputs: any }) => {
      return apiRequest('POST', `/api/python-agents/${agentId}/execute`, inputs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/python-agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-glow-green';
      case 'error': return 'text-glow-red';
      case 'deploying': return 'text-glow-yellow';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-3 h-3" />;
      case 'error': return <AlertCircle className="w-3 h-3" />;
      case 'deploying': return <Upload className="w-3 h-3" />;
      default: return <Cpu className="w-3 h-3" />;
    }
  };

  const handleDeploy = (agent: PythonAgent) => {
    deployAgentMutation.mutate(agent.id);
  };

  const handleExecute = (agent: PythonAgent) => {
    const inputs = { 
      task: 'full_analysis',
      data: [{ example: 'data' }]
    };
    executeAgentMutation.mutate({ agentId: agent.id, inputs });
  };

  if (agentsLoading) {
    return (
      <Card className="cornered-card">
        <CardHeader>
          <CardTitle className="text-lg font-light flex items-center">
            <Bot className="w-5 h-5 mr-2 text-glow-purple" />
            Python Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/5 cornered-card"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="cornered-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-light flex items-center">
              <Bot className="w-5 h-5 mr-2 text-glow-purple" />
              Python Agents
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                onClick={() => setIsCreateDialogOpen(true)}
                className="cornered-button text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Create
              </Button>
              {status?.runningAgents > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {status.runningAgents} running
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {agents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No Python agents deployed</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsCreateDialogOpen(true)}
                className="cornered-button mt-3"
              >
                <Plus className="w-3 h-3 mr-1" />
                Create First Agent
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
              {agents.map((agent: PythonAgent) => (
                <div key={agent.id} className="cornered-card p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium truncate">{agent.name}</h4>
                        <div className={`flex items-center ${getStatusColor(agent.status)}`}>
                          {getStatusIcon(agent.status)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{agent.description}</p>
                    </div>
                    <div className="flex items-center space-x-1 ml-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeploy(agent)}
                        disabled={deployAgentMutation.isPending || agent.status === 'deploying'}
                        className="cornered-button text-xs h-7 px-2"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Deploy
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleExecute(agent)}
                        disabled={executeAgentMutation.isPending || agent.status === 'running'}
                        className="cornered-button text-xs h-7 px-2"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500">
                        Mode: <span className="text-white">{agent.executionMode}</span>
                      </span>
                      <span className="text-gray-500">
                        Runs: <span className="text-white">{agent.executionCount}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {agent.capabilities.slice(0, 2).map((cap, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs px-1">
                          {cap.replace('_', ' ')}
                        </Badge>
                      ))}
                      {agent.capabilities.length > 2 && (
                        <Badge variant="outline" className="text-xs px-1">
                          +{agent.capabilities.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {agent.averageExecutionTime > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Avg execution: {agent.averageExecutionTime.toFixed(0)}ms
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="cornered-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2 text-glow-purple" />
              Create Python Agent
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template">Agent Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="cornered-input">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template: AgentTemplate) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-gray-400">{template.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="p-3 bg-white/5 cornered-card">
                <h4 className="text-sm font-medium mb-2">Template Details</h4>
                {templates.find((t: AgentTemplate) => t.id === selectedTemplate) && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">
                      {templates.find((t: AgentTemplate) => t.id === selectedTemplate)?.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {templates.find((t: AgentTemplate) => t.id === selectedTemplate)?.capabilities.map((cap: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cap.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setSelectedTemplate('');
                }}
                className="cornered-button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // This would normally create the agent from template
                  console.log('Creating agent from template:', selectedTemplate);
                  setIsCreateDialogOpen(false);
                  setSelectedTemplate('');
                }}
                disabled={!selectedTemplate}
                className="cornered-button"
              >
                <Bot className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}