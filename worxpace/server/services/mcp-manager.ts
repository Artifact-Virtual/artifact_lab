import { IStorage } from "../storage";
import { McpServer } from "@shared/schema";

interface MCPCapability {
  name: string;
  description: string;
  parameters: Record<string, any>;
  examples: string[];
}

interface MCPServerInfo {
  id: number;
  name: string;
  type: string;
  endpoint?: string;
  status: string;
  capabilities: MCPCapability[];
  lastPing?: Date;
  responseTime?: number;
}

export class MCPManager {
  private servers = new Map<number, MCPServerInfo>();
  private discoveryInterval?: NodeJS.Timeout;

  constructor(private storage: IStorage) {
    this.initializeMCPServers();
    this.startAutoDiscovery();
  }

  private async initializeMCPServers() {
    try {
      const servers = await this.storage.getMcpServers();
      
      for (const server of servers) {
        const serverInfo: MCPServerInfo = {
          id: server.id,
          name: server.name,
          type: server.type,
          endpoint: server.endpoint || undefined,
          status: server.status || 'inactive',
          capabilities: server.capabilities as MCPCapability[] || []
        };
        
        this.servers.set(server.id, serverInfo);
        
        if (server.status === 'active') {
          await this.pingServer(serverInfo);
        }
      }

      // Register default MCP servers
      await this.registerDefaultServers();
      
    } catch (error) {
      console.error('Failed to initialize MCP servers:', error);
    }
  }

  private async registerDefaultServers() {
    const defaultServers = [
      {
        name: 'Social Media MCP',
        type: 'social-media',
        config: {
          platforms: ['twitter', 'instagram', 'linkedin'],
          rateLimit: { requests: 100, window: '1h' }
        },
        capabilities: [
          {
            name: 'post_content',
            description: 'Post content to social media platforms',
            parameters: { platform: 'string', content: 'string', media: 'optional' },
            examples: ['Post tweet with image', 'Share LinkedIn article']
          },
          {
            name: 'schedule_post',
            description: 'Schedule posts for later publishing',
            parameters: { platform: 'string', content: 'string', scheduledTime: 'datetime' },
            examples: ['Schedule morning tweet', 'Plan Instagram story']
          }
        ]
      },
      {
        name: 'File Operations MCP',
        type: 'file-operations',
        config: {
          allowedPaths: ['/tmp', '/uploads'],
          maxFileSize: '10MB'
        },
        capabilities: [
          {
            name: 'read_file',
            description: 'Read file contents',
            parameters: { path: 'string', encoding: 'optional' },
            examples: ['Read configuration file', 'Load data from CSV']
          },
          {
            name: 'write_file',
            description: 'Write content to file',
            parameters: { path: 'string', content: 'string', mode: 'optional' },
            examples: ['Save report to file', 'Export data as JSON']
          }
        ]
      },
      {
        name: 'Database MCP',
        type: 'database',
        config: {
          supportedDatabases: ['postgresql', 'mongodb', 'sqlite'],
          connectionPooling: true
        },
        capabilities: [
          {
            name: 'execute_query',
            description: 'Execute database queries',
            parameters: { query: 'string', database: 'string', parameters: 'optional' },
            examples: ['Fetch user data', 'Update inventory records']
          },
          {
            name: 'backup_database',
            description: 'Create database backups',
            parameters: { database: 'string', destination: 'string' },
            examples: ['Daily backup to S3', 'Export table data']
          }
        ]
      },
      {
        name: 'Web Scraping MCP',
        type: 'web-scraping',
        config: {
          rateLimit: { requests: 50, window: '1m' },
          userAgent: 'ARTIFACT-VIRTUAL-Bot/1.0'
        },
        capabilities: [
          {
            name: 'scrape_page',
            description: 'Extract data from web pages',
            parameters: { url: 'string', selectors: 'object', options: 'optional' },
            examples: ['Extract article content', 'Monitor price changes']
          },
          {
            name: 'monitor_changes',
            description: 'Monitor websites for changes',
            parameters: { url: 'string', checkInterval: 'duration', threshold: 'optional' },
            examples: ['Track product availability', 'Monitor news updates']
          }
        ]
      },
      {
        name: 'Email MCP',
        type: 'email',
        config: {
          providers: ['smtp', 'sendgrid', 'mailgun'],
          templates: true
        },
        capabilities: [
          {
            name: 'send_email',
            description: 'Send emails to recipients',
            parameters: { to: 'array', subject: 'string', body: 'string', attachments: 'optional' },
            examples: ['Send notification email', 'Deliver report PDF']
          },
          {
            name: 'process_inbox',
            description: 'Process incoming emails',
            parameters: { filter: 'object', action: 'string' },
            examples: ['Auto-reply to inquiries', 'Parse order confirmations']
          }
        ]
      }
    ];

    for (const serverConfig of defaultServers) {
      try {
        const existingServer = await this.findServerByName(serverConfig.name);
        if (!existingServer) {
          const server = await this.storage.createMcpServer({
            ...serverConfig,
            status: 'active'
          });

          const serverInfo: MCPServerInfo = {
            id: server.id,
            name: server.name,
            type: server.type,
            status: 'active',
            capabilities: serverConfig.capabilities
          };

          this.servers.set(server.id, serverInfo);
          
          await this.storage.createActivity({
            type: 'tool',
            title: `Registered MCP server: ${server.name}`,
            userId: 1
          });
        }
      } catch (error) {
        console.error(`Failed to register default server ${serverConfig.name}:`, error);
      }
    }
  }

