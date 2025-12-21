/**
 * MCP Server React Hook
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  McpServer,
  type McpServerOptions,
  type ToolDefinition,
  type ResourceDefinition,
  type PromptDefinition,
} from "../server/index.js";

/**
 * useMcpServer Hook 配置
 */
export interface UseMcpServerOptions extends McpServerOptions {
  /**
   * iframe 元素的 ref
   */
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  /**
   * 目标窗口（如果不使用 iframeRef）
   */
  targetWindow?: Window;
  /**
   * 允许的 origin
   */
  targetOrigin?: string;
  /**
   * 允许通信的域名白名单列表，不配置则允许所有域名
   * 支持精确匹配和通配符，如：['https://example.com', '*.example.com']
   */
  allowedOrigins?: string[];
  /**
   * 是否自动连接
   */
  autoConnect?: boolean;
}

/**
 * useMcpServer Hook 返回值
 */
export interface UseMcpServerReturn {
  /**
   * MCP Server 实例
   */
  server: McpServer;
  /**
   * 是否已连接
   */
  isConnected: boolean;
  /**
   * 连接错误
   */
  error: Error | null;
  /**
   * 连接到 iframe
   */
  connect: () => Promise<void>;
  /**
   * 断开连接
   */
  disconnect: () => Promise<void>;
  /**
   * 添加工具
   */
  addTool: (tool: ToolDefinition) => void;
  /**
   * 移除工具
   */
  removeTool: (name: string) => void;
  /**
   * 添加资源
   */
  addResource: (resource: ResourceDefinition) => void;
  /**
   * 移除资源
   */
  removeResource: (uri: string) => void;
  /**
   * 添加 Prompt
   */
  addPrompt: (prompt: PromptDefinition) => void;
  /**
   * 移除 Prompt
   */
  removePrompt: (name: string) => void;
}

/**
 * MCP Server React Hook
 * 用于在 React 组件中创建和管理 MCP Server
 */
export function useMcpServer(options: UseMcpServerOptions): UseMcpServerReturn {
  const {
    iframeRef,
    targetWindow,
    targetOrigin,
    allowedOrigins,
    autoConnect = true,
    ...serverOptions
  } = options;

  // 使用 ref 保存 server 实例，避免重复创建
  const serverRef = useRef<McpServer | null>(null);
  if (!serverRef.current) {
    serverRef.current = new McpServer(serverOptions);
  }
  const server = serverRef.current;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 连接函数
  const connect = useCallback(async () => {
    try {
      setError(null);

      const target = targetWindow ?? iframeRef?.current;
      if (!target) {
        throw new Error("未指定目标 iframe 或窗口");
      }

      await server.connect(target, { targetOrigin, allowedOrigins });
      setIsConnected(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsConnected(false);
      throw error;
    }
  }, [server, iframeRef, targetWindow, targetOrigin, allowedOrigins]);

  // 断开连接函数
  const disconnect = useCallback(async () => {
    await server.disconnect();
    setIsConnected(false);
  }, [server]);

  // 添加工具
  const addTool = useCallback(
    (tool: ToolDefinition) => {
      server.addTool(tool);
    },
    [server]
  );

  // 移除工具
  const removeTool = useCallback(
    (name: string) => {
      server.removeTool(name);
    },
    [server]
  );

  // 添加资源
  const addResource = useCallback(
    (resource: ResourceDefinition) => {
      server.addResource(resource);
    },
    [server]
  );

  // 移除资源
  const removeResource = useCallback(
    (uri: string) => {
      server.removeResource(uri);
    },
    [server]
  );

  // 添加 Prompt
  const addPrompt = useCallback(
    (prompt: PromptDefinition) => {
      server.addPrompt(prompt);
    },
    [server]
  );

  // 移除 Prompt
  const removePrompt = useCallback(
    (name: string) => {
      server.removePrompt(name);
    },
    [server]
  );

  // 自动连接
  useEffect(() => {
    if (!autoConnect) return;

    const target = targetWindow ?? iframeRef?.current;
    if (!target) return;

    // 如果是 iframe，等待 load 事件
    if (iframeRef?.current) {
      const iframe = iframeRef.current;

      const handleLoad = () => {
        connect().catch(console.error);
      };

      // 如果 iframe 已经加载完成
      if (iframe.contentDocument?.readyState === "complete") {
        connect().catch(console.error);
      } else {
        iframe.addEventListener("load", handleLoad);
        return () => iframe.removeEventListener("load", handleLoad);
      }
    } else {
      connect().catch(console.error);
    }
  }, [autoConnect, connect, iframeRef, targetWindow]);

  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      server.disconnect().catch(console.error);
    };
  }, [server]);

  return {
    server,
    isConnected,
    error,
    connect,
    disconnect,
    addTool,
    removeTool,
    addResource,
    removeResource,
    addPrompt,
    removePrompt,
  };
}
