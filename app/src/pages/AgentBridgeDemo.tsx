import { useRef, useState, useEffect, useCallback } from 'react';
import { useMcpClient } from 'postmessage-mcp';
import type { Tool } from 'postmessage-mcp';
import StatusIndicator from '../components/StatusIndicator.tsx';

type Message =
  | { role: 'user'; text: string }
  | { role: 'agent'; text: string }
  | { role: 'tool'; text: string; result?: string; error?: boolean }
  | { role: 'system'; text: string };

const SCENARIOS = [
  {
    label: '查看销售趋势',
    prompt: '查看 Acme Corp 的销售趋势',
  },
  {
    label: '对比公司营收',
    prompt: '对比 Acme Corp 和 Globex Inc. 的营收情况',
  },
  {
    label: '导出季度报告',
    prompt: '帮我导出 Acme Corp 的 Q4 报告',
  },
  {
    label: '分析客户洞察',
    prompt: '分析 Initech 的客户洞察',
  },
];

function formatToolResult(raw: string): string {
  try {
    const obj = JSON.parse(raw);
    if (obj.salesData) {
      const data = obj.salesData as Array<{ quarter: string; value: number }>;
      const fmt = data.map((d) => `${d.quarter}: $${(d.value / 1000).toFixed(0)}K`).join(', ');
      if (obj.chartType === 'revenue_comparison') {
        return `对比图表已渲染`;
      }
      return `${obj.customer ?? ''} 销售趋势: ${fmt}\n趋势: ${obj.trend ?? ''} · 增长率: ${obj.growth ?? ''}`;
    }
    if (obj.reportUrl) {
      return `报告已生成: ${obj.fileName}\n${obj.pages} 页 · ${obj.size}`;
    }
    if (obj.insights) {
      return obj.insights as string;
    }
    if (obj.name && obj.industry) {
      return `${obj.name} · ${obj.industry}\n营收: $${((obj.revenue as number) / 1000000).toFixed(1)}M · ${obj.orderCount} 笔近期订单`;
    }
    const pretty = JSON.stringify(obj, null, 1);
    return pretty.length > 300 ? pretty.slice(0, 300) + '...' : pretty;
  } catch {
    return raw.length > 300 ? raw.slice(0, 300) + '...' : raw;
  }
}

