import { useEffect, useRef, useState } from 'react';
import { useMcpServer } from 'postmessage-mcp';
import type { ToolDefinition } from 'postmessage-mcp';
import StatusIndicator from '../components/StatusIndicator.tsx';

export default function CalculatorDemo() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const { isConnected, error, addTool } = useMcpServer({
    name: 'calculator-server',
    version: '1.0.0',
    iframeRef,
    autoConnect: true,
  });

  useEffect(() => {
    const calculatorTool: ToolDefinition = {
      name: 'calculator',
      description: 'Execute simple math calculations',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['add', 'subtract', 'multiply', 'divide'],
            description: 'Operation type',
          },
          a: { type: 'number', description: 'First number' },
          b: { type: 'number', description: 'Second number' },
        },
        required: ['operation', 'a', 'b'],
      },
      handler: async (input) => {
        const { operation, a, b } = input as {
          operation: string;
          a: number;
          b: number;
        };
        let result: number;
        const opSymbol: Record<string, string> = {
          add: '+',
          subtract: '−',
          multiply: '×',
          divide: '÷',
        };

        switch (operation) {
          case 'add':
            result = a + b;
            break;
          case 'subtract':
            result = a - b;
            break;
          case 'multiply':
            result = a * b;
            break;
          case 'divide':
            if (b === 0) {
              return {
                content: [{ type: 'text', text: 'Error: Division by zero' }],
                isError: true,
              };
            }
            result = a / b;
            break;
          default:
            return {
              content: [{ type: 'text', text: `Unknown operation: ${operation}` }],
              isError: true,
            };
        }

        addLog(`${a} ${opSymbol[operation]} ${b} = ${result}`);
        return {
          content: [{ type: 'text', text: `Result: ${result}` }],
        };
      },
    };
    addTool(calculatorTool);
  }, [addTool]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        height: 'calc(100vh - var(--global-nav-height) - var(--sub-nav-height))',
      }}
    >
      {/* Left: Server Panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-canvas)',
          borderRight: '1px solid var(--color-hairline)',
          padding: 'var(--space-xxl) var(--space-xl)',
          gap: 'var(--space-lg)',
          overflow: 'auto',
        }}
      >
        <div>
          <h2
            style={{
              font: 'var(--text-display-lg)',
              color: 'var(--color-ink)',
              marginBottom: 'var(--space-xs)',
            }}
          >
            Calculator Server
          </h2>
          <p
            style={{
              font: 'var(--text-lead)',
              color: 'var(--color-ink-muted-80)',
              letterSpacing: '0.196px',
              marginBottom: 'var(--space-md)',
            }}
          >
            Main page runs the MCP server and registers the calculator tool.
          </p>
        </div>

        <StatusIndicator isConnected={isConnected} label="Server" />
        {error && (
          <div style={{ color: '#ff453a', font: 'var(--text-caption)' }}>
            {error.message}
          </div>
        )}

        <div className="apple-card section-stack-sm">
          <h3
            style={{
              font: 'var(--text-caption-strong)',
              color: 'var(--color-ink-muted-48)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Registered Tool
          </h3>
          <div>
            <strong style={{ font: 'var(--text-body-strong)', color: 'var(--color-ink)' }}>
              calculator
            </strong>
            <p style={{ font: 'var(--text-caption)', color: 'var(--color-ink-muted-48)', marginTop: 'var(--space-xxs)' }}>
              Execute simple math calculations. Supports add, subtract, multiply, divide.
            </p>
          </div>
        </div>

        <div className="section-stack-sm">
          <h3
            style={{
              font: 'var(--text-caption-strong)',
              color: 'var(--color-ink-muted-48)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Call Log
          </h3>
          {logs.length > 0 ? (
            <ul className="log-list">
              {logs.map((log, i) => (
                <li key={i} className="log-item">
                  {log}
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">No tool calls yet</div>
          )}
        </div>
      </div>

      {/* Right: Client iframe */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <iframe
          ref={iframeRef}
          src="/calculator-client.html"
          title="Calculator Client"
          style={{
            flex: 1,
            border: 'none',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
}
