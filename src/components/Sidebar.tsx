import { SECTIONS } from '../schema';

interface SidebarProps {
  activeSection: string;
}

export default function Sidebar({ activeSection }: SidebarProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{
      width: '210px',
      flexShrink: 0,
      position: 'sticky',
      top: '72px',
      height: 'calc(100vh - 72px)',
      overflowY: 'auto',
      padding: '16px 0',
    }}>
      <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, letterSpacing: '0.08em', padding: '0 16px 8px', textTransform: 'uppercase' }}>
        Sections
      </div>
      {SECTIONS.map(section => {
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => scrollTo(section.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              background: isActive ? '#00d4d422' : 'transparent',
              border: 'none',
              borderLeft: isActive ? '2px solid #00d4d4' : '2px solid transparent',
              color: isActive ? '#00d4d4' : '#94a3b8',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              borderRadius: '0 4px 4px 0',
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
            }}
          >
            <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{section.icon}</span>
            {section.label}
          </button>
        );
      })}
    </div>
  );
}
