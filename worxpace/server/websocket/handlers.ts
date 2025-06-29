import { WebSocket } from 'ws';
import { IStorage } from '../storage';
import { LLMKernel } from '../services/llm-kernel';
import { WorkflowEngine } from '../services/workflow-engine';
import { MCPManager } from '../services/mcp-manager';
import { AIChatService } from '../services/ai-chat';

interface WebSocketClient {
  id: string;
  ws: WebSocket;
  userId?: number;
  subscriptions: Set<string>;
}

export class WebSocketHandler {
  private clients = new Map<string, WebSocketClient>();
  private aiChatService: AIChatService;

  constructor(
    private storage: IStorage,
    private llmKernel: LLMKernel,
    private workflowEngine: WorkflowEngine,
    private mcpManager: MCPManager
  ) {
    this.aiChatService = new AIChatService(
      llmKernel,
      workflowEngine,
      mcpManager,
      storage
    );
  }

  handleConnection(ws: WebSocket): void {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const client: WebSocketClient = {
      id: clientId,
      ws,
      subscriptions: new Set()
    };

    this.clients.set(clientId, client);

    console.log(`WebSocket client connected: ${clientId}`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'welcome',
      clientId,
      timestamp: new Date().toISOString(),
      systemStatus: 'online'
    });

    // Set up message handlers
    ws.on('message', (data) => this.handleMessage(clientId, data));
    ws.on('close', () => this.handleDisconnect(clientId));
    ws.on('error', (error) => this.handleError(clientId, error));

