# PostMessage MCP

基于 PostMessage 的 Model Context Protocol (MCP) 实现，支持 iframe 和窗口之间的双向通信。

## 特性

- 🔒 支持域名白名单控制，确保通信安全
- 🚀 基于 PostMessage API，跨域通信更安全
- 🎯 完整支持 MCP 协议（Tools、Resources、Prompts）
- ⚛️ React Hooks 封装，易于集成
- 📦 TypeScript 支持，类型安全

## 安装

```bash
pnpm install
```

## 域名白名单功能

为了增强安全性，本项目支持对 iframe 和窗口通信进行域名白名单控制。

### Server 端配置

```typescript
import { useMcpServer } from './lib/hooks/useMcpServer';

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
import { useMcpClient } from './lib/hooks/useMcpClient';

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

# 构建
pnpm build

# 预览构建结果
pnpm preview
```

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
