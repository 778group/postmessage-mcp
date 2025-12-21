/**
 * MCP Server 类型定义
 */

import type {
  Tool,
  Resource,
  Prompt,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool 处理函数的输入参数
 */
export interface ToolCallInput {
  [key: string]: unknown;
}

/**
 * Tool 处理函数的返回结果
 */
export interface ToolCallResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/**
 * Tool 定义（包含处理函数）
 */
export interface ToolDefinition {
  /**
   * 工具名称
   */
  name: string;
  /**
   * 工具描述
   */
  description?: string;
  /**
   * 输入参数的 JSON Schema
   */
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
  /**
   * 工具处理函数
   */
  handler: (input: ToolCallInput) => Promise<ToolCallResult> | ToolCallResult;
}

/**
 * Resource 读取处理函数
 */
export type ResourceReadHandler = (uri: string) => Promise<{
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}>;

/**
 * Resource 定义（包含读取处理函数）
 */
export interface ResourceDefinition {
  /**
   * 资源 URI
   */
  uri: string;
  /**
   * 资源名称
   */
  name: string;
  /**
   * 资源描述
   */
  description?: string;
  /**
   * MIME 类型
   */
  mimeType?: string;
  /**
   * 读取处理函数
   */
  handler: ResourceReadHandler;
}

/**
 * Prompt 参数定义
 */
export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

/**
 * Prompt 获取处理函数
 */
export type PromptGetHandler = (args: Record<string, string>) => Promise<{
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

/**
 * Prompt 定义（包含获取处理函数）
 */
export interface PromptDefinition {
  /**
   * Prompt 名称
   */
  name: string;
  /**
   * Prompt 描述
   */
  description?: string;
  /**
   * Prompt 参数
   */
  arguments?: PromptArgument[];
  /**
   * 获取处理函数
   */
  handler: PromptGetHandler;
}

/**
 * MCP Server 配置
 */
export interface McpServerOptions {
  /**
   * 服务器名称
   */
  name: string;
  /**
   * 服务器版本
   */
  version: string;
}

/**
 * Tool 信息（不包含 handler）
 */
export type ToolInfo = Omit<Tool, "handler">;

/**
 * Resource 信息（不包含 handler）
 */
export type ResourceInfo = Omit<Resource, "handler">;

/**
 * Prompt 信息（不包含 handler）
 */
export type PromptInfo = Omit<Prompt, "handler">;