    // Start sending periodic updates
    this.startPeriodicUpdates(clientId);
  }

  private async handleMessage(clientId: string, data: Buffer): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'chat':
          await this.handleChatMessage(clientId, message);
          break;
          
        case 'subscribe':
          await this.handleSubscription(clientId, message);
          break;
          
        case 'unsubscribe':
          await this.handleUnsubscription(clientId, message);
          break;
          
        case 'system_command':
          await this.handleSystemCommand(clientId, message);
          break;
          
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error handling message from ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Failed to process message',
        error: error.toString()
      });
    }
  }

  private async handleChatMessage(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    const userId = message.userId || 1; // Default user for demo
    client.userId = userId;

    try {
      // Send typing indicator
      this.sendToClient(clientId, {
        type: 'chat_typing',
        isTyping: true
      });

      // Process the chat message
      const response = await this.aiChatService.processMessage(message.content, userId);

      // Send the response
      this.sendToClient(clientId, {
        type: 'chat_response',
        content: response.content,
        functionCalls: response.functionCalls,
        timestamp: new Date().toISOString()
      });

      // Stop typing indicator
      this.sendToClient(clientId, {
        type: 'chat_typing',
        isTyping: false
      });

      // Broadcast system updates if functions were executed
      if (response.functionCalls.length > 0) {
        await this.broadcastSystemUpdate();
      }

    } catch (error) {
      console.error(`Chat processing error for ${clientId}:`, error);
      
      this.sendToClient(clientId, {
        type: 'chat_response',
        content: 'I encountered an error processing your request. Please try again.',
        functionCalls: [],
        timestamp: new Date().toISOString(),
        error: true
      });
    }
  }

  private async handleSubscription(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    const channels = Array.isArray(message.channels) ? message.channels : [message.channel];
    
    for (const channel of channels) {
      client.subscriptions.add(channel);
    }

    this.sendToClient(clientId, {
      type: 'subscription_confirmed',
      channels,
      timestamp: new Date().toISOString()
    });

    // Send initial data for subscribed channels
    for (const channel of channels) {
      await this.sendChannelData(clientId, channel);
    }
  }

  private async handleUnsubscription(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    const channels = Array.isArray(message.channels) ? message.channels : [message.channel];
    
    for (const channel of channels) {
      client.subscriptions.delete(channel);
    }

    this.sendToClient(clientId, {
      type: 'unsubscription_confirmed',
      channels,
      timestamp: new Date().toISOString()
    });
  }

  private async handleSystemCommand(clientId: string, message: any): Promise<void> {
    try {
      switch (message.command) {
        case 'get_metrics':
          await this.sendMetricsUpdate(clientId);
          break;
          
        case 'get_activities':
          await this.sendActivitiesUpdate(clientId);
          break;
          
        case 'get_workflow_status':
          await this.sendWorkflowStatus(clientId);
          break;
          
        case 'get_mcp_status':
          await this.sendMCPStatus(clientId);
          break;
          
        default:
          this.sendToClient(clientId, {
            type: 'error',
            message: `Unknown system command: ${message.command}`
          });
      }
    } catch (error) {
      console.error(`System command error for ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Failed to execute system command',
        error: error.toString()
      });
    }
  }

  private handleDisconnect(clientId: string): void {
    console.log(`WebSocket client disconnected: ${clientId}`);
    this.clients.delete(clientId);
  }

  private handleError(clientId: string, error: Error): void {
    console.error(`WebSocket error for ${clientId}:`, error);
  }

  private sendToClient(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error(`Failed to send message to ${clientId}:`, error);
      }
    }
  }

  private broadcast(data: any, excludeClientId?: string): void {
    for (const [clientId, client] of this.clients) {
      if (excludeClientId && clientId === excludeClientId) continue;
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(data));
        } catch (error) {
          console.error(`Failed to broadcast to ${clientId}:`, error);
        }
      }
    }
  }

  private broadcastToSubscribers(channel: string, data: any): void {
    for (const [clientId, client] of this.clients) {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify({
            ...data,
            channel
          }));
        } catch (error) {
          console.error(`Failed to broadcast to subscriber ${clientId}:`, error);
        }
      }
    }
  }

  private async sendChannelData(clientId: string, channel: string): Promise<void> {
    try {
      switch (channel) {
        case 'metrics':
          await this.sendMetricsUpdate(clientId);
          break;
          
        case 'activities':
          await this.sendActivitiesUpdate(clientId);
          break;
          
        case 'workflows':
          await this.sendWorkflowStatus(clientId);
          break;
          
        case 'mcp_servers':
          await this.sendMCPStatus(clientId);
          break;
      }
    } catch (error) {
      console.error(`Failed to send channel data for ${channel}:`, error);
    }
  }

  private async sendMetricsUpdate(clientId: string): Promise<void> {
    const workflows = await this.storage.getWorkflows();
    const agents = await this.storage.getAgents();
    const knowledgeSources = await this.storage.getKnowledgeSources();
    const mcpServers = this.mcpManager.getServerStatus();
    const activities = await this.storage.getActivities(undefined, 100);

    const metrics = {
      activeWorkflows: workflows.filter(w => w.status === 'active').length,
      totalWorkflows: workflows.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      totalAgents: agents.length,
      knowledgeSources: knowledgeSources.length,
      activeMcpServers: mcpServers.filter(s => s.status === 'active').length,
      totalMcpServers: mcpServers.length,
      recentActivities: activities.length,
      systemHealth: 98,
      timestamp: new Date().toISOString()
    };

    this.sendToClient(clientId, {
      type: 'metrics_update',
      metrics
    });
  }

  private async sendActivitiesUpdate(clientId: string): Promise<void> {
    const activities = await this.storage.getActivities(undefined, 20);
    
    this.sendToClient(clientId, {
      type: 'activities_update',
      activities: activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        type: activity.type,
        description: activity.description,
        timestamp: activity.createdAt
      }))
    });
  }

  private async sendWorkflowStatus(clientId: string): Promise<void> {
    const workflows = await this.storage.getWorkflows();
    const executions = this.workflowEngine.getActiveExecutions();
    
    this.sendToClient(clientId, {
      type: 'workflow_status',
      workflows: workflows.map(w => ({
        id: w.id,
        name: w.name,
        status: w.status,
        lastUpdated: w.updatedAt
      })),
      activeExecutions: executions.length
    });
  }

  private async sendMCPStatus(clientId: string): Promise<void> {
    const servers = this.mcpManager.getServerStatus();
    
    this.sendToClient(clientId, {
      type: 'mcp_status',
      servers: servers.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        status: s.status,
        responseTime: s.responseTime,
        lastPing: s.lastPing
      }))
    });
  }

  private startPeriodicUpdates(clientId: string): void {
    const interval = setInterval(async () => {
      const client = this.clients.get(clientId);
      if (!client || client.ws.readyState !== WebSocket.OPEN) {
        clearInterval(interval);
        return;
      }

      // Send periodic updates for subscribed channels
      if (client.subscriptions.has('metrics')) {
        await this.sendMetricsUpdate(clientId);
      }
      
      if (client.subscriptions.has('activities')) {
        await this.sendActivitiesUpdate(clientId);
      }
    }, 30000); // Update every 30 seconds
  }

  private async broadcastSystemUpdate(): Promise<void> {
    // Broadcast to all clients subscribed to relevant channels
    this.broadcastToSubscribers('metrics', {
      type: 'metrics_updated',
      timestamp: new Date().toISOString()
    });
    
    this.broadcastToSubscribers('activities', {
      type: 'activities_updated',
      timestamp: new Date().toISOString()
    });
    
    this.broadcastToSubscribers('workflows', {
      type: 'workflows_updated',
      timestamp: new Date().toISOString()
    });
  }

  // Public methods for external systems to trigger updates
  async notifyWorkflowUpdate(workflowId: number): Promise<void> {
    this.broadcastToSubscribers('workflows', {
      type: 'workflow_updated',
      workflowId,
      timestamp: new Date().toISOString()
    });
  }

  async notifyAgentUpdate(agentId: number): Promise<void> {
    this.broadcastToSubscribers('agents', {
      type: 'agent_updated',
      agentId,
      timestamp: new Date().toISOString()
    });
  }

  async notifyMCPUpdate(serverId: number): Promise<void> {
    this.broadcastToSubscribers('mcp_servers', {
      type: 'mcp_server_updated',
      serverId,
      timestamp: new Date().toISOString()
    });
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  getClientSubscriptions(): Map<string, Set<string>> {
    const subscriptions = new Map<string, Set<string>>();
    for (const [clientId, client] of this.clients) {
      subscriptions.set(clientId, new Set(client.subscriptions));
    }
    return subscriptions;
  }
}
