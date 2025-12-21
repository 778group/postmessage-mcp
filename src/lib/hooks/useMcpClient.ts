/**
 * MCP Client React Hook
 */

import { useCallback, useEffect, useState } from "react";
import type {
  Tool,
  Resource,
  Prompt,
} from "@modelcontextprotocol/sdk/types.js";
import {
  McpClient,
  type McpClientOptions,
  type ServerInfo,
  type ClientState,
} from "../client/index.js";
import type { ClientTransportOptions } from "../transport/index.js";
import type { ToolCallResult } from "../server/types.js";

/**
 * useMcpClient Hook 配置
 */
export interface UseMcpClientOptions extends McpClientOptions {
  /**
   * Transport 配置
   */
  transportOptions?: ClientTransportOptions;
  /**
   * iframe 元素的 ref（反向模式使用）
   * 设置后，Client 在主页面中运行，与 iframe 中的 Server 通信
   */
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  /**
   * 连接后是否自动获取 tools/resources/prompts 列表
   */
  autoFetch?: boolean;
  /**
   * 是否自动连接
   */
  autoConnect?: boolean;
  /**
   * 允许通信的域名白名单列表，不配置则允许所有域名
   * 支持精确匹配和通配符，如：['https://example.com', '*.example.com']
   */
  allowedOrigins?: string[];
}

/**
 * useMcpClient Hook 返回值
 */
export interface UseMcpClientReturn {
  /**
   * MCP Client 实例
   */
  client: McpClient;
  /**
   * 连接状态
   */
  state: ClientState;
  /**
   * 是否已连接
   */
  isConnected: boolean;
  /**
   * 连接错误
   */
  error: Error | null;
  /**
   * Server 信息
   */
  serverInfo: ServerInfo | null;
  /**
   * 工具列表
   */
  tools: Tool[];
  /**
   * 资源列表
   */
  resources: Resource[];
  /**
   * Prompts 列表
   */
  prompts: Prompt[];
  /**
   * 连接到 Server
   */
  connect: () => Promise<ServerInfo>;
  /**
   * 断开连接
   */
  disconnect: () => Promise<void>;
  /**
   * 刷新工具列表
   */
  refreshTools: () => Promise<Tool[]>;
  /**
   * 刷新资源列表
   */
  refreshResources: () => Promise<Resource[]>;
  /**
   * 刷新 Prompts 列表
   */
  refreshPrompts: () => Promise<Prompt[]>;
  /**
   * 调用工具
   */
  callTool: (
    name: string,
    args?: Record<string, unknown>
  ) => Promise<ToolCallResult>;
  /**
   * 读取资源
   */
  readResource: (uri: string) => Promise<{
    contents: Array<{
      uri: string;
      mimeType?: string;
      text?: string;
      blob?: string;
    }>;
  }>;
  /**
   * 获取 Prompt
   */
  getPrompt: (
    name: string,
    args?: Record<string, string>
  ) => Promise<{
    description?: string;
    messages: Array<{
      role: "user" | "assistant";
      content: {
        type: "text" | "image" | "resource";
        text?: string;
        data?: string;
        mimeType?: string;
      };
    }>;
  }>;
}

/**
 * MCP Client React Hook
 * 用于在 React 组件中创建和管理 MCP Client
 */
