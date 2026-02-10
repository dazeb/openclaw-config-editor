import { useState, useEffect } from 'react';

interface RawJsonEditorProps {
  config: Record<string, unknown>;
  onApply: (config: Record<string, unknown>) => void;
}

export default function RawJsonEditor({ config, onApply }: RawJsonEditorProps) {
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRaw(JSON.stringify(config, null, 2));
    }
  }, [isOpen]);

  const handleApply = () => {
    try {
      const parsed = JSON.parse(raw);
      setError(null);
      onApply(parsed);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`);
    }
  };

  const handleSync = () => {
    setRaw(JSON.stringify(config, null, 2));
    setError(null);
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
          <span style={{ fontSize: '14px' }}>⚙️</span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0' }}>Raw JSON Editor</span>
          <span style={{ fontSize: '11px', color: '#475569' }}>Advanced</span>
        </div>
        <span style={{ color: '#475569', fontSize: '16px' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{ padding: '16px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>
            Edit the full config JSON directly. Click "Sync from Form" to pull in your form edits,
            then "Apply to Form" to push your JSON back.
          </p>

          {error && (
            <div style={{
              background: '#ef444422',
              border: '1px solid #ef444466',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#ef4444',
              fontSize: '12px',
              marginBottom: '12px',
            }}>
              ⚠ {error}
            </div>
          )}

          <textarea
            id="raw-json-editor"
            name="rawJson"
            value={raw}
            onChange={e => { setRaw(e.target.value); setError(null); }}
            spellCheck={false}
            style={{
              width: '100%',
              height: '350px',
              background: '#0f1117',
              border: `1px solid ${error ? '#ef4444' : '#2a2d3e'}`,
              borderRadius: '6px',
              color: '#e2e8f0',
              padding: '12px',
              fontSize: '12px',
              fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
              lineHeight: '1.6',
              resize: 'vertical',
              outline: 'none',
            }}
          />

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={handleSync}
              style={{
                background: '#22263a',
                border: '1px solid #2a2d3e',
                borderRadius: '6px',
                color: '#94a3b8',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              🔄 Sync from Form
            </button>
            <button
              onClick={handleApply}
              style={{
                background: applied ? '#22c55e22' : '#00d4d422',
                border: `1px solid ${applied ? '#22c55e' : '#00d4d4'}`,
                borderRadius: '6px',
                color: applied ? '#22c55e' : '#00d4d4',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              {applied ? '✓ Applied!' : '✅ Apply to Form'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
