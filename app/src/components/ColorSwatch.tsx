interface ColorSwatchProps {
  color: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ColorSwatch({ color, label, size = 'md' }: ColorSwatchProps) {
  const sizes: Record<string, { swatch: number; font: string }> = {
    sm: { swatch: 48, font: 'var(--text-caption)' },
    md: { swatch: 72, font: 'var(--text-body)' },
    lg: { swatch: 96, font: 'var(--text-tagline)' },
  };
  const s = sizes[size];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-xs)',
      }}
    >
      <div
        style={{
          width: s.swatch,
          height: s.swatch,
          borderRadius: 'var(--radius-lg)',
          background: color,
          boxShadow: 'var(--shadow-product)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      />
      <span
        style={{
          font: s.font,
          color: 'var(--color-ink-muted-80)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {color}
      </span>
      {label && (
        <span
          style={{
            font: 'var(--text-caption)',
            color: 'var(--color-ink-muted-48)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
