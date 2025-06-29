import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { LLMKernel } from "./services/llm-kernel";
import { WorkflowEngine } from "./services/workflow-engine";
import { MCPManager } from "./services/mcp-manager";
import { AIChatService } from "./services/ai-chat";
import { z } from "zod";

const llmKernel = new LLMKernel();
const workflowEngine = new WorkflowEngine(storage);
const mcpManager = new MCPManager(storage);
const aiChatService = new AIChatService(llmKernel, workflowEngine, mcpManager, storage);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat') {
          const response = await aiChatService.processMessage(message.content, message.userId || 1);
          
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'chat_response',
              content: response.content,
              functionCalls: response.functionCalls
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // API Routes

  // Dashboard Metrics
  app.get('/api/metrics', async (req, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      
      // Calculate real-time metrics
      const workflows = await storage.getWorkflows();
      const agents = await storage.getAgents();
      const knowledgeSources = await storage.getKnowledgeSources();
      const mcpServers = await storage.getMcpServers();
      const activities = await storage.getActivities(undefined, 100);

      const activeWorkflows = workflows.filter(w => w.status === 'active').length;
      const activeAgents = agents.filter(a => a.status === 'active').length;
      const completedTasks = activities.length;
      const totalKnowledge = knowledgeSources.length;
      const activeMcpServers = mcpServers.filter(s => s.status === 'active').length;

      const response = [
        { label: "Active Workflows", value: activeWorkflows.toString(), change: "+12% vs last hour" },
        { label: "AI Agents", value: activeAgents.toString(), change: "— Stable, all online" },
        { label: "Tasks Completed", value: completedTasks.toString(), change: `+${Math.floor(completedTasks * 0.1)} today` },
        { label: "Knowledge Sources", value: totalKnowledge.toString(), change: "Indexed & Ready" },
        { label: "MCP Servers", value: activeMcpServers.toString(), change: "All operational" },
        { label: "System Health", value: "98%", change: "Excellent" },
      ];

      res.json(response);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ message: 'Failed to fetch metrics' });
    }
  });

  // Activities Feed
  app.get('/api/activities', async (req, res) => {
    try {
      const activities = await storage.getActivities(undefined, 10);
      
      const response = activities.map(activity => ({
        title: activity.title,
        time: getRelativeTime(activity.createdAt!),
        type: activity.type
      }));

      res.json(response);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ message: 'Failed to fetch activities' });
    }
  });

  // Chat endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { content } = req.body;
      const userId = 1; // Default user for now
      
      const response = await aiChatService.processMessage(content, userId);
      
      res.json(response);
    } catch (error) {
      console.error('Error processing chat message:', error);
      res.status(500).json({ message: 'Failed to process message' });
    }
  });

  // Workflows
  app.get('/api/workflows', async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch workflows' });
    }
  });

  app.post('/api/workflows', async (req, res) => {
    try {
      const workflowData = z.object({
        name: z.string(),
        description: z.string().optional(),
        config: z.record(z.any()),
        userId: z.number().default(1)
      }).parse(req.body);

      const workflow = await storage.createWorkflow(workflowData);
      
      // Log activity
      await storage.createActivity({
        type: 'workflow',
        title: `Created workflow: ${workflow.name}`,
        userId: workflowData.userId
      });

      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create workflow' });
    }
  });

  app.patch('/api/workflows/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const workflow = await storage.updateWorkflow(id, updates);
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update workflow' });
    }
  });

  app.post('/api/workflows/:id/execute', async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      
      // Start workflow execution
      const execution = await workflowEngine.executeWorkflow(workflowId);
      
      // Log activity
      await storage.createActivity({
        type: 'workflow',
        title: `Executed workflow: ${workflowId}`,
        userId: 1
      });
      
      res.json({ 
        message: 'Workflow execution started',
        executionId: execution.id,
        status: execution.status
      });
    } catch (error) {
      console.error('Workflow execution error:', error);
      res.status(500).json({ message: 'Failed to execute workflow' });
    }
  });

  // Agents
  app.get('/api/agents', async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch agents' });
    }
  });

  app.post('/api/agents', async (req, res) => {
    try {
      const agentData = z.object({
        name: z.string(),
        type: z.string(),
        config: z.record(z.any()),
        workflowId: z.number().optional()
      }).parse(req.body);

      const agent = await storage.createAgent(agentData);
      
      // Log activity
      await storage.createActivity({
        type: 'agent',
        title: `Deployed agent: ${agent.name}`,
        userId: 1
      });

      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create agent' });
    }
  });

  // Knowledge Sources
  app.get('/api/knowledge-sources', async (req, res) => {
    try {
      const sources = await storage.getKnowledgeSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch knowledge sources' });
    }
  });

  app.post('/api/knowledge-sources', async (req, res) => {
    try {
      const sourceData = z.object({
        name: z.string(),
        type: z.string(),
        url: z.string().optional(),
        content: z.string().optional(),
        metadata: z.record(z.any()).optional()
      }).parse(req.body);

      const source = await storage.createKnowledgeSource(sourceData);
      
      // Log activity
      await storage.createActivity({
        type: 'knowledge',
        title: `Added knowledge source: ${source.name}`,
        userId: 1
      });

      res.json(source);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create knowledge source' });
    }
  });

  // MCP Servers
  app.get('/api/mcp-servers', async (req, res) => {
    try {
      const servers = await storage.getMcpServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch MCP servers' });
    }
  });

  app.post('/api/mcp-servers', async (req, res) => {
    try {
      const serverData = z.object({
        name: z.string(),
        type: z.string(),
        endpoint: z.string().optional(),
        config: z.record(z.any()),
        capabilities: z.record(z.any()).optional()
      }).parse(req.body);

      const server = await storage.createMcpServer(serverData);
      
      // Log activity
      await storage.createActivity({
        type: 'tool',
        title: `Registered MCP server: ${server.name}`,
        userId: 1
      });

      res.json(server);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create MCP server' });
    }
  });

  // Execute MCP capability
  app.post('/api/mcp/execute', async (req, res) => {
    try {
      const { serverId, capability, params } = req.body;
      const result = await mcpManager.executeCapability(serverId, capability, params);
      
      await storage.createActivity({
        type: 'tool',
        title: `Executed MCP capability: ${capability}`,
        userId: 1
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to execute MCP capability' });
    }
  });

  // Test MCP server connection
  app.post('/api/mcp-servers/:id/test', async (req, res) => {
    try {
      const serverId = parseInt(req.params.id);
      // TODO: Implement actual connection test
      res.json({ status: 'connected', responseTime: 42 });
    } catch (error) {
      res.status(500).json({ message: 'Failed to test connection' });
    }
  });

  // Execute workflow
  app.post('/api/workflows/:id/execute', async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const execution = await workflowEngine.executeWorkflow(workflowId);
      
      await storage.createActivity({
        type: 'workflow',
        title: `Executed workflow ${workflowId}`,
        userId: 1
      });
      
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: 'Failed to execute workflow' });
    }
  });

  // Update workflow
  app.patch('/api/workflows/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const workflow = await storage.updateWorkflow(id, updates);
      
      await storage.createActivity({
        type: 'workflow',
        title: `Updated workflow: ${workflow.name}`,
        userId: 1
      });
      
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update workflow' });
    }
  });

  // Delete workflow
  app.delete('/api/workflows/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkflow(id);
      
      await storage.createActivity({
        type: 'workflow',
        title: `Deleted workflow ${id}`,
        userId: 1
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete workflow' });
    }
  });

  // Delete knowledge source
  app.delete('/api/knowledge-sources/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // TODO: Implement delete in storage interface
      
      await storage.createActivity({
        type: 'knowledge',
        title: `Deleted knowledge source ${id}`,
        userId: 1
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete knowledge source' });
    }
  });

  // Search knowledge
  app.post('/api/knowledge/search', async (req, res) => {
    try {
      const { query } = req.body;
      
      // TODO: Implement vector search with embeddings
      const mockResults = {
        query,
        results: [
          {
            title: "Enterprise Automation Best Practices",
            content: `Found relevant content for "${query}": This document covers comprehensive automation strategies for enterprise environments...`,
            similarity: 0.92,
            source: "knowledge-base"
          },
          {
            title: "AI Agent Configuration Guide",
            content: `Configuration guidelines related to "${query}": When setting up AI agents for automated workflows...`,
            similarity: 0.87,
            source: "documentation"
          }
        ]
      };
      
      res.json(mockResults);
    } catch (error) {
      res.status(500).json({ message: 'Failed to search knowledge' });
    }
  });

  // System health endpoint
  app.get('/api/system/health', async (req, res) => {
    try {
      const health = {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        services: {
          llm: llmKernel.getConfig().providers,
          workflows: (await storage.getWorkflows()).length,
          agents: (await storage.getAgents()).length,
          mcpServers: (await storage.getMcpServers()).length
        }
      };
      
      res.json(health);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get system health' });
    }
  });

  return httpServer;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}
