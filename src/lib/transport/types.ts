/**
 * PostMessage Transport 类型定义
 */

import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";

/**
 * MCP 消息类型
 */
export type McpMessage = JSONRPCMessage;

/**
 * PostMessage 通信事件名称
 */
export const MCP_MESSAGE_EVENT = "mcp-message";

/**
 * Transport 状态
 */
export type TransportState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/**
 * Transport 事件监听器
 */
export interface TransportEventHandlers {
  onMessage?: (message: McpMessage) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

/**
 * Server Transport 配置
 */
export interface ServerTransportOptions {
  /**
   * 目标 iframe 元素、Window 对象，或 'parent' 表示父窗口
   * 当设置为 'parent' 时，Server 运行在 iframe 中，与父窗口通信
   */
  target: HTMLIFrameElement | Window | "parent";
  /**
   * 允许的 origin，默认为 '*'
   */
  targetOrigin?: string;
  /**
   * 允许通信的域名白名单列表，不配置则允许所有域名
   * 支持精确匹配和通配符，如：['https://example.com', '*.example.com']
   */
  allowedOrigins?: string[];
}

/**
 * Client Transport 配置
 */
export interface ClientTransportOptions {
  /**
   * 目标窗口，可以是：
   * - 父窗口（默认 window.parent，用于 iframe 中的 Client）
   * - iframe 的 contentWindow（用于主页面中的 Client 调用 iframe 中的 Server）
   */
  target?: Window;
  /**
   * @deprecated 使用 target 代替
   */
  parent?: Window;
  /**
   * 允许的 origin，默认为 '*'
   */
  targetOrigin?: string;
  /**
   * 允许通信的域名白名单列表，不配置则允许所有域名
   * 支持精确匹配和通配符，如：['https://example.com', '*.example.com']
   */
  allowedOrigins?: string[];
}
