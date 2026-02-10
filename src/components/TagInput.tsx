import { useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  id?: string;
}

export default function TagInput({ values, onChange, placeholder, id }: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const v = input.trim();
    if (v && !values.includes(v)) {
      onChange([...values, v]);
    }
    setInput('');
  };

  const removeTag = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && values.length > 0) {
      removeTag(values.length - 1);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        alignItems: 'center',
        background: '#22263a',
        border: '1px solid #2a2d3e',
        borderRadius: '6px',
        padding: '6px 10px',
        minHeight: '40px',
        cursor: 'text',
      }}
    >
      {values.map((tag, idx) => (
        <span key={idx} className="tag-chip">
          {tag}
          <button onClick={() => removeTag(idx)} title="Remove" type="button">✕</button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={addTag}
        placeholder={values.length === 0 ? (placeholder || 'Type and press Enter...') : ''}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#e2e8f0',
          fontSize: '14px',
          minWidth: '120px',
          flex: 1,
        }}
      />
    </div>
  );
}
