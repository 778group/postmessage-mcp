/**
 * Server 端 PostMessage Transport 实现
 */

import * as postRobot from "post-robot";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { MCP_MESSAGE_EVENT, type ServerTransportOptions } from "./types.js";

/**
 * 基于 PostMessage 的 Server Transport
 * 用于主页面与 iframe 之间的 MCP 通信
 */
export class PostMessageServerTransport implements Transport {
  private targetWindow: Window | null = null;
  private targetOrigin: string;
  private allowedOrigins: string[] | undefined;
  private listener: ReturnType<typeof postRobot.on> | null = null;
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
   * 获取目标窗口
   */
  private getTargetWindow(): Window {
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
        // 忽略取消错误
      }
      this.listener = null;
    }

    try {
      // 监听来自 Client 的消息
      this.listener = postRobot.on(
        MCP_MESSAGE_EVENT,
        { window: this.targetWindow, domain: this.targetOrigin },
        ({ origin, data }) => {
          // 检查 origin 白名单
          if (!this.isOriginAllowed(origin)) {
            console.warn(`拒绝来自未授权域名的消息: ${origin}`);
            return Promise.resolve({ received: false, error: "Origin not allowed" });
          }

          if (this.onmessage) {
            this.onmessage(data as JSONRPCMessage);
          }
          // post-robot 需要返回响应，但 MCP Transport 是单向的
          // 响应通过单独的 send 调用发送
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
   * 发送消息到 Client
   */
  async send(message: JSONRPCMessage): Promise<void> {
    if (!this.targetWindow) {
      throw new Error("Transport 未启动");
    }

    try {
      await postRobot.send(this.targetWindow, MCP_MESSAGE_EVENT, message, {
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
