/**
 * Client 端 PostMessage Transport 实现
 */

import * as postRobot from "post-robot";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { MCP_MESSAGE_EVENT, type ClientTransportOptions } from "./types.js";

/**
 * 基于 PostMessage 的 Client Transport
 * 用于 iframe 与主页面之间的 MCP 通信
 */
export class PostMessageClientTransport implements Transport {
  private parentWindow: Window;
  private targetOrigin: string;
  private allowedOrigins: string[] | undefined;
  private listener: ReturnType<typeof postRobot.on> | null = null;
  private started = false;

  onmessage?: (message: JSONRPCMessage) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;

  constructor(options: ClientTransportOptions = {}) {
    this.parentWindow = options.parent ?? window.parent;
    this.targetOrigin = options.targetOrigin ?? "*";
    this.allowedOrigins = options.allowedOrigins;
  }

  /**
   * 检查 origin 是否在白名单中
   */
  private isOriginAllowed(origin: string): boolean {
    // 如果未配置白名单，允许所有
    if (!this.allowedOrigins || this.allowedOrigins.length === 0) {
      return true;
    }

    for (const allowed of this.allowedOrigins) {
      // 精确匹配
      if (allowed === origin) {
        return true;
      }

      // 通配符匹配 (*.example.com)
      if (allowed.startsWith("*.")) {
        const domain = allowed.slice(2);
        if (origin.endsWith(domain) || origin.endsWith("." + domain)) {
          return true;
        }
      }

      // 通配符匹配 (https://*.example.com)
      if (allowed.includes("://*.")) {
        const [protocol, rest] = allowed.split("://");
        if (rest.startsWith("*.")) {
          const domain = rest.slice(2);
          if (origin.startsWith(protocol + "://") && 
              (origin.endsWith(domain) || origin.endsWith("." + domain))) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * 启动 Transport，开始监听消息
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    // 检查是否在 iframe 中
    if (window === window.parent && !this.parentWindow) {
      throw new Error("Client Transport 必须在 iframe 中运行");
    }

    // 清理可能存在的旧监听器
    if (this.listener) {
      try {
        this.listener.cancel();
      } catch (err) {
        // 忽略取消错误
      }
      this.listener = null;
    }

    // 等待一小段时间，确保父窗口的 Server 已经准备好监听
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // 监听来自 Server 的消息
      this.listener = postRobot.on(
        MCP_MESSAGE_EVENT,
        { window: this.parentWindow, domain: this.targetOrigin },
        ({ origin, data }) => {
          // 检查 origin 白名单
          if (!this.isOriginAllowed(origin)) {
            console.warn(`拒绝来自未授权域名的消息: ${origin}`);
            return Promise.resolve({ received: false, error: "Origin not allowed" });
          }

          if (this.onmessage) {
            this.onmessage(data as JSONRPCMessage);
          }
          return Promise.resolve({ received: true });
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
   * 发送消息到 Server
   */
  async send(message: JSONRPCMessage): Promise<void> {
    if (!this.started) {
      throw new Error("Transport 未启动");
    }

    try {
      await postRobot.send(this.parentWindow, MCP_MESSAGE_EVENT, message, {
        domain: this.targetOrigin,
      });
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
    this.started = false;

    if (this.onclose) {
      this.onclose();
    }
  }
}

/**
 * 创建 Client Transport
 */
export function createClientTransport(
  options?: ClientTransportOptions
): PostMessageClientTransport {
  return new PostMessageClientTransport(options);
}
