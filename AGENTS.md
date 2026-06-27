# AGENTS.md

## 项目概述

**postmessage-mcp** 是一个 TypeScript 库，在浏览器 `window.postMessage` API 之上实现了 [Model Context Protocol (MCP)](https://modelcontextprotocol.io)。它使主页面与 iframe（或任意两个窗口）之间能够进行双向 JSON-RPC 2.0 通信，一端作为 MCP Server 暴露工具（tools）、资源（resources）和提示词（prompts），另一端作为 MCP Client 发现并调用这些能力。

- **npm 包名**：`postmessage-mcp`
- **入口文件**：`dist-lib/index.js`（ESM）
- **类型入口**：`dist-lib/index.d.ts`
- **仓库**：https://github.com/778group/postmessage-mcp

## 技术栈

- **语言**：TypeScript（严格模式，ES2022 target）
- **构建工具**：Vite（rolldown-vite 7.x），`tsc` 用于库构建
- **包管理**：pnpm
- **框架**：React 18/19（peerDependency，仅 hooks 需要）
- **核心依赖**：`@modelcontextprotocol/sdk`（仅使用其类型定义，如 `Transport` 接口、`Tool`、`Resource`、`Prompt`、`JSONRPCMessage` 等）
- **传输层**：原生 `window.postMessage` API，无第三方依赖

## 项目结构

```
src/
├── lib/                         # 库源码（发布到 npm）
│   ├── index.ts                 # 公共导出入口（barrel export）
│   ├── client/
│   │   ├── McpClient.ts         # McpClient 类实现
│   │   └── types.ts            # Client 类型定义
│   ├── server/
│   │   ├── McpServer.ts         # McpServer 类实现
│   │   └── types.ts            # Server 类型定义
│   ├── hooks/
│   │   ├── useMcpServer.ts      # useMcpServer React Hook
│   │   └── useMcpClient.ts      # useMcpClient React Hook
│   └── transport/
│       ├── index.ts             # 传输层导出
│       ├── types.ts             # 传输层类型定义
│       ├── postmessage.ts       # 原生 postMessage 工具函数
│       ├── server-transport.ts  # Server 端 Transport 实现
│       └── client-transport.ts  # Client 端 Transport 实现
├── App.tsx / App.css            # 示例：Server 端组件
├── ClientApp.tsx / client.css   # 示例：Client 端组件
├── DemoApp.tsx                  # 示例：分栏布局（Server + iframe Client）
├── main.tsx                     # 主页面入口
├── client.tsx                   # iframe 页面入口
└── index.css                    # 全局样式
index.html                       # 主页面 HTML
client.html                      # iframe 页面 HTML
```

## 架构分层

项目采用三层架构：

```
第三层：React Hooks 层
  useMcpServer / useMcpClient
  职责：状态管理、自动连接、自动发现能力、useCallback 包裹的方法

第二层：协议层
  McpServer / McpClient
  职责：JSON-RPC 2.0 请求/响应处理、MCP 方法路由、超时控制

第一层：传输层
  PostMessageServerTransport / PostMessageClientTransport
  职责：封装原生 postMessage、origin 白名单校验、实现 Transport 接口
```

### 通信流程（普通模式：主页面 Server，iframe Client）

1. 主页面渲染 `<iframe>` 并创建 `McpServer`（指向 iframe）
2. iframe 加载完成，创建 `McpClient`（指向 `window.parent`）
3. Client 发送 `initialize` → Server 响应能力声明
4. Client 发送 `notifications/initialized`
5. Client 发现能力（`tools/list`、`resources/list`、`prompts/list`）
6. Client 调用能力（`tools/call`、`resources/read`、`prompts/get`）

### 反向模式（iframe Server，主页面 Client）

- Server 设置 `asIframe: true`，目标为 `'parent'`
- Client 通过 `iframeRef` 指定目标 iframe

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动开发服务器（localhost:5173） |
| `pnpm build` | Vite 构建示例应用 → `dist/` |
| `pnpm build:lib` | TypeScript 编译库 → `dist-lib/` |
| `pnpm lint` | 运行 ESLint |
| `pnpm preview` | 预览构建结果 |

## 代码规范

### 导出规范

- 所有公共 API 通过 `src/lib/index.ts` 统一导出
- 新增类、函数、类型必须在 `index.ts` 中显式 export
- 使用 barrel export 模式，各子模块通过各自的 `index.ts` 汇总

### 类型定义

- 类相关的类型定义放在对应子目录的 `types.ts` 中（如 `client/types.ts`）
- 类型导出一律使用 `export type { ... }` 以支持类型擦除
- 核心类型包括：`ToolDefinition`、`ResourceDefinition`、`PromptDefinition`、`ClientState`、`ServerInfo` 等

### React Hooks

- 使用 `useRef` 保持实例单例
- 使用 `useCallback` 包裹暴露给调用方的方法，确保引用稳定
- 支持 `autoConnect`（自动连接）和 `autoFetch`（自动发现能力）配置
- 组件卸载时自动断开连接

### JSON-RPC 错误码

- `-32601`：方法未找到
- `-32000`：Server 执行错误

### 安全规范

- `allowedOrigins` 为空时允许所有来源（仅开发环境使用）
- 生产环境务必设置 origin 白名单
- 支持精确匹配、`*.domain` 通配符、`https://*.domain` 通配符三种模式

## 依赖约束

- **不得引入新的运行时依赖**。postMessage 传输层已从 `post-robot` 重构为原生实现，必须保持零第三方传输依赖
- `@modelcontextprotocol/sdk` 是唯一的运行时依赖，仅使用其类型定义
- React / ReactDOM 为 peerDependency，不可在库代码中直接 import 除 hooks 之外的其他 React API
- 库代码（`src/lib/`）不得依赖示例代码（`src/App.tsx` 等）

## 测试与验证

- 运行 `pnpm dev` 启动开发服务器，在浏览器中验证通信功能
- 示例应用（`DemoApp.tsx`）提供分栏布局，左侧为主页面 Server 面板，右侧为 iframe Client 面板
- 验证清单：
  - Server/Client 握手是否正常（`isConnected` 状态变化）
  - 工具调用（callTool）是否返回正确结果
  - 资源读取（readResource）是否正常
  - 提示词获取（getPrompt）是否正常
  - 切换普通模式/反向模式是否都能正常通信
  - 超时机制是否生效（30 秒无响应应自动 reject）

## 开发规范
每次代码更新后需要及时的更新`SEPC.md`