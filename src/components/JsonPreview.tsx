import { useState } from 'react';
import { copyToClipboard } from '../utils';

interface JsonPreviewProps {
  config: Record<string, unknown>;
}

export default function JsonPreview({ config }: JsonPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const json = JSON.stringify(config, null, 2);

  const handleCopy = async () => {
    await copyToClipboard(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: '#1a1d27',
      border: '1px solid #2a2d3e',
      borderRadius: '10px',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: isOpen ? '1px solid #2a2d3e' : 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setIsOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>📄</span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0' }}>Live JSON Preview</span>
          <span style={{ fontSize: '11px', color: '#475569' }}>
            ({json.split('\n').length} lines)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={e => { e.stopPropagation(); handleCopy(); }}
            style={{
              background: copied ? '#22c55e22' : '#22263a',
              border: `1px solid ${copied ? '#22c55e' : '#2a2d3e'}`,
              borderRadius: '6px',
              color: copied ? '#22c55e' : '#94a3b8',
              padding: '4px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy JSON'}
          </button>
          <span style={{ color: '#475569', fontSize: '16px' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div style={{
          padding: '16px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          <pre className="json-preview" style={{ margin: 0, color: '#94a3b8' }}>
            {json.split('\n').map((line, i) => {
              // Simple syntax coloring
              const colored = line
                .replace(/"([^"]+)":/g, '<span style="color:#00d4d4">"$1"</span>:')
                .replace(/: "([^"]*)"/g, ': <span style="color:#a3e635">"$1"</span>')
                .replace(/: (true|false)/g, ': <span style="color:#f59e0b">$1</span>')
                .replace(/: (-?\d+\.?\d*)/g, ': <span style="color:#818cf8">$1</span>');
              return (
                <div key={i} dangerouslySetInnerHTML={{ __html: colored }} />
              );
            })}
          </pre>
        </div>
      )}
    </div>
  );
}
