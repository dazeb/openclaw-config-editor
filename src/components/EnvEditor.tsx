import { useState, useEffect, useRef, useCallback } from 'react';
import { KNOWN_ENV_VARS, type EnvVarDef } from '../envVars';
import { parseEnv, formatValue } from '../utils/envParser';
import EnvHelpModal from './EnvHelpModal';

const STORAGE_KEY = 'openclaw-env-editor-draft';
const STORAGE_META_KEY = 'openclaw-env-editor-meta';

interface EnvState {
  [key: string]: string | undefined;
}

interface RestoredDraft {
  state: EnvState;
  savedAt: string;
}

function loadDraft(): RestoredDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const meta = localStorage.getItem(STORAGE_META_KEY);
    if (!raw) return null;
    return {
      state: JSON.parse(raw),
      savedAt: meta ? JSON.parse(meta).savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function saveDraft(state: EnvState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify({ savedAt: new Date().toISOString() }));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_META_KEY);
}

function groupEnvVars() {
  const groups = new Map<string, EnvVarDef[]>();
  for (const v of KNOWN_ENV_VARS) {
    if (!groups.has(v.group)) groups.set(v.group, []);
    groups.get(v.group)!.push(v);
  }
  return groups;
}

function buildKnownKeysSet(): Set<string> {
  return new Set(KNOWN_ENV_VARS.map(v => v.key));
}

