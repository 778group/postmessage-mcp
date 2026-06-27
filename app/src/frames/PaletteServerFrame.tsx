import { useEffect, useRef, useState } from 'react';
import { useMcpServer } from 'postmessage-mcp';
import type { ToolDefinition, ResourceDefinition } from 'postmessage-mcp';
import StatusIndicator from '../components/StatusIndicator.tsx';
import { generatePalette, adjustColor } from '../hooks/useColorGenerator.ts';

const DESIGN_TOKENS = {
  colors: {
    primary: '#0066cc',
    'primary-focus': '#0071e3',
    'primary-on-dark': '#2997ff',
    ink: '#1d1d1f',
    body: '#1d1d1f',
    'body-on-dark': '#ffffff',
    'body-muted': '#cccccc',
    'ink-muted-80': '#333333',
    'ink-muted-48': '#7a7a7a',
    'divider-soft': '#f0f0f0',
    hairline: '#e0e0e0',
    canvas: '#ffffff',
    'canvas-parchment': '#f5f5f7',
    'surface-pearl': '#fafafc',
    'surface-tile-1': '#272729',
    'surface-tile-2': '#2a2a2c',
    'surface-tile-3': '#252527',
    'surface-black': '#000000',
    'on-primary': '#ffffff',
    'on-dark': '#ffffff',
  },
  typography: {
    'hero-display': '600 56px/1.07 SF Pro Display',
    'display-lg': '600 40px/1.1 SF Pro Display',
    body: '400 17px/1.47 SF Pro Text',
    caption: '400 14px/1.43 SF Pro Text',
  },
  spacing: {
    xxs: '4px',
    xs: '8px',
    sm: '12px',
    md: '17px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    section: '80px',
  },
  rounded: {
    sm: '8px',
    md: '11px',
    lg: '18px',
    pill: '9999px',
  },
};

export default function PaletteServerFrame() {
  const paletteRef = useRef<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const { isConnected, addTool, addResource } = useMcpServer({
    name: 'palette-server',
    version: '1.0.0',
    asIframe: true,
    autoConnect: true,
  });

  useEffect(() => {
    const generatePaletteTool: ToolDefinition = {
      name: 'generate_palette',
      description: 'Generate a color palette from a base color',
      inputSchema: {
        type: 'object',
        properties: {
          baseColor: {
            type: 'string',
            description: 'Base hex color (e.g. #0066cc)',
          },
          paletteType: {
            type: 'string',
            enum: ['monochromatic', 'analogous', 'complementary', 'triadic', 'split-complementary'],
            description: 'Type of palette to generate',
          },
          count: {
            type: 'number',
            description: 'Number of colors in the palette',
          },
        },
        required: ['baseColor', 'paletteType'],
      },
      handler: async (input) => {
        const { baseColor, paletteType, count = 6 } = input as {
          baseColor: string;
          paletteType: string;
          count: number;
        };
        const palette = generatePalette(baseColor, paletteType, count);
        paletteRef.current = palette;
        addLog(`Generate: ${paletteType} palette from ${baseColor} (${palette.length} colors)`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ baseColor, paletteType, palette }),
            },
          ],
        };
      },
    };
    addTool(generatePaletteTool);

    const adjustColorTool: ToolDefinition = {
      name: 'adjust_color',
      description: 'Adjust a color (lighten, darken, saturate, desaturate)',
      inputSchema: {
        type: 'object',
        properties: {
          color: {
            type: 'string',
            description: 'Hex color to adjust',
          },
          operation: {
            type: 'string',
            enum: ['lighten', 'darken', 'saturate', 'desaturate'],
            description: 'Adjustment operation',
          },
          amount: {
            type: 'number',
            description: 'Amount to adjust (0-100)',
          },
        },
        required: ['color', 'operation', 'amount'],
      },
      handler: async (input) => {
        const { color, operation, amount } = input as {
          color: string;
          operation: string;
          amount: number;
        };
        const adjusted = adjustColor(color, operation, amount);
        addLog(`Adjust: ${operation} ${color} by ${amount}% → ${adjusted}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ color: adjusted, operation, amount }),
            },
          ],
        };
      },
    };
    addTool(adjustColorTool);

    const designTokensResource: ResourceDefinition = {
      uri: 'palette://design-tokens',
      name: 'Design Tokens',
      description: 'Current Apple design tokens from DESIGN.md',
      mimeType: 'application/json',
      handler: async () => {
        addLog('Read resource: palette://design-tokens');
        return {
          contents: [
            {
              uri: 'palette://design-tokens',
              mimeType: 'application/json',
              text: JSON.stringify(DESIGN_TOKENS, null, 2),
            },
          ],
        };
      },
    };
    addResource(designTokensResource);

    const currentPaletteResource: ResourceDefinition = {
      uri: 'palette://current-palette',
      name: 'Current Palette',
      description: 'The most recently generated palette',
      mimeType: 'application/json',
      handler: async () => {
        addLog(`Read resource: palette://current-palette (${paletteRef.current.length} colors)`);
        return {
          contents: [
            {
              uri: 'palette://current-palette',
              mimeType: 'application/json',
              text: JSON.stringify({ palette: paletteRef.current }, null, 2),
            },
          ],
        };
      },
    };
    addResource(currentPaletteResource);
  }, [addTool, addResource, addLog]);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-canvas)',
        color: 'var(--color-ink)',
        padding: 'var(--space-lg)',
        gap: 'var(--space-lg)',
        overflow: 'auto',
      }}
    >
      <StatusIndicator isConnected={isConnected} label="Palette Server" />

      <div className="section-stack-sm">
        <h2
          style={{
            font: 'var(--text-body-strong)',
            color: 'var(--color-ink)',
          }}
        >
          Registered Capabilities
        </h2>

        <div>
          <h3
            style={{
              font: 'var(--text-caption-strong)',
              color: 'var(--color-ink-muted-48)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-xs)',
            }}
          >
            Tools
          </h3>
          <ul style={{ font: 'var(--text-caption)', paddingLeft: 'var(--space-lg)', color: 'var(--color-ink-muted-80)' }}>
            <li><strong style={{ color: 'var(--color-ink)' }}>generate_palette</strong> — Generate color palettes</li>
            <li><strong style={{ color: 'var(--color-ink)' }}>adjust_color</strong> — Lighten, darken, saturate, desaturate</li>
          </ul>
        </div>

        <div>
          <h3
            style={{
              font: 'var(--text-caption-strong)',
              color: 'var(--color-ink-muted-48)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-xs)',
            }}
          >
            Resources
          </h3>
          <ul style={{ font: 'var(--text-caption)', paddingLeft: 'var(--space-lg)', color: 'var(--color-ink-muted-80)' }}>
            <li><strong style={{ color: 'var(--color-ink)' }}>palette://design-tokens</strong> — Apple design tokens</li>
            <li><strong style={{ color: 'var(--color-ink)' }}>palette://current-palette</strong> — Current palette</li>
          </ul>
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
          Activity Log
        </h3>
        {logs.length > 0 ? (
          <ul className="log-list" style={{ maxHeight: 200 }}>
            {logs.map((log, i) => (
              <li key={i} className="log-item">
                {log}
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            Waiting for client requests...
          </div>
        )}
      </div>
    </div>
  );
}
