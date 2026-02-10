import { useState, useEffect, useCallback, useRef } from 'react';
import { SECTIONS, ALL_FIELDS } from './schema';
import { setPath, downloadJson, copyToClipboard, clearSensitiveFields, validateField } from './utils';
import Sidebar from './components/Sidebar';
import SectionCard from './components/SectionCard';
import JsonPreview from './components/JsonPreview';
import RawJsonEditor from './components/RawJsonEditor';
import UploadPanel from './components/UploadPanel';
import EnvEditor from './components/EnvEditor';
import AgentCreator from './components/AgentCreator';
import type { Agent, Binding } from './agentTypes';

const SENSITIVE_PATHS = ALL_FIELDS.filter(f => f.sensitive).map(f => f.path);

const STORAGE_KEY = 'openclaw-config-editor-draft';
const STORAGE_META_KEY = 'openclaw-config-editor-meta';

function loadDraft(): { config: Record<string, unknown>; savedAt: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const meta = localStorage.getItem(STORAGE_META_KEY);
    if (!raw) return null;
    return { config: JSON.parse(raw), savedAt: meta ? JSON.parse(meta).savedAt : 'unknown' };
  } catch {
    return null;
  }
}

function saveDraft(config: Record<string, unknown>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify({ savedAt: new Date().toISOString() }));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_META_KEY);
}

