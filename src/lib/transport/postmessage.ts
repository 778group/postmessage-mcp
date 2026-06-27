/**
 * 原生 postMessage 工具函数
 */

import { MCP_MESSAGE_EVENT } from "./types.js";

/**
 * 消息数据结构
 */
interface PostMessageData {
  type: string;
  data: unknown;
}

/**
 * Listener 对象，含 cancel 方法用于取消监听
 */
export interface PostMessageListener {
  cancel: () => void;
}

/**
 * 检查 origin 是否在白名单中
 */
export function isOriginAllowed(
  origin: string,
  allowedOrigins?: string[]
): boolean {
  if (!allowedOrigins || allowedOrigins.length === 0) {
    return true;
  }

  for (const allowed of allowedOrigins) {
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
        if (
          origin.startsWith(protocol + "://") &&
          (origin.endsWith(domain) || origin.endsWith("." + domain))
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * 创建 postMessage 监听器
 *
 * @param targetWindow - 要监听的目标窗口（用于校验 source），null 表示不校验
 * @param allowedOrigins - origin 白名单
 * @param onMessage - 收到消息时的回调
 * @returns 含 cancel() 方法的 listener 对象
 */
export function createPostMessageListener(
  targetWindow: Window | null,
  allowedOrigins: string[] | undefined,
  onMessage: (data: unknown, event: MessageEvent) => void
): PostMessageListener {
  const handler = (event: MessageEvent) => {
    // 校验 source
    if (targetWindow && event.source !== targetWindow) {
      return;
    }

    // 校验消息格式
    const payload = event.data as PostMessageData | undefined;
    if (!payload || payload.type !== MCP_MESSAGE_EVENT) {
      return;
    }

    // 校验 origin
    if (!isOriginAllowed(event.origin, allowedOrigins)) {
      console.warn(`拒绝来自未授权域名的消息: ${event.origin}`);
      return;
    }

    onMessage(payload.data, event);
  };

  window.addEventListener("message", handler);

  return {
    cancel: () => {
      window.removeEventListener("message", handler);
    },
  };
}

/**
 * 判断消息是否为握手消息
 */
export function isReadyHandshake(data: unknown): data is { method: string } {
  const msg = data as Record<string, unknown> | undefined;
  return (
    typeof msg === "object" &&
    msg !== null &&
    (msg.method === "__mcp_ready__" || msg.method === "__mcp_ready_ack__")
  );
}

/**
 * 创建握手消息
 */
export function createReadyMessage(
  type: string
): { jsonrpc: string; method: string; params: Record<string, never> } {
  return { jsonrpc: "2.0", method: type, params: {} };
}

/**
 * 通过 postMessage 发送消息
 *
 * @param targetWindow - 目标窗口
 * @param data - 要发送的数据
 * @param targetOrigin - 目标 origin，默认 "*"
 */
export function sendPostMessage(
  targetWindow: Window,
  data: unknown,
  targetOrigin: string = "*"
): void {
  const payload: PostMessageData = {
    type: MCP_MESSAGE_EVENT,
    data,
  };
  targetWindow.postMessage(payload, targetOrigin);
}
