import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { 
  Code, 
  Play, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Settings
} from "lucide-react";

interface WindmillScript {
  id: string;
  name: string;
  description: string;
  language: 'python' | 'typescript' | 'bash';
  status: 'active' | 'inactive';
  parameters: Record<string, any>;
}

interface WindmillJob {
  id: string;
  scriptId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  result?: any;
  error?: string;
}

export default function WindmillPanel() {
  const queryClient = useQueryClient();
  const [selectedScript, setSelectedScript] = useState<WindmillScript | null>(null);
  const [executionParams, setExecutionParams] = useState<string>('{}');
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false);

  const { data: scripts = [], isLoading: scriptsLoading } = useQuery({
    queryKey: ['/api/windmill/scripts'],
    refetchInterval: 30000
  });

  const { data: status } = useQuery({
    queryKey: ['/api/windmill/status'],
    refetchInterval: 10000
  });

  const executeScriptMutation = useMutation({
    mutationFn: async ({ scriptId, parameters }: { scriptId: string; parameters: any }) => {
      return apiRequest('POST', `/api/windmill/scripts/${scriptId}/execute`, parameters);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/windmill/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      setIsExecuteDialogOpen(false);
      setExecutionParams('{}');
    }
  });

  const handleExecuteScript = (script: WindmillScript) => {
    setSelectedScript(script);
    setExecutionParams(JSON.stringify(script.parameters || {}, null, 2));
    setIsExecuteDialogOpen(true);
  };

  const executeScript = () => {
    if (!selectedScript) return;
    
    try {
      const parameters = JSON.parse(executionParams);
      executeScriptMutation.mutate({ 
        scriptId: selectedScript.id, 
        parameters 
      });
    } catch (error) {
      console.error('Invalid JSON parameters:', error);
    }
  };

  const getLanguageColor = (language: string) => {
    switch (language) {
      case 'python': return 'bg-blue-500/20 text-blue-400';
      case 'typescript': return 'bg-green-500/20 text-green-400';
      case 'bash': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (scriptsLoading) {
    return (
      <Card className="cornered-card">
        <CardHeader>
          <CardTitle className="text-lg font-light flex items-center">
            <Code className="w-5 h-5 mr-2 text-glow-blue" />
            Windmill Scripts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/5 cornered-card"></div>
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
              <Code className="w-5 h-5 mr-2 text-glow-blue" />
              Windmill Scripts
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={status?.connected ? "default" : "destructive"} className="text-xs">
                {status?.connected ? "Connected" : "Disconnected"}
              </Badge>
              {status?.activeJobs > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {status.activeJobs} running
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {scripts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No Windmill scripts available</p>
              <p className="text-xs mt-2">Configure Windmill integration in settings</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
              {scripts.map((script: WindmillScript) => (
                <div key={script.id} className="cornered-card p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{script.name}</h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{script.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      <Badge className={`text-xs ${getLanguageColor(script.language)}`}>
                        {script.language}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExecuteScript(script)}
                        className="cornered-button text-xs h-7 px-2"
                        disabled={executeScriptMutation.isPending}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Parameters: {Object.keys(script.parameters || {}).length}</span>
                    <Badge variant={script.status === 'active' ? "default" : "secondary"} className="text-xs">
                      {script.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
        <DialogContent className="cornered-card max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Play className="w-5 h-5 mr-2 text-glow-cyan" />
              Execute Windmill Script
            </DialogTitle>
          </DialogHeader>
          {selectedScript && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">{selectedScript.name}</h4>
                <p className="text-xs text-gray-400">{selectedScript.description}</p>
                <Badge className={`text-xs mt-2 ${getLanguageColor(selectedScript.language)}`}>
                  {selectedScript.language}
                </Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Parameters (JSON)</label>
                <Textarea
                  value={executionParams}
                  onChange={(e) => setExecutionParams(e.target.value)}
                  placeholder="Enter execution parameters as JSON..."
                  className="cornered-input font-mono text-sm"
                  rows={8}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsExecuteDialogOpen(false)}
                  className="cornered-button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeScript}
                  disabled={executeScriptMutation.isPending}
                  className="cornered-button"
                >
                  {executeScriptMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute Script
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}