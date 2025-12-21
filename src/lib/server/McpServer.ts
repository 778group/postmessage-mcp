/**
 * MCP Server 核心实现
 */

import type {
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
} from "@modelcontextprotocol/sdk/types.js";
import {
  PostMessageServerTransport,
  type ServerTransportOptions,
} from "../transport/index.js";
import type {
  McpServerOptions,
  ToolDefinition,
  ResourceDefinition,
  PromptDefinition,
  ToolCallInput,
} from "./types.js";

/**
 * MCP Server 实现
 * 在主页面中运行，提供 tools、resources、prompts 能力
 */
export class McpServer {
  private transport: PostMessageServerTransport | null = null;
  private tools: Map<string, ToolDefinition> = new Map();
  private resources: Map<string, ResourceDefinition> = new Map();
  private prompts: Map<string, PromptDefinition> = new Map();
  private pendingRequests: Map<
    number | string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
    }
  > = new Map();
  private options: McpServerOptions;

  constructor(options: McpServerOptions) {
    this.options = options;
  }

  /**
   * 添加工具
   */
  addTool(tool: ToolDefinition): this {
    this.tools.set(tool.name, tool);
    return this;
  }

  /**
   * 移除工具
   */
  removeTool(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * 添加资源
   */
  addResource(resource: ResourceDefinition): this {
    this.resources.set(resource.uri, resource);
    return this;
  }

  /**
   * 移除资源
   */
  removeResource(uri: string): boolean {
    return this.resources.delete(uri);
  }

  /**
   * 添加 Prompt
   */
  addPrompt(prompt: PromptDefinition): this {
    this.prompts.set(prompt.name, prompt);
    return this;
  }

  /**
   * 移除 Prompt
   */
  removePrompt(name: string): boolean {
    return this.prompts.delete(name);
  }

  /**
   * 获取所有工具信息
   */
  getTools() {
    return Array.from(this.tools.values()).map(
      ({ handler: _, ...tool }) => tool
    );
  }

  /**
   * 获取所有资源信息
   */
  getResources() {
    return Array.from(this.resources.values()).map(
      ({ handler: _, ...resource }) => resource
    );
  }

  /**
   * 获取所有 Prompt 信息
   */
  getPrompts() {
    return Array.from(this.prompts.values()).map(
      ({ handler: _, ...prompt }) => prompt
    );
  }

  /**
   * 连接到 iframe
   */
  async connect(
    target: HTMLIFrameElement | Window,
    options?: Omit<ServerTransportOptions, "target">
  ): Promise<void> {
    if (this.transport) {
      await this.transport.close();
    }

    this.transport = new PostMessageServerTransport({
      target,
      ...options,
    });

    this.transport.onmessage = (message) => this.handleMessage(message);
    this.transport.onerror = (error) =>
      console.error("MCP Server Transport 错误:", error);

    await this.transport.start();
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }
  }

  /**
   * 处理收到的消息
   */
  private async handleMessage(message: JSONRPCMessage): Promise<void> {
    // 处理响应消息
    if ("result" in message || "error" in message) {
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
      return;
    }

    // 处理请求消息
    const request = message as JSONRPCRequest;
    const response = await this.handleRequest(request);

    if (this.transport && response) {
      await this.transport.send(response);
    }
  }

  /**
   * 处理 JSON-RPC 请求
   */
  private async handleRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | null> {
    const { id, method, params } = request;

    try {
      let result: Record<string, unknown>;

      switch (method) {
        case "initialize":
          result = this.handleInitialize();
          break;

        case "tools/list":
          result = { tools: this.getTools() };
          break;

        case "tools/call":
          result = await this.handleToolCall(
            params as { name: string; arguments?: ToolCallInput }
          );
          break;

        case "resources/list":
          result = { resources: this.getResources() };
          break;

        case "resources/read":
          result = await this.handleResourceRead(params as { uri: string });
          break;

        case "prompts/list":
          result = { prompts: this.getPrompts() };
          break;

        case "prompts/get":
          result = await this.handlePromptGet(
            params as { name: string; arguments?: Record<string, string> }
          );
          break;

        case "ping":
          result = {};
          break;

        default:
          return {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `未知方法: ${method}`,
            },
          };
      }

      return {
        jsonrpc: "2.0",
        id,
        result,
      };
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * 处理初始化请求
   */
  private handleInitialize(): Record<string, unknown> {
    return {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: this.tools.size > 0 ? {} : undefined,
        resources: this.resources.size > 0 ? {} : undefined,
        prompts: this.prompts.size > 0 ? {} : undefined,
      },
      serverInfo: {
        name: this.options.name,
        version: this.options.version,
      },
    };
  }

  /**
   * 处理工具调用
   */
  private async handleToolCall(params: {
    name: string;
    arguments?: ToolCallInput;
  }): Promise<Record<string, unknown>> {
    const tool = this.tools.get(params.name);
    if (!tool) {
      throw new Error(`工具未找到: ${params.name}`);
    }

    const result = await tool.handler(params.arguments ?? {});
    return result as unknown as Record<string, unknown>;
  }

  /**
   * 处理资源读取
   */
  private async handleResourceRead(params: {
    uri: string;
  }): Promise<Record<string, unknown>> {
    const resource = this.resources.get(params.uri);
    if (!resource) {
      throw new Error(`资源未找到: ${params.uri}`);
    }

    const result = await resource.handler(params.uri);
    return result as unknown as Record<string, unknown>;
  }

  /**
   * 处理 Prompt 获取
   */
  private async handlePromptGet(params: {
    name: string;
    arguments?: Record<string, string>;
  }): Promise<Record<string, unknown>> {
    const prompt = this.prompts.get(params.name);
    if (!prompt) {
      throw new Error(`Prompt 未找到: ${params.name}`);
    }

    const result = await prompt.handler(params.arguments ?? {});
    return result as unknown as Record<string, unknown>;
  }
}

/**
 * 创建 MCP Server
 */
export function createMcpServer(options: McpServerOptions): McpServer {
  return new McpServer(options);
}
