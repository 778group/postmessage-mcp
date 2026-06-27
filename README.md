# PostMessage MCP

[English](./README.en.md)

基于 PostMessage 的 Model Context Protocol (MCP) 实现，支持 iframe 和窗口之间的双向通信。

## 特性

- 🤝 内置握手机制，杜绝连接时序问题
- 🔒 支持域名白名单控制，确保通信安全
- 🚀 基于 PostMessage API，跨域通信更安全
- 🎯 完整支持 MCP 协议（Tools、Resources、Prompts）
- ⚛️ React Hooks 封装，易于集成
- 📦 TypeScript 支持，类型安全
- 🔄 支持双向模式：主页面/iframe 都可以作为 Server 或 Client

## 安装

### 作为 npm 包使用

```bash
npm install postmessage-mcp
# 或
pnpm add postmessage-mcp
# 或
yarn add postmessage-mcp
```

### 开发环境安装

```bash
pnpm install
```

## 快速开始

### 基本用法（主页面作为 Server，iframe 作为 Client）

**主页面（Server）**：

```typescript
import { useMcpServer } from 'postmessage-mcp';
import { useRef, useEffect } from 'react';

function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const { addTool, isConnected } = useMcpServer({
    name: 'my-server',
    version: '1.0.0',
    iframeRef,
    autoConnect: true,
  });

  // 注册工具（在 useEffect 中注册，避免渲染期间副作用）
  useEffect(() => {
    addTool({
      name: 'greet',
      description: '问候工具',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
      handler: async (input) => {
        return {
          content: [{ type: 'text', text: `Hello, ${input.name}!` }],
        };
      },
    });
  }, [addTool]);

  return (
    <div>
      <div>状态: {isConnected ? '已连接' : '未连接'}</div>
      <iframe ref={iframeRef} src="/client.html" />
    </div>
  );
}
```

**iframe 页面（Client）**：

```typescript
import { useMcpClient } from 'postmessage-mcp';

function ClientApp() {
  const { tools, callTool, isConnected } = useMcpClient({
    name: 'my-client',
    version: '1.0.0',
    autoConnect: true,
  });

  const handleGreet = async () => {
    const result = await callTool('greet', { name: 'World' });
    console.log(result);
  };

  return (
    <div>
      <div>状态: {isConnected ? '已连接' : '未连接'}</div>
      <button onClick={handleGreet}>调用工具</button>
    </div>
  );
}
```

### 反向模式（iframe 作为 Server，主页面作为 Client）

**iframe 页面（Server）**：

```typescript
import { useMcpServer } from 'postmessage-mcp';

function IframeServer() {
  const { addTool } = useMcpServer({
    name: 'iframe-server',
    version: '1.0.0',
    asIframe: true, // 关键：设置为 true 表示 Server 在 iframe 中运行
    autoConnect: true,
  });

  // 注册工具...
}
```

**主页面（Client）**：

```typescript
import { useMcpClient } from 'postmessage-mcp';
import { useRef } from 'react';

function ParentClient() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const { callTool } = useMcpClient({
    name: 'parent-client',
    version: '1.0.0',
    iframeRef, // 指定 iframe，Client 将与其中的 Server 通信
    autoConnect: true,
  });

  // 使用工具...
}
```

## 握手机制

为避免连接时序问题（iframe 中的 Client 先于父页面的 Server 发送消息导致消息丢失），传输层内置了 Ready 握手机制：

1. Transport 在**构造时**即通过 `addEventListener('message')` 启动监听，不依赖 `start()` 调用时机
2. Client 调用 `connect()` 时发送 `__mcp_ready__` 信号
3. Server 收到 ready 后通过 `event.source` 回复 `__mcp_ready_ack__`
4. Client 收到 ack 后才发送 MCP `initialize`，开始正式通信

握手由传输层内部处理，对上层 MCP 协议透明，无需使用者额外配置。

## 域名白名单功能

为了增强安全性，本项目支持对 iframe 和窗口通信进行域名白名单控制。

### Server 端配置

```typescript
import { useMcpServer } from 'postmessage-mcp';

const { server, connect } = useMcpServer({
  iframeRef: iframeRef,
  targetOrigin: 'https://example.com',
  // 配置允许的域名白名单
  allowedOrigins: [
    'https://example.com',           // 精确匹配
    'https://*.example.com',         // 支持协议的通配符
    '*.trusted-domain.com',          // 通配符匹配
  ],
  autoConnect: true,
});
```

### Client 端配置

```typescript
import { useMcpClient } from 'postmessage-mcp';

const { client, connect } = useMcpClient({
  // 配置允许的域名白名单
  allowedOrigins: [
    'https://parent-domain.com',
    '*.trusted-domain.com',
  ],
  autoConnect: true,
});
```

### 白名单规则说明

- **精确匹配**：`https://example.com` - 只允许完全匹配的域名
- **域名通配符**：`*.example.com` - 允许所有 example.com 的子域名
- **带协议通配符**：`https://*.example.com` - 只允许 https 协议的 example.com 子域名
- **不配置白名单**：默认允许所有域名（不推荐在生产环境使用）

### 安全建议

1. 在生产环境中始终配置 `allowedOrigins`
2. 避免使用 `targetOrigin: '*'` 配合空白名单
3. 尽量使用精确匹配而非通配符
4. 定期审查和更新白名单配置

## 开发

```bash
# 开发服务器
pnpm dev

# 构建应用
pnpm build

# 构建库（用于发布）
pnpm build:lib

# 预览构建结果
pnpm preview
```

## 发布到 npm

```bash
# 构建库
pnpm build:lib

# 发布（需要先登录 npm）
npm publish
```

## API 概览

### 核心类

- **McpServer** — MCP Server 实现，注册 tools/resources/prompts 并响应 Client 请求
- **McpClient** — MCP Client 实现，发现并调用 Server 暴露的能力
- **PostMessageServerTransport** — 基于 postMessage 的 Server 端传输层
- **PostMessageClientTransport** — 基于 postMessage 的 Client 端传输层

### React Hooks

- **useMcpServer** — React Hook，封装 McpServer 的创建、连接与能力注册
- **useMcpClient** — React Hook，封装 McpClient 的创建、连接与能力发现

### 支持的 MCP 方法

| 方法 | 说明 |
|---|---|
| `initialize` | 能力握手 |
| `notifications/initialized` | 确认初始化完成 |
| `tools/list` | 发现可用工具 |
| `tools/call` | 调用工具 |
| `resources/list` | 发现可用资源 |
| `resources/read` | 读取资源 |
| `prompts/list` | 发现可用提示词 |
| `prompts/get` | 获取提示词 |
| `ping` | 心跳检测 |

## 架构

```
React Hooks（useMcpServer / useMcpClient）
        │  状态管理、自动连接、自动发现
        │
协议层（McpServer / McpClient）
        │  JSON-RPC 2.0、MCP 方法路由、30s 超时
        │
传输层（PostMessageServerTransport / PostMessageClientTransport）
        │  构造时启动监听、Ready 握手、origin 白名单校验
        │
浏览器 API（window.postMessage）
```

详细架构图与通信流程见 [SPEC.md](./SPEC.md)。

## License

MIT
