# PostMessage MCP

[中文](./README.md)

A Model Context Protocol (MCP) implementation based on PostMessage, supporting bidirectional communication between iframes and windows.

## Features

- Built-in handshake mechanism to eliminate connection timing issues
- Domain allowlist control for secure communication
- Based on the PostMessage API for safer cross-origin messaging
- Full MCP protocol support (Tools, Resources, Prompts)
- React Hooks for easy integration
- TypeScript support with full type safety
- Bidirectional mode: main page/iframe can act as either Server or Client

## Installation

### As an npm package

```bash
npm install postmessage-mcp
# or
pnpm add postmessage-mcp
# or
yarn add postmessage-mcp
```

### Development setup

```bash
pnpm install
```

## Quick Start

> **⚠️ Note**: The following examples are simplified demos without `allowedOrigins` or `targetOrigin` configured — they default to allowing all origins. For production, please refer to [Origin Allowlist](#origin-allowlist) to configure properly.

### Basic Usage (Main Page as Server, iframe as Client)

**Main Page (Server)**:

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

  // Register tools inside useEffect to avoid side effects during render
  useEffect(() => {
    addTool({
      name: 'greet',
      description: 'A greeting tool',
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
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <iframe ref={iframeRef} src="/client.html" />
    </div>
  );
}
```

**iframe Page (Client)**:

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
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <button onClick={handleGreet}>Call Tool</button>
    </div>
  );
}
```

### Reverse Mode (iframe as Server, Main Page as Client)

**iframe Page (Server)**:

```typescript
import { useMcpServer } from 'postmessage-mcp';

function IframeServer() {
  const { addTool } = useMcpServer({
    name: 'iframe-server',
    version: '1.0.0',
    asIframe: true, // Key: set to true when the Server runs inside an iframe
    autoConnect: true,
  });

  // Register tools...
}
```

**Main Page (Client)**:

```typescript
import { useMcpClient } from 'postmessage-mcp';
import { useRef } from 'react';

function ParentClient() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { callTool } = useMcpClient({
    name: 'parent-client',
    version: '1.0.0',
    iframeRef, // Specify the iframe — the Client will communicate with the Server within it
    autoConnect: true,
  });

  // Use tools...
}
```

## Handshake Mechanism

To avoid connection timing issues (the Client in an iframe sending messages before the parent page's Server is ready), the transport layer includes a built-in Ready handshake:

1. Transport starts listening via `addEventListener('message')` **in the constructor**, before `start()` is called
2. Client sends `__mcp_ready__` signal when `connect()` is called
3. Server receives ready and replies with `__mcp_ready_ack__` via `event.source`
4. Only after receiving the ack does the Client send the MCP `initialize`, beginning formal communication

The handshake is handled internally by the transport layer and is transparent to the MCP protocol — no additional configuration is needed.

## Origin Allowlist

> **⚠️ Security Warning**: By default, if `allowedOrigins` and `targetOrigin` are not configured, the communication channel is **completely open to any origin** — any page can communicate with your MCP Server/Client via postMessage. **You MUST configure the allowlist in production**, otherwise MCP capabilities such as tool calls and resource reads could be exploited by malicious pages.

For enhanced security, this project supports domain allowlist control for iframe and window communication.

### Server Configuration

```typescript
import { useMcpServer } from 'postmessage-mcp';

const { server, connect } = useMcpServer({
  iframeRef: iframeRef,
  targetOrigin: 'https://example.com',
  // Configure allowed origin allowlist
  allowedOrigins: [
    'https://example.com',           // Exact match
    'https://*.example.com',         // Protocol-specific wildcard
    '*.trusted-domain.com',          // Wildcard match
  ],
  autoConnect: true,
});
```

### Client Configuration

```typescript
import { useMcpClient } from 'postmessage-mcp';

const { client, connect } = useMcpClient({
  // Configure allowed origin allowlist
  allowedOrigins: [
    'https://parent-domain.com',
    '*.trusted-domain.com',
  ],
  autoConnect: true,
});
```

### Allowlist Rules

- **Exact match**: `https://example.com` — only allows the exact matching origin
- **Domain wildcard**: `*.example.com` — allows all subdomains of example.com
- **Protocol-specific wildcard**: `https://*.example.com` — allows only HTTPS subdomains of example.com
- **No allowlist configured**: allows all origins by default (not recommended for production)

### Security Recommendations

1. **You MUST configure `allowedOrigins` in production** — no configuration means any page can communicate
2. Set `targetOrigin` to a specific origin (not `'*'`) to prevent messages from being received by arbitrary pages
3. Configure `allowedOrigins` on **both the Server and Client sides** for bidirectional validation
4. Prefer exact matches over wildcards when possible
5. Regularly review and update allowlist configurations
6. Avoid using default settings with `file://` protocol or sandbox iframes (origin will be `"null"`, which degrades to `"*"`)

## Development

```bash
# Start dev server
pnpm dev

# Build the app
pnpm build

# Build the library (for publishing)
pnpm build:lib

# Preview the build
pnpm preview
```

## Publishing to npm

```bash
# Build the library
pnpm build:lib

# Publish (requires npm login)
npm publish
```

## API Overview

### Core Classes

- **McpServer** — MCP Server implementation; registers tools/resources/prompts and responds to Client requests
- **McpClient** — MCP Client implementation; discovers and invokes capabilities exposed by the Server
- **PostMessageServerTransport** — postMessage-based Server-side transport layer
- **PostMessageClientTransport** — postMessage-based Client-side transport layer

### React Hooks

- **useMcpServer** — React Hook wrapping McpServer creation, connection, and capability registration
- **useMcpClient** — React Hook wrapping McpClient creation, connection, and capability discovery

### Supported MCP Methods

| Method | Description |
|---|---|
| `initialize` | Capability handshake |
| `notifications/initialized` | Confirm initialization complete |
| `tools/list` | Discover available tools |
| `tools/call` | Invoke a tool |
| `resources/list` | Discover available resources |
| `resources/read` | Read a resource |
| `prompts/list` | Discover available prompts |
| `prompts/get` | Retrieve a prompt |
| `ping` | Heartbeat / connectivity check |

## Architecture

```
React Hooks (useMcpServer / useMcpClient)
        │  State management, auto-connect, auto-discovery
        │
Protocol Layer (McpServer / McpClient)
        │  JSON-RPC 2.0, MCP method routing, 30s timeout
        │
Transport Layer (PostMessageServerTransport / PostMessageClientTransport)
        │  Listener on construction, Ready handshake, origin allowlist
        │
Browser API (window.postMessage)
```

See [SPEC.en.md](./SPEC.en.md) for detailed architecture diagrams and communication flows.

## License

MIT
