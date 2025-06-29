import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, RefreshCw, Database, Shield, Bell, Palette, Code } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const [llmConfig, setLlmConfig] = useState({
    defaultProvider: "openai",
    providers: {
      openai: { enabled: true, model: "gpt-4o" },
      gemini: { enabled: true, model: "gemini-2.5-flash" },
      ollama: { enabled: false, endpoint: "http://localhost:11434", model: "llama3.2:3b" },
      llmstudio: { enabled: false, endpoint: "http://localhost:1234", model: "local-model" }
    }
  });

  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    backupInterval: "daily",
    logLevel: "info",
    maxConcurrentWorkflows: 10,
    sessionTimeout: 3600,
    enableAnalytics: true,
    enableNotifications: true
  });

  const queryClient = useQueryClient();

  const { data: currentConfig } = useQuery({
    queryKey: ['/api/system/config'],
    refetchInterval: 30000
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['/api/system/health'],
    refetchInterval: 10000
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (config: any) => {
      return apiRequest('POST', '/api/system/config', config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system/config'] });
    }
  });

  const restartServiceMutation = useMutation({
    mutationFn: async (service: string) => {
      return apiRequest('POST', `/api/system/restart/${service}`);
    }
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('GET', '/api/system/export');
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (provider: string) => {
      return apiRequest('POST', `/api/system/test/${provider}`);
    }
  });

  return (
    <div className="h-full p-6 overflow-y-auto custom-scrollbar space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extralight">System Settings</h1>
          <p className="text-gray-400 text-sm">Configure ARTIFACT VIRTUAL system preferences and integrations</p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => saveConfigMutation.mutate({ llm: llmConfig, system: systemSettings })}
            disabled={saveConfigMutation.isPending}
            className="holographic-border bg-glow-green/20 hover:bg-glow-green/30"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveConfigMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="llm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-transparent border border-white/20">
          <TabsTrigger value="llm" className="data-[state=active]:bg-glow-cyan/20">LLM Providers</TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-glow-purple/20">System</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-glow-coral/20">Security</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-glow-yellow/20">Notifications</TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-glow-teal/20">Maintenance</TabsTrigger>
        </TabsList>

        {/* LLM Providers */}
        <TabsContent value="llm" className="space-y-6">
          <Card className="holographic-border bg-transparent">
            <CardHeader>
              <CardTitle className="text-lg font-light flex items-center">
                <Code className="w-5 h-5 mr-2 text-glow-cyan" />
                LLM Provider Configuration
              </CardTitle>
              <CardDescription>
                Configure AI language model providers and their settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm text-gray-400">Default Provider</label>
                <Select 
                  value={llmConfig.defaultProvider} 
                  onValueChange={(value) => setLlmConfig({ ...llmConfig, defaultProvider: value })}
                >
                  <SelectTrigger className="bg-transparent border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-white/20">
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="ollama">Ollama (Local)</SelectItem>
                    <SelectItem value="llmstudio">LM Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* OpenAI Configuration */}
              <div className="space-y-4 p-4 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-light">OpenAI</h4>
                    <p className="text-xs text-gray-400">GPT-4 and other OpenAI models</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Switch 
                      checked={llmConfig.providers.openai.enabled}
                      onCheckedChange={(checked) => setLlmConfig({
                        ...llmConfig,
                        providers: { ...llmConfig.providers, openai: { ...llmConfig.providers.openai, enabled: checked }}
                      })}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => testConnectionMutation.mutate('openai')}
                      disabled={testConnectionMutation.isPending}
                      className="text-glow-cyan hover:bg-glow-cyan/20"
                    >
                      Test
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Model</label>
                  <Select 
                    value={llmConfig.providers.openai.model}
                    onValueChange={(value) => setLlmConfig({
                      ...llmConfig,
                      providers: { ...llmConfig.providers, openai: { ...llmConfig.providers.openai, model: value }}
                    })}
                  >
                    <SelectTrigger className="bg-transparent border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-white/20">
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Gemini Configuration */}
              <div className="space-y-4 p-4 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-light">Google Gemini</h4>
                    <p className="text-xs text-gray-400">Gemini Pro and other Google AI models</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Switch 
                      checked={llmConfig.providers.gemini.enabled}
                      onCheckedChange={(checked) => setLlmConfig({
                        ...llmConfig,
                        providers: { ...llmConfig.providers, gemini: { ...llmConfig.providers.gemini, enabled: checked }}
                      })}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => testConnectionMutation.mutate('gemini')}
                      disabled={testConnectionMutation.isPending}
                      className="text-glow-purple hover:bg-glow-purple/20"
                    >
                      Test
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Model</label>
                  <Select 
                    value={llmConfig.providers.gemini.model}
                    onValueChange={(value) => setLlmConfig({
                      ...llmConfig,
                      providers: { ...llmConfig.providers, gemini: { ...llmConfig.providers.gemini, model: value }}
                    })}
                  >
                    <SelectTrigger className="bg-transparent border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border border-white/20">
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card className="holographic-border bg-transparent">
            <CardHeader>
              <CardTitle className="text-lg font-light flex items-center">
                <Settings className="w-5 h-5 mr-2 text-glow-purple" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Core system settings and performance parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-400">Max Concurrent Workflows</label>
                  <Input
                    type="number"
                    value={systemSettings.maxConcurrentWorkflows}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      maxConcurrentWorkflows: parseInt(e.target.value)
                    })}
                    className="bg-transparent border-white/20"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Session Timeout (seconds)</label>
                  <Input
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => setSystemSettings({
                      ...systemSettings,
                      sessionTimeout: parseInt(e.target.value)
                    })}
                    className="bg-transparent border-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Log Level</label>
                <Select 
                  value={systemSettings.logLevel}
                  onValueChange={(value) => setSystemSettings({ ...systemSettings, logLevel: value })}
                >
                  <SelectTrigger className="bg-transparent border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border border-white/20">
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-light">Auto Backup</h4>
                    <p className="text-xs text-gray-400">Automatically backup system data</p>
                  </div>
                  <Switch 
                    checked={systemSettings.autoBackup}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoBackup: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-light">Analytics</h4>
                    <p className="text-xs text-gray-400">Enable system analytics and monitoring</p>
                  </div>
                  <Switch 
                    checked={systemSettings.enableAnalytics}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, enableAnalytics: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card className="holographic-border bg-transparent">
            <CardHeader>
              <CardTitle className="text-lg font-light flex items-center">
                <Shield className="w-5 h-5 mr-2 text-glow-coral" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border border-glow-coral/30 rounded-lg bg-glow-coral/5">
                <h4 className="font-light mb-2">API Keys Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">OpenAI API Key</span>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      Configured
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gemini API Key</span>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      Configured
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-light">Access Control</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Require authentication</p>
                      <p className="text-xs text-gray-400">All API requests must include valid auth</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Rate limiting</p>
                      <p className="text-xs text-gray-400">Limit requests per minute per user</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="holographic-border bg-transparent">
            <CardHeader>
              <CardTitle className="text-lg font-light flex items-center">
                <Bell className="w-5 h-5 mr-2 text-glow-yellow" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure alerts and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-light">Workflow Notifications</h4>
                    <p className="text-xs text-gray-400">Get notified when workflows complete or fail</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-light">System Alerts</h4>
                    <p className="text-xs text-gray-400">Receive alerts for system issues and maintenance</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-light">Agent Activity</h4>
                    <p className="text-xs text-gray-400">Monitor AI agent deployment and activity</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card className="holographic-border bg-transparent">
            <CardHeader>
              <CardTitle className="text-lg font-light flex items-center">
                <Database className="w-5 h-5 mr-2 text-glow-teal" />
                System Maintenance
              </CardTitle>
              <CardDescription>
                Database management and system maintenance tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Health */}
              <div className="p-4 border border-white/10 rounded-lg">
                <h4 className="font-light mb-3">System Health</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uptime:</span>
                    <span>{systemHealth?.uptime ? Math.floor(systemHealth.uptime / 3600) : 0}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory:</span>
                    <span>{systemHealth?.memory ? Math.round(systemHealth.memory.used / 1024 / 1024) : 0}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {systemHealth?.status || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Services:</span>
                    <span>{systemHealth?.services ? Object.keys(systemHealth.services).length : 0} active</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => exportDataMutation.mutate()}
                  disabled={exportDataMutation.isPending}
                  className="holographic-border bg-glow-teal/20 hover:bg-glow-teal/30"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                
                <Button
                  onClick={() => restartServiceMutation.mutate('all')}
                  disabled={restartServiceMutation.isPending}
                  className="holographic-border bg-glow-yellow/20 hover:bg-glow-yellow/30"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart Services
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}