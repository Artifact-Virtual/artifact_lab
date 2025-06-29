import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Clock, Play, Pause, Trash2, MoreVertical, CalendarDays } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ScheduledTask {
  id: number;
  name: string;
  description: string;
  cron: string;
  workflowId?: number;
  enabled: boolean;
  nextRun: string;
  lastRun?: string;
  status: 'active' | 'paused' | 'error';
}

export default function Scheduling() {
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    cron: "",
    workflowId: undefined as number | undefined,
    enabled: true
  });

  const queryClient = useQueryClient();

  const { data: scheduledTasks = [], isLoading } = useQuery({
    queryKey: ['/api/scheduled-tasks'],
    refetchInterval: 30000
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['/api/workflows']
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      return apiRequest('POST', '/api/scheduled-tasks', task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-tasks'] });
      setNewTask({ name: "", description: "", cron: "", workflowId: undefined, enabled: true });
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      return apiRequest('PATCH', `/api/scheduled-tasks/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-tasks'] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/scheduled-tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-tasks'] });
    }
  });

  const executeNowMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/scheduled-tasks/${id}/execute`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-glow-green';
      case 'paused': return 'text-glow-yellow';
      case 'error': return 'text-glow-coral';
      default: return 'text-gray-400';
    }
  };

  const getCronDescription = (cron: string) => {
    const descriptions: Record<string, string> = {
      '0 9 * * *': 'Daily at 9:00 AM',
      '0 */6 * * *': 'Every 6 hours',
      '0 0 * * 0': 'Weekly on Sunday',
      '0 0 1 * *': 'Monthly on 1st',
      '*/15 * * * *': 'Every 15 minutes',
      '0 8 * * 1-5': 'Weekdays at 8:00 AM'
    };
    return descriptions[cron] || cron;
  };

  const predefinedSchedules = [
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily at 9 AM', value: '0 9 * * *' },
    { label: 'Weekdays at 8 AM', value: '0 8 * * 1-5' },
    { label: 'Weekly on Sunday', value: '0 0 * * 0' },
    { label: 'Monthly on 1st', value: '0 0 1 * *' }
  ];

  return (
    <div className="h-full p-6 overflow-y-auto custom-scrollbar space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extralight">Task Scheduling</h1>
          <p className="text-gray-400 text-sm">Automate workflows with time-based triggers and schedules</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="holographic-border bg-glow-yellow/20 hover:bg-glow-yellow/30">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black border border-white/20 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-light">Schedule New Task</DialogTitle>
              <DialogDescription>
                Create a time-based automation schedule
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Task Name</label>
                  <Input
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="Daily Report Generation"
                    className="bg-transparent border-white/20"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Workflow</label>
                  <Select value={newTask.workflowId?.toString()} onValueChange={(value) => setNewTask({ ...newTask, workflowId: parseInt(value) })}>
                    <SelectTrigger className="bg-transparent border-white/20">
                      <SelectValue placeholder="Select workflow" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-white/20">
                      {workflows.map((workflow: any) => (
                        <SelectItem key={workflow.id} value={workflow.id.toString()}>
                          {workflow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Describe what this scheduled task does..."
                  className="bg-transparent border-white/20"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Schedule (Cron Expression)</label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={newTask.cron} onValueChange={(value) => setNewTask({ ...newTask, cron: value })}>
                    <SelectTrigger className="bg-transparent border-white/20">
                      <SelectValue placeholder="Choose preset" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-white/20">
                      {predefinedSchedules.map((schedule) => (
                        <SelectItem key={schedule.value} value={schedule.value}>
                          {schedule.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={newTask.cron}
                    onChange={(e) => setNewTask({ ...newTask, cron: e.target.value })}
                    placeholder="0 9 * * *"
                    className="bg-transparent border-white/20"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {newTask.cron && getCronDescription(newTask.cron)}
                </p>
              </div>
              
              <Button 
                onClick={() => createTaskMutation.mutate(newTask)}
                disabled={createTaskMutation.isPending || !newTask.name || !newTask.cron}
                className="w-full holographic-border bg-glow-yellow/20 hover:bg-glow-yellow/30"
              >
                {createTaskMutation.isPending ? 'Creating...' : 'Create Schedule'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedule Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-400">Total Schedules</p>
              <p className="text-2xl font-light">{scheduledTasks.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-glow-yellow" />
          </CardContent>
        </Card>
        
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-2xl font-light text-glow-green">
                {scheduledTasks.filter((t: ScheduledTask) => t.enabled && t.status === 'active').length}
              </p>
            </div>
            <Play className="w-8 h-8 text-glow-green" />
          </CardContent>
        </Card>
        
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-400">Next Hour</p>
              <p className="text-2xl font-light">
                {scheduledTasks.filter((t: ScheduledTask) => {
                  const nextRun = new Date(t.nextRun);
                  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
                  return nextRun <= oneHourFromNow;
                }).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-glow-cyan" />
          </CardContent>
        </Card>
        
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-400">Success Rate</p>
              <p className="text-2xl font-light">96.8%</p>
            </div>
            <CalendarDays className="w-8 h-8 text-glow-purple" />
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Tasks List */}
      <div className="space-y-4">
        {scheduledTasks.map((task: ScheduledTask) => (
          <Card key={task.id} className="holographic-border bg-transparent hover:border-glow-yellow/50 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-glow-yellow" />
                  <div>
                    <CardTitle className="text-lg font-light flex items-center space-x-2">
                      <span>{task.name}</span>
                      {!task.enabled && <Badge variant="outline" className="text-xs">Disabled</Badge>}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">{getCronDescription(task.cron)}</Badge>
                      <span className={getStatusColor(task.status)}>{task.status}</span>
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => executeNowMutation.mutate(task.id)}
                    disabled={executeNowMutation.isPending || !task.enabled}
                    className="text-glow-cyan hover:bg-glow-cyan/20"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTaskMutation.mutate({ 
                      id: task.id, 
                      enabled: !task.enabled 
                    })}
                    disabled={toggleTaskMutation.isPending}
                    className={task.enabled ? "text-glow-yellow hover:bg-glow-yellow/20" : "text-glow-green hover:bg-glow-green/20"}
                  >
                    {task.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    disabled={deleteTaskMutation.isPending}
                    className="text-glow-coral hover:bg-glow-coral/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {task.description && (
                  <p className="text-sm text-gray-300">{task.description}</p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Next Run:</span>
                    <span className="ml-2 text-white">
                      {new Date(task.nextRun).toLocaleString()}
                    </span>
                  </div>
                  
                  {task.lastRun && (
                    <div>
                      <span className="text-gray-400">Last Run:</span>
                      <span className="ml-2 text-white">
                        {new Date(task.lastRun).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-400">Schedule:</span>
                    <span className="ml-2 text-white font-mono text-xs">{task.cron}</span>
                  </div>
                  
                  {task.workflowId && (
                    <div>
                      <span className="text-gray-400">Workflow:</span>
                      <span className="ml-2 text-white">
                        {workflows.find((w: any) => w.id === task.workflowId)?.name || `ID: ${task.workflowId}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {scheduledTasks.length === 0 && !isLoading && (
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-light mb-2">No Scheduled Tasks</h3>
            <p className="text-gray-400 text-center mb-4">
              Create your first scheduled task to automate workflows on a time-based schedule
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}