export default function AgentBridgeDemo() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    error,
    tools,
    callTool,
  } = useMcpClient({
    name: 'business-agent',
    version: '1.0.0',
    iframeRef,
    autoConnect: true,
    autoFetch: true,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isConnected && tools.length > 0) {
      setMessages((prev) => {
        if (prev.length === 0) {
          return [{
            role: 'system',
            text: `Agent ready. Connected to CRM Server with ${tools.length} tools available: ${tools.map((t: Tool) => t.name).join(', ')}. Try a scenario or type your own request.`,
          }];
        }
        return prev;
      });
    }
  }, [isConnected, tools]);

  const addMsg = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const runAgent = useCallback(async (prompt: string) => {
    setIsProcessing(true);
    addMsg({ role: 'user', text: prompt });

    const lower = prompt.toLowerCase();

    const toolCalls: Array<{ tool: string; args: Record<string, unknown>; label: string }> = [];

    const mentionCustomer = (name: string) =>
      lower.includes(name.toLowerCase()) || prompt.includes(name);

    if (mentionCustomer('Acme Corp') || mentionCustomer('acme')) {
      toolCalls.push({
        tool: 'search_customer',
        args: { customerName: 'Acme Corp' },
        label: `search_customer("Acme Corp")`,
      });
    }
    if (mentionCustomer('Globex')) {
      toolCalls.push({
        tool: 'search_customer',
        args: { customerName: 'Globex Inc' },
        label: `search_customer("Globex Inc.")`,
      });
    }
    if (mentionCustomer('Initech')) {
      toolCalls.push({
        tool: 'search_customer',
        args: { customerName: 'Initech' },
        label: `search_customer("Initech")`,
      });
    }

    if (lower.includes('趋势') || lower.includes('chart') || lower.includes('图表') || lower.includes('销售')) {
      const cust = mentionCustomer('Globex') ? 'Globex Inc' : mentionCustomer('Initech') ? 'Initech' : 'Acme Corp';
      toolCalls.push({
        tool: 'render_chart',
        args: { chartType: 'sales_trend', customerName: cust },
        label: `render_chart("sales_trend", "${cust}")`,
      });
    }
    if (lower.includes('对比') || lower.includes('compar')) {
      toolCalls.push({
        tool: 'render_chart',
        args: { chartType: 'revenue_comparison' },
        label: 'render_chart("revenue_comparison")',
      });
    }
    if (lower.includes('报告') || lower.includes('导出') || lower.includes('export') || lower.includes('report')) {
      const quarter = lower.includes('q1') ? 'Q1' : lower.includes('q2') ? 'Q2' : lower.includes('q3') ? 'Q3' : 'Q4';
      const cust = mentionCustomer('Initech') ? 'Initech' : mentionCustomer('Globex') ? 'Globex Inc' : 'Acme Corp';
      toolCalls.push({
        tool: 'export_report',
        args: { quarter, customerName: cust },
        label: `export_report("${quarter}", "${cust}")`,
      });
    }
    if (lower.includes('洞察') || lower.includes('分析') || lower.includes('insight') || lower.includes('analyze')) {
      const cust = mentionCustomer('Acme') ? 'Acme Corp' : mentionCustomer('Globex') ? 'Globex Inc' : 'Initech';
      toolCalls.push({
        tool: 'get_insights',
        args: { customerName: cust },
        label: `get_insights("${cust}")`,
      });
    }

    if (toolCalls.length === 0) {
      const av = tools.map((t: Tool) => t.name).join(', ');
      addMsg({
        role: 'agent',
        text: `I can help with: viewing customer sales trends, comparing revenue, exporting reports, and generating insights. Try mentioning a company name (Acme Corp, Globex Inc., Initech) along with what you need.\n\nAvailable tools: ${av}`,
      });
      setIsProcessing(false);
      return;
    }

    addMsg({ role: 'agent', text: `Let me process your request. Executing ${toolCalls.length} tool call${toolCalls.length > 1 ? 's' : ''}...` });

    for (let i = 0; i < toolCalls.length; i++) {
      const tc = toolCalls[i];
      await new Promise((r) => setTimeout(r, 500));
      addMsg({ role: 'tool', text: `⚙ ${tc.label}` });

      try {
        const res = await callTool(tc.tool, tc.args);
        const text = res.content.map((c) => c.text).join('\n');
        const isErr = res.isError ?? false;
        const formatted = formatToolResult(text);
        addMsg({ role: 'tool', text: `↳ ${formatted}`, error: isErr });
      } catch (err) {
        addMsg({ role: 'tool', text: `↳ Error: ${err instanceof Error ? err.message : String(err)}`, error: true });
      }
    }

    await new Promise((r) => setTimeout(r, 400));

    const summaryParts: string[] = [];
    if (toolCalls.some((t) => t.tool === 'search_customer') && toolCalls.some((t) => t.tool === 'render_chart')) {
      const cust = toolCalls.find((t) => t.tool === 'search_customer')?.args.customerName ?? 'the customer';
      if (lower.includes('对比')) {
        summaryParts.push(`Here's the revenue comparison you requested. The chart is now rendered in the CRM dashboard on the left. You can see how each company's quarterly performance stacks up.`);
      } else {
        summaryParts.push(`I've pulled up ${cust} in the CRM and rendered the sales trend chart. You can see the live chart on the left side of the screen — each quarter shows steady growth.`);
      }
    }
    if (toolCalls.some((t) => t.tool === 'export_report')) {
      const tc = toolCalls.find((t) => t.tool === 'export_report')!;
      summaryParts.push(`The ${tc.args.quarter} report for ${tc.args.customerName} has been generated. You can see the export progress and download link in the CRM panel.`);
    }
    if (toolCalls.some((t) => t.tool === 'get_insights')) {
      const cust = toolCalls.find((t) => t.tool === 'get_insights')?.args.customerName ?? 'the customer';
      summaryParts.push(`I've analyzed ${cust}'s performance data. The AI insights are now displayed in the CRM dashboard, showing growth metrics and strategic recommendations.`);
    }

    addMsg({
      role: 'agent',
      text: summaryParts.join('\n\n') || 'Task completed. The CRM dashboard on the left has been updated with your requested data.',
    });

    setIsProcessing(false);
  }, [tools, callTool, addMsg]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {/* Left: CRM iframe */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <div
          style={{
            background: 'var(--color-canvas)',
            borderBottom: '1px solid var(--color-hairline)',
            padding: '10px var(--space-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span style={{ font: 'var(--text-caption-strong)', color: 'var(--color-ink-muted-48)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CRM System · MCP Server
          </span>
          <span
            style={{
              font: 'var(--text-fine-print)',
              color: 'var(--color-ink-muted-48)',
              background: 'var(--color-canvas-parchment)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            iframe embed
          </span>
        </div>
        <iframe
          ref={iframeRef}
          src="/crm-server.html"
          title="CRM Server"
          style={{
            flex: 1,
            border: 'none',
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      {/* Right: Agent Chat */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-canvas)',
          borderLeft: '1px solid var(--color-hairline)',
          minWidth: 400,
          maxWidth: 560,
        }}
      >
        {/* Agent Header */}
        <div
          style={{
            background: 'var(--color-canvas)',
            borderBottom: '1px solid var(--color-hairline)',
            padding: 'var(--space-md) var(--space-lg)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  background: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 16,
                }}
              >
                🤖
              </span>
              <div>
                <span style={{ font: 'var(--text-body-strong)', color: 'var(--color-ink)' }}>
                  Business Agent
                </span>
                <span style={{ font: 'var(--text-fine-print)', color: 'var(--color-ink-muted-48)', marginLeft: 'var(--space-sm)' }}>
                  MCP Client
                </span>
              </div>
            </div>
            <StatusIndicator isConnected={isConnected} label={isConnected ? `${tools.length} tools` : ''} />
          </div>
          {error && (
            <div style={{ color: '#ff453a', font: 'var(--text-fine-print)', marginTop: 'var(--space-xxs)' }}>
              {error.message}
            </div>
          )}
        </div>

        {/* Scenario Cards */}
        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--color-divider-soft)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-xs)',
            flexShrink: 0,
          }}
        >
          {SCENARIOS.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                if (!isProcessing) runAgent(s.prompt);
              }}
              disabled={isProcessing || !isConnected}
              className="apple-button"
              style={{
                background: 'var(--color-canvas-parchment)',
                color: 'var(--color-ink-muted-80)',
                font: 'var(--text-caption)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--color-divider-soft)',
                fontSize: 13,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <p style={{ font: 'var(--text-caption)', color: 'var(--color-ink-muted-48)', textAlign: 'center', maxWidth: 280 }}>
                {isConnected
                  ? 'Your Agent is connected to the CRM Server. Click a scenario above or type a request.\n\nThe Agent uses MCP tools to operate the CRM — and you can watch the UI update live on the left.'
                  : 'Connecting to CRM Server...'}
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.role === 'system') {
              return (
                <div key={i} style={{ textAlign: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      font: 'var(--text-fine-print)',
                      color: 'var(--color-ink-muted-48)',
                      background: 'var(--color-canvas-parchment)',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-pill)',
                      maxWidth: '90%',
                    }}
                  >
                    {msg.text}
                  </span>
                </div>
              );
            }

            if (msg.role === 'user') {
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: '85%',
                      background: 'var(--color-primary)',
                      color: 'var(--color-on-primary)',
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-lg)',
                      borderBottomRightRadius: 'var(--radius-sm)',
                      font: 'var(--text-body)',
                      fontSize: 15,
                      lineHeight: 1.45,
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            }

            if (msg.role === 'agent') {
              return (
                <div key={i} style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>🤖</span>
                  <div
                    style={{
                      maxWidth: '85%',
                      background: 'var(--color-canvas-parchment)',
                      color: 'var(--color-ink)',
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-lg)',
                      borderBottomLeftRadius: 'var(--radius-sm)',
                      font: 'var(--text-body)',
                      fontSize: 15,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            }

            if (msg.role === 'tool') {
              return (
                <div key={i} style={{ paddingLeft: 32 }}>
                  <div
                    style={{
                      font: 'var(--text-fine-print)',
                      fontFamily: 'SF Mono, ui-monospace, monospace',
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: msg.error ? '#ff453a' : 'var(--color-ink-muted-48)',
                      background: msg.text.startsWith('⚙') ? 'rgba(0,102,204,0.06)' : 'transparent',
                      padding: msg.text.startsWith('⚙') ? '6px 10px' : '2px 10px 6px',
                      borderRadius: 'var(--radius-sm)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            }

            return null;
          })}

          {isProcessing && (
            <div style={{ display: 'flex', gap: 'var(--space-sm)', paddingLeft: 0 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>🤖</span>
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: '10px 16px',
                }}
              >
                <span className="status-dot connecting" style={{ width: 6, height: 6 }} />
                <span className="status-dot connecting" style={{ width: 6, height: 6, animationDelay: '0.2s' }} />
                <span className="status-dot connecting" style={{ width: 6, height: 6, animationDelay: '0.4s' }} />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            borderTop: '1px solid var(--color-hairline)',
            padding: 'var(--space-md) var(--space-lg)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && input.trim() && !isProcessing && isConnected) {
                  runAgent(input.trim());
                  setInput('');
                }
              }}
              disabled={isProcessing || !isConnected}
              placeholder={isConnected ? 'Ask the agent... (e.g. show Acme sales)' : 'Connecting...'}
              className="apple-input"
              style={{ flex: 1, borderRadius: 'var(--radius-pill)', padding: '10px 18px', fontSize: 15 }}
            />
            <button
              onClick={() => {
                if (input.trim() && !isProcessing && isConnected) {
                  runAgent(input.trim());
                  setInput('');
                }
              }}
              disabled={isProcessing || !isConnected || !input.trim()}
              className="apple-button apple-button-primary"
              style={{ borderRadius: 'var(--radius-full)', width: 42, height: 42, padding: 0, flexShrink: 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
