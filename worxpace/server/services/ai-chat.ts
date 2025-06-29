import { LLMKernel } from "./llm-kernel";
import { WorkflowEngine } from "./workflow-engine";
import { MCPManager } from "./mcp-manager";
import { IStorage } from "../storage";

interface FunctionCall {
  name: string;
  description: string;
  status: 'running' | 'completed' | 'error';
  result?: any;
}

interface ChatResponse {
  content: string;
  functionCalls: FunctionCall[];
}

export class AIChatService {
  private availableFunctions: Map<string, Function>;

  constructor(
    private llmKernel: LLMKernel,
    private workflowEngine: WorkflowEngine,
    private mcpManager: MCPManager,
    private storage: IStorage
  ) {
    this.initializeFunctions();
  }

  private initializeFunctions() {
    this.availableFunctions = new Map([
      ['deploy_agent', this.deployAgent.bind(this)],
      ['create_workflow', this.createWorkflow.bind(this)],
      ['schedule_task', this.scheduleTask.bind(this)],
      ['add_knowledge_source', this.addKnowledgeSource.bind(this)],
      ['install_mcp_server', this.installMCPServer.bind(this)],
      ['execute_mcp_capability', this.executeMCPCapability.bind(this)],
      ['get_system_status', this.getSystemStatus.bind(this)],
      ['search_knowledge', this.searchKnowledge.bind(this)],
      ['analyze_trends', this.analyzeTrends.bind(this)],
      ['generate_report', this.generateReport.bind(this)]
    ]);
  }

