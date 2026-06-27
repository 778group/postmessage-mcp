import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ flex: 1 }}>
      {/* Hero Section */}
      <section
        className="product-tile-light"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            font: 'var(--text-tagline)',
            color: 'var(--color-primary)',
            letterSpacing: '0.231px',
            marginBottom: 'var(--space-md)',
          }}
        >
          PostMessage MCP
        </p>
        <h1
          style={{
            font: 'var(--text-hero-display)',
            color: 'var(--color-ink)',
            marginBottom: 'var(--space-sm)',
            letterSpacing: '-0.28px',
          }}
        >
          平台的能力，业务的 Agent
        </h1>
        <p
          style={{
            font: 'var(--text-lead)',
            color: 'var(--color-ink-muted-80)',
            maxWidth: 640,
            marginBottom: 'var(--space-xxl)',
            letterSpacing: '0.196px',
          }}
        >
          不再二选一。把你的中后台系统通过 iframe + MCP 暴露出来，
          业务团队的 Agent 直接调用平台能力，UI 双方实时可见。
        </p>
        <Link
          to="/agent-bridge"
          style={{ textDecoration: 'none' }}
        >
          <span
            className="apple-button apple-button-primary"
            style={{ display: 'inline-flex', fontSize: 18, padding: '14px 28px' }}
          >
            体验完整 Demo
          </span>
        </Link>
      </section>

      {/* Feature Tiles */}
      <section className="product-tile-dark" style={{ textAlign: 'center' }}>
        <h2
          style={{
            font: 'var(--text-display-lg)',
            color: 'var(--color-on-dark)',
            marginBottom: 'var(--space-md)',
          }}
        >
          你的 Agent 缺能力？iframe 接上就行
        </h2>
        <p
          style={{
            font: 'var(--text-lead)',
            color: 'var(--color-body-muted)',
            maxWidth: 580,
            margin: '0 auto var(--space-xxl)',
            letterSpacing: '0.196px',
          }}
        >
          平台团队提供中后台（iframe + MCP Server），
          业务团队使用自己的 Agent（MCP Client），
          Agent 通过标准协议操作中后台，同时 UI 实时反馈。
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-lg)',
            maxWidth: 900,
            margin: '0 auto',
            textAlign: 'left',
          }}
        >
          {[
            {
              title: '双向模式',
              desc: '主页面或 iframe 都可以作 Server。平台嵌入业务页面，还是业务嵌入平台，都能适配。',
            },
            {
              title: 'MCP 标准协议',
              desc: '完整的 Tools、Resources、Prompts 支持。Agent 自动发现能力，无需手动对接。',
            },
            {
              title: 'UI 实时反馈',
              desc: 'Agent 调用 tool 的同时，iframe 里的 UI 当场更新——图表渲染、客户切换、报告导出，眼见为实。',
            },
            {
              title: '零信任安全',
              desc: 'Origin 白名单、精确/通配符匹配。非白名单来源消息直接丢弃。所有通信基于浏览器原生 postMessage。',
            },
          ].map((f, i) => (
            <div key={i}>
              <h3
                style={{
                  font: 'var(--text-body-strong)',
                  color: 'var(--color-on-dark)',
                  marginBottom: 'var(--space-xs)',
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  font: 'var(--text-caption)',
                  color: 'var(--color-body-muted)',
                  lineHeight: 1.55,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Cards */}
      <section
        className="product-tile-parchment"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h2
          style={{
            font: 'var(--text-display-lg)',
            color: 'var(--color-ink)',
            marginBottom: 'var(--space-xs)',
            textAlign: 'center',
          }}
        >
          Explore the Demos
        </h2>
        <p
          style={{
            font: 'var(--text-lead)',
            color: 'var(--color-ink-muted-80)',
            textAlign: 'center',
            maxWidth: 500,
            marginBottom: 'var(--space-xxl)',
            letterSpacing: '0.196px',
          }}
        >
          Three interactive demos showing different patterns of MCP communication.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-lg)',
            maxWidth: 1000,
            width: '100%',
          }}
        >
          <Link to="/agent-bridge" style={{ textDecoration: 'none' }}>
            <div
              className="apple-card"
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                borderColor: 'var(--color-primary)',
                borderWidth: 2,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  font: 'var(--text-fine-print)',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 11,
                }}
              >
                New
              </span>
              <h3
                style={{
                  font: 'var(--text-tagline)',
                  color: 'var(--color-ink)',
                  letterSpacing: '0.231px',
                  marginBottom: 'var(--space-xs)',
                }}
              >
                Agent Bridge
              </h3>
              <p style={{ font: 'var(--text-body)', color: 'var(--color-ink-muted-80)', lineHeight: 1.5 }}>
                CRM iframe as MCP Server + business Agent as MCP Client.
                The Agent calls tools on the CRM system — search customers,
                render charts, export reports — while the CRM UI updates live in the iframe.
              </p>
            </div>
          </Link>

          <Link to="/calculator" style={{ textDecoration: 'none' }}>
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
              <p style={{ font: 'var(--text-body)', color: 'var(--color-ink-muted-80)', lineHeight: 1.5 }}>
                Main page as MCP Server, iframe as MCP Client.
                Call the calculator tool from the iframe and see server logs in real time.
              </p>
            </div>
          </Link>

          <Link to="/color-palette" style={{ textDecoration: 'none' }}>
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
              <p style={{ font: 'var(--text-body)', color: 'var(--color-ink-muted-80)', lineHeight: 1.5 }}>
                Main page as MCP Client, iframe as MCP Server.
                Generate color palettes and read Apple design tokens via MCP resources.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="product-tile-light"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            font: 'var(--text-display-md)',
            color: 'var(--color-ink)',
            marginBottom: 'var(--space-md)',
          }}
        >
          Ready to connect your systems?
        </h2>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 'var(--space-lg)' }}>
          <a
            href="https://www.npmjs.com/package/postmessage-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="apple-button apple-button-primary"
            style={{ textDecoration: 'none', fontSize: 16, padding: '12px 24px' }}
          >
            npm install postmessage-mcp
          </a>
          <a
            href="https://github.com/778group/postmessage-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="apple-button apple-button-secondary-pill"
            style={{ textDecoration: 'none', fontSize: 16, padding: '12px 24px' }}
          >
            View on GitHub
          </a>
        </div>
        <p style={{ font: 'var(--text-caption)', color: 'var(--color-ink-muted-48)' }}>
          MIT License · React 18/19 · TypeScript
        </p>
      </section>
    </div>
  );
}