export function useMcpClient(
  options: UseMcpClientOptions = {}
): UseMcpClientReturn {
  const {
    transportOptions,
    iframeRef,
    autoConnect = true,
    autoFetch = true,
    allowedOrigins,
    ...clientOptions
  } = options;

  // 使用 useState 保存 client 实例，避免重复创建
  const [client] = useState<McpClient>(() => new McpClient(clientOptions));

  const [state, setState] = useState<ClientState>("disconnected");
  const [error, setError] = useState<Error | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  // 刷新工具列表
  const refreshTools = useCallback(async () => {
    const result = await client.listTools();
    setTools(result);
    return result;
  }, [client]);

  // 刷新资源列表
  const refreshResources = useCallback(async () => {
    const result = await client.listResources();
    setResources(result);
    return result;
  }, [client]);

  // 刷新 Prompts 列表
  const refreshPrompts = useCallback(async () => {
    const result = await client.listPrompts();
    setPrompts(result);
    return result;
  }, [client]);

  // 连接函数
  const connect = useCallback(async () => {
    // 如果已经在连接中或已连接，不重复连接
    if (
      client.getState() === "connecting" ||
      client.getState() === "connected"
    ) {
      if (client.getState() === "connected") {
        const info = client.getServerInfo();
        if (info) return info;
      }
      // 如果正在连接，等待完成
      return new Promise<ServerInfo>((resolve, reject) => {
        const checkInterval = setInterval(() => {
          const currentState = client.getState();
          if (currentState === "connected") {
            const info = client.getServerInfo();
            clearInterval(checkInterval);
            if (info) {
              resolve(info);
            } else {
              reject(new Error("连接成功但未获取到服务器信息"));
            }
          } else if (
            currentState === "error" ||
            currentState === "disconnected"
          ) {
            clearInterval(checkInterval);
            reject(new Error("连接失败"));
          }
        }, 100);
        // 超时保护
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error("连接超时"));
        }, 5000);
      });
    }

    try {
      setError(null);
      setState("connecting");

      // 如果指定了 iframeRef，使用反向模式（主页面作为 Client）
      const target = iframeRef?.current?.contentWindow;
      const finalTransportOptions: ClientTransportOptions = {
        ...transportOptions,
        allowedOrigins: allowedOrigins ?? transportOptions?.allowedOrigins,
        ...(target ? { target } : {}),
      };

      const info = await client.connect(finalTransportOptions);
      setServerInfo(info);
      setState("connected");

      // 自动获取列表
      if (autoFetch) {
        await Promise.all([
          refreshTools().catch((err) => {
            console.error("刷新工具列表失败:", err);
          }),
          refreshResources().catch((err) => {
            console.error("刷新资源列表失败:", err);
          }),
          refreshPrompts().catch(() => {}),
        ]);
      }

      return info;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setState("error");
      throw error;
    }
  }, [
    client,
    transportOptions,
    iframeRef,
    allowedOrigins,
    autoFetch,
    refreshTools,
    refreshResources,
    refreshPrompts,
  ]);

  // 断开连接函数
  const disconnect = useCallback(async () => {
    await client.disconnect();
    setState("disconnected");
    setServerInfo(null);
    setTools([]);
    setResources([]);
    setPrompts([]);
  }, [client]);

  // 调用工具
  const callTool = useCallback(
    async (name: string, args?: Record<string, unknown>) => {
      return await client.callTool(name, args);
    },
    [client]
  );

  // 读取资源
  const readResource = useCallback(
    async (uri: string) => {
      return await client.readResource(uri);
    },
    [client]
  );

  // 获取 Prompt
  const getPrompt = useCallback(
    async (name: string, args?: Record<string, string>) => {
      return await client.getPrompt(name, args);
    },
    [client]
  );

  // 自动连接
  useEffect(() => {
    if (!autoConnect) return;

    // 反向模式：Client 在主页面中运行，与 iframe 中的 Server 通信
    if (iframeRef) {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const handleLoad = () => {
        setTimeout(() => {
          connect().catch(console.error);
        }, 0);
      };

      // 如果 iframe 已经加载完成
      if (iframe.contentDocument?.readyState === "complete") {
        setTimeout(() => {
          connect().catch(console.error);
        }, 0);
      } else {
        iframe.addEventListener("load", handleLoad);
        return () => iframe.removeEventListener("load", handleLoad);
      }
      return;
    }

    // 默认模式：检查是否在 iframe 中
    if (window === window.parent) {
      console.warn(
        "MCP Client 默认模式需要在 iframe 中运行，或使用 iframeRef 指定目标"
      );
      return;
    }

    // 使用 ref 来防止重复连接
    let mounted = true;
    const doConnect = async () => {
      if (mounted) {
        try {
          await connect();
        } catch (err) {
          if (mounted) {
            console.error("自动连接失败:", err);
          }
        }
      }
    };

    doConnect();

    return () => {
      mounted = false;
    };
  }, [autoConnect, connect, iframeRef]);

  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      client.disconnect().catch(console.error);
    };
  }, [client]);

  return {
    client,
    state,
    isConnected: state === "connected",
    error,
    serverInfo,
    tools,
    resources,
    prompts,
    connect,
    disconnect,
    refreshTools,
    refreshResources,
    refreshPrompts,
    callTool,
    readResource,
    getPrompt,
  };
}
