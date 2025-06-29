import { IStorage } from "../storage";
import { Workflow, Agent } from "@shared/schema";
import * as cron from "node-cron";

interface WorkflowExecution {
  id: string;
  workflowId: number;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  logs: string[];
}

export class WorkflowEngine {
  private executions = new Map<string, WorkflowExecution>();
  private scheduledTasks = new Map<number, cron.ScheduledTask>();

  constructor(private storage: IStorage) {
    this.initializeScheduledWorkflows();
  }

  private async initializeScheduledWorkflows() {
    try {
      const workflows = await this.storage.getWorkflows();
      
      for (const workflow of workflows) {
        if (workflow.status === 'active' && workflow.config?.schedule) {
          this.scheduleWorkflow(workflow);
        }
      }
    } catch (error) {
      console.error('Failed to initialize scheduled workflows:', error);
    }
  }

  async executeWorkflow(workflowId: number): Promise<WorkflowExecution> {
    const workflow = await this.storage.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = `exec_${Date.now()}_${workflowId}`;
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      startTime: new Date(),
      logs: []
    };

    this.executions.set(executionId, execution);

    try {
      execution.logs.push(`Starting workflow: ${workflow.name}`);
      
      // Get associated agents
      const agents = await this.storage.getAgents(workflowId);
      
      // Execute workflow steps
      await this.executeWorkflowSteps(workflow, agents, execution);
      
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.logs.push('Workflow completed successfully');

      // Log activity
      await this.storage.createActivity({
        type: 'workflow',
        title: `Workflow "${workflow.name}" completed`,
        description: `Execution time: ${execution.endTime.getTime() - execution.startTime.getTime()}ms`,
        userId: workflow.userId || 1
      });

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.logs.push(`Error: ${error}`);
      
      console.error(`Workflow ${workflowId} failed:`, error);
    }

    return execution;
  }

  private async executeWorkflowSteps(
    workflow: Workflow, 
    agents: Agent[], 
    execution: WorkflowExecution
  ): Promise<void> {
    const config = workflow.config as any;
    
    // Execute pre-processing steps
    if (config.preprocessing) {
      execution.logs.push('Executing preprocessing steps');
      await this.executeSteps(config.preprocessing, execution);
    }

    // Execute agents in parallel or sequence based on config
    if (agents.length > 0) {
      execution.logs.push(`Executing ${agents.length} agents`);
      
      if (config.parallel) {
        await Promise.all(agents.map(agent => this.executeAgent(agent, execution)));
      } else {
        for (const agent of agents) {
          await this.executeAgent(agent, execution);
        }
      }
    }

    // Execute post-processing steps
    if (config.postprocessing) {
      execution.logs.push('Executing postprocessing steps');
      await this.executeSteps(config.postprocessing, execution);
    }
  }

  private async executeSteps(steps: any[], execution: WorkflowExecution): Promise<void> {
    for (const step of steps) {
      execution.logs.push(`Executing step: ${step.name || step.type}`);
      
      // Simulate step execution with delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      execution.logs.push(`Step completed: ${step.name || step.type}`);
    }
  }

  private async executeAgent(agent: Agent, execution: WorkflowExecution): Promise<void> {
    execution.logs.push(`Starting agent: ${agent.name}`);
    
    try {
      // Update agent status
      await this.storage.updateAgent(agent.id, { status: 'active' });
      
      // Simulate agent execution
      await new Promise(resolve => setTimeout(resolve, 200));
      
      execution.logs.push(`Agent ${agent.name} completed successfully`);
      
    } catch (error) {
      execution.logs.push(`Agent ${agent.name} failed: ${error}`);
      throw error;
    }
  }

  scheduleWorkflow(workflow: Workflow): void {
    const schedule = workflow.config?.schedule;
    if (!schedule) return;

    // Stop existing scheduled task if any
    const existingTask = this.scheduledTasks.get(workflow.id);
    if (existingTask) {
      existingTask.stop();
    }

    // Create new scheduled task
    const task = cron.schedule(schedule, async () => {
      console.log(`Executing scheduled workflow: ${workflow.name}`);
      try {
        await this.executeWorkflow(workflow.id);
      } catch (error) {
        console.error(`Scheduled workflow ${workflow.id} failed:`, error);
      }
    }, {
      scheduled: false,
      timezone: "UTC"
    });

    this.scheduledTasks.set(workflow.id, task);
    task.start();

    console.log(`Scheduled workflow ${workflow.name} with cron: ${schedule}`);
  }

  unscheduleWorkflow(workflowId: number): void {
    const task = this.scheduledTasks.get(workflowId);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(workflowId);
    }
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(
      execution => execution.status === 'running'
    );
  }

  async createWorkflowFromTemplate(
    name: string,
    template: string,
    userId: number
  ): Promise<Workflow> {
    const templates = {
      'social-media': {
        name,
        description: 'Automated social media campaign management',
        config: {
          schedule: '0 9 * * *', // Daily at 9 AM
          preprocessing: [
            { type: 'content-generation', name: 'Generate content' },
            { type: 'hashtag-research', name: 'Research hashtags' }
          ],
          postprocessing: [
            { type: 'analytics-collection', name: 'Collect analytics' },
            { type: 'report-generation', name: 'Generate report' }
          ],
          parallel: false
        }
      },
      'knowledge-update': {
        name,
        description: 'Automated knowledge base updating',
        config: {
          schedule: '0 */6 * * *', // Every 6 hours
          preprocessing: [
            { type: 'source-discovery', name: 'Discover new sources' },
            { type: 'content-extraction', name: 'Extract content' }
          ],
          postprocessing: [
            { type: 'indexing', name: 'Index content' },
            { type: 'similarity-check', name: 'Check for duplicates' }
          ],
          parallel: true
        }
      }
    };

    const templateConfig = templates[template as keyof typeof templates];
    if (!templateConfig) {
      throw new Error(`Unknown template: ${template}`);
    }

    return await this.storage.createWorkflow({
      ...templateConfig,
      userId
    });
  }
}
