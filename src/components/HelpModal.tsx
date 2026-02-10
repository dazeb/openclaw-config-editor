import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { FieldDef } from '../schema';

interface HelpModalProps {
  field: FieldDef;
  onClose: () => void;
}

const typeLabel = (field: FieldDef): string => {
  switch (field.type) {
    case 'number': {
      const parts: string[] = [];
      if (field.min !== undefined) parts.push(`min: ${field.min}`);
      if (field.max !== undefined) parts.push(`max: ${field.max}`);
      return parts.length ? `integer (${parts.join(', ')})` : 'integer';
    }
    case 'boolean': return 'boolean';
    case 'string': return 'string';
    case 'enum': return 'enum';
    case 'array': return 'array of strings';
    case 'model-select': return 'model identifier';
    case 'model-fallbacks': return 'model + fallback chain';
    default: return field.type;
  }
};

export default function HelpModal({ field, onClose }: HelpModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#00000088',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1d27',
          border: '1px solid #2a2d3e',
          borderRadius: '12px',
          maxWidth: '540px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px #00000088',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '16px 20px',
          borderBottom: '1px solid #2a2d3e',
          position: 'sticky',
          top: 0,
          background: '#1a1d27',
          borderRadius: '12px 12px 0 0',
          zIndex: 1,
        }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', flex: 1 }}>
            {field.label}
          </span>
          <span style={{
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: '#00d4d422',
            color: '#00d4d4',
            border: '1px solid #00d4d444',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            {typeLabel(field)}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
              padding: '2px 4px',
              borderRadius: '4px',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>

          {/* Description */}
          {field.help && (
            <Section title="Description">
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                {field.help}
              </p>
            </Section>
          )}

          {/* Options (enum) */}
          {field.type === 'enum' && field.options && (
            <Section title="Options">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {field.options.map(opt => (
                  <div key={opt} style={{
                    background: '#22263a',
                    border: '1px solid #2a2d3e',
                    borderRadius: '8px',
                    padding: '10px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: field.optionDescriptions?.[opt] ? '4px' : 0 }}>
                      <code style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#00d4d4',
                        background: '#00d4d411',
                        padding: '1px 6px',
                        borderRadius: '3px',
                      }}>
                        {opt}
                      </code>
                      {field.defaultValue !== undefined && String(field.defaultValue) === opt && (
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
                          background: '#22263a', color: '#94a3b8', border: '1px solid #334155',
                          fontWeight: 600 }}>DEFAULT</span>
                      )}
                      {field.recommended !== undefined && String(field.recommended) === opt && (
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
                          background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e44',
                          fontWeight: 600 }}>✓ RECOMMENDED</span>
                      )}
                    </div>
                    {field.optionDescriptions?.[opt] && (
                      <p style={{ color: '#64748b', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                        {field.optionDescriptions[opt]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Type & Constraints */}
          <Section title="Type &amp; Constraints">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <Chip label="Type" value={typeLabel(field)} />
              {field.defaultValue !== undefined && (
                <Chip label="Default" value={String(field.defaultValue)} />
              )}
              {field.recommended !== undefined && (
                <Chip label="Recommended" value={String(field.recommended)} accent="#22c55e" />
              )}
              {field.required && (
                <Chip label="Required" value="yes" accent="#ef4444" />
              )}
              {field.sensitive && (
                <Chip label="Sensitive" value="yes" accent="#f59e0b" />
              )}
            </div>
            {field.recommendedReason && (
              <div style={{
                marginTop: '10px', fontSize: '12px', color: '#86efac',
                background: '#22c55e0a', border: '1px solid #22c55e22',
                borderRadius: '6px', padding: '8px 12px',
                display: 'flex', gap: '6px',
              }}>
                <span>💡</span>
                <span>{field.recommendedReason}</span>
              </div>
            )}
          </Section>

          {/* JSON Path */}
          <Section title="JSON Path">
            <code style={{
              display: 'block',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#94a3b8',
              background: '#22263a',
              border: '1px solid #2a2d3e',
              borderRadius: '6px',
              padding: '8px 12px',
            }}>
              {field.path}
            </code>
          </Section>

          {/* Examples */}
          {field.examples && field.examples.length > 0 && (
            <Section title="Example Values">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {field.examples.map((ex, i) => (
                  <code key={i} style={{
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#22c55e',
                    background: '#22c55e11',
                    border: '1px solid #22c55e33',
                    padding: '3px 10px',
                    borderRadius: '4px',
                  }}>
                    {ex}
                  </code>
                ))}
              </div>
            </Section>
          )}

          {/* CLI Commands */}
          <Section title="⌨️ CLI Commands">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                Apply changes directly from your terminal without editing the JSON file:
              </div>
              {/* Get current value */}
              <div>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '3px' }}>Get current value:</div>
                <code style={{
                  display: 'block', fontSize: '12px', fontFamily: 'monospace',
                  color: '#94a3b8', background: '#0f1117', border: '1px solid #2a2d3e',
                  padding: '8px 12px', borderRadius: '6px', whiteSpace: 'pre',
                }}>
                  {`openclaw config get ${field.path}`}
                </code>
              </div>
              {/* Set a value */}
              <div>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '3px' }}>Set a value:</div>
                <code style={{
                  display: 'block', fontSize: '12px', fontFamily: 'monospace',
                  color: '#00d4d4', background: '#0f1117', border: '1px solid #2a2d3e',
                  padding: '8px 12px', borderRadius: '6px', whiteSpace: 'pre',
                }}>
                  {`openclaw config set ${field.path} <value>`}
                </code>
              </div>
              {/* Enum examples */}
              {field.options && field.options.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '3px' }}>Examples for each option:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {field.options.map(opt => (
                      <code key={opt} style={{
                        display: 'block', fontSize: '12px', fontFamily: 'monospace',
                        color: '#86efac', background: '#0f1117', border: '1px solid #2a2d3e',
                        padding: '6px 12px', borderRadius: '6px',
                      }}>
                        {`openclaw config set ${field.path} ${opt}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}
              {/* Patch via gateway */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '3px' }}>Or patch config live (no file edit):</div>
                <code style={{
                  display: 'block', fontSize: '12px', fontFamily: 'monospace',
                  color: '#f59e0b', background: '#0f1117', border: '1px solid #2a2d3e',
                  padding: '8px 12px', borderRadius: '6px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                  {`openclaw gateway call config.patch --params '{"raw": "{ ${field.path.split('.').reduceRight((v, k) => `${k}: ${typeof v === 'string' && v.startsWith('{') ? v : `{ ${v} }`}`, '"<value>"')} }"}'`}
                </code>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                💡 Run <code style={{ color: '#00d4d4' }}>openclaw doctor</code> after changes to validate your config.
              </div>
            </div>
          </Section>

          {/* Docs link */}
          {field.docUrl && (
            <Section title="Documentation">
              <a
                href={field.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00d4d4', fontSize: '13px', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                {field.docUrl} ↗
              </a>
            </Section>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '8px',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Chip({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      background: '#22263a',
      border: '1px solid #2a2d3e',
      borderRadius: '6px',
      padding: '4px 10px',
      fontSize: '12px',
    }}>
      <span style={{ color: '#475569' }}>{label}:</span>
      <span style={{ color: accent ?? '#94a3b8', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}
