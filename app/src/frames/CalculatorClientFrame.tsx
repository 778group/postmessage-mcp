import { useState } from 'react';
import { useMcpClient } from 'postmessage-mcp';
import CodeBlock from '../components/CodeBlock.tsx';
import StatusIndicator from '../components/StatusIndicator.tsx';

export default function CalculatorClientFrame() {
  const { isConnected, callTool } = useMcpClient({
    name: 'calculator-client',
    version: '1.0.0',
    autoConnect: true,
    autoFetch: true,
  });

  const [calcOp, setCalcOp] = useState('add');
  const [calcA, setCalcA] = useState('10');
  const [calcB, setCalcB] = useState('5');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    setIsError(false);
    try {
      const res = await callTool('calculator', {
        operation: calcOp,
        a: parseFloat(calcA),
        b: parseFloat(calcB),
      });
      const text = res.content.map((c) => c.text).join('\n');
      setResult(text);
      setIsError(res.isError ?? false);
    } catch (err) {
      setResult(err instanceof Error ? err.message : String(err));
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-canvas-parchment)',
        padding: 'var(--space-lg)',
        gap: 'var(--space-lg)',
        overflow: 'auto',
      }}
    >
      <StatusIndicator isConnected={isConnected} label="MCP Client" />

      <div className="section-stack">
        <div>
          <h2
            style={{
              font: 'var(--text-body-strong)',
              color: 'var(--color-ink)',
              marginBottom: 'var(--space-md)',
            }}
          >
            Calculator Tool
          </h2>
        </div>

        <div className="section-stack-sm">
          <label
            style={{
              font: 'var(--text-caption)',
              color: 'var(--color-ink-muted-48)',
            }}
          >
            Operation
          </label>
          <select
            value={calcOp}
            onChange={(e) => setCalcOp(e.target.value)}
            className="apple-select"
          >
            <option value="add">Add (+)</option>
            <option value="subtract">Subtract (−)</option>
            <option value="multiply">Multiply (×)</option>
            <option value="divide">Divide (÷)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <div className="section-stack-sm" style={{ flex: 1 }}>
            <label
              style={{
                font: 'var(--text-caption)',
                color: 'var(--color-ink-muted-48)',
              }}
            >
              Value A
            </label>
            <input
              type="number"
              value={calcA}
              onChange={(e) => setCalcA(e.target.value)}
              className="apple-input"
            />
          </div>
          <div className="section-stack-sm" style={{ flex: 1 }}>
            <label
              style={{
                font: 'var(--text-caption)',
                color: 'var(--color-ink-muted-48)',
              }}
            >
              Value B
            </label>
            <input
              type="number"
              value={calcB}
              onChange={(e) => setCalcB(e.target.value)}
              className="apple-input"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading || !isConnected}
          className="apple-button apple-button-primary"
          style={{ alignSelf: 'flex-start' }}
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </div>

      <div className="section-stack-sm">
        <h3
          style={{
            font: 'var(--text-caption-strong)',
            color: 'var(--color-ink-muted-48)',
          }}
        >
          Result
        </h3>
        {result ? (
          <CodeBlock>{result}</CodeBlock>
        ) : (
          <div className="empty-state">Run a calculation to see the result</div>
        )}
        {isError && result && (
          <div style={{ color: '#ff453a', font: 'var(--text-caption)' }}>
            Error returned by server
          </div>
        )}
      </div>
    </div>
  );
}
