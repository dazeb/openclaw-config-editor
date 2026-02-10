import { useState, useRef } from 'react';

// Known model IDs — sourced from OpenClaw defaults
export const KNOWN_MODELS = [
  'anthropic/claude-opus-4-6',
  'anthropic/claude-opus-4-5',
  'anthropic/claude-sonnet-4-5',
  'anthropic/claude-sonnet-4-5-20250929',
  'anthropic/claude-sonnet-4-0',
  'anthropic/claude-sonnet-4-20250514',
  'anthropic/claude-haiku-4-5',
  'anthropic/claude-haiku-4-5-20251001',
  'anthropic/claude-3-5-sonnet-20240620',
  'anthropic/claude-3-5-haiku-latest',
  'google/gemini-3-pro-preview',
  'google/gemini-3-flash-preview',
  'google/gemini-2.5-pro',
  'google/gemini-2.5-flash',
  'google/gemini-flash-latest',
  'google/gemini-flash-lite-latest',
  'google-antigravity/gemini-3-pro-high',
  'google-antigravity/gemini-3-pro-low',
  'google-antigravity/gemini-3-flash',
  'google-antigravity/claude-sonnet-4-5',
  'google-antigravity/claude-sonnet-4-5-thinking',
  'google-antigravity/claude-opus-4-5-thinking',
  'google-gemini-cli/gemini-3-pro-preview',
  'google-gemini-cli/gemini-3-flash-preview',
  'google-gemini-cli/gemini-2.5-pro',
  'google-gemini-cli/gemini-2.5-flash',
  'google-gemini-cli/gemini-2.0-flash',
  'ollama/kimi-k2.5:cloud',
  'ollama/llama3.2:1b',
  'ollama/llama3.1:8b',
  'ollama/qwen3:8b',
  'moonshot/kimi-k2.5',
  'kimi-coding/kimi-k2-thinking',
  'kimi-coding/k2p5',
  'openrouter/moonshotai/kimi-k2',
  'openrouter/moonshotai/kimi-k2-thinking',
  'openrouter/moonshotai/kimi-k2.5',
  'openrouter/openrouter/auto',
  'openrouter/openrouter/free',
  'openrouter/meta-llama/llama-3.3-70b-instruct:free',
  'openrouter/google/gemma-3-27b-it:free',
  'openrouter/openai/gpt-oss-120b:free',
  'openrouter/qwen/qwen3-4b:free',
  'openrouter/z-ai/glm-4.5-air:free',
  'opencode/big-pickle',
  'opencode/kimi-k2.5-free',
  'opencode/trinity-large-preview-free',
  'opencode/glm-4.7-free',
  'deepseek/deepseek-chat',
];

const PROVIDER_COLORS: Record<string, { bg: string; color: string }> = {
  anthropic:     { bg: '#d97706', color: '#fff' },
  google:        { bg: '#1a73e8', color: '#fff' },
  'google-antigravity': { bg: '#0f4c81', color: '#7dd3fc' },
  'google-gemini-cli':  { bg: '#0d4a6b', color: '#93c5fd' },
  ollama:        { bg: '#22543d', color: '#9ae6b4' },
  openrouter:    { bg: '#6d28d9', color: '#ddd6fe' },
  opencode:      { bg: '#0e7490', color: '#a5f3fc' },
  moonshot:      { bg: '#374151', color: '#e5e7eb' },
  'kimi-coding': { bg: '#166534', color: '#bbf7d0' },
  deepseek:      { bg: '#1e3a5f', color: '#bfdbfe' },
};

function providerOf(modelId: string) {
  return modelId.split('/')[0] ?? 'unknown';
}

function ProviderBadge({ modelId }: { modelId: string }) {
  const p = providerOf(modelId);
  const c = PROVIDER_COLORS[p] ?? { bg: '#374151', color: '#d1d5db' };
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: 700,
      padding: '2px 6px',
      borderRadius: '4px',
      background: c.bg,
      color: c.color,
      letterSpacing: '0.04em',
      flexShrink: 0,
    }}>
      {p}
    </span>
  );
}

function modelName(id: string) {
  const parts = id.split('/');
  return parts.slice(1).join('/');
}

interface Props {
  values: string[];
  onChange: (vals: string[]) => void;
  primaryModel?: string;
  onPrimaryChange?: (val: string) => void;
  id?: string;
}

