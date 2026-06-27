import { useRef, useState } from 'react';
import { useMcpClient } from 'postmessage-mcp';
import StatusIndicator from '../components/StatusIndicator.tsx';
import ColorSwatch from '../components/ColorSwatch.tsx';
import CodeBlock from '../components/CodeBlock.tsx';

const PALETTE_TYPES = [
  { value: 'monochromatic', label: 'Monochromatic' },
  { value: 'analogous', label: 'Analogous' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'triadic', label: 'Triadic' },
  { value: 'split-complementary', label: 'Split Complementary' },
];

export default function ColorPaletteDemo() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isConnected, error, callTool, readResource } = useMcpClient({
    name: 'palette-client',
    version: '1.0.0',
    iframeRef,
    autoConnect: true,
  });

  const [baseColor, setBaseColor] = useState('#0066cc');
  const [paletteType, setPaletteType] = useState('monochromatic');
  const [palette, setPalette] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [tokensJson, setTokensJson] = useState('');
  const [currentPalette, setCurrentPalette] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await callTool('generate_palette', {
        baseColor,
        paletteType,
        count: 6,
      });
      const text = res.content.map((c) => c.text).join('\n');
      const data = JSON.parse(text);
      setPalette(data.palette);
      setSelectedColor(data.palette[0]);
      setCurrentPalette(text);
      setTokensJson('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (operation: string) => {
    if (!selectedColor) return;
    setLoading(true);
    try {
      const res = await callTool('adjust_color', {
        color: selectedColor,
        operation,
        amount: 20,
      });
      const text = res.content.map((c) => c.text).join('\n');
      const data = JSON.parse(text);
      setSelectedColor(data.color);
      setCurrentPalette(text);
      setTokensJson('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReadTokens = async () => {
    setLoading(true);
    try {
      const res = await readResource('palette://design-tokens');
      const text = res.contents[0]?.text ?? '';
      setTokensJson(text);
      setCurrentPalette('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReadCurrentPalette = async () => {
    setLoading(true);
    try {
      const res = await readResource('palette://current-palette');
      const text = res.contents[0]?.text ?? '';
      setCurrentPalette(text);
      setTokensJson('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        height: 'calc(100vh - var(--global-nav-height) - var(--sub-nav-height))',
      }}
    >
      {/* Left: Client Controls */}
      <div
        style={{
          flex: 2,
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
            Color Palette
          </h2>
          <p
            style={{
              font: 'var(--text-lead)',
              color: 'var(--color-ink-muted-80)',
              letterSpacing: '0.196px',
              marginBottom: 'var(--space-md)',
            }}
          >
            Main page as MCP Client. Generate palettes and read design tokens from the iframe server.
          </p>
        </div>

        <StatusIndicator isConnected={isConnected} label="Client" />
        {error && (
          <div style={{ color: '#ff453a', font: 'var(--text-caption)' }}>
            {error.message}
          </div>
        )}

        <div className="apple-card section-stack">
          <div className="inline-row" style={{ alignItems: 'center' }}>
            <input
              type="color"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              className="apple-color-input"
            />
            <div>
              <div className="section-label" style={{ marginBottom: 0 }}>
                Base Color
              </div>
              <span style={{ font: 'var(--text-body)', color: 'var(--color-ink)' }}>
                {baseColor}
              </span>
            </div>
          </div>

          <div className="section-stack-sm">
            <label className="section-label">Palette Type</label>
            <select
              value={paletteType}
              onChange={(e) => setPaletteType(e.target.value)}
              className="apple-select"
            >
              {PALETTE_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !isConnected}
            className="apple-button apple-button-primary"
          >
            {loading ? 'Generating...' : 'Generate Palette'}
          </button>
        </div>

        {palette.length > 0 && (
          <div className="apple-card section-stack">
            <h3 className="section-label">Generated Palette</h3>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-md)',
                justifyContent: 'center',
              }}
            >
              {palette.map((color, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedColor(color)}
                  style={{ cursor: 'pointer' }}
                >
                  <ColorSwatch
                    color={color}
                    size="sm"
                    label={color === selectedColor ? 'selected' : undefined}
                  />
                </div>
              ))}
            </div>

            {selectedColor && (
              <div className="section-stack-sm">
                <label className="section-label">
                  Adjust Selected: {selectedColor}
                </label>
                <div className="inline-row-wrap">
                  <button
                    onClick={() => handleAdjust('lighten')}
                    disabled={loading || !isConnected}
                    className="apple-button apple-button-secondary-pill"
                    style={{ fontSize: 14, padding: '8px 16px' }}
                  >
                    Lighten
                  </button>
                  <button
                    onClick={() => handleAdjust('darken')}
                    disabled={loading || !isConnected}
                    className="apple-button apple-button-secondary-pill"
                    style={{ fontSize: 14, padding: '8px 16px' }}
                  >
                    Darken
                  </button>
                  <button
                    onClick={() => handleAdjust('saturate')}
                    disabled={loading || !isConnected}
                    className="apple-button apple-button-secondary-pill"
                    style={{ fontSize: 14, padding: '8px 16px' }}
                  >
                    Saturate
                  </button>
                  <button
                    onClick={() => handleAdjust('desaturate')}
                    disabled={loading || !isConnected}
                    className="apple-button apple-button-secondary-pill"
                    style={{ fontSize: 14, padding: '8px 16px' }}
                  >
                    Desaturate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="apple-card section-stack">
          <h3 className="section-label">Resources</h3>
          <div className="inline-row-wrap">
            <button
              onClick={handleReadTokens}
              disabled={loading || !isConnected}
              className="apple-button apple-button-dark-utility"
            >
              Read Design Tokens
            </button>
            <button
              onClick={handleReadCurrentPalette}
              disabled={loading || !isConnected}
              className="apple-button apple-button-dark-utility"
            >
              Read Current Palette
            </button>
          </div>
          {tokensJson && (
            <CodeBlock maxHeight={200}>{tokensJson}</CodeBlock>
          )}
          {currentPalette && !tokensJson && (
            <CodeBlock maxHeight={200}>{currentPalette}</CodeBlock>
          )}
        </div>
      </div>

      {/* Right: Server iframe */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 360 }}>
        <iframe
          ref={iframeRef}
          src="/palette-server.html"
          title="Palette Server"
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
