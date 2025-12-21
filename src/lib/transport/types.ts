/**
 * PostMessage Transport 类型定义
 */

import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP 消息类型
 */
export type McpMessage = JSONRPCMessage;

/**
 * PostMessage 通信事件名称
 */
export const MCP_MESSAGE_EVENT = 'mcp-message';

/**
 * Transport 状态
 */
export type TransportState = 'disconnected' | 'connecting' | 'connected' | 'error';

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
   * 目标 iframe 元素或 Window 对象
   */
  target: HTMLIFrameElement | Window;
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
   * 父窗口，默认为 window.parent
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

