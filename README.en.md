# PostMessage MCP

A Model Context Protocol (MCP) implementation based on PostMessage, supporting bidirectional communication between iframes and windows.

## Features

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

### Basic Usage (Main Page as Server, iframe as Client)

**Main Page (Server)**:

```typescript
import { useMcpServer } from 'postmessage-mcp';
import { useRef } from 'react';

function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { addTool, isConnected } = useMcpServer({
    name: 'my-server',
    version: '1.0.0',
    iframeRef,
    autoConnect: true,
  });

  // Register a tool
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

## Origin Allowlist

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

1. Always configure `allowedOrigins` in production
2. Avoid using `targetOrigin: '*'` with an empty allowlist
3. Prefer exact matches over wildcards when possible
4. Regularly review and update allowlist configurations

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
        │
Protocol Layer (McpServer / McpClient — JSON-RPC 2.0 + MCP methods)
        │
Transport Layer (PostMessageServerTransport / PostMessageClientTransport — native postMessage)
```

## License

MIT
