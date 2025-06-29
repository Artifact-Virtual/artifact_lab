import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { LLMKernel } from "./services/llm-kernel";
import { WorkflowEngine } from "./services/workflow-engine";
import { MCPManager } from "./services/mcp-manager";
import { AIChatService } from "./services/ai-chat";
import { WindmillIntegration } from "./services/windmill-integration";
import { PythonAgentManager } from "./services/python-agent-manager";
import { WebSocketHandler } from "./websocket/handlers";
import { insertWorkflowSchema, insertAgentSchema, insertKnowledgeSourceSchema, insertMcpServerSchema } from "@shared/schema";
import { z } from "zod";

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} h ago`;
  return `${days} d ago`;
}

export async function registerEnhancedRoutes(app: Express): Promise<Server> {
  // Initialize services
  const llmKernel = new LLMKernel();
  const workflowEngine = new WorkflowEngine(storage);
  const mcpManager = new MCPManager(storage);
  const windmillIntegration = new WindmillIntegration(storage);
  const pythonAgentManager = new PythonAgentManager(storage);
  const aiChatService = new AIChatService(llmKernel, workflowEngine, mcpManager, storage);

  // Initialize services
  await windmillIntegration.initialize();

  // ===================
  // WORKFLOW ROUTES
  // ===================
  
  app.get("/api/workflows", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const workflows = await storage.getWorkflows(userId);
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const data = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(data);
      res.status(201).json(workflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid workflow data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workflow" });
    }
  });

  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertWorkflowSchema.partial().parse(req.body);
      const workflow = await storage.updateWorkflow(id, data);
      res.json(workflow);
    } catch (error) {
      console.error("Error updating workflow:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid workflow data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkflow(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });

  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const workflowId = parseInt(req.params.id);
      const execution = await workflowEngine.executeWorkflow(workflowId);
      
      // Log activity
      await storage.createActivity({
        title: `Executed workflow: ${workflowId}`,
        description: `Workflow execution started with ID: ${execution.id}`,
        type: "workflow_execution",
        userId: 1, // Default user for now
      });

      res.json({ 
        message: "Workflow execution started", 
        executionId: execution.id,
        status: execution.status 
      });
    } catch (error) {
      console.error("Error executing workflow:", error);
      res.status(500).json({ message: "Failed to execute workflow" });
    }
  });

  // ===================
  // AGENT ROUTES
  // ===================

  app.get("/api/agents", async (req, res) => {
    try {
      const workflowId = req.query.workflowId ? parseInt(req.query.workflowId as string) : undefined;
      const agents = await storage.getAgents(workflowId);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const data = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(data);
      res.status(201).json(agent);
    } catch (error) {
      console.error("Error creating agent:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid agent data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.put("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertAgentSchema.partial().parse(req.body);
      const agent = await storage.updateAgent(id, data);
      res.json(agent);
    } catch (error) {
      console.error("Error updating agent:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid agent data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  app.delete("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAgent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting agent:", error);
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });

  // ===================
  // KNOWLEDGE ROUTES
  // ===================

  app.get("/api/knowledge", async (req, res) => {
    try {
      const sources = await storage.getKnowledgeSources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching knowledge sources:", error);
      res.status(500).json({ message: "Failed to fetch knowledge sources" });
    }
  });

  app.post("/api/knowledge", async (req, res) => {
    try {
      const data = insertKnowledgeSourceSchema.parse(req.body);
      const source = await storage.createKnowledgeSource(data);
      res.status(201).json(source);
    } catch (error) {
      console.error("Error creating knowledge source:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid knowledge source data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create knowledge source" });
    }
  });

  app.put("/api/knowledge/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertKnowledgeSourceSchema.partial().parse(req.body);
      const source = await storage.updateKnowledgeSource(id, data);
      res.json(source);
    } catch (error) {
      console.error("Error updating knowledge source:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid knowledge source data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update knowledge source" });
    }
  });

  app.post("/api/knowledge/search", async (req, res) => {
    try {
      const { query, filters } = req.body;
      
      // Simulate knowledge search
      const sources = await storage.getKnowledgeSources();
      const results = sources.filter(source => 
        source.name.toLowerCase().includes(query.toLowerCase()) ||
        (source.content && source.content.toLowerCase().includes(query.toLowerCase()))
      );

      res.json({
        query,
        results: results.map(source => ({
          id: source.id,
          title: source.name,
          content: source.content?.substring(0, 200) + "...",
          type: source.type,
          relevance: Math.random() * 0.5 + 0.5, // Simulated relevance score
          metadata: source.metadata
        }))
      });
    } catch (error) {
      console.error("Error searching knowledge:", error);
      res.status(500).json({ message: "Failed to search knowledge" });
    }
  });

  // ===================
  // MCP ROUTES
  // ===================

  app.get("/api/mcp/servers", async (req, res) => {
    try {
      const servers = await storage.getMcpServers();
      const serverStatus = mcpManager.getServerStatus();
      
      // Merge database data with runtime status
      const enrichedServers = servers.map(server => {
        const status = serverStatus.find(s => s.id === server.id);
        return {
          ...server,
          lastPing: status?.lastPing,
          responseTime: status?.responseTime
        };
      });

      res.json(enrichedServers);
    } catch (error) {
      console.error("Error fetching MCP servers:", error);
      res.status(500).json({ message: "Failed to fetch MCP servers" });
    }
  });

  app.post("/api/mcp/servers", async (req, res) => {
    try {
      const data = insertMcpServerSchema.parse(req.body);
      const server = await storage.createMcpServer(data);
      
      // Install server in MCP manager
      await mcpManager.installMCPServer({
        name: server.name,
        type: server.type,
        endpoint: server.endpoint || '',
        config: server.config as any
      });

      res.status(201).json(server);
    } catch (error) {
      console.error("Error creating MCP server:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid MCP server data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create MCP server" });
    }
  });

  app.get("/api/mcp/capabilities", async (req, res) => {
    try {
      const capabilities = mcpManager.getAvailableCapabilities();
      res.json(capabilities);
    } catch (error) {
      console.error("Error fetching MCP capabilities:", error);
      res.status(500).json({ message: "Failed to fetch MCP capabilities" });
    }
  });

  app.post("/api/mcp/execute", async (req, res) => {
    try {
      const { serverId, capabilityName, parameters } = req.body;
      const result = await mcpManager.executeCapability(serverId, capabilityName, parameters);
      res.json(result);
    } catch (error) {
      console.error("Error executing MCP capability:", error);
      res.status(500).json({ message: "Failed to execute MCP capability" });
    }
  });

  // ===================
  // ANALYTICS ROUTES
  // ===================

  app.get("/api/metrics", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      const agents = await storage.getAgents();
      const activities = await storage.getActivities(undefined, 100);
      const mcpServers = await storage.getMcpServers();
      
      const activeWorkflows = workflows.filter(w => w.status === 'active').length;
      const totalExecutions = workflows.reduce((sum, w) => sum + (w.executionCount || 0), 0);
      const avgResponseTime = mcpManager.getServerStatus()
        .reduce((sum, s) => sum + (s.responseTime || 0), 0) / mcpServers.length || 0;

      const metrics = [
        {
          label: "Active Workflows",
          value: activeWorkflows.toString(),
          change: "+12%",
          trend: "up" as const
        },
        {
          label: "Total Executions",
          value: totalExecutions.toString(),
          change: "+8%", 
          trend: "up" as const
        },
        {
          label: "Avg Response Time",
          value: `${Math.round(avgResponseTime)}ms`,
          change: "-5%",
          trend: "down" as const
        },
        {
          label: "Active Agents",
          value: agents.filter(a => a.status === 'active').length.toString(),
          change: "+15%",
          trend: "up" as const
        }
      ];

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.get("/api/analytics/performance", async (req, res) => {
    try {
      const timeRange = req.query.range || '7d';
      
      // Generate sample performance data
      const data = Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
        executions: Math.floor(Math.random() * 50) + 10,
        responseTime: Math.floor(Math.random() * 200) + 50,
        successRate: Math.random() * 0.2 + 0.8
      }));

      res.json({ timeRange, data });
    } catch (error) {
      console.error("Error fetching performance analytics:", error);
      res.status(500).json({ message: "Failed to fetch performance analytics" });
    }
  });

  // ===================
  // ACTIVITY ROUTES
  // ===================

  app.get("/api/activities", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await storage.getActivities(userId, limit);
      
      const formattedActivities = activities.map(activity => ({
        ...activity,
        time: getRelativeTime(activity.createdAt || new Date())
      }));

      res.json(formattedActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // ===================
  // CHAT ROUTES
  // ===================

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, userId = 1 } = req.body;
      const response = await aiChatService.processMessage(message, userId);
      res.json(response);
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // ===================
  // SYSTEM ROUTES
  // ===================

  app.get("/api/system/status", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      const agents = await storage.getAgents();
      const mcpServers = mcpManager.getServerStatus();
      
      const status = {
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage().heapUsed / 1024 / 1024,
          total: process.memoryUsage().heapTotal / 1024 / 1024
        },
        services: {
          workflows: workflows.length,
          agents: agents.length,
          mcpServers: mcpServers.length,
          activeConnections: 0 // Will be updated by WebSocket handler
        },
        health: "healthy"
      };

      res.json(status);
    } catch (error) {
      console.error("Error fetching system status:", error);
      res.status(500).json({ message: "Failed to fetch system status" });
    }
  });

  app.get("/api/system/config", async (req, res) => {
    try {
      const config = llmKernel.getConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ message: "Failed to fetch system config" });
    }
  });

  app.put("/api/system/config", async (req, res) => {
    try {
      const config = req.body;
      llmKernel.updateConfig(config);
      res.json({ message: "Configuration updated successfully" });
    } catch (error) {
      console.error("Error updating system config:", error);
      res.status(500).json({ message: "Failed to update system config" });
    }
  });

  // ===================
  // SCHEDULING ROUTES
  // ===================

  app.get("/api/scheduling/tasks", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      const scheduledWorkflows = workflows.filter(w => w.schedule);
      
      const tasks = scheduledWorkflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        schedule: workflow.schedule,
        status: workflow.status,
        nextRun: workflow.nextExecution,
        lastRun: workflow.lastExecution
      }));

      res.json(tasks);
    } catch (error) {
      console.error("Error fetching scheduled tasks:", error);
      res.status(500).json({ message: "Failed to fetch scheduled tasks" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // ===================
  // WINDMILL INTEGRATION ROUTES
  // ===================
  
  app.get("/api/windmill/scripts", async (req, res) => {
    try {
      const scripts = windmillIntegration.getAvailableScripts();
      res.json(scripts);
    } catch (error) {
      console.error("Error fetching Windmill scripts:", error);
      res.status(500).json({ message: "Failed to fetch Windmill scripts" });
    }
  });

  app.post("/api/windmill/scripts/:scriptId/execute", async (req, res) => {
    try {
      const { scriptId } = req.params;
      const parameters = req.body;
      const job = await windmillIntegration.executeScript(scriptId, parameters);
      res.json(job);
    } catch (error) {
      console.error("Error executing Windmill script:", error);
      res.status(500).json({ message: "Failed to execute script" });
    }
  });

  app.get("/api/windmill/jobs/:jobId", async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = windmillIntegration.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching Windmill job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.get("/api/windmill/status", async (req, res) => {
    try {
      const status = windmillIntegration.getConnectionStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching Windmill status:", error);
      res.status(500).json({ message: "Failed to fetch Windmill status" });
    }
  });

  // ===================
  // PYTHON AGENT ROUTES
  // ===================
  
  app.get("/api/python-agents", async (req, res) => {
    try {
      const agents = pythonAgentManager.getAvailableAgents();
      res.json(agents);
    } catch (error) {
      console.error("Error fetching Python agents:", error);
      res.status(500).json({ message: "Failed to fetch Python agents" });
    }
  });

  app.post("/api/python-agents", async (req, res) => {
    try {
      const agentData = req.body;
      const agent = await pythonAgentManager.createPythonAgent(agentData);
      res.json(agent);
    } catch (error) {
      console.error("Error creating Python agent:", error);
      res.status(500).json({ message: "Failed to create Python agent" });
    }
  });

  app.post("/api/python-agents/:agentId/deploy", async (req, res) => {
    try {
      const { agentId } = req.params;
      await pythonAgentManager.deployAgent(agentId);
      res.json({ message: "Agent deployment initiated" });
    } catch (error) {
      console.error("Error deploying Python agent:", error);
      res.status(500).json({ message: "Failed to deploy Python agent" });
    }
  });

  app.post("/api/python-agents/:agentId/execute", async (req, res) => {
    try {
      const { agentId } = req.params;
      const inputs = req.body;
      const execution = await pythonAgentManager.executeAgent(agentId, inputs);
      res.json(execution);
    } catch (error) {
      console.error("Error executing Python agent:", error);
      res.status(500).json({ message: "Failed to execute Python agent" });
    }
  });

  app.get("/api/python-agents/templates", async (req, res) => {
    try {
      const templates = pythonAgentManager.getAgentTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching Python agent templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/python-agents/status", async (req, res) => {
    try {
      const status = pythonAgentManager.getSystemStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching Python agent status:", error);
      res.status(500).json({ message: "Failed to fetch Python agent status" });
    }
  });

  app.get("/api/python-agents/:agentId/executions", async (req, res) => {
    try {
      const { agentId } = req.params;
      const executions = pythonAgentManager.getAgentExecutions(agentId);
      res.json(executions);
    } catch (error) {
      console.error("Error fetching agent executions:", error);
      res.status(500).json({ message: "Failed to fetch executions" });
    }
  });

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const wsHandler = new WebSocketHandler(storage, llmKernel, workflowEngine, mcpManager);

  wss.on('connection', (ws) => {
    wsHandler.handleConnection(ws);
  });

  return httpServer;
}