function useActiveSection(): string {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace('section-', '');
            setActive(id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    SECTIONS.forEach(s => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return active;
}

export default function App() {
  const draft = loadDraft();
  const [config, setConfig] = useState<Record<string, unknown>>(draft?.config ?? {});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [, setValidateAllState] = useState(false);
  const [exported, setExported] = useState(false);
  const [copied, setCopied] = useState(false);
  const [clearSensitive, setClearSensitiveState] = useState(false);
  const [validationSummary, setValidationSummary] = useState<{ valid: number; invalid: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(draft ? 'saved' : 'idle');
  const [restoredAt] = useState<string | null>(draft?.savedAt ?? null);
  const [tab, setTab] = useState<'config' | 'env' | 'agents'>('config');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);

  // Agents state
  const [agents, setAgents] = useState<Agent[]>(() => {
    const cfg = draft?.config as Record<string, unknown> | undefined;
    const agentsConfig = cfg?.agents as Record<string, unknown> | undefined;
    const agentList = agentsConfig?.list as Agent[] | undefined;
    return agentList ?? [];
  });
  const [bindings, setBindings] = useState<Binding[]>(() => {
    const cfg = draft?.config as Record<string, unknown> | undefined;
    const bindingList = cfg?.bindings as Binding[] | undefined;
    return bindingList ?? [];
  });

  const activeSection = useActiveSection();

  // Auto-save on every config change (debounced 600ms)
  useEffect(() => {
    // Skip save on the very first render (initial state from localStorage or empty)
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (Object.keys(config).length === 0) return;

    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraft(config);
      setSaveStatus('saved');
    }, 600);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [config]);

  const handleChange = useCallback((path: string, value: unknown) => {
    setConfig(prev => setPath(prev, path, value));
    setErrors(prev => ({ ...prev, [path]: null }));
  }, []);

  const handleLoad = useCallback((newConfig: Record<string, unknown>) => {
    setConfig(newConfig);
    setErrors({});
    setValidationSummary(null);
    saveDraft(newConfig);
    setSaveStatus('saved');
    setTimeout(() => {
      document.getElementById('section-update')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleApplyRaw = useCallback((newConfig: Record<string, unknown>) => {
    setConfig(newConfig);
    setErrors({});
  }, []);

  // Agent handlers
  const handleAgentsChange = useCallback((newAgents: Agent[]) => {
    setAgents(newAgents);
    setConfig(prev => ({
      ...prev,
      agents: {
        ...(prev.agents as Record<string, unknown> | undefined),
        list: newAgents,
      },
    }));
  }, []);

  const handleBindingsChange = useCallback((newBindings: Binding[]) => {
    setBindings(newBindings);
    setConfig(prev => ({
      ...prev,
      bindings: newBindings,
    }));
  }, []);

  const handleClearDraft = () => {
    clearDraft();
    setConfig({});
    setErrors({});
    setValidationSummary(null);
    setSaveStatus('idle');
  };

  const handleValidate = () => {
    const newErrors: Record<string, string | null> = {};
    let validCount = 0;
    let invalidCount = 0;

    for (const field of ALL_FIELDS) {
      // Get value from config
      const value = getConfigPath(config, field.path);
      const err = validateField(value, field.type, field.options, field.min, field.max, field.required);
      newErrors[field.path] = err;
      if (err) invalidCount++;
      else if (value !== undefined && value !== '') validCount++;
    }

    setErrors(newErrors);
    setValidateAllState(true);
    setValidationSummary({ valid: validCount, invalid: invalidCount });

    // Scroll to first error
    const firstError = ALL_FIELDS.find(f => newErrors[f.path]);
    if (firstError) {
      const section = SECTIONS.find(s => s.fields.some(f => f.path === firstError.path));
      if (section) {
        document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleExport = () => {
    const exportConfig = clearSensitive
      ? clearSensitiveFields(config, SENSITIVE_PATHS)
      : config;
    downloadJson(exportConfig, 'openclaw-edited.json');
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  const handleCopy = async () => {
    const exportConfig = clearSensitive
      ? clearSensitiveFields(config, SENSITIVE_PATHS)
      : config;
    await copyToClipboard(JSON.stringify(exportConfig, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const configIsEmpty = Object.keys(config).length === 0;

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#0f1117ee',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #2a2d3e',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #00d4d4, #0066cc)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}>
            🦞
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#e2e8f0' }}>
              OpenClaw Config Editor
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>
              /home/openclaw/.openclaw/openclaw.json
            </div>
          </div>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            background: '#00d4d422',
            color: '#00d4d4',
            border: '1px solid #00d4d444',
            padding: '2px 8px',
            borderRadius: '12px',
          }}>
            v1.0
          </span>

          {/* Auto-save status */}
          {saveStatus !== 'idle' && (
            <span style={{
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: saveStatus === 'saving' ? '#94a3b8' : '#22c55e',
              transition: 'color 0.3s',
            }}>
              {saveStatus === 'saving' ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                  Saving…
                </>
              ) : (
                <>💾 Saved to browser</>
              )}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {validationSummary && (
            <span style={{
              fontSize: '12px',
              color: validationSummary.invalid > 0 ? '#ef4444' : '#22c55e',
            }}>
              {validationSummary.invalid > 0
                ? `⚠ ${validationSummary.invalid} error${validationSummary.invalid > 1 ? 's' : ''}`
                : `✓ All valid (${validationSummary.valid} fields)`}
            </span>
          )}

          <button
            onClick={handleValidate}
            style={{
              background: '#22263a',
              border: '1px solid #2a2d3e',
              borderRadius: '6px',
              color: '#94a3b8',
              padding: '7px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            ✓ Validate
          </button>

          <button
            onClick={handleExport}
            style={{
              background: exported ? '#22c55e22' : '#00d4d422',
              border: `1px solid ${exported ? '#22c55e' : '#00d4d4'}`,
              borderRadius: '6px',
              color: exported ? '#22c55e' : '#00d4d4',
              padding: '7px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            {exported ? '✓ Downloaded!' : '⬇ Export Config'}
          </button>

          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#22c55e22' : '#22263a',
              border: `1px solid ${copied ? '#22c55e' : '#2a2d3e'}`,
              borderRadius: '6px',
              color: copied ? '#22c55e' : '#94a3b8',
              padding: '7px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
      </header>

      {/* Restored draft banner */}
      {restoredAt && (
        <div style={{
          background: '#22c55e0a',
          borderBottom: '1px solid #22c55e22',
          padding: '6px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '13px' }}>💾</span>
          <span style={{ fontSize: '12px', color: '#86efac' }}>
            <strong>Draft restored</strong> from last session
            {' · '}<span style={{ color: '#4ade80' }}>{new Date(restoredAt).toLocaleString()}</span>
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

      {/* Safety banner */}
      <div style={{
        background: '#f59e0b11',
        borderBottom: '1px solid #f59e0b33',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontSize: '14px' }}>⚠️</span>
        <span style={{ fontSize: '12px', color: '#f59e0b' }}>
          <strong>This will NOT overwrite your original config.</strong> Review all changes before applying.
          Config path: <code style={{ color: '#fbbf24' }}>/home/openclaw/.openclaw/openclaw.json</code>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#f59e0b',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={clearSensitive}
              onChange={e => setClearSensitiveState(e.target.checked)}
              style={{ accentColor: '#f59e0b' }}
            />
            Clear sensitive fields on export
          </label>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        background: '#1a1d27',
        borderBottom: '1px solid #2a2d3e',
        display: 'flex',
        padding: '0 24px',
      }}>
        <button
          onClick={() => setTab('config')}
          style={{
            padding: '14px 20px',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'config' ? '2px solid #00d4d4' : '2px solid transparent',
            color: tab === 'config' ? '#00d4d4' : '#64748b',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          ⚙️ Config Editor
        </button>
        <button
          onClick={() => setTab('env')}
          style={{
            padding: '14px 20px',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'env' ? '2px solid #00d4d4' : '2px solid transparent',
            color: tab === 'env' ? '#00d4d4' : '#64748b',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🔐 .env Editor
        </button>
        <button
          onClick={() => setTab('agents')}
          style={{
            padding: '14px 20px',
            background: 'none',
            border: 'none',
            borderBottom: tab === 'agents' ? '2px solid #00d4d4' : '2px solid transparent',
            color: tab === 'agents' ? '#00d4d4' : '#64748b',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🤖 Agents ({agents.length})
        </button>
      </div>

      {/* Main layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        maxWidth: tab === 'config' ? '1400px' : '1000px',
        margin: '0 auto',
        width: '100%',
        padding: '0 16px',
      }}>
        {tab === 'config' ? (
          <>
            {/* Sidebar */}
            <div style={{ paddingTop: '24px', marginRight: '24px' }}>
              <Sidebar activeSection={activeSection} />
            </div>

            {/* Content area */}
            <div style={{ flex: 1, minWidth: 0, paddingTop: '24px', paddingBottom: '60px' }}>
              {/* Upload panel */}
              <UploadPanel onLoad={handleLoad} />

              {/* Empty state hint */}
              {configIsEmpty && (
                <div style={{
                  background: '#1a1d27',
                  border: '1px dashed #2a2d3e',
                  borderRadius: '10px',
                  padding: '40px',
                  textAlign: 'center',
                  marginBottom: '24px',
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚙️</div>
                  <div style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '6px' }}>
                    No config loaded yet
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    Upload your <code style={{ color: '#00d4d4' }}>openclaw.json</code> above to populate the fields,
                    or start editing below to build a new config from scratch.
                  </div>
                </div>
              )}

              {/* Section cards */}
              {SECTIONS.map(section => (
                <SectionCard
                  key={section.id}
                  section={section}
                  config={config}
                  errors={errors}
                  onChange={handleChange}
                />
              ))}

              {/* JSON Preview */}
              {!configIsEmpty && <JsonPreview config={config} />}

              {/* Raw editor */}
              <RawJsonEditor config={config} onApply={handleApplyRaw} />
            </div>
          </>
        ) : tab === 'env' ? (
          <div style={{ flex: 1, paddingTop: '24px' }}>
            <EnvEditor />
          </div>
        ) : (
          <div style={{ flex: 1, paddingTop: '24px' }}>
            <AgentCreator
              agents={agents}
              bindings={bindings}
              onAgentsChange={handleAgentsChange}
              onBindingsChange={handleBindingsChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to get path (avoid import cycle; just inline)
function getConfigPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}
