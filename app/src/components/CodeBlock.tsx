interface CodeBlockProps {
  children: string;
  maxHeight?: number;
}

export default function CodeBlock({ children, maxHeight = 400 }: CodeBlockProps) {
  if (!children) {
    return <div className="empty-state">No data</div>;
  }

  return (
    <pre className="code-block" style={{ maxHeight }}>
      {children}
    </pre>
  );
}
