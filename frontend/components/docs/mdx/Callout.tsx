import React from 'react';
import { AlertCircle, CheckCircle2, Info, Lightbulb } from 'lucide-react';

interface CalloutProps {
  type?: 'info' | 'warning' | 'tip' | 'error';
  title?: string;
  children: React.ReactNode;
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const styles = {
    info: { border: 'rgba(255,255,255,0.2)', bg: 'rgba(255,255,255,0.03)', icon: <Info size={20} color="#ffffff" /> },
    warning: { border: 'rgba(255,200,0,0.5)', bg: 'rgba(255,200,0,0.05)', icon: <AlertCircle size={20} color="#ffc800" /> },
    error: { border: 'rgba(255,50,50,0.5)', bg: 'rgba(255,50,50,0.05)', icon: <AlertCircle size={20} color="#ff3232" /> },
    tip: { border: 'rgba(50,255,100,0.5)', bg: 'rgba(50,255,100,0.05)', icon: <Lightbulb size={20} color="#32ff64" /> }
  };

  const { border, bg, icon } = styles[type];

  return (
    <div style={{
      borderLeft: `3px solid ${border}`,
      background: bg,
      padding: '20px',
      borderRadius: '8px',
      margin: '24px 0',
      display: 'flex',
      gap: '16px'
    }}>
      <div style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</div>
      <div>
        {title && <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>{title}</h4>}
        <div style={{ fontSize: '15px', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
