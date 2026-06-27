/**
 * Server 端 PostMessage Transport 实现
 */

import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { type ServerTransportOptions } from "./types.js";
import {
  type PostMessageListener,
  createPostMessageListener,
  sendPostMessage,
} from "./postmessage.js";

/**
 * 基于 PostMessage 的 Server Transport
 * 用于主页面与 iframe 之间的 MCP 通信
 */
export class PostMessageServerTransport implements Transport {
  private targetWindow: Window | null = null;
  private targetOrigin: string;
  private allowedOrigins: string[] | undefined;
  private listener: PostMessageListener | null = null;
  private started = false;

  onmessage?: (message: JSONRPCMessage) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;
  private options: ServerTransportOptions;

  constructor(options: ServerTransportOptions) {
    this.options = options;
    this.targetOrigin = options.targetOrigin ?? "*";
    this.allowedOrigins = options.allowedOrigins;
  }

  /**
   * 获取目标窗口
   */
  private getTargetWindow(): Window {
    // 支持 'parent' 模式：Server 在 iframe 中运行，与父窗口通信
    if (this.options.target === "parent") {
      if (window === window.parent) {
        throw new Error("使用 'parent' 模式时，Server 必须在 iframe 中运行");
      }
      return window.parent;
    }

    if (this.options.target instanceof HTMLIFrameElement) {
      if (!this.options.target.contentWindow) {
        throw new Error("iframe contentWindow 不可用");
      }
      return this.options.target.contentWindow;
    }
    return this.options.target;
  }

  /**
   * 启动 Transport，开始监听消息
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.targetWindow = this.getTargetWindow();

    // 清理可能存在的旧监听器
    if (this.listener) {
      try {
        this.listener.cancel();
      } catch (err) {
        console.error("取消监听器失败:", err);
      }
      this.listener = null;
    }

    try {
      // 监听来自 Client 的消息
      this.listener = createPostMessageListener(
        this.targetWindow,
        this.allowedOrigins,
        (data) => {
          if (this.onmessage) {
            this.onmessage(data as JSONRPCMessage);
          }
        }
      );

      this.started = true;
    } catch (error) {
      this.started = false;
      if (this.onerror) {
        this.onerror(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  }

  /**
   * 发送消息到 Client
   */
  async send(message: JSONRPCMessage): Promise<void> {
    if (!this.targetWindow) {
      throw new Error("Transport 未启动");
    }

    try {
      sendPostMessage(this.targetWindow, message, this.targetOrigin);
    } catch (error) {
      if (this.onerror) {
        this.onerror(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    }
  }

  /**
   * 关闭 Transport
   */
  async close(): Promise<void> {
    if (this.listener) {
      this.listener.cancel();
      this.listener = null;
    }
    this.targetWindow = null;
    this.started = false;

    if (this.onclose) {
      this.onclose();
    }
  }
}

/**
 * 创建 Server Transport
 */
export function createServerTransport(
  options: ServerTransportOptions
): PostMessageServerTransport {
  return new PostMessageServerTransport(options);
}