  private async findServerByName(name: string): Promise<McpServer | null> {
    const servers = await this.storage.getMcpServers();
    return servers.find(s => s.name === name) || null;
  }

  private startAutoDiscovery() {
    // Auto-discovery every 5 minutes
    this.discoveryInterval = setInterval(async () => {
      await this.discoverNewServers();
      await this.healthCheckServers();
    }, 5 * 60 * 1000);
  }

  private async discoverNewServers() {
    try {
      // Simulate discovery of new MCP servers
      const discoveryEndpoints = [
        'http://localhost:3001/mcp',
        'http://localhost:3002/mcp',
        'http://localhost:3003/mcp'
      ];

      for (const endpoint of discoveryEndpoints) {
        try {
          const response = await fetch(`${endpoint}/info`, {
            timeout: 5000,
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const serverInfo = await response.json();
            await this.registerDiscoveredServer(endpoint, serverInfo);
          }
        } catch (error) {
          // Server not available, continue
        }
      }
    } catch (error) {
      console.error('Discovery error:', error);
    }
  }

  private async registerDiscoveredServer(endpoint: string, info: any) {
    const existingServer = await this.findServerByEndpoint(endpoint);
    if (existingServer) return;

    try {
      const server = await this.storage.createMcpServer({
        name: info.name || `Discovered Server at ${endpoint}`,
        type: info.type || 'unknown',
        endpoint,
        config: info.config || {},
        capabilities: info.capabilities || []
      });

      const serverInfo: MCPServerInfo = {
        id: server.id,
        name: server.name,
        type: server.type,
        endpoint: server.endpoint || undefined,
        status: 'active',
        capabilities: server.capabilities as MCPCapability[] || []
      };

      this.servers.set(server.id, serverInfo);

      await this.storage.createActivity({
        type: 'tool',
        title: `Auto-discovered MCP server: ${server.name}`,
        description: `Found at ${endpoint}`,
        userId: 1
      });

    } catch (error) {
      console.error('Failed to register discovered server:', error);
    }
  }

  private async findServerByEndpoint(endpoint: string): Promise<McpServer | null> {
    const servers = await this.storage.getMcpServers();
    return servers.find(s => s.endpoint === endpoint) || null;
  }

  private async healthCheckServers() {
    const activeServers = Array.from(this.servers.values()).filter(
      server => server.status === 'active' && server.endpoint
    );

    for (const server of activeServers) {
      await this.pingServer(server);
    }
  }

  private async pingServer(server: MCPServerInfo): Promise<void> {
    if (!server.endpoint) return;

    try {
      const startTime = Date.now();
      const response = await fetch(`${server.endpoint}/health`, {
        timeout: 3000,
        signal: AbortSignal.timeout(3000)
      });

      server.responseTime = Date.now() - startTime;
      server.lastPing = new Date();

      if (response.ok) {
        server.status = 'active';
      } else {
        server.status = 'error';
      }

      await this.storage.updateMcpServer(server.id, { 
        status: server.status 
      });

    } catch (error) {
      server.status = 'inactive';
      server.lastPing = new Date();
      
      await this.storage.updateMcpServer(server.id, { 
        status: 'inactive' 
      });
    }
  }

  async executeCapability(
    serverId: number, 
    capabilityName: string, 
    parameters: Record<string, any>
  ): Promise<any> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    const capability = server.capabilities.find(cap => cap.name === capabilityName);
    if (!capability) {
      throw new Error(`Capability ${capabilityName} not found on server ${server.name}`);
    }

    try {
      if (server.endpoint) {
        const response = await fetch(`${server.endpoint}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            capability: capabilityName,
            parameters
          }),
          timeout: 30000,
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } else {
        // For servers without endpoints, simulate execution
        return this.simulateCapabilityExecution(capability, parameters);
      }
    } catch (error) {
      console.error(`Failed to execute ${capabilityName} on ${server.name}:`, error);
      throw error;
    }
  }

  private simulateCapabilityExecution(
    capability: MCPCapability, 
    parameters: Record<string, any>
  ): any {
    // Simulate successful execution for demo purposes
    return {
      success: true,
      result: `Simulated execution of ${capability.name}`,
      parameters,
      timestamp: new Date().toISOString()
    };
  }

  getAvailableCapabilities(): Array<{serverId: number, serverName: string, capabilities: MCPCapability[]}> {
    return Array.from(this.servers.values())
      .filter(server => server.status === 'active')
      .map(server => ({
        serverId: server.id,
        serverName: server.name,
        capabilities: server.capabilities
      }));
  }

  getServerStatus(): MCPServerInfo[] {
    return Array.from(this.servers.values());
  }

  async installMCPServer(config: {
    name: string;
    type: string;
    source: string; // npm package, git repo, or docker image
    config: Record<string, any>;
  }): Promise<McpServer> {
    // For now, just register the server configuration
    // In a real implementation, this would install and start the MCP server
    
    const server = await this.storage.createMcpServer({
      name: config.name,
      type: config.type,
      config: config.config,
      status: 'installing'
    });

    // Simulate installation process
    setTimeout(async () => {
      await this.storage.updateMcpServer(server.id, { status: 'active' });
      
      const serverInfo: MCPServerInfo = {
        id: server.id,
        name: server.name,
        type: server.type,
        status: 'active',
        capabilities: []
      };
      
      this.servers.set(server.id, serverInfo);
    }, 2000);

    return server;
  }

  stop() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }
  }
}
