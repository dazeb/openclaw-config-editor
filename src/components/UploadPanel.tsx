import { useState, useRef } from 'react';

interface UploadPanelProps {
  onLoad: (config: Record<string, unknown>) => void;
}

export default function UploadPanel({ onLoad }: UploadPanelProps) {
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processJson = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      setError(null);
      setSuccess(true);
      setPasteText('');
      onLoad(parsed);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e) {
      setError(`JSON parse error: ${(e as Error).message}`);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      processJson(text);
    };
    reader.readAsText(file);
    // Reset so same file can be re-uploaded
    e.target.value = '';
  };

  const handlePaste = () => {
    if (!pasteText.trim()) {
      setError('Paste some JSON first.');
      return;
    }
    processJson(pasteText);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => processJson(ev.target?.result as string);
    reader.readAsText(file);
  };

  return (
    <div
      id="section-upload"
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: '10px',
        padding: '24px',
        marginBottom: '24px',
        scrollMarginTop: '80px',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '20px' }}>📂</span>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>
            Load Configuration
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          Upload your <code style={{ color: '#00d4d4', background: '#00d4d422', padding: '1px 6px', borderRadius: '3px' }}>openclaw.json</code> file
          or paste the JSON below. The editor will populate all fields automatically.
        </p>
      </div>

      {/* Drop zone + file button */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          border: '2px dashed #2a2d3e',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          marginBottom: '16px',
          transition: 'border-color 0.15s',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#00d4d4')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2d3e')}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
        <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>
          Click to browse or drag & drop
        </div>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          openclaw.json or any JSON config file
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1, height: '1px', background: '#2a2d3e' }} />
        <span style={{ fontSize: '12px', color: '#475569' }}>or paste JSON</span>
        <div style={{ flex: 1, height: '1px', background: '#2a2d3e' }} />
      </div>

      {/* Paste area */}
      <textarea
        id="upload-paste-area"
        name="configPaste"
        value={pasteText}
        onChange={e => { setPasteText(e.target.value); setError(null); }}
        placeholder='Paste your openclaw.json content here...'
        spellCheck={false}
        rows={6}
        style={{
          width: '100%',
          background: '#0f1117',
          border: `1px solid ${error ? '#ef4444' : '#2a2d3e'}`,
          borderRadius: '6px',
          color: '#e2e8f0',
          padding: '12px',
          fontSize: '12px',
          fontFamily: "'Fira Code', 'Consolas', monospace",
          lineHeight: '1.5',
          resize: 'vertical',
          outline: 'none',
          marginBottom: '12px',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handlePaste}
          style={{
            background: '#00d4d422',
            border: '1px solid #00d4d4',
            borderRadius: '6px',
            color: '#00d4d4',
            padding: '8px 20px',
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Load Pasted JSON
        </button>

        {error && (
          <span style={{ fontSize: '12px', color: '#ef4444' }}>⚠ {error}</span>
        )}
        {success && (
          <span style={{ fontSize: '12px', color: '#22c55e' }}>✓ Config loaded successfully!</span>
        )}
      </div>
    </div>
  );
}
