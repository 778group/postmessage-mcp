interface StatusIndicatorProps {
  isConnected: boolean;
  label?: string;
}

export default function StatusIndicator({ isConnected, label }: StatusIndicatorProps) {
  return (
    <div className="connection-bar">
      <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
      <span>
        {label ? `${label} — ` : ''}
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}
