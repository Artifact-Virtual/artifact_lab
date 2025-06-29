import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  Edit,
  Users,
  Zap,
  Brain,
  MessageSquare,
  Activity,
  Clock
} from "lucide-react";
import type { Agent, Workflow, InsertAgent } from "@shared/schema";

export default function Agents() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [newAgent, setNewAgent] = useState<Partial<InsertAgent>>({
    name: '',
    description: '',
    prompt: '',
    capabilities: [],
    workflowId: undefined
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    refetchInterval: 30000
  });

  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows']
  });

  const createAgentMutation = useMutation({
    mutationFn: async (agentData: InsertAgent) => {
      return apiRequest('POST', '/api/agents', agentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      setIsCreateDialogOpen(false);
      resetNewAgent();
    }
  });

  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAgent> }) => {
      return apiRequest('PUT', `/api/agents/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      setIsEditDialogOpen(false);
      setSelectedAgent(null);
    }
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    }
  });

  const deployAgentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/agents/${id}/deploy`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    }
  });

  const resetNewAgent = () => {
    setNewAgent({
      name: '',
      description: '',
      prompt: '',
      capabilities: [],
      workflowId: undefined
    });
  };

  const handleCreateAgent = () => {
    if (!newAgent.name || !newAgent.description) return;
    
    createAgentMutation.mutate({
      name: newAgent.name,
      description: newAgent.description,
      prompt: newAgent.prompt || '',
      capabilities: newAgent.capabilities || [],
      workflowId: newAgent.workflowId
    });
  };

  const handleEditAgent = () => {
    if (!selectedAgent || !selectedAgent.name) return;
    
    updateAgentMutation.mutate({
      id: selectedAgent.id,
      data: {
        name: selectedAgent.name,
        description: selectedAgent.description,
        prompt: selectedAgent.prompt,
        capabilities: selectedAgent.capabilities,
        workflowId: selectedAgent.workflowId
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'border-glow-green text-glow-green';
      case 'deployed': return 'border-glow-blue text-glow-blue';
      case 'training': return 'border-glow-purple text-glow-purple';
      case 'error': return 'border-glow-coral text-glow-coral';
      default: return 'border-gray-500 text-gray-400';
    }
  };

  const getAgentsByStatus = () => {
    const activeAgents = agents.filter(a => a.status === 'active');
    const deployedAgents = agents.filter(a => a.status === 'deployed');
    const idleAgents = agents.filter(a => a.status === 'idle');
    const errorAgents = agents.filter(a => a.status === 'error');

    return { activeAgents, deployedAgents, idleAgents, errorAgents };
  };

  const { activeAgents, deployedAgents, idleAgents, errorAgents } = getAgentsByStatus();

  if (agentsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-glow-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading agents...</p>
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
            <h1 className="text-2xl font-extralight mb-2">AI Agents</h1>
            <p className="text-gray-400">Deploy and manage intelligent automation agents</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-glow-cyan/20 border-glow-cyan text-glow-cyan hover:bg-glow-cyan/30">
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="holographic-border bg-black max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Agent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <Label htmlFor="agent-name">Agent Name</Label>
                  <Input
                    id="agent-name"
                    value={newAgent.name || ''}
                    onChange={(e) => setNewAgent(prev => ({...prev, name: e.target.value}))}
                    placeholder="Enter agent name..."
                    className="holographic-border"
                  />
                </div>
                
                <div>
                  <Label htmlFor="agent-description">Description</Label>
                  <Textarea
                    id="agent-description"
                    value={newAgent.description || ''}
                    onChange={(e) => setNewAgent(prev => ({...prev, description: e.target.value}))}
                    placeholder="Describe what this agent does..."
                    className="holographic-border"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="agent-workflow">Associated Workflow</Label>
                  <Select 
                    value={newAgent.workflowId?.toString() || ""} 
                    onValueChange={(value) => setNewAgent(prev => ({...prev, workflowId: parseInt(value)}))}
                  >
                    <SelectTrigger className="holographic-border">
                      <SelectValue placeholder="Select workflow (optional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows.map((workflow) => (
                        <SelectItem key={workflow.id} value={workflow.id.toString()}>
                          {workflow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="agent-prompt">System Prompt</Label>
                  <Textarea
                    id="agent-prompt"
                    value={newAgent.prompt || ''}
                    onChange={(e) => setNewAgent(prev => ({...prev, prompt: e.target.value}))}
                    placeholder="Define the agent's behavior and capabilities..."
                    className="holographic-border"
                    rows={4}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={handleCreateAgent}
                    disabled={createAgentMutation.isPending || !newAgent.name || !newAgent.description}
                    className="flex-1"
                  >
                    {createAgentMutation.isPending ? 'Creating...' : 'Create Agent'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="holographic-border"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="holographic-border bg-black/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Agents</CardTitle>
              <Activity className="w-5 h-5 text-glow-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeAgents.length}</div>
              <p className="text-xs text-gray-400">Currently running</p>
            </CardContent>
          </Card>

          <Card className="holographic-border bg-black/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Deployed</CardTitle>
              <Zap className="w-5 h-5 text-glow-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{deployedAgents.length}</div>
              <p className="text-xs text-gray-400">Ready for tasks</p>
            </CardContent>
          </Card>

          <Card className="holographic-border bg-black/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Agents</CardTitle>
              <Users className="w-5 h-5 text-glow-cyan" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{agents.length}</div>
              <p className="text-xs text-gray-400">All agents</p>
            </CardContent>
          </Card>

          <Card className="holographic-border bg-black/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">With Errors</CardTitle>
              <Bot className="w-5 h-5 text-glow-coral" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{errorAgents.length}</div>
              <p className="text-xs text-gray-400">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Agents Grid */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="holographic-border bg-black/60">
            <TabsTrigger value="all">All Agents ({agents.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeAgents.length})</TabsTrigger>
            <TabsTrigger value="deployed">Deployed ({deployedAgents.length})</TabsTrigger>
            <TabsTrigger value="idle">Idle ({idleAgents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} className="holographic-border bg-black/40 hover:bg-black/60 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-5 h-5 text-glow-cyan" />
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{agent.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {agent.workflowId && (
                      <div className="flex items-center text-sm text-gray-400">
                        <Zap className="w-4 h-4 mr-2" />
                        <span>Workflow: {workflows.find(w => w.id === agent.workflowId)?.name || 'Unknown'}</span>
                      </div>
                    )}
                    
                    {agent.capabilities && agent.capabilities.length > 0 && (
                      <div className="flex items-center text-sm text-gray-400">
                        <Brain className="w-4 h-4 mr-2" />
                        <span>{agent.capabilities.length} capabilities</span>
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Created {new Date(agent.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => deployAgentMutation.mutate(agent.id)}
                        disabled={deployAgentMutation.isPending || agent.status === 'active'}
                        className="flex-1 bg-glow-green/20 border-glow-green text-glow-green hover:bg-glow-green/30"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Deploy
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setIsEditDialogOpen(true);
                        }}
                        className="holographic-border"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteAgentMutation.mutate(agent.id)}
                        disabled={deleteAgentMutation.isPending}
                        className="border-glow-coral text-glow-coral hover:bg-glow-coral/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {agents.length === 0 && (
              <Card className="holographic-border bg-black/40">
                <CardContent className="p-12 text-center">
                  <Bot className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-lg font-medium mb-2">No Agents Yet</h3>
                  <p className="text-gray-400 mb-6">Create your first AI agent to start automating tasks</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Agent
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAgents.map((agent) => (
                <Card key={agent.id} className="holographic-border bg-black/40 border-glow-green/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-glow-green" />
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="border-glow-green text-glow-green">
                        Running
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{agent.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Performance: Excellent</span>
                      <Button size="sm" variant="outline" className="border-glow-coral text-glow-coral">
                        <Pause className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="deployed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deployedAgents.map((agent) => (
                <Card key={agent.id} className="holographic-border bg-black/40 border-glow-blue/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-glow-blue" />
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="border-glow-blue text-glow-blue">
                        Ready
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{agent.description}</p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="idle">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {idleAgents.map((agent) => (
                <Card key={agent.id} className="holographic-border bg-black/40">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-5 h-5 text-gray-400" />
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="border-gray-500 text-gray-400">
                        Idle
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{agent.description}</p>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      size="sm" 
                      onClick={() => deployAgentMutation.mutate(agent.id)}
                      className="w-full bg-glow-green/20 border-glow-green text-glow-green"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Activate Agent
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Agent Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="holographic-border bg-black max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
            </DialogHeader>
            {selectedAgent && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <Label htmlFor="edit-agent-name">Agent Name</Label>
                  <Input
                    id="edit-agent-name"
                    value={selectedAgent.name}
                    onChange={(e) => setSelectedAgent(prev => prev ? {...prev, name: e.target.value} : null)}
                    className="holographic-border"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-agent-description">Description</Label>
                  <Textarea
                    id="edit-agent-description"
                    value={selectedAgent.description || ''}
                    onChange={(e) => setSelectedAgent(prev => prev ? {...prev, description: e.target.value} : null)}
                    className="holographic-border"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-agent-prompt">System Prompt</Label>
                  <Textarea
                    id="edit-agent-prompt"
                    value={selectedAgent.prompt || ''}
                    onChange={(e) => setSelectedAgent(prev => prev ? {...prev, prompt: e.target.value} : null)}
                    className="holographic-border"
                    rows={4}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={handleEditAgent}
                    disabled={updateAgentMutation.isPending}
                    className="flex-1"
                  >
                    {updateAgentMutation.isPending ? 'Updating...' : 'Update Agent'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                    className="holographic-border"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}