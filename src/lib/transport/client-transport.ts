/**
 * Client 端 PostMessage Transport 实现
 */

import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { type ClientTransportOptions } from "./types.js";
import {
  type PostMessageListener,
  createPostMessageListener,
  sendPostMessage,
  isReadyHandshake,
  createReadyMessage,
} from "./postmessage.js";
import { MCP_READY_EVENT, MCP_READY_ACK_EVENT } from "./types.js";

/**
 * 基于 PostMessage 的 Client Transport
 * 用于 iframe 与主页面之间的 MCP 通信
 *
 * 支持两种模式：
 * 1. 默认模式：Client 在 iframe 中运行，与父窗口的 Server 通信
 * 2. 反向模式：Client 在主页面中运行，与 iframe 中的 Server 通信（通过指定 target）
 */
export class PostMessageClientTransport implements Transport {
  private targetWindow: Window;
  private targetOrigin: string;
  private allowedOrigins: string[] | undefined;
  private listener: PostMessageListener | null = null;
  private started = false;
  private isReverseMode = false;

  // Ready handshake
  private _readyPromise: Promise<void>;
  private _readyResolve!: () => void;

  onmessage?: (message: JSONRPCMessage) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;

  constructor(options: ClientTransportOptions = {}) {
    // 支持新的 target 参数，同时兼容旧的 parent 参数
    this.targetWindow = options.target ?? options.parent ?? window.parent;
    this.targetOrigin = options.targetOrigin ?? "*";
    this.allowedOrigins = options.allowedOrigins;
    // 如果明确指定了 target，则为反向模式
    this.isReverseMode = !!(
      options.target && options.target !== window.parent
    );

    this._readyPromise = new Promise((resolve) => {
      this._readyResolve = resolve;
    });

    // 立即设置消息监听，处理握手协议
    this.setupListener();
  }

  /**
   * 设置 postMessage 监听器（构造时即启动）
   */
  private setupListener(): void {
    if (this.listener) {
      this.listener.cancel();
      this.listener = null;
    }

    this.listener = createPostMessageListener(
      this.targetWindow,
      this.allowedOrigins,
      (data, _event) => {
        if (isReadyHandshake(data)) {
          const msg = data as { method: string };
          if (msg.method === MCP_READY_ACK_EVENT || msg.method === MCP_READY_EVENT) {
            this._readyResolve();
          }
          return;
        }
        // 非握手消息，转发给 MCP 协议层
        if (this.started && this.onmessage) {
          this.onmessage(data as JSONRPCMessage);
        }
      }
    );
  }

  /**
   * 启动 Transport（发送 ready）
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    // 仅在默认模式（非反向模式）下检查是否在 iframe 中
    if (!this.isReverseMode && window === window.parent) {
      throw new Error(
        "Client Transport 默认模式必须在 iframe 中运行，或使用 target 参数指定目标窗口"
      );
    }

    try {
      this.started = true;

      // 发送 ready 信号
      sendPostMessage(
        this.targetWindow,
        createReadyMessage(MCP_READY_EVENT),
        this.targetOrigin
      );
    } catch (error) {
      this.started = false;
      if (this.onerror) {
        this.onerror(
          error instanceof Error ? error : new Error(String(error))
        );
      }
      throw error;
    }
  }

  /**
   * 等待握手完成（对方确认 ready）
   * @param timeoutMs 超时时间（毫秒），默认 10000ms
   */
  waitForReady(timeoutMs = 10000): Promise<void> {
    return Promise.race([
      this._readyPromise,
      new Promise<void>((_, reject) =>
        setTimeout(
          () => reject(new Error(`握手超时（${timeoutMs}ms）`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * 发送消息到 Server
   */
  async send(message: JSONRPCMessage): Promise<void> {
    if (!this.started) {
      throw new Error("Transport 未启动");
    }

    try {
      sendPostMessage(this.targetWindow, message, this.targetOrigin);
    } catch (error) {
      if (this.onerror) {
        this.onerror(
          error instanceof Error ? error : new Error(String(error))
        );
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

    // 重置 ready promise
    this._readyPromise = new Promise((resolve) => {
      this._readyResolve = resolve;
    });

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