  async processMessage(content: string, userId: number): Promise<ChatResponse> {
    const functionCalls: FunctionCall[] = [];

    try {
      // Prepare function definitions for the LLM
      const functions = [
        {
          name: "deploy_agent",
          description: "Deploy a new AI agent with specified configuration",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Name of the agent" },
              type: { type: "string", description: "Type of agent (social-media, analytics, content-generation, etc.)" },
              config: { type: "object", description: "Agent configuration parameters" },
              workflowId: { type: "number", description: "Optional workflow ID to associate with" }
            },
            required: ["name", "type"]
          }
        },
        {
          name: "create_workflow",
          description: "Create a new workflow from template or custom configuration",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Workflow name" },
              template: { type: "string", description: "Template type (social-media, knowledge-update, custom)" },
              schedule: { type: "string", description: "Cron schedule expression" },
              config: { type: "object", description: "Custom workflow configuration" }
            },
            required: ["name"]
          }
        },
        {
          name: "schedule_task",
          description: "Schedule a recurring task or one-time execution",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Task name" },
              schedule: { type: "string", description: "Cron expression or datetime" },
              action: { type: "string", description: "Action to perform" },
              parameters: { type: "object", description: "Task parameters" }
            },
            required: ["name", "schedule", "action"]
          }
        },
        {
          name: "add_knowledge_source",
          description: "Add new knowledge sources to the RAG system",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Source name" },
              type: { type: "string", description: "Source type (web, file, api, database)" },
              url: { type: "string", description: "Source URL or path" },
              config: { type: "object", description: "Source-specific configuration" }
            },
            required: ["name", "type"]
          }
        },
        {
          name: "install_mcp_server",
          description: "Install and configure a new MCP server",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string", description: "Server name" },
              type: { type: "string", description: "Server type" },
              source: { type: "string", description: "Installation source (npm, git, docker)" },
              config: { type: "object", description: "Server configuration" }
            },
            required: ["name", "type", "source"]
          }
        },
        {
          name: "execute_mcp_capability",
          description: "Execute a specific capability on an MCP server",
          parameters: {
            type: "object",
            properties: {
              serverName: { type: "string", description: "MCP server name" },
              capability: { type: "string", description: "Capability name" },
              parameters: { type: "object", description: "Capability parameters" }
            },
            required: ["serverName", "capability"]
          }
        },
        {
          name: "get_system_status",
          description: "Get comprehensive system status and metrics",
          parameters: {
            type: "object",
            properties: {
              detailed: { type: "boolean", description: "Include detailed metrics" }
            }
          }
        }
      ];

      // Get conversation context
      const messages = [
        {
          role: "system",
          content: `You are ARTIFACT AI, an advanced AI assistant for the ARTIFACT VIRTUAL enterprise automation platform. You can:

1. Deploy and manage AI agents for various tasks
2. Create and schedule workflows using templates or custom configurations
3. Manage knowledge sources for the RAG system
4. Install and configure MCP servers for extended capabilities
5. Execute capabilities through the MCP ecosystem
6. Monitor system health and generate reports

You have access to function calling capabilities. When users request actions, use the appropriate functions and provide clear feedback about what you're doing. Always be helpful, professional, and explain technical concepts clearly.

Current system capabilities:
- Agentic RAG with 156+ knowledge sources
- 7 active AI agents
- 43 operational MCP servers
- 24 active workflows
- Real-time monitoring and analytics

Be proactive in suggesting improvements and automation opportunities.`
        },
        {
          role: "user",
          content
        }
      ];

      // Call LLM with function definitions
      const response = await this.llmKernel.generateResponse(messages, {
        functions,
        temperature: 0.7,
        maxTokens: 1024
      });

      let responseContent = response.content;

      // Execute any function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const call of response.functionCalls) {
          const functionCall: FunctionCall = {
            name: call.name,
            description: `Executing ${call.name}`,
            status: 'running'
          };
          functionCalls.push(functionCall);

          try {
            const func = this.availableFunctions.get(call.name);
            if (func) {
              const args = typeof call.arguments === 'string' ? 
                JSON.parse(call.arguments) : call.arguments;
              
              const result = await func(args, userId);
              functionCall.status = 'completed';
              functionCall.result = result;
              functionCall.description = `✓ ${call.name} completed successfully`;
            } else {
              throw new Error(`Function ${call.name} not found`);
            }
          } catch (error) {
            functionCall.status = 'error';
            functionCall.description = `✗ ${call.name} failed: ${error}`;
            console.error(`Function ${call.name} failed:`, error);
          }
        }

        // Update response content based on function results
        if (functionCalls.length > 0) {
          const successfulCalls = functionCalls.filter(fc => fc.status === 'completed');
          const failedCalls = functionCalls.filter(fc => fc.status === 'error');

          if (successfulCalls.length > 0 && failedCalls.length === 0) {
            responseContent += `\n\nAll requested actions completed successfully! ${successfulCalls.map(fc => fc.description).join(', ')}`;
          } else if (failedCalls.length > 0) {
            responseContent += `\n\nSome actions encountered issues: ${failedCalls.map(fc => fc.description).join(', ')}`;
          }
        }
      }

      return {
        content: responseContent,
        functionCalls
      };

    } catch (error) {
      console.error('AI Chat processing error:', error);
      return {
        content: `I encountered an error processing your request: ${error}. Please try again or rephrase your request.`,
        functionCalls: []
      };
    }
  }

  private async deployAgent(params: any, userId: number): Promise<any> {
    const agentConfig = {
      name: params.name,
      type: params.type,
      config: params.config || {},
      workflowId: params.workflowId || null
    };

    const agent = await this.storage.createAgent(agentConfig);

    await this.storage.createActivity({
      type: 'agent',
      title: `AI deployed agent: ${agent.name}`,
      description: `Type: ${agent.type}`,
      userId
    });

    return { agent, message: `Agent "${agent.name}" deployed successfully` };
  }

  private async createWorkflow(params: any, userId: number): Promise<any> {
    let workflow;

    if (params.template && params.template !== 'custom') {
      workflow = await this.workflowEngine.createWorkflowFromTemplate(
        params.name,
        params.template,
        userId
      );
    } else {
      workflow = await this.storage.createWorkflow({
        name: params.name,
        description: params.description || '',
        config: params.config || {},
        userId
      });
    }

    if (params.schedule) {
      await this.storage.updateWorkflow(workflow.id, { 
        config: { ...workflow.config, schedule: params.schedule },
        status: 'active'
      });
      this.workflowEngine.scheduleWorkflow(workflow);
    }

    await this.storage.createActivity({
      type: 'workflow',
      title: `AI created workflow: ${workflow.name}`,
      description: params.template ? `From template: ${params.template}` : 'Custom workflow',
      userId
    });

    return { workflow, message: `Workflow "${workflow.name}" created successfully` };
  }

  private async scheduleTask(params: any, userId: number): Promise<any> {
    // Create a simple workflow for the scheduled task
    const workflow = await this.storage.createWorkflow({
      name: params.name,
      description: `Scheduled task: ${params.action}`,
      config: {
        schedule: params.schedule,
        action: params.action,
        parameters: params.parameters || {}
      },
      status: 'active',
      userId
    });

    this.workflowEngine.scheduleWorkflow(workflow);

    await this.storage.createActivity({
      type: 'workflow',
      title: `AI scheduled task: ${params.name}`,
      description: `Schedule: ${params.schedule}`,
      userId
    });

    return { workflow, message: `Task "${params.name}" scheduled successfully` };
  }

  private async addKnowledgeSource(params: any, userId: number): Promise<any> {
    const source = await this.storage.createKnowledgeSource({
      name: params.name,
      type: params.type,
      url: params.url,
      content: params.content,
      metadata: params.config || {}
    });

    await this.storage.createActivity({
      type: 'knowledge',
      title: `AI added knowledge source: ${source.name}`,
      description: `Type: ${source.type}`,
      userId
    });

    return { source, message: `Knowledge source "${source.name}" added successfully` };
  }

  private async installMCPServer(params: any, userId: number): Promise<any> {
    const server = await this.mcpManager.installMCPServer({
      name: params.name,
      type: params.type,
      source: params.source,
      config: params.config || {}
    });

    await this.storage.createActivity({
      type: 'tool',
      title: `AI installed MCP server: ${server.name}`,
      description: `Source: ${params.source}`,
      userId
    });

    return { server, message: `MCP server "${server.name}" installation initiated` };
  }

  private async executeMCPCapability(params: any, userId: number): Promise<any> {
    const servers = await this.storage.getMcpServers();
    const server = servers.find(s => s.name === params.serverName);

    if (!server) {
      throw new Error(`MCP server "${params.serverName}" not found`);
    }

    const result = await this.mcpManager.executeCapability(
      server.id,
      params.capability,
      params.parameters || {}
    );

    await this.storage.createActivity({
      type: 'tool',
      title: `AI executed ${params.capability} on ${params.serverName}`,
      description: `Result: ${result.success ? 'Success' : 'Failed'}`,
      userId
    });

    return { result, message: `Capability "${params.capability}" executed on ${params.serverName}` };
  }

  private async getSystemStatus(params: any, userId: number): Promise<any> {
    const workflows = await this.storage.getWorkflows();
    const agents = await this.storage.getAgents();
    const knowledgeSources = await this.storage.getKnowledgeSources();
    const mcpServers = this.mcpManager.getServerStatus();
    const activities = await this.storage.getActivities(undefined, 10);

    const status = {
      workflows: {
        total: workflows.length,
        active: workflows.filter(w => w.status === 'active').length,
        inactive: workflows.filter(w => w.status === 'inactive').length
      },
      agents: {
        total: agents.length,
        active: agents.filter(a => a.status === 'active').length,
        inactive: agents.filter(a => a.status === 'inactive').length
      },
      knowledge: {
        total: knowledgeSources.length,
        indexed: knowledgeSources.filter(k => k.status === 'indexed').length,
        pending: knowledgeSources.filter(k => k.status === 'pending').length
      },
      mcpServers: {
        total: mcpServers.length,
        active: mcpServers.filter(s => s.status === 'active').length,
        inactive: mcpServers.filter(s => s.status === 'inactive').length
      },
      recentActivities: activities.length
    };

    return { 
      status, 
      message: `System status retrieved - ${status.workflows.active} workflows, ${status.agents.active} agents, ${status.mcpServers.active} MCP servers active` 
    };
  }

  private async searchKnowledge(params: any, userId: number): Promise<any> {
    // Simulate knowledge search
    const sources = await this.storage.getKnowledgeSources();
    const relevantSources = sources.filter(source => 
      source.name.toLowerCase().includes(params.query?.toLowerCase() || '') ||
      source.content?.toLowerCase().includes(params.query?.toLowerCase() || '')
    );

    return { 
      sources: relevantSources, 
      message: `Found ${relevantSources.length} relevant knowledge sources` 
    };
  }

  private async analyzeTrends(params: any, userId: number): Promise<any> {
    const activities = await this.storage.getActivities(undefined, 100);
    const workflows = await this.storage.getWorkflows();

    // Simple trend analysis
    const trends = {
      activityTrend: activities.length > 50 ? 'increasing' : 'stable',
      workflowGrowth: workflows.length > 20 ? 'high' : 'moderate',
      systemHealth: 'excellent'
    };

    await this.storage.createActivity({
      type: 'analytics',
      title: 'AI performed trend analysis',
      description: `Activity trend: ${trends.activityTrend}`,
      userId
    });

    return { 
      trends, 
      message: `Trend analysis complete - System activity is ${trends.activityTrend}` 
    };
  }

  private async generateReport(params: any, userId: number): Promise<any> {
    const status = await this.getSystemStatus({}, userId);
    const activities = await this.storage.getActivities(undefined, 50);

    const report = {
      timestamp: new Date().toISOString(),
      summary: status.status,
      recentActivities: activities.slice(0, 10),
      recommendations: [
        'Consider adding more knowledge sources for better RAG performance',
        'Review inactive workflows for optimization opportunities',
        'Monitor MCP server performance for bottlenecks'
      ]
    };

    await this.storage.createActivity({
      type: 'analytics',
      title: 'AI generated system report',
      description: 'Comprehensive system analysis',
      userId
    });

    return { 
      report, 
      message: 'System report generated successfully' 
    };
  }
}
