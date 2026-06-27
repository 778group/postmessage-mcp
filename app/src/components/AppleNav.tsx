import { NavLink } from 'react-router-dom';

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? 'var(--color-primary)' : 'var(--color-ink)',
  textDecoration: 'none' as const,
  font: 'var(--text-button-utility)',
  letterSpacing: '-0.224px',
  padding: '0 2px',
  transition: 'color 0.15s',
});

export default function AppleNav() {
  return (
    <>
      <nav
        style={{
          background: 'var(--color-surface-black)',
          height: 'var(--global-nav-height)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-lg)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: 1440,
            margin: '0 auto',
          }}
        >
          <span
            style={{
              font: 'var(--text-nav-link)',
              color: 'var(--color-on-dark)',
              letterSpacing: '-0.12px',
              fontWeight: 600,
            }}
          >
            PostMessage MCP
          </span>
          <div style={{ flex: 1 }} />
          <span
            style={{
              font: 'var(--text-nav-link)',
              color: 'var(--color-body-muted)',
              letterSpacing: '-0.12px',
            }}
          >
            Demo Suite
          </span>
        </div>
      </nav>

      <nav
        style={{
          background: 'rgba(245, 245, 247, 0.8)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          height: 'var(--sub-nav-height)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-lg)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: 1440,
            margin: '0 auto',
          }}
        >
          <span
            style={{
              font: 'var(--text-tagline)',
              color: 'var(--color-ink)',
              letterSpacing: '0.231px',
            }}
          >
            Demos
          </span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
            <NavLink to="/" end style={navLinkStyle}>
              Home
            </NavLink>
            <NavLink to="/calculator" end style={navLinkStyle}>
              Calculator
            </NavLink>
            <NavLink to="/color-palette" end style={navLinkStyle}>
              Color Palette
            </NavLink>
            <NavLink to="/agent-bridge" end style={navLinkStyle}>
              Agent Bridge
            </NavLink>
          </div>
        </div>
      </nav>
    </>
  );
}
