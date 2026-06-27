import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-section) var(--space-lg)',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          font: 'var(--text-display-lg)',
          color: 'var(--color-ink)',
          marginBottom: 'var(--space-md)',
        }}
      >
        PostMessage MCP
      </h1>
      <p
        style={{
          font: 'var(--text-lead)',
          color: 'var(--color-ink-muted-80)',
          maxWidth: 600,
          marginBottom: 'var(--space-xxl)',
          letterSpacing: '0.196px',
        }}
      >
        MCP communication between main page and iframes via PostMessage.
        Explore the two demos below.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-lg)',
          maxWidth: 800,
          width: '100%',
        }}
      >
        <Link
          to="/calculator"
          style={{ textDecoration: 'none' }}
        >
          <div className="apple-card" style={{ textAlign: 'left', cursor: 'pointer' }}>
            <h3
              style={{
                font: 'var(--text-tagline)',
                color: 'var(--color-ink)',
                letterSpacing: '0.231px',
                marginBottom: 'var(--space-xs)',
              }}
            >
              Calculator
            </h3>
            <p style={{ font: 'var(--text-body)', color: 'var(--color-ink-muted-80)' }}>
              Main page as MCP Server, iframe as MCP Client.
              Call the calculator tool from the iframe and see server logs in real time.
            </p>
          </div>
        </Link>

        <Link
          to="/color-palette"
          style={{ textDecoration: 'none' }}
        >
          <div className="apple-card" style={{ textAlign: 'left', cursor: 'pointer' }}>
            <h3
              style={{
                font: 'var(--text-tagline)',
                color: 'var(--color-ink)',
                letterSpacing: '0.231px',
                marginBottom: 'var(--space-xs)',
              }}
            >
              Color Palette
            </h3>
            <p style={{ font: 'var(--text-body)', color: 'var(--color-ink-muted-80)' }}>
              Main page as MCP Client, iframe as MCP Server.
              Generate color palettes and read Apple design tokens via MCP resources.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
