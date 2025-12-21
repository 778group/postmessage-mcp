/**
 * MCP Client 类型定义
 */

import type {
  Tool,
  Resource,
  Prompt,
} from "@modelcontextprotocol/sdk/types.js";
import type { ToolCallResult } from "../server/types.js";

/**
 * MCP Client 配置
 */
export interface McpClientOptions {
  /**
   * 客户端名称
   */
  name?: string;
  /**
   * 客户端版本
   */
  version?: string;
}

/**
 * Tool 调用参数
 */
export interface CallToolParams {
  /**
   * 工具名称
   */
  name: string;
  /**
   * 工具参数
   */
  arguments?: Record<string, unknown>;
}

/**
 * Resource 读取参数
 */
export interface ReadResourceParams {
  /**
   * 资源 URI
   */
  uri: string;
}

/**
 * Prompt 获取参数
 */
export interface GetPromptParams {
  /**
   * Prompt 名称
   */
  name: string;
  /**
   * Prompt 参数
   */
  arguments?: Record<string, string>;
}

/**
 * Server 信息
 */
export interface ServerInfo {
  name: string;
  version: string;
}

/**
 * Client 连接状态
 */
export type ClientState = "disconnected" | "connecting" | "connected" | "error";

/**
 * 导出 SDK 类型供外部使用
 */
export type { Tool, Resource, Prompt, ToolCallResult };
