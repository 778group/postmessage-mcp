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
  isReadyHandshake,
  createReadyMessage,
} from "./postmessage.js";
import { MCP_READY_EVENT, MCP_READY_ACK_EVENT } from "./types.js";

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
  private options: ServerTransportOptions;

  // Ready handshake
  private _readyPromise: Promise<void>;
  private _readyResolve!: () => void;

  // 握手完成后记录 Client 窗口，后续消息仅接受该窗口来源
  private clientWindow: Window | null = null;

  onmessage?: (message: JSONRPCMessage) => void;
  onerror?: (error: Error) => void;
  onclose?: () => void;

  constructor(options: ServerTransportOptions) {
    this.options = options;
    this.targetOrigin = options.targetOrigin ?? "*";
    this.allowedOrigins = options.allowedOrigins;

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

    // targetWindow 为 null 时不过滤 source，由 allowedOrigins 控制安全
    // 握手完成后通过 clientWindow 限定消息来源
    this.listener = createPostMessageListener(
      null,
      this.allowedOrigins,
      (data, event) => {
        if (isReadyHandshake(data)) {
          this.handleReadyMessage(data, event);
          return;
        }
        // 握手完成后，校验消息来源是否与握手时的窗口一致
        if (this.clientWindow && event.source !== this.clientWindow) {
          return;
        }
        // 非握手消息，转发给 MCP 协议层
        if (this.started && this.onmessage) {
          this.onmessage(data as JSONRPCMessage);
        }
      },
    );
  }

  /**
   * 处理握手消息
   */
  private handleReadyMessage(
    data: { method: string },
    event: MessageEvent,
  ): void {
    if (data.method === MCP_READY_EVENT) {
      // 记录 Client 窗口来源，后续仅接受该窗口的消息
      if (event.source) {
        this.clientWindow = event.source as Window;
        let ackOrigin = event.origin;
        if (event.origin === "null") {
          console.warn(
            "收到来自 null origin 的握手请求（可能来自 file:// 协议或 sandbox iframe），ack 将使用 '*' 作为 targetOrigin",
          );
          ackOrigin = "*";
        }
        sendPostMessage(
          event.source as Window,
          createReadyMessage(MCP_READY_ACK_EVENT),
          ackOrigin,
        );
      }
      this._readyResolve();
    } else if (data.method === MCP_READY_ACK_EVENT) {
      this._readyResolve();
    }
  }

  /**
   * 获取目标窗口
   */
  private getTargetWindow(): Window {
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
   * 启动 Transport（发送 ready 并标记为已启动）
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    this.targetWindow = this.getTargetWindow();

    try {
      this.started = true;

      // 发送 ready 信号
      if (this.targetWindow) {
        sendPostMessage(
          this.targetWindow,
          createReadyMessage(MCP_READY_EVENT),
          this.targetOrigin,
        );
      }
    } catch (error) {
      this.started = false;
      if (this.onerror) {
        this.onerror(error instanceof Error ? error : new Error(String(error)));
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
          timeoutMs,
        ),
      ),
    ]);
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
    this.clientWindow = null;

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
 * 创建 Server Transport
 */
export function createServerTransport(
  options: ServerTransportOptions,
): PostMessageServerTransport {
  return new PostMessageServerTransport(options);
}
