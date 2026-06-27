import { type RefObject, useEffect, useState } from "react";
import { useMcpServer } from "./lib";
import "./App.css";

interface AppProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
}

/**
 * MCP Server 示例页面
 * 作为主页面，注册工具并与 iframe 中的 Client 通信
 */
function App({ iframeRef }: AppProps) {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const { isConnected, error, addTool, addResource, addPrompt } = useMcpServer({
    name: "demo-server",
    version: "1.0.0",
    iframeRef,
    autoConnect: true,
  });

  // 注册示例工具
  useEffect(() => {
    // 计算器工具
    addTool({
      name: "calculator",
      description: "执行简单的数学计算",
      inputSchema: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["add", "subtract", "multiply", "divide"],
            description: "运算类型",
          },
          a: { type: "number", description: "第一个数字" },
          b: { type: "number", description: "第二个数字" },
        },
        required: ["operation", "a", "b"],
      },
      handler: async (input) => {
        const { operation, a, b } = input as {
          operation: string;
          a: number;
          b: number;
        };
        let result: number;

        switch (operation) {
          case "add":
            result = a + b;
            break;
          case "subtract":
            result = a - b;
            break;
          case "multiply":
            result = a * b;
            break;
          case "divide":
            if (b === 0) {
              return {
                content: [{ type: "text", text: "错误：除数不能为零" }],
                isError: true,
              };
            }
            result = a / b;
            break;
          default:
            return {
              content: [{ type: "text", text: `未知操作: ${operation}` }],
              isError: true,
            };
        }

        addLog(`计算器: ${a} ${operation} ${b} = ${result}`);
        return {
          content: [{ type: "text", text: `计算结果: ${result}` }],
        };
      },
    });

    // 获取时间工具
    addTool({
      name: "get_time",
      description: "获取当前时间",
      inputSchema: {
        type: "object",
        properties: {
          format: {
            type: "string",
            enum: ["full", "date", "time"],
            description: "时间格式",
          },
        },
      },
      handler: async (input) => {
        const { format = "full" } = input as { format?: string };
        const now = new Date();
        let result: string;

        switch (format) {
          case "date":
            result = now.toLocaleDateString("zh-CN");
            break;
          case "time":
            result = now.toLocaleTimeString("zh-CN");
            break;
          default:
            result = now.toLocaleString("zh-CN");
        }

        addLog(`获取时间: ${result}`);
        return {
          content: [{ type: "text", text: result }],
        };
      },
    });

    // 注册示例资源
    addResource({
      uri: "demo://config",
      name: "应用配置",
      description: "示例应用配置信息",
      mimeType: "application/json",
      handler: async () => {
        addLog("读取资源: demo://config");
        return {
          contents: [
            {
              uri: "demo://config",
              mimeType: "application/json",
              text: JSON.stringify(
                {
                  appName: "PostMessage MCP Demo",
                  version: "1.0.0",
                  features: ["tools", "resources", "prompts"],
                },
                null,
                2
              ),
            },
          ],
        };
      },
    });

    // 注册示例 Prompt
    addPrompt({
      name: "greeting",
      description: "生成问候语",
      arguments: [
        { name: "name", description: "用户名称", required: true },
        {
          name: "style",
          description: "问候风格 (formal/casual)",
          required: false,
        },
      ],
      handler: async (args) => {
        const { name, style = "casual" } = args;
        addLog(`获取 Prompt: greeting (name=${name}, style=${style})`);

        const greeting =
          style === "formal"
            ? `尊敬的 ${name}，您好！很高兴为您服务。`
            : `嗨 ${name}！今天过得怎么样？`;

        return {
          description: "个性化问候语",
          messages: [
            {
              role: "assistant",
              content: {
                type: "text",
                text: greeting,
              },
            },
          ],
        };
      },
    });
  }, [addTool, addResource, addPrompt]);

  return (
    <div className="server-app">
      <header className="server-header">
        <h1>🖥️ Server 端</h1>
        <div className="status">
          {isConnected ? (
            <span className="connected">● 已连接</span>
          ) : (
            <span className="disconnected">● 未连接</span>
          )}
          {error && <span className="error"> - {error.message}</span>}
        </div>
      </header>

      <div className="server-content">
        <div className="panel capabilities-panel">
          <h2>已注册的能力</h2>
          <div className="capabilities">
            <div className="capability">
              <h3>🔧 工具 (Tools)</h3>
              <ul>
                <li>
                  <strong>calculator</strong> - 执行数学计算
                </li>
                <li>
                  <strong>get_time</strong> - 获取当前时间
                </li>
              </ul>
            </div>
            <div className="capability">
              <h3>📁 资源 (Resources)</h3>
              <ul>
                <li>
                  <strong>demo://config</strong> - 应用配置
                </li>
              </ul>
            </div>
            <div className="capability">
              <h3>💬 Prompts</h3>
              <ul>
                <li>
                  <strong>greeting</strong> - 生成问候语
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="panel logs-panel">
          <h2>📋 调用日志</h2>
          <div className="log-list">
            {logs.length === 0 ? (
              <p className="empty">暂无调用记录</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="log-item">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