export default function FallbackModelEditor({ values, onChange, primaryModel, onPrimaryChange, id }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = KNOWN_MODELS.filter(m =>
    m.toLowerCase().includes(search.toLowerCase()) && !values.includes(m)
  );

  // Drag-and-drop handlers
  const onDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const onDragEnter = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) return;
    setDragOverIdx(idx);
  };

  const onDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const next = [...values];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const onDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const remove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...values];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  const moveDown = (idx: number) => {
    if (idx === values.length - 1) return;
    const next = [...values];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };

  const addModel = (m: string) => {
    if (!values.includes(m)) {
      onChange([...values, m]);
    }
    setSearch('');
    setShowDropdown(false);
  };

  const addCustom = () => {
    const v = search.trim();
    if (v && !values.includes(v)) {
      onChange([...values, v]);
    }
    setSearch('');
    setShowDropdown(false);
  };

  return (
    <div style={{ width: '100%' }}>

      {/* Primary model picker */}
      {onPrimaryChange !== undefined && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
            🥇 PRIMARY MODEL
          </div>
          <div style={{ position: 'relative' }}>
            <select
              id={id}
              name={id}
              value={primaryModel ?? ''}
              onChange={e => onPrimaryChange(e.target.value)}
              style={{
                width: '100%',
                background: '#22263a',
                border: '2px solid #00d4d4',
                borderRadius: '8px',
                color: '#e2e8f0',
                padding: '10px 14px',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
              }}
            >
              <option value="">— select primary model —</option>
              {KNOWN_MODELS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#00d4d4' }}>▾</span>
          </div>
          {primaryModel && (
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ProviderBadge modelId={primaryModel} />
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>{modelName(primaryModel)}</span>
            </div>
          )}
        </div>
      )}

      {/* Fallback list header */}
      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>📋 FALLBACK CHAIN ({values.length} models)</span>
        <span style={{ color: '#475569', fontWeight: 400 }}>Tried in order · drag ⠿ to reorder</span>
      </div>

      {/* Ranked fallback list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
        {values.length === 0 && (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: '#475569',
            fontSize: '13px',
            background: '#1a1d27',
            borderRadius: '8px',
            border: '1px dashed #2a2d3e',
          }}>
            No fallbacks set. Add models below.
          </div>
        )}

        {values.map((model, idx) => (
          <div
            key={model}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragEnter={() => onDragEnter(idx)}
            onDrop={() => onDrop(idx)}
            onDragEnd={onDragEnd}
            onDragOver={e => e.preventDefault()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              background: dragOverIdx === idx ? '#1e3a5f' : (dragIdx === idx ? '#22263a88' : '#1a1d27'),
              border: `1px solid ${dragOverIdx === idx ? '#00d4d4' : '#2a2d3e'}`,
              borderRadius: '8px',
              opacity: dragIdx === idx ? 0.5 : 1,
              transition: 'all 0.1s',
              cursor: 'grab',
            }}
          >
            {/* Rank badge */}
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              minWidth: '24px',
              textAlign: 'center',
              color: idx === 0 ? '#00d4d4' : idx < 3 ? '#94a3b8' : '#475569',
            }}>
              #{idx + 1}
            </span>

            {/* Drag handle */}
            <span style={{ color: '#475569', fontSize: '16px', cursor: 'grab', letterSpacing: '-2px' }}>⠿⠿</span>

            {/* Provider badge */}
            <ProviderBadge modelId={model} />

            {/* Model name */}
            <span style={{ flex: 1, fontSize: '13px', color: '#e2e8f0', fontFamily: 'monospace' }}>
              {modelName(model)}
            </span>

            {/* Up/Down arrows */}
            <button
              type="button"
              onClick={() => moveUp(idx)}
              disabled={idx === 0}
              title="Move up"
              style={{
                background: 'none',
                border: '1px solid #2a2d3e',
                borderRadius: '4px',
                color: idx === 0 ? '#2a2d3e' : '#94a3b8',
                cursor: idx === 0 ? 'default' : 'pointer',
                padding: '2px 6px',
                fontSize: '12px',
              }}
            >▲</button>
            <button
              type="button"
              onClick={() => moveDown(idx)}
              disabled={idx === values.length - 1}
              title="Move down"
              style={{
                background: 'none',
                border: '1px solid #2a2d3e',
                borderRadius: '4px',
                color: idx === values.length - 1 ? '#2a2d3e' : '#94a3b8',
                cursor: idx === values.length - 1 ? 'default' : 'pointer',
                padding: '2px 6px',
                fontSize: '12px',
              }}
            >▼</button>

            {/* Remove */}
            <button
              type="button"
              onClick={() => remove(idx)}
              title="Remove"
              style={{
                background: 'none',
                border: '1px solid #ef444433',
                borderRadius: '4px',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '2px 7px',
                fontSize: '13px',
              }}
            >✕</button>
          </div>
        ))}
      </div>

      {/* Add model dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search or type a model ID to add..."
              style={{
                width: '100%',
                background: '#22263a',
                border: '1px solid #2a2d3e',
                borderRadius: '8px',
                color: '#e2e8f0',
                padding: '8px 12px',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="button"
            onClick={addCustom}
            style={{
              background: '#00d4d422',
              border: '1px solid #00d4d4',
              borderRadius: '8px',
              color: '#00d4d4',
              padding: '8px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            + Add
          </button>
        </div>

        {/* Dropdown list */}
        {showDropdown && (search || filtered.length > 0) && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: '64px',
              background: '#1a1d27',
              border: '1px solid #2a2d3e',
              borderRadius: '8px',
              marginTop: '4px',
              maxHeight: '240px',
              overflowY: 'auto',
              zIndex: 200,
              boxShadow: '0 8px 32px #00000066',
            }}
            onMouseLeave={() => setShowDropdown(false)}
          >
            {filtered.length === 0 && search && (
              <div style={{ padding: '10px 14px', fontSize: '12px', color: '#64748b' }}>
                No known matches — press "+ Add" to add <strong style={{ color: '#e2e8f0' }}>{search}</strong> as custom model
              </div>
            )}
            {filtered.slice(0, 20).map(m => (
              <div
                key={m}
                onClick={() => addModel(m)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  borderBottom: '1px solid #1e2130',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#22263a')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <ProviderBadge modelId={m} />
                <span style={{ fontSize: '13px', color: '#e2e8f0', fontFamily: 'monospace' }}>{modelName(m)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>
        Tip: Drag ⠿ to reorder · OpenClaw tries each fallback in ranked order when the primary fails
      </div>
    </div>
  );
}
