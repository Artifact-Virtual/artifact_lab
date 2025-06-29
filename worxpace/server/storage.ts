import { 
  users, workflows, agents, knowledgeSources, mcpServers, 
  chatSessions, systemMetrics, activities,
  type User, type InsertUser, type Workflow, type InsertWorkflow,
  type Agent, type InsertAgent, type KnowledgeSource, type InsertKnowledgeSource,
  type McpServer, type InsertMcpServer, type ChatSession, type InsertChatSession,
  type SystemMetric, type InsertSystemMetric, type Activity, type InsertActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Workflows
  getWorkflows(userId?: number): Promise<Workflow[]>;
  getWorkflow(id: number): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: number, updates: Partial<InsertWorkflow>): Promise<Workflow>;
  deleteWorkflow(id: number): Promise<void>;

  // Agents
  getAgents(workflowId?: number): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent>;
  deleteAgent(id: number): Promise<void>;

  // Knowledge Sources
  getKnowledgeSources(): Promise<KnowledgeSource[]>;
  createKnowledgeSource(source: InsertKnowledgeSource): Promise<KnowledgeSource>;
  updateKnowledgeSource(id: number, updates: Partial<InsertKnowledgeSource>): Promise<KnowledgeSource>;

  // MCP Servers
  getMcpServers(): Promise<McpServer[]>;
  createMcpServer(server: InsertMcpServer): Promise<McpServer>;
  updateMcpServer(id: number, updates: Partial<InsertMcpServer>): Promise<McpServer>;

  // Chat Sessions
  getChatSessions(userId: number): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: number, updates: Partial<InsertChatSession>): Promise<ChatSession>;

  // System Metrics
  getSystemMetrics(metricType?: string): Promise<SystemMetric[]>;
  createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;

  // Activities
  getActivities(userId?: number, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Workflows
  async getWorkflows(userId?: number): Promise<Workflow[]> {
    if (userId) {
      return await db.select().from(workflows).where(eq(workflows.userId, userId));
    }
    return await db.select().from(workflows);
  }

  async getWorkflow(id: number): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow || undefined;
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db.insert(workflows).values(workflow).returning();
    return newWorkflow;
  }

  async updateWorkflow(id: number, updates: Partial<InsertWorkflow>): Promise<Workflow> {
    const [workflow] = await db.update(workflows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();
    return workflow;
  }

  async deleteWorkflow(id: number): Promise<void> {
    await db.delete(workflows).where(eq(workflows.id, id));
  }

  // Agents
  async getAgents(workflowId?: number): Promise<Agent[]> {
    if (workflowId) {
      return await db.select().from(agents).where(eq(agents.workflowId, workflowId));
    }
    return await db.select().from(agents);
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [newAgent] = await db.insert(agents).values(agent).returning();
    return newAgent;
  }

  async updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent> {
    const [agent] = await db.update(agents)
      .set(updates)
      .where(eq(agents.id, id))
      .returning();
    return agent;
  }

  async deleteAgent(id: number): Promise<void> {
    await db.delete(agents).where(eq(agents.id, id));
  }

  // Knowledge Sources
  async getKnowledgeSources(): Promise<KnowledgeSource[]> {
    return await db.select().from(knowledgeSources).orderBy(desc(knowledgeSources.createdAt));
  }

  async createKnowledgeSource(source: InsertKnowledgeSource): Promise<KnowledgeSource> {
    const [newSource] = await db.insert(knowledgeSources).values(source).returning();
    return newSource;
  }

  async updateKnowledgeSource(id: number, updates: Partial<InsertKnowledgeSource>): Promise<KnowledgeSource> {
    const [source] = await db.update(knowledgeSources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(knowledgeSources.id, id))
      .returning();
    return source;
  }

  // MCP Servers
  async getMcpServers(): Promise<McpServer[]> {
    return await db.select().from(mcpServers).orderBy(desc(mcpServers.createdAt));
  }

  async createMcpServer(server: InsertMcpServer): Promise<McpServer> {
    const [newServer] = await db.insert(mcpServers).values(server).returning();
    return newServer;
  }

  async updateMcpServer(id: number, updates: Partial<InsertMcpServer>): Promise<McpServer> {
    const [server] = await db.update(mcpServers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mcpServers.id, id))
      .returning();
    return server;
  }

  // Chat Sessions
  async getChatSessions(userId: number): Promise<ChatSession[]> {
    return await db.select().from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.createdAt));
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [newSession] = await db.insert(chatSessions).values(session).returning();
    return newSession;
  }

  async updateChatSession(id: number, updates: Partial<InsertChatSession>): Promise<ChatSession> {
    const [session] = await db.update(chatSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatSessions.id, id))
      .returning();
    return session;
  }

  // System Metrics
  async getSystemMetrics(metricType?: string): Promise<SystemMetric[]> {
    if (metricType) {
      return await db.select().from(systemMetrics)
        .where(eq(systemMetrics.metricType, metricType))
        .orderBy(desc(systemMetrics.timestamp));
    }
    return await db.select().from(systemMetrics).orderBy(desc(systemMetrics.timestamp));
  }

  async createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric> {
    const [newMetric] = await db.insert(systemMetrics).values(metric).returning();
    return newMetric;
  }

  // Activities
  async getActivities(userId?: number, limit: number = 50): Promise<Activity[]> {
    const query = db.select().from(activities);
    
    if (userId) {
      query.where(eq(activities.userId, userId));
    }
    
    return await query.orderBy(desc(activities.createdAt)).limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }
}

export const storage = new DatabaseStorage();
