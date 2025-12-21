/**
 * MCP Client 核心实现
 */

import type {
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
  Tool,
  Resource,
  Prompt,
} from "@modelcontextprotocol/sdk/types.js";
import {
  PostMessageClientTransport,
  type ClientTransportOptions,
} from "../transport/index.js";
import type {
  McpClientOptions,
  CallToolParams,
  ReadResourceParams,
  GetPromptParams,
  ServerInfo,
  ClientState,
} from "./types.js";
import type { ToolCallResult } from "../server/types.js";

/**
 * MCP Client 实现
 * 在 iframe 中运行，调用主页面的 MCP Server 能力
 */
export class McpClient {
  private transport: PostMessageClientTransport | null = null;
  private requestId = 0;
  private pendingRequests: Map<
    number | string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
    }
  > = new Map();
  private state: ClientState = "disconnected";
  private serverInfo: ServerInfo | null = null;
  private options: McpClientOptions;

  constructor(options: McpClientOptions = {}) {
    this.options = options;
  }

  /**
   * 获取当前状态
   */
  getState(): ClientState {
    return this.state;
  }

  /**
   * 获取 Server 信息
   */
  getServerInfo(): ServerInfo | null {
    return this.serverInfo;
  }

  /**
   * 连接到 Server
   */
  async connect(
    transportOptions?: ClientTransportOptions
  ): Promise<ServerInfo> {
    if (this.state === "connected") {
      if (this.serverInfo) {
        return this.serverInfo;
      }
    }

    this.state = "connecting";

    try {
      this.transport = new PostMessageClientTransport(transportOptions);
      this.transport.onmessage = (message) => this.handleMessage(message);
      this.transport.onerror = (error) => {
        console.error("MCP Client Transport 错误:", error);
        this.state = "error";
        // 发生错误时清理 transport
        this.transport = null;
      };
      this.transport.onclose = () => {
        this.state = "disconnected";
        // 连接关闭时清理 transport
        this.transport = null;
      };

      await this.transport.start();

      // 检查 transport 是否还在（可能在 start() 过程中被 onerror/onclose 清理了）
      if (!this.transport) {
        throw new Error("Transport 启动失败");
      }

      // 发送初始化请求
      const result = (await this.sendRequest("initialize", {
        protocolVersion: "1.0.0",
        capabilities: {},
        clientInfo: {
          name: this.options.name ?? "mcp-client",
          version: this.options.version ?? "1.0.0",
        },
      })) as { serverInfo: ServerInfo };

      this.serverInfo = result.serverInfo;
      this.state = "connected";

      // 发送 initialized 通知
      await this.sendNotification("notifications/initialized", {});

      return this.serverInfo;
    } catch (error) {
      this.state = "error";
      // 发生错误时清理 transport
      if (this.transport) {
        try {
          await this.transport.close();
        } catch (closeError) {
          // 忽略关闭时的错误
        }
        this.transport = null;
      }
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
    this.state = "disconnected";
    this.serverInfo = null;
    this.pendingRequests.clear();
  }

  /**
   * 列出所有工具
   */
  async listTools(): Promise<Tool[]> {
    const result = (await this.sendRequest("tools/list", {})) as {
      tools: Tool[];
    };
    return result.tools;
  }

  /**
   * 调用工具
   */
  async callTool(
    name: string,
    args?: Record<string, unknown>
  ): Promise<ToolCallResult>;
  async callTool(params: CallToolParams): Promise<ToolCallResult>;
  async callTool(
    nameOrParams: string | CallToolParams,
    args?: Record<string, unknown>
  ): Promise<ToolCallResult> {
    const params: CallToolParams =
      typeof nameOrParams === "string"
        ? { name: nameOrParams, arguments: args }
        : nameOrParams;

    return (await this.sendRequest("tools/call", params)) as ToolCallResult;
  }

  /**
   * 列出所有资源
   */
  async listResources(): Promise<Resource[]> {
    const result = (await this.sendRequest("resources/list", {})) as {
      resources: Resource[];
    };
    return result.resources;
  }

  /**
   * 读取资源
   */
  async readResource(uri: string): Promise<{
    contents: Array<{
      uri: string;
      mimeType?: string;
      text?: string;
      blob?: string;
    }>;
  }>;
  async readResource(params: ReadResourceParams): Promise<{
    contents: Array<{
      uri: string;
      mimeType?: string;
      text?: string;
      blob?: string;
    }>;
  }>;
  async readResource(uriOrParams: string | ReadResourceParams): Promise<{
    contents: Array<{
      uri: string;
      mimeType?: string;
      text?: string;
      blob?: string;
    }>;
  }> {
    const params: ReadResourceParams =
      typeof uriOrParams === "string" ? { uri: uriOrParams } : uriOrParams;

    return (await this.sendRequest("resources/read", params)) as {
      contents: Array<{
        uri: string;
        mimeType?: string;
        text?: string;
        blob?: string;
      }>;
    };
  }

  /**
   * 列出所有 Prompts
   */
  async listPrompts(): Promise<Prompt[]> {
    const result = (await this.sendRequest("prompts/list", {})) as {
      prompts: Prompt[];
    };
    return result.prompts;
  }

  /**
   * 获取 Prompt
   */
  async getPrompt(
    name: string,
    args?: Record<string, string>
  ): Promise<{
    description?: string;
    messages: Array<{
      role: "user" | "assistant";
      content: {
        type: "text" | "image" | "resource";
        text?: string;
        data?: string;
        mimeType?: string;
      };
    }>;
  }>;
  async getPrompt(params: GetPromptParams): Promise<{
    description?: string;
    messages: Array<{
      role: "user" | "assistant";
      content: {
        type: "text" | "image" | "resource";
        text?: string;
        data?: string;
        mimeType?: string;
      };
    }>;
  }>;
  async getPrompt(
    nameOrParams: string | GetPromptParams,
    args?: Record<string, string>
  ): Promise<{
    description?: string;
    messages: Array<{
      role: "user" | "assistant";
      content: {
        type: "text" | "image" | "resource";
        text?: string;
        data?: string;
        mimeType?: string;
      };
    }>;
  }> {
    const params: GetPromptParams =
      typeof nameOrParams === "string"
        ? { name: nameOrParams, arguments: args }
        : nameOrParams;

    return (await this.sendRequest("prompts/get", params)) as {
      description?: string;
      messages: Array<{
        role: "user" | "assistant";
        content: {
          type: "text" | "image" | "resource";
          text?: string;
          data?: string;
          mimeType?: string;
        };
      }>;
    };
  }

  /**
   * Ping Server
   */
  async ping(): Promise<void> {
    await this.sendRequest("ping", {});
  }

  /**
   * 发送请求
   */
  private async sendRequest(method: string, params: unknown): Promise<unknown> {
    if (!this.transport) {
      throw new Error("Client 未连接");
    }

    const id = ++this.requestId;
    const request: JSONRPCRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params: params as Record<string, unknown>,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.transport!.send(request).catch((error) => {
        this.pendingRequests.delete(id);
        reject(error);
      });

      // 超时处理
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`请求超时: ${method}`));
        }
      }, 30000);
    });
  }

  /**
   * 发送通知
   */
  private async sendNotification(
    method: string,
    params: unknown
  ): Promise<void> {
    if (!this.transport) {
      throw new Error("Client 未连接");
    }

    const notification: JSONRPCMessage = {
      jsonrpc: "2.0",
      method,
      params: params as Record<string, unknown>,
    };

    await this.transport.send(notification);
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(message: JSONRPCMessage): void {
    // 处理响应消息
    if ("id" in message && ("result" in message || "error" in message)) {
      const response = message as JSONRPCResponse;
      if (response.id !== undefined) {
        const pending = this.pendingRequests.get(response.id);
        if (pending) {
          this.pendingRequests.delete(response.id);
          if ("error" in response) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
      }
    }
    // 忽略其他消息类型（如通知）
  }
}

/**
 * 创建 MCP Client
 */
export function createMcpClient(options?: McpClientOptions): McpClient {
  return new McpClient(options);
}
