import type { SectionDef } from '../schema';
import FieldRow from './FieldRow';
import { getPath } from '../utils';

interface SectionCardProps {
  section: SectionDef;
  config: Record<string, unknown>;
  errors: Record<string, string | null>;
  onChange: (path: string, value: unknown) => void;
}

export default function SectionCard({ section, config, errors, onChange }: SectionCardProps) {
  return (
    <div
      id={`section-${section.id}`}
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3e',
        borderRadius: '10px',
        padding: '24px',
        marginBottom: '24px',
        scrollMarginTop: '80px',
      }}
    >
      {/* Section header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '20px' }}>{section.icon}</span>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            color: '#e2e8f0',
          }}>
            {section.label}
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          {section.description}
        </p>
      </div>

      {/* Fields */}
      <div>
        {section.fields.map(field => (
          <FieldRow
            key={field.path}
            field={field}
            value={getPath(config, field.path)}
            error={errors[field.path]}
            onChange={onChange}
            config={config}
          />
        ))}
      </div>
    </div>
  );
}
