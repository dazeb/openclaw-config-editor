import { useState } from 'react';
import type { FieldDef } from '../schema';
import ToggleSwitch from './ToggleSwitch';
import TagInput from './TagInput';
import FallbackModelEditor, { KNOWN_MODELS } from './FallbackModelEditor';
import HelpModal from './HelpModal';

interface FieldRowProps {
  field: FieldDef;
  value: unknown;
  onChange: (path: string, value: unknown) => void;
  error?: string | null;
  config?: Record<string, unknown>;
}

const inputBase: React.CSSProperties = {
  background: '#22263a',
  border: '1px solid #2a2d3e',
  borderRadius: '6px',
  color: '#e2e8f0',
  padding: '8px 12px',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s',
};

// Helper to get a nested config value by dot-path
function getPath(obj: Record<string, unknown>, dotPath: string): unknown {
  return dotPath.split('.').reduce((cur: unknown, k) => {
    if (cur && typeof cur === 'object') return (cur as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

// A field has "rich help" if it has optionDescriptions, examples, or a long help string
function hasRichHelp(field: FieldDef): boolean {
  if (field.optionDescriptions && Object.keys(field.optionDescriptions).length > 0) return true;
  if (field.examples && field.examples.length > 0) return true;
  if (field.docUrl) return true;
  return false;
}

const REDACTED_TOKEN = '__OPENCLAW_REDACTED__';
const ENV_VAR_RE = /^\$\{([A-Z_][A-Z0-9_]*)\}$/;

function isRedacted(v: unknown): boolean {
  return typeof v === 'string' && v === REDACTED_TOKEN;
}

function isEnvRef(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const m = v.match(ENV_VAR_RE);
  return m ? m[1] : null;
}

// Wraps any sensitive/string control with redacted / env-var awareness
function RedactedWrapper({
  value,
  onChange,
  children,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  children: React.ReactNode;
}) {
  const [overriding, setOverriding] = useState(false);

  const envVar = isEnvRef(value);

  if (isRedacted(value) && !overriding) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#1a1d2e', border: '1px solid #f59e0b44',
          borderRadius: '6px', padding: '8px 12px',
        }}>
          <span style={{ fontSize: '16px' }}>🔒</span>
          <span style={{ fontSize: '13px', color: '#f59e0b', fontFamily: 'monospace', flex: 1 }}>
            __OPENCLAW_REDACTED__
          </span>
          <button
            type="button"
            onClick={() => { onChange(''); setOverriding(true); }}
            style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '4px',
              background: '#f59e0b22', border: '1px solid #f59e0b66',
              color: '#f59e0b', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Override
          </button>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>
          🔒 Managed by OpenClaw — will be preserved as-is on export unless overridden.
          To use an env var instead: type <code style={{ color: '#00d4d4' }}>{'${MY_VAR}'}</code>
        </div>
      </div>
    );
  }

  if (envVar) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#1a1d2e', border: '1px solid #00d4d444',
          borderRadius: '6px', padding: '8px 12px',
        }}>
          <span style={{ fontSize: '14px' }}>🌐</span>
          <span style={{ fontSize: '13px', color: '#00d4d4', fontFamily: 'monospace', flex: 1 }}>
            {`\${${envVar}}`}
          </span>
          <button
            type="button"
            onClick={() => { onChange(''); setOverriding(true); }}
            style={{
              fontSize: '11px', padding: '3px 10px', borderRadius: '4px',
              background: '#00d4d422', border: '1px solid #00d4d444',
              color: '#00d4d4', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Edit
          </button>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>
          🌐 Using environment variable <code style={{ color: '#00d4d4' }}>{envVar}</code> — will be exported as-is.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {children}
      {overriding && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => { onChange(REDACTED_TOKEN); setOverriding(false); }}
            style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
              background: '#f59e0b11', border: '1px solid #f59e0b44',
              color: '#f59e0b', cursor: 'pointer',
            }}
          >
            🔒 Reset to REDACTED
          </button>
          <span style={{ fontSize: '11px', color: '#475569', alignSelf: 'center' }}>
            or type <code style={{ color: '#00d4d4' }}>{'${MY_VAR}'}</code> to use an env var
          </span>
        </div>
      )}
    </div>
  );
}

// Equality check supporting primitive + serialized comparisons
function looseEq(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;
  return String(a) === String(b);
}

