import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, Plus, Play, Pause, Trash2, Edit, Copy, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";

export default function Automation() {
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    trigger: "manual",
    steps: [],
    schedule: "",
    enabled: true
  });

  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['/api/workflows'],
    refetchInterval: 5000
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (workflow: any) => {
      return apiRequest('POST', '/api/workflows', workflow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      setNewWorkflow({ name: "", description: "", trigger: "manual", steps: [], schedule: "", enabled: true });
    }
  });

  const executeWorkflowMutation = useMutation({
    mutationFn: async (workflowId: number) => {
      return apiRequest('POST', `/api/workflows/${workflowId}/execute`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    }
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      return apiRequest('PATCH', `/api/workflows/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    }
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    }
  });

  const duplicateWorkflowMutation = useMutation({
    mutationFn: async (workflow: any) => {
      const duplicate = {
        ...workflow,
        name: `${workflow.name} (Copy)`,
        id: undefined
      };
      return apiRequest('POST', '/api/workflows', duplicate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-glow-green';
      case 'completed': return 'text-glow-cyan';
      case 'failed': return 'text-glow-coral';
      case 'paused': return 'text-glow-yellow';
      default: return 'text-gray-400';
    }
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'schedule': return '⏰';
      case 'webhook': return '🔗';
      case 'file': return '📁';
      case 'email': return '📧';
      default: return '▶️';
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto custom-scrollbar space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extralight">Automation Hub</h1>
          <p className="text-gray-400 text-sm">Create and manage automated workflows and processes</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="holographic-border bg-glow-purple/20 hover:bg-glow-purple/30">
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black border border-white/20 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-light">Create Automation Workflow</DialogTitle>
              <DialogDescription>
                Design a new automated workflow to streamline your processes
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Workflow Name</label>
                  <Input
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    placeholder="My Automation Workflow"
                    className="bg-transparent border-white/20"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Trigger Type</label>
                  <Select value={newWorkflow.trigger} onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger: value })}>
                    <SelectTrigger className="bg-transparent border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-white/20">
                      <SelectItem value="manual">Manual Trigger</SelectItem>
                      <SelectItem value="schedule">Schedule</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="file">File Upload</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {newWorkflow.trigger === 'schedule' && (
                <div>
                  <label className="text-sm text-gray-400">Schedule (Cron)</label>
                  <Input
                    value={newWorkflow.schedule}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, schedule: e.target.value })}
                    placeholder="0 9 * * * (Daily at 9 AM)"
                    className="bg-transparent border-white/20"
                  />
                </div>
              )}
              
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <Textarea
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="Describe what this workflow does..."
                  className="bg-transparent border-white/20"
                />
              </div>
              
              <Button 
                onClick={() => createWorkflowMutation.mutate(newWorkflow)}
                disabled={createWorkflowMutation.isPending || !newWorkflow.name}
                className="w-full holographic-border bg-glow-purple/20 hover:bg-glow-purple/30"
              >
                {createWorkflowMutation.isPending ? 'Creating...' : 'Create Workflow'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-400">Total Workflows</p>
              <p className="text-2xl font-light">{workflows?.length || 0}</p>
            </div>
            <Settings2 className="w-8 h-8 text-glow-purple" />
          </CardContent>
        </Card>
        
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-2xl font-light text-glow-green">
                {workflows?.filter((w: any) => w.enabled && w.status !== 'paused').length || 0}
              </p>
            </div>
            <Play className="w-8 h-8 text-glow-green" />
          </CardContent>
        </Card>
        
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-400">Executions Today</p>
              <p className="text-2xl font-light">
                {workflows?.reduce((acc: number, w: any) => acc + (w.executionCount || 0), 0) || 0}
              </p>
            </div>
            <Play className="w-8 h-8 text-glow-cyan" />
          </CardContent>
        </Card>
        
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-400">Success Rate</p>
              <p className="text-2xl font-light">94.2%</p>
            </div>
            <Settings2 className="w-8 h-8 text-glow-yellow" />
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {workflows?.map((workflow: any) => (
          <Card key={workflow.id} className="holographic-border bg-transparent hover:border-glow-purple/50 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getTriggerIcon(workflow.trigger)}</div>
                  <div>
                    <CardTitle className="text-lg font-light flex items-center space-x-2">
                      <span>{workflow.name}</span>
                      {!workflow.enabled && <Badge variant="outline" className="text-xs">Disabled</Badge>}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">{workflow.trigger}</Badge>
                      <span className={getStatusColor(workflow.status)}>{workflow.status || 'idle'}</span>
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => executeWorkflowMutation.mutate(workflow.id)}
                    disabled={executeWorkflowMutation.isPending || !workflow.enabled}
                    className="text-glow-green hover:bg-glow-green/20"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleWorkflowMutation.mutate({ 
                      id: workflow.id, 
                      enabled: !workflow.enabled 
                    })}
                    disabled={toggleWorkflowMutation.isPending}
                    className={workflow.enabled ? "text-glow-yellow hover:bg-glow-yellow/20" : "text-glow-green hover:bg-glow-green/20"}
                  >
                    {workflow.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-white/10">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-black border border-white/20">
                      <DropdownMenuItem onClick={() => duplicateWorkflowMutation.mutate(workflow)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                        className="text-glow-coral"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {workflow.description && (
                  <p className="text-sm text-gray-300">{workflow.description}</p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Created:</span>
                    <span className="ml-2 text-white">
                      {new Date(workflow.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {workflow.schedule && (
                    <div>
                      <span className="text-gray-400">Schedule:</span>
                      <span className="ml-2 text-white">{workflow.schedule}</span>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-400">Executions:</span>
                    <span className="ml-2 text-white">{workflow.executionCount || 0}</span>
                  </div>
                  
                  {workflow.lastExecuted && (
                    <div>
                      <span className="text-gray-400">Last Run:</span>
                      <span className="ml-2 text-white">
                        {new Date(workflow.lastExecuted).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Workflow Steps Preview */}
                {workflow.steps && workflow.steps.length > 0 && (
                  <div>
                    <h4 className="text-sm font-light mb-2 text-gray-300">Workflow Steps</h4>
                    <div className="flex flex-wrap gap-2">
                      {workflow.steps.slice(0, 5).map((step: any, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {index + 1}. {step.type || step.name || 'Step'}
                        </Badge>
                      ))}
                      {workflow.steps.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{workflow.steps.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workflows?.length === 0 && !isLoading && (
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings2 className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-light mb-2">No Automation Workflows</h3>
            <p className="text-gray-400 text-center mb-4">
              Create your first automated workflow to streamline repetitive tasks and processes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}