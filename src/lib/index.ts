/**
 * PostMessage MCP 库入口
 * 
 * 提供基于 postMessage 的 MCP 通信能力
 */

// Transport 层
export {
  PostMessageServerTransport,
  PostMessageClientTransport,
  createServerTransport,
  createClientTransport,
  type ServerTransportOptions,
  type ClientTransportOptions,
  type TransportState,
  MCP_MESSAGE_EVENT,
} from './transport/index.js';

// Server
export {
  McpServer,
  createMcpServer,
  type McpServerOptions,
  type ToolDefinition,
  type ResourceDefinition,
  type PromptDefinition,
  type ToolCallInput,
  type ToolCallResult,
  type ToolInfo,
  type ResourceInfo,
  type PromptInfo,
  type PromptArgument,
  type ResourceReadHandler,
  type PromptGetHandler,
} from './server/index.js';

// Client
export {
  McpClient,
  createMcpClient,
  type McpClientOptions,
  type CallToolParams,
  type ReadResourceParams,
  type GetPromptParams,
  type ServerInfo,
  type ClientState,
  type Tool,
  type Resource,
  type Prompt,
} from './client/index.js';

// React Hooks
export {
  useMcpServer,
  useMcpClient,
  type UseMcpServerOptions,
  type UseMcpServerReturn,
  type UseMcpClientOptions,
  type UseMcpClientReturn,
} from './hooks/index.js';