export default function EnvEditor() {
  const draft = loadDraft();
  const [envState, setEnvState] = useState<EnvState>(draft?.state ?? {});
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [showRaw, setShowRaw] = useState(false);
  const [restoredAt, setRestoredAt] = useState<string | null>(draft?.savedAt ?? null);
  const [helpEnvVar, setHelpEnvVar] = useState<EnvVarDef | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);

  // Auto-save on state change (debounced 600ms)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (Object.keys(envState).length === 0) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraft(envState);
    }, 600);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [envState]);

  const handleUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const entries = parseEnv(text);

      const newState: EnvState = {};
      for (const entry of entries) {
        if (entry.type === 'var' && entry.key && entry.value !== undefined) {
          newState[entry.key] = entry.value;
        }
      }

      setEnvState(newState);
      saveDraft(newState);
      setShowPasswords(new Set());
    };
    reader.readAsText(file);
  }, []);

  const handleChangeVar = (key: string, value: string) => {
    setEnvState((prev) => ({ ...prev, [key]: value }));
  };

  const handleRemoveVar = (key: string) => {
    setEnvState((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleAddVar = (key: string, value: string) => {
    if (key.trim()) {
      setEnvState((prev) => ({ ...prev, [key.trim()]: value }));
    }
  };

  const handleDownload = () => {
    const lines: string[] = [];
    const groups = groupEnvVars();
    const knownKeys = buildKnownKeysSet();

    // Add known groups with section headers
    for (const [groupName, vars] of groups) {
      const groupVars = vars.filter((v) => envState[v.key]);
      if (groupVars.length > 0) {
        lines.push(`# === ${groupName.toUpperCase()} ===`);
        for (const v of groupVars) {
          const val = envState[v.key];
          if (val !== undefined) {
            lines.push(`${v.key}=${formatValue(val)}`);
          }
        }
        lines.push('');
      }
    }

    // Add custom variables
    const customVars = Object.entries(envState).filter(([k]) => !knownKeys.has(k) && envState[k]);
    if (customVars.length > 0) {
      lines.push('# === CUSTOM / UNKNOWN VARIABLES ===');
      for (const [k, v] of customVars) {
        if (v !== undefined) {
          lines.push(`${k}=${formatValue(v)}`);
        }
      }
    }

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyRaw = async () => {
    const lines: string[] = [];
    const groups = groupEnvVars();
    const knownKeys = buildKnownKeysSet();

    for (const [groupName, vars] of groups) {
      const groupVars = vars.filter((v) => envState[v.key]);
      if (groupVars.length > 0) {
        lines.push(`# === ${groupName.toUpperCase()} ===`);
        for (const v of groupVars) {
          const val = envState[v.key];
          if (val !== undefined) {
            lines.push(`${v.key}=${formatValue(val)}`);
          }
        }
        lines.push('');
      }
    }

    const customVars = Object.entries(envState).filter(([k]) => !knownKeys.has(k) && envState[k]);
    if (customVars.length > 0) {
      lines.push('# === CUSTOM / UNKNOWN VARIABLES ===');
      for (const [k, v] of customVars) {
        if (v !== undefined) {
          lines.push(`${k}=${formatValue(v)}`);
        }
      }
    }

    const content = lines.join('\n');
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const handleClearDraft = () => {
    clearDraft();
    setEnvState({});
    setShowPasswords(new Set());
    setRestoredAt(null);
  };

  const togglePassword = (key: string) => {
    setShowPasswords((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const groups = groupEnvVars();
  const knownKeys = buildKnownKeysSet();
  const customVars = Object.entries(envState).filter(([k]) => !knownKeys.has(k));

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', flexDirection: 'column' }}>
      {/* Restored draft banner */}
      {restoredAt && (
        <div
          style={{
            background: '#22c55e0a',
            borderBottom: '1px solid #22c55e22',
            padding: '6px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '13px' }}>💾</span>
          <span style={{ fontSize: '12px', color: '#86efac' }}>
            <strong>Draft restored</strong> from last session
            {' · '}
            <span style={{ color: '#4ade80' }}>{new Date(restoredAt).toLocaleString()}</span>
          </span>
          <button
            onClick={handleClearDraft}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: '1px solid #22c55e44',
              borderRadius: '4px',
              color: '#86efac',
              fontSize: '11px',
              padding: '2px 10px',
              cursor: 'pointer',
            }}
          >
            × Clear draft
          </button>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
        {/* Top action bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          {/* Upload button */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: '#22263a',
              border: '1px solid #2a2d3e',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#2a2d3e';
              (e.currentTarget as HTMLElement).style.color = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#22263a';
              (e.currentTarget as HTMLElement).style.color = '#94a3b8';
            }}
          >
            📂 Upload .env
            <input
              type="file"
              accept=".env,text/plain"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) {
                  handleUpload(file);
                  e.currentTarget.value = '';
                }
              }}
              style={{ display: 'none' }}
            />
          </label>

          {/* Add variable button */}
          <AddVarForm onAdd={handleAddVar} />

          <div style={{ flex: 1 }} /> {/* Spacer */}

          {/* Download button */}
          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: '#00d4d422',
              border: '1px solid #00d4d4',
              borderRadius: '6px',
              color: '#00d4d4',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#00d4d433';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#00d4d422';
            }}
          >
            ⬇ Download .env
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopyRaw}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: '#22263a',
              border: '1px solid #2a2d3e',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#2a2d3e';
              (e.currentTarget as HTMLElement).style.color = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#22263a';
              (e.currentTarget as HTMLElement).style.color = '#94a3b8';
            }}
          >
            📋 Copy
          </button>
        </div>

        {/* Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Array.from(groups.entries()).map(([groupName, vars]) => (
            <EnvGroup
              key={groupName}
              groupName={groupName}
              vars={vars}
              envState={envState}
              showPasswords={showPasswords}
              onChange={handleChangeVar}
              onRemove={handleRemoveVar}
              onTogglePassword={togglePassword}
              onShowHelp={setHelpEnvVar}
            />
          ))}

          {/* Custom variables group */}
          {customVars.length > 0 && (
            <EnvGroup
              groupName="Unknown / Custom Variables"
              vars={customVars.map(([key]) => ({
                key,
                group: 'Unknown / Custom Variables',
                label: key,
                description: 'Custom environment variable',
                sensitive: false,
              }))}
              envState={envState}
              showPasswords={showPasswords}
              onChange={handleChangeVar}
              onRemove={handleRemoveVar}
              onTogglePassword={togglePassword}
              onShowHelp={setHelpEnvVar}
              isCustomGroup
            />
          )}
        </div>

        {/* Raw preview */}
        <div style={{ marginTop: '24px' }}>
          <RawPreview
            show={showRaw}
            onToggle={() => setShowRaw(!showRaw)}
            envState={envState}
          />
        </div>
      </div>

      {/* Help Modal */}
      {helpEnvVar && (
        <EnvHelpModal
          envVar={helpEnvVar}
          onClose={() => setHelpEnvVar(null)}
        />
      )}
    </div>
  );
}

interface EnvGroupProps {
  groupName: string;
  vars: EnvVarDef[];
  envState: EnvState;
  showPasswords: Set<string>;
  onChange: (key: string, value: string) => void;
  onRemove: (key: string) => void;
  onTogglePassword: (key: string) => void;
  onShowHelp: (envVar: EnvVarDef) => void;
  isCustomGroup?: boolean;
}

function EnvGroup({
  groupName,
  vars,
  envState,
  showPasswords,
  onChange,
  onRemove,
  onTogglePassword,
  onShowHelp,
  isCustomGroup,
}: EnvGroupProps) {
  const [collapsed, setCollapsed] = useState(!isCustomGroup);

  const setVars = vars.filter((v) => envState[v.key]);

  return (
    <div
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Group header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#cbd5e1',
          fontSize: '13px',
          fontWeight: 600,
          borderBottom: collapsed ? 'none' : '1px solid #2a2d3e',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#22263a';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
        <span>{groupName}</span>
        <span
          style={{
            marginLeft: 'auto',
            background: '#00d4d422',
            color: '#00d4d4',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          {setVars.length}/{vars.length}
        </span>
      </button>

      {/* Group content */}
      {!collapsed && (
        <div style={{ padding: '12px 0', borderTop: '1px solid #2a2d3e' }}>
          {vars.map((v) => (
            <EnvRow
              key={v.key}
              varDef={v}
              value={envState[v.key] || ''}
              isSet={!!envState[v.key]}
              showPassword={showPasswords.has(v.key)}
              onChange={(val) => onChange(v.key, val)}
              onRemove={() => onRemove(v.key)}
              onTogglePassword={() => onTogglePassword(v.key)}
              onShowHelp={() => onShowHelp(v)}
              isCustom={isCustomGroup}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface EnvRowProps {
  varDef: EnvVarDef;
  value: string;
  isSet: boolean;
  showPassword: boolean;
  onChange: (value: string) => void;
  onRemove: () => void;
  onTogglePassword: () => void;
  onShowHelp: () => void;
  isCustom?: boolean;
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

function EnvRow({
  varDef,
  value,
  isSet,
  showPassword,
  onChange,
  onRemove,
  onTogglePassword,
  onShowHelp,
  isCustom,
}: EnvRowProps) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #2a2d3e',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      {/* Key and badges */}
      <div style={{ flex: '0 0 200px' }}>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#00d4d4',
            fontWeight: 600,
            marginBottom: '4px',
            wordBreak: 'break-word',
          }}
        >
          {varDef.key}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {varDef.sensitive && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                background: '#f59e0b22',
                color: '#f59e0b',
                padding: '2px 6px',
                borderRadius: '3px',
              }}
            >
              SENSITIVE
            </span>
          )}
          {varDef.required && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                background: '#ef444422',
                color: '#ef4444',
                padding: '2px 6px',
                borderRadius: '3px',
              }}
            >
              REQUIRED
            </span>
          )}
          <HelpButton onClick={onShowHelp} />
        </div>
        {varDef.description && (
          <div
            style={{
              fontSize: '11px',
              color: '#64748b',
              marginTop: '4px',
            }}
          >
            {varDef.description}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {varDef.sensitive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              id={`env-${varDef.key}`}
              name={varDef.key}
              type={showPassword ? 'text' : 'password'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={varDef.placeholder}
              style={{
                flex: 1,
                padding: '8px 10px',
                background: '#0f1117',
                border: '1px solid #2a2d3e',
                borderRadius: '4px',
                color: '#e2e8f0',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            />
            <button
              onClick={onTogglePassword}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '14px',
              }}
              title={showPassword ? 'Hide' : 'Show'}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
        ) : (
          <input
            id={`env-${varDef.key}`}
            name={varDef.key}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={varDef.placeholder}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: '#0f1117',
              border: '1px solid #2a2d3e',
              borderRadius: '4px',
              color: '#e2e8f0',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          />
        )}
      </div>

      {/* Status and actions */}
      <div style={{ flex: '0 0 120px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '3px',
            background: isSet ? '#22c55e22' : '#64748b22',
            color: isSet ? '#22c55e' : '#64748b',
          }}
        >
          {isSet ? 'SET' : 'NOT SET'}
        </span>
        {(isCustom || !varDef.key) && (
          <button
            onClick={onRemove}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '2px 4px',
            }}
            title="Remove"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface AddVarFormProps {
  onAdd: (key: string, value: string) => void;
}

function AddVarForm({ onAdd }: AddVarFormProps) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  const handleAdd = () => {
    if (key.trim()) {
      onAdd(key.trim(), value);
      setKey('');
      setValue('');
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 14px',
          background: '#22263a',
          border: '1px solid #2a2d3e',
          borderRadius: '6px',
          color: '#94a3b8',
          fontSize: '13px',
          cursor: 'pointer',
          fontWeight: 500,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#2a2d3e';
          (e.currentTarget as HTMLElement).style.color = '#cbd5e1';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#22263a';
          (e.currentTarget as HTMLElement).style.color = '#94a3b8';
        }}
      >
        + Add Variable
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input
        id="env-new-key"
        name="envKey"
        type="text"
        placeholder="KEY"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd();
          if (e.key === 'Escape') {
            setKey('');
            setValue('');
            setOpen(false);
          }
        }}
        style={{
          padding: '7px 10px',
          background: '#0f1117',
          border: '1px solid #2a2d3e',
          borderRadius: '4px',
          color: '#e2e8f0',
          fontSize: '12px',
          minWidth: '100px',
        }}
        autoFocus
      />
      <input
        id="env-new-value"
        name="envValue"
        type="text"
        placeholder="value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd();
          if (e.key === 'Escape') {
            setKey('');
            setValue('');
            setOpen(false);
          }
        }}
        style={{
          padding: '7px 10px',
          background: '#0f1117',
          border: '1px solid #2a2d3e',
          borderRadius: '4px',
          color: '#e2e8f0',
          fontSize: '12px',
          flex: 1,
          minWidth: '100px',
        }}
      />
      <button
        onClick={handleAdd}
        style={{
          padding: '7px 12px',
          background: '#00d4d422',
          border: '1px solid #00d4d4',
          borderRadius: '4px',
          color: '#00d4d4',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Add
      </button>
      <button
        onClick={() => {
          setKey('');
          setValue('');
          setOpen(false);
        }}
        style={{
          padding: '7px 12px',
          background: 'none',
          border: '1px solid #2a2d3e',
          borderRadius: '4px',
          color: '#94a3b8',
          fontSize: '12px',
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
    </div>
  );
}

interface RawPreviewProps {
  show: boolean;
  onToggle: () => void;
  envState: EnvState;
}

function RawPreview({ show, onToggle, envState }: RawPreviewProps) {
  const lines: string[] = [];
  const groups = groupEnvVars();
  const knownKeys = buildKnownKeysSet();

  for (const [groupName, vars] of groups) {
    const groupVars = vars.filter((v) => envState[v.key]);
    if (groupVars.length > 0) {
        lines.push(`# === ${groupName.toUpperCase()} ===`);
        for (const v of groupVars) {
          const val = envState[v.key];
          if (val !== undefined) {
            lines.push(`${v.key}=${formatValue(val)}`);
          }
        }
        lines.push('');
      }
    }


  const customVars = Object.entries(envState).filter(([k]) => !knownKeys.has(k) && envState[k]);
  if (customVars.length > 0) {
    lines.push('# === CUSTOM / UNKNOWN VARIABLES ===');
    for (const [k, v] of customVars) {
      if (v !== undefined) {
        lines.push(`${k}=${formatValue(v)}`);
      }
    }
  }

  const content = lines.join('\n') || '(empty)';

  return (
    <div
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#cbd5e1',
          fontSize: '13px',
          fontWeight: 600,
          borderBottom: show ? '1px solid #2a2d3e' : 'none',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#22263a';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        <span
          style={{
            transition: 'transform 0.2s',
            display: 'inline-block',
            transform: show ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        >
          ▼
        </span>
        <span>📄 Raw Preview</span>
      </button>
      {show && (
        <textarea
          value={content}
          readOnly
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '12px 16px',
            background: '#0f1117',
            border: 'none',
            color: '#e2e8f0',
            fontSize: '12px',
            fontFamily: 'monospace',
            borderTop: '1px solid #2a2d3e',
            resize: 'vertical',
          }}
        />
      )}
    </div>
  );
}
