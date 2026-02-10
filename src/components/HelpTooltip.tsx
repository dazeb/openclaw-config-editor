import { useState } from 'react';

interface HelpTooltipProps {
  content: string;
  title?: string;
  link?: string;
  linkText?: string;
}

export default function HelpTooltip({ content, title, link, linkText }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#2a2d3e',
          color: '#64748b',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'help',
          marginLeft: '6px',
          border: '1px solid #3a3d4e',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#00d4d422';
          e.currentTarget.style.color = '#00d4d4';
          e.currentTarget.style.borderColor = '#00d4d4';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = '#2a2d3e';
          e.currentTarget.style.color = '#64748b';
          e.currentTarget.style.borderColor = '#3a3d4e';
        }}
      >
        ?
      </span>
      
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '320px',
            maxWidth: '90vw',
            background: '#1a1d27',
            border: '1px solid #3a3d4e',
            borderRadius: '8px',
            padding: '12px 16px',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #3a3d4e',
            }}
          />
          
          {title && (
            <div
              style={{
                fontWeight: 600,
                color: '#00d4d4',
                fontSize: '13px',
                marginBottom: '6px',
                paddingBottom: '6px',
                borderBottom: '1px solid #2a2d3e',
              }}
            >
              {title}
            </div>
          )}
          
          <div
            style={{
              color: '#94a3b8',
              fontSize: '12px',
              lineHeight: '1.6',
            }}
          >
            {content}
          </div>
          
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '8px',
                color: '#00d4d4',
                fontSize: '11px',
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              {linkText || 'Learn more →'}
            </a>
          )}
        </div>
      )}
    </span>
  );
}