export default function FieldRow({ field, value, onChange, error, config }: FieldRowProps) {
  const [showSensitive, setShowSensitive] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const { path, label, help, type, options, sensitive, placeholder, min, max } = field;

  const val = value !== undefined ? value : (field.defaultValue !== undefined ? field.defaultValue : '');

  const isFilledValue = value !== undefined && value !== '' && !isRedacted(value);
  const isDefault = field.defaultValue !== undefined && looseEq(value, field.defaultValue);
  const isRecommended = field.recommended !== undefined && looseEq(value, field.recommended);
  const divergesFromRecommended = field.recommended !== undefined && !looseEq(value, field.recommended) && value !== undefined && value !== '';

  const borderColor = error ? '#ef4444'
    : divergesFromRecommended ? '#f59e0b44'
    : isRecommended ? '#22c55e44'
    : (isFilledValue ? '#22c55e33' : '#2a2d3e');

  const renderControl = () => {
    switch (type) {
      case 'boolean': {
        return (
          <ToggleSwitch
            id={`field-${path}`}
            checked={Boolean(val)}
            onChange={v => onChange(path, v)}
          />
        );
      }

      case 'enum': {
        return (
          <select
            id={`field-${path}`}
            name={path}
            value={String(val ?? '')}
            onChange={e => onChange(path, e.target.value)}
            style={{ ...inputBase, borderColor, cursor: 'pointer' }}
          >
            <option value="">— select —</option>
            {options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      }

      case 'number': {
        return (
          <input
            id={`field-${path}`}
            name={path}
            type="number"
            value={val !== undefined && val !== '' ? Number(val) : ''}
            min={min}
            max={max}
            onChange={e => {
              const n = parseFloat(e.target.value);
              onChange(path, isNaN(n) ? undefined : n);
            }}
            placeholder={placeholder || `${min ?? ''}–${max ?? ''}`}
            style={{ ...inputBase, borderColor }}
          />
        );
      }

      case 'array': {
        return (
          <TagInput
            id={`field-${path}`}
            values={Array.isArray(val) ? (val as string[]) : []}
            onChange={v => onChange(path, v)}
            placeholder={placeholder}
          />
        );
      }

      case 'model-select': {
        return (
          <div style={{ position: 'relative' }}>
            <select
              id={`field-${path}`}
              name={path}
              value={String(val ?? '')}
              onChange={e => onChange(path, e.target.value)}
              style={{ ...inputBase, borderColor, cursor: 'pointer', appearance: 'none', paddingRight: '32px' }}
            >
              <option value="">— select model —</option>
              {KNOWN_MODELS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
              {val && !KNOWN_MODELS.includes(String(val)) && (
                <option value={String(val)}>{String(val)} (custom)</option>
              )}
            </select>
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>▾</span>
          </div>
        );
      }

      case 'model-fallbacks': {
        // path = 'agents.defaults.model.primary'
        // fallbacks = 'agents.defaults.model.fallbacks'
        const fallbacksPath = path.replace('.primary', '.fallbacks');
        const primaryVal = config ? String(getPath(config, path) ?? '') : String(val ?? '');
        const fallbacksVal = config
          ? (getPath(config, fallbacksPath) as string[] | undefined) ?? []
          : [];
        return (
          <FallbackModelEditor
            id={`field-${path}`}
            primaryModel={primaryVal}
            onPrimaryChange={v => onChange(path, v)}
            values={fallbacksVal}
            onChange={v => onChange(fallbacksPath, v)}
          />
        );
      }

      case 'string': {
        if (sensitive) {
          const rawInput = (
            <div style={{ position: 'relative' }}>
              <input
                id={`field-${path}`}
                name={path}
                type={showSensitive ? 'text' : 'password'}
                value={isRedacted(val) || isEnvRef(val) ? '' : String(val ?? '')}
                onChange={e => onChange(path, e.target.value)}
                placeholder={placeholder || 'Enter value or ${ENV_VAR}'}
                style={{ ...inputBase, borderColor, paddingRight: '80px' }}
                autoComplete="off"
                data-lpignore="true"
              />
              <button
                type="button"
                onClick={() => setShowSensitive(s => !s)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px 6px',
                }}
              >
                {showSensitive ? '🙈 Hide' : '👁 Show'}
              </button>
            </div>
          );
          return (
            <RedactedWrapper value={val} onChange={v => onChange(path, v)}>
              {rawInput}
            </RedactedWrapper>
          );
        }
        // Non-sensitive strings: still support env-var refs
        const strInput = (
          <input
            id={`field-${path}`}
            name={path}
            type="text"
            value={isRedacted(val) || isEnvRef(val) ? String(val ?? '') : String(val ?? '')}
            onChange={e => onChange(path, e.target.value)}
            placeholder={placeholder || ''}
            style={{ ...inputBase, borderColor }}
          />
        );
        if (isRedacted(val) || isEnvRef(val)) {
          return (
            <RedactedWrapper value={val} onChange={v => onChange(path, v)}>
              {strInput}
            </RedactedWrapper>
          );
        }
        return strInput;
      }

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: type === 'model-fallbacks' ? 'column' : 'row',
        alignItems: type === 'boolean' ? 'center' : 'flex-start',
        gap: '16px',
        padding: '14px 0',
        borderBottom: '1px solid #1e2130',
      }}
    >
      {/* Left: label + help */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <label
            htmlFor={`field-${path}`}
            style={{ fontSize: '14px', fontWeight: 500, color: '#e2e8f0', cursor: 'pointer' }}
          >
            {label}
          </label>
          {hasRichHelp(field) && (
            <HelpButton onClick={() => setShowHelp(true)} />
          )}
          {sensitive && (
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '3px',
              background: '#f59e0b22',
              color: '#f59e0b',
              border: '1px solid #f59e0b44',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}>
              SENSITIVE
            </span>
          )}
          {isFilledValue && !error && !isDefault && !isRecommended && !divergesFromRecommended && (
            <span style={{ color: '#22c55e', fontSize: '12px' }}>✓</span>
          )}
          {isDefault && !isRecommended && (
            <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '4px',
              background: '#22263a', color: '#94a3b8', border: '1px solid #334155',
              fontWeight: 600, letterSpacing: '0.04em' }}>DEFAULT</span>
          )}
          {isRecommended && (
            <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '4px',
              background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e44',
              fontWeight: 600, letterSpacing: '0.04em' }}>✓ RECOMMENDED</span>
          )}
          {divergesFromRecommended && !error && (
            <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '4px',
              background: '#f59e0b11', color: '#f59e0b', border: '1px solid #f59e0b44',
              fontWeight: 600, letterSpacing: '0.04em' }}>⚠ NOT DEFAULT</span>
          )}
          {isRedacted(value) && (
            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
              background: '#f59e0b11', color: '#f59e0b', border: '1px solid #f59e0b33',
              fontWeight: 600, letterSpacing: '0.05em' }}>🔒 REDACTED</span>
          )}
          {isEnvRef(value) && (
            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
              background: '#00d4d411', color: '#00d4d4', border: '1px solid #00d4d433',
              fontWeight: 600 }}>🌐 ENV</span>
          )}
        </div>
        {showHelp && (
          <HelpModal field={field} onClose={() => setShowHelp(false)} />
        )}
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: type !== 'boolean' ? '6px' : '0' }}>
          {help}
        </div>

        {/* Default value hint */}
        {field.defaultValue !== undefined && (
          <div style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
            Default: <code style={{ color: '#94a3b8', background: '#1e2130', padding: '1px 5px', borderRadius: '3px', fontSize: '11px' }}>{String(field.defaultValue)}</code>
            {field.recommended !== undefined && !looseEq(field.defaultValue, field.recommended) && (
              <span style={{ marginLeft: '6px' }}>
                · Recommended: <code style={{ color: '#22c55e', background: '#22c55e11', padding: '1px 5px', borderRadius: '3px', fontSize: '11px' }}>{String(field.recommended)}</code>
              </span>
            )}
          </div>
        )}

        {/* Recommended reason — shown when value diverges */}
        {divergesFromRecommended && field.recommendedReason && (
          <div style={{
            fontSize: '12px', color: '#f59e0b', marginBottom: '6px',
            background: '#f59e0b0d', border: '1px solid #f59e0b22',
            borderRadius: '5px', padding: '6px 10px',
            display: 'flex', gap: '6px', alignItems: 'flex-start',
          }}>
            <span style={{ flexShrink: 0 }}>💡</span>
            <span>
              <strong>Recommended: <code style={{ color: '#fbbf24', background: '#f59e0b11', padding: '1px 5px', borderRadius: '3px' }}>{String(field.recommended)}</code></strong>
              {' — '}{field.recommendedReason}
            </span>
          </div>
        )}

        {/* Recommended reason — shown when value matches recommended (positive reinforcement) */}
        {isRecommended && field.recommendedReason && (
          <div style={{
            fontSize: '12px', color: '#22c55e', marginBottom: '6px',
            background: '#22c55e0a', border: '1px solid #22c55e22',
            borderRadius: '5px', padding: '6px 10px',
            display: 'flex', gap: '6px', alignItems: 'flex-start',
          }}>
            <span style={{ flexShrink: 0 }}>✅</span>
            <span>{field.recommendedReason}</span>
          </div>
        )}

        {type === 'enum' && options && !field.optionDescriptions && (
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
            Options: {options.join(' · ')}
          </div>
        )}
        {error && (
          <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>⚠ {error}</div>
        )}
      </div>


      {/* Right: control */}
      <div style={{
        width: type === 'boolean' ? 'auto' : type === 'model-fallbacks' ? '100%' : '300px',
        flexShrink: type === 'model-fallbacks' ? 1 : 0,
      }}>
        {renderControl()}
      </div>
    </div>
  );
}

function HelpButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={e => { e.preventDefault(); onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Show help"
      style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: hovered ? '#00d4d422' : '#22263a',
        border: '1px solid #2a2d3e',
        color: hovered ? '#00d4d4' : '#64748b',
        cursor: 'pointer',
        fontSize: '10px',
        fontWeight: 700,
        lineHeight: '14px',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      ?
    </button>
  );
}
