import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Plus, Server, Activity, AlertCircle, CheckCircle, Clock, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function MCP() {
  const [newServer, setNewServer] = useState({
    name: "",
    type: "http",
    endpoint: "",
    capabilities: []
  });

  const queryClient = useQueryClient();

  const { data: mcpServers, isLoading } = useQuery({
    queryKey: ['/api/mcp-servers'],
    refetchInterval: 10000
  });

  const addServerMutation = useMutation({
    mutationFn: async (server: any) => {
      return apiRequest('POST', '/api/mcp-servers', server);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mcp-servers'] });
      setNewServer({ name: "", type: "http", endpoint: "", capabilities: [] });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (serverId: number) => {
      return apiRequest('POST', `/api/mcp-servers/${serverId}/test`);
    }
  });

  const executeCapabilityMutation = useMutation({
    mutationFn: async ({ serverId, capability, params }: any) => {
      return apiRequest('POST', `/api/mcp/execute`, { serverId, capability, params });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-glow-green" />;
      case 'connecting': return <Clock className="w-4 h-4 text-glow-yellow" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-glow-coral" />;
      default: return <Server className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'border-glow-green/50 bg-glow-green/10';
      case 'connecting': return 'border-glow-yellow/50 bg-glow-yellow/10';
      case 'error': return 'border-glow-coral/50 bg-glow-coral/10';
      default: return 'border-white/20';
    }
  };

  return (
    <div className="h-full p-6 overflow-y-auto custom-scrollbar space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extralight">MCP Servers</h1>
          <p className="text-gray-400 text-sm">Manage Model Context Protocol servers and capabilities</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="holographic-border bg-glow-blue/20 hover:bg-glow-blue/30">
              <Plus className="w-4 h-4 mr-2" />
              Add Server
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-lg font-light">Add MCP Server</DialogTitle>
              <DialogDescription>
                Connect a new Model Context Protocol server
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Server Name</label>
                <Input
                  value={newServer.name}
                  onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                  placeholder="My MCP Server"
                  className="bg-transparent border-white/20"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Server Type</label>
                <Select value={newServer.type} onValueChange={(value) => setNewServer({ ...newServer, type: value })}>
                  <SelectTrigger className="bg-transparent border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-white/20">
                    <SelectItem value="http">HTTP Server</SelectItem>
                    <SelectItem value="stdio">STDIO Process</SelectItem>
                    <SelectItem value="websocket">WebSocket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Endpoint/Command</label>
                <Input
                  value={newServer.endpoint}
                  onChange={(e) => setNewServer({ ...newServer, endpoint: e.target.value })}
                  placeholder="http://localhost:8080 or /path/to/command"
                  className="bg-transparent border-white/20"
                />
              </div>
              
              <Button 
                onClick={() => addServerMutation.mutate(newServer)}
                disabled={addServerMutation.isPending || !newServer.name || !newServer.endpoint}
                className="w-full holographic-border bg-glow-blue/20 hover:bg-glow-blue/30"
              >
                {addServerMutation.isPending ? 'Adding...' : 'Add Server'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Server Status Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-400">Total Servers</p>
              <p className="text-2xl font-light">{mcpServers?.length || 0}</p>
            </div>
            <Server className="w-8 h-8 text-glow-blue" />
          </CardContent>
        </Card>
        
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-400">Connected</p>
              <p className="text-2xl font-light text-glow-green">
                {mcpServers?.filter((s: any) => s.status === 'connected').length || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-glow-green" />
          </CardContent>
        </Card>
        
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-400">Capabilities</p>
              <p className="text-2xl font-light">
                {mcpServers?.reduce((acc: number, s: any) => acc + (s.capabilities?.length || 0), 0) || 0}
              </p>
            </div>
            <Zap className="w-8 h-8 text-glow-yellow" />
          </CardContent>
        </Card>
        
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-gray-400">Avg Response</p>
              <p className="text-2xl font-light">
                {mcpServers?.length ? 
                  Math.round(mcpServers.reduce((acc: number, s: any) => acc + (s.responseTime || 0), 0) / mcpServers.length) 
                  : 0}ms
              </p>
            </div>
            <Activity className="w-8 h-8 text-glow-cyan" />
          </CardContent>
        </Card>
      </div>

      {/* MCP Servers List */}
      <div className="space-y-4">
        {mcpServers?.map((server: any) => (
          <Card key={server.id} className={`holographic-border bg-transparent transition-all ${getStatusColor(server.status)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(server.status)}
                  <div>
                    <CardTitle className="text-lg font-light">{server.name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">{server.type}</Badge>
                      <span>{server.endpoint}</span>
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => testConnectionMutation.mutate(server.id)}
                    disabled={testConnectionMutation.isPending}
                    className="text-glow-cyan hover:bg-glow-cyan/20"
                  >
                    {testConnectionMutation.isPending ? 'Testing...' : 'Test'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:bg-white/10"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {/* Server Info */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className={`ml-2 capitalize ${
                      server.status === 'connected' ? 'text-glow-green' :
                      server.status === 'connecting' ? 'text-glow-yellow' :
                      'text-glow-coral'
                    }`}>
                      {server.status}
                    </span>
                  </div>
                  
                  {server.responseTime && (
                    <div>
                      <span className="text-gray-400">Response Time:</span>
                      <span className="ml-2 text-white">{server.responseTime}ms</span>
                    </div>
                  )}
                  
                  {server.lastPing && (
                    <div>
                      <span className="text-gray-400">Last Ping:</span>
                      <span className="ml-2 text-white">
                        {new Date(server.lastPing).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Capabilities */}
                {server.capabilities && server.capabilities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-light mb-2 text-gray-300">Available Capabilities</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {server.capabilities.map((capability: any, index: number) => (
                        <div key={index} className="p-3 rounded border border-white/10 hover:border-glow-blue/50 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-light">{capability.name}</h5>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => executeCapabilityMutation.mutate({
                                serverId: server.id,
                                capability: capability.name,
                                params: {}
                              })}
                              disabled={executeCapabilityMutation.isPending}
                              className="text-xs text-glow-blue hover:bg-glow-blue/20"
                            >
                              Execute
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400">{capability.description}</p>
                          
                          {capability.parameters && Object.keys(capability.parameters).length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Parameters:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.keys(capability.parameters).map((param) => (
                                  <Badge key={param} variant="outline" className="text-xs">
                                    {param}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {capability.examples && capability.examples.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Examples:</p>
                              <div className="text-xs text-gray-400 mt-1">
                                {capability.examples.slice(0, 2).join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mcpServers?.length === 0 && !isLoading && (
        <Card className="holographic-border bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-light mb-2">No MCP Servers</h3>
            <p className="text-gray-400 text-center mb-4">
              Add your first Model Context Protocol server to extend AI capabilities with external tools and services
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}