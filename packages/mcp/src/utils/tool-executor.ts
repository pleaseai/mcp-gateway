import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { CompatibilityCallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { McpServerConfig, MergedServerEntry } from './mcp-config.js'
import process from 'node:process'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { CompatibilityCallToolResultSchema } from '@modelcontextprotocol/sdk/types.js'

/**
 * Result of tool execution
 */
export interface ToolCallResult {
  success: boolean
  result?: CompatibilityCallToolResult
  error?: string
}

/**
 * Manages connections to MCP servers for tool execution
 */
export class ToolExecutor {
  private clients = new Map<string, Client>()
  private transports = new Map<string, Transport>()
  private serverConfigs = new Map<string, McpServerConfig>()
  private readonly connectionTimeout: number

  constructor(options: { timeout?: number } = {}) {
    this.connectionTimeout = options.timeout ?? 30000
  }

  /**
   * Register server configurations for tool execution
   */
  registerServers(servers: MergedServerEntry[]): void {
    for (const server of servers) {
      this.serverConfigs.set(server.name, server.config)
    }
  }

  /**
   * Register a single server configuration
   */
  registerServer(name: string, config: McpServerConfig): void {
    this.serverConfigs.set(name, config)
  }

  /**
   * Get or create a client connection to a server
   */
  private async getClient(serverName: string): Promise<Client> {
    // Return existing connection if available
    const existingClient = this.clients.get(serverName)
    if (existingClient) {
      return existingClient
    }

    // Get server config
    const config = this.serverConfigs.get(serverName)
    if (!config) {
      throw new Error(`Unknown server: ${serverName}. Server not registered.`)
    }

    // Create transport
    const transport = this.createTransport(config)
    this.transports.set(serverName, transport)

    // Create and connect client
    const client = new Client({
      name: 'pleaseai-mcp-executor',
      version: '1.0.0',
    })

    const connectPromise = client.connect(transport)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Connection timeout after ${this.connectionTimeout}ms`)), this.connectionTimeout),
    )

    await Promise.race([connectPromise, timeoutPromise])

    this.clients.set(serverName, client)
    return client
  }

  /**
   * Create transport based on server configuration
   */
  private createTransport(config: McpServerConfig): Transport {
    const transport = config.transport || (config.url ? 'http' : 'stdio')

    if (transport === 'http' && config.url) {
      return new StreamableHTTPClientTransport(new URL(config.url))
    }
    else if (transport === 'sse' && config.url) {
      return new SSEClientTransport(new URL(config.url))
    }
    else if (config.command) {
      const env: Record<string, string> = {}
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
          env[key] = value
        }
      }
      if (config.env) {
        Object.assign(env, config.env)
      }

      return new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env,
      })
    }

    throw new Error('Invalid server configuration: missing command or url')
  }

  /**
   * Execute a tool on a specific server
   */
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<ToolCallResult> {
    try {
      const client = await this.getClient(serverName)

      const result = await client.callTool(
        {
          name: toolName,
          arguments: args,
        },
        CompatibilityCallToolResultSchema,
      )

      return {
        success: true,
        result,
      }
    }
    catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  /**
   * Check if a server is registered
   */
  hasServer(serverName: string): boolean {
    return this.serverConfigs.has(serverName)
  }

  /**
   * Get list of registered servers
   */
  getRegisteredServers(): string[] {
    return Array.from(this.serverConfigs.keys())
  }

  /**
   * Close a specific server connection
   */
  async closeConnection(serverName: string): Promise<void> {
    const client = this.clients.get(serverName)
    if (client) {
      try {
        await client.close()
      }
      catch {
        // Ignore close errors
      }
      this.clients.delete(serverName)
      this.transports.delete(serverName)
    }
  }

  /**
   * Close all connections
   */
  async dispose(): Promise<void> {
    const serverNames = Array.from(this.clients.keys())
    await Promise.all(serverNames.map(name => this.closeConnection(name)))
  }
}
