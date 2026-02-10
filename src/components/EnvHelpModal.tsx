import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { EnvVarDef } from '../envVars';

interface EnvHelpModalProps {
  envVar: EnvVarDef;
  onClose: () => void;
}

export default function EnvHelpModal({ envVar, onClose }: EnvHelpModalProps) {
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
            {envVar.label}
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
            {envVar.sensitive ? 'sensitive' : 'string'}
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
          {/* Variable Key */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Environment Variable
            </div>
            <code style={{
              fontSize: '13px',
              fontFamily: 'monospace',
              color: '#00d4d4',
              background: '#00d4d411',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #00d4d433',
            }}>
              {envVar.key}
            </code>
          </div>

          {/* Description */}
          {envVar.description && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Description
              </div>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                {envVar.description}
              </p>
            </div>
          )}

          {/* Example */}
          {envVar.example && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Example
              </div>
              <code style={{
                display: 'block',
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#e2e8f0',
                background: '#0f1117',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2a2d3e',
              }}>
                {envVar.key}={envVar.example}
              </code>
            </div>
          )}

          {/* Placeholder */}
          {envVar.placeholder && !envVar.example && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Expected Format
              </div>
              <code style={{
                display: 'block',
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#64748b',
                background: '#0f1117',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2a2d3e',
              }}>
                {envVar.placeholder}
              </code>
            </div>
          )}

          {/* Documentation Link */}
          {envVar.docUrl && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Documentation
              </div>
              <a
                href={envVar.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#00d4d4',
                  fontSize: '13px',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  background: '#00d4d411',
                  borderRadius: '6px',
                  border: '1px solid #00d4d433',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#00d4d422';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#00d4d411';
                }}
              >
                <span>📖</span>
                <span>Get API Key / Learn More</span>
                <span style={{ marginLeft: '4px' }}>→</span>
              </a>
            </div>
          )}

          {/* Metadata */}
          <div style={{
            background: '#0f1117',
            border: '1px solid #2a2d3e',
            borderRadius: '8px',
            padding: '12px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Properties
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {envVar.required && (
                <span style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: '#ef444418',
                  color: '#ef4444',
                  border: '1px solid #ef444433',
                  fontWeight: 600,
                }}>
                  REQUIRED
                </span>
              )}
              {envVar.sensitive && (
                <span style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: '#f59e0b18',
                  color: '#f59e0b',
                  border: '1px solid #f59e0b44',
                  fontWeight: 600,
                }}>
                  SENSITIVE
                </span>
              )}
              <span style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#22263a',
                color: '#94a3b8',
                border: '1px solid #2a2d3e',
              }}>
                Group: {envVar.group}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
