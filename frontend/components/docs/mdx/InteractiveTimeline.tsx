'use client';

import React, { useState } from 'react';

interface TimelineStep {
  title: string;
  duration?: string;
  description: string;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export function InteractiveTimeline({ steps = [] }: { steps?: TimelineStep[] }) {
  const [activeStep, setActiveStep] = useState(0);

  if (steps.length === 0) return null;

  return (
    <div style={{ margin: '32px 0', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
        {/* Progress Line */}
        <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '15px', left: '0', width: `${(activeStep / (steps.length - 1)) * 100}%`, height: '2px', background: '#ffffff', zIndex: 0, transition: 'width 0.3s ease' }} />

        {steps.map((step, idx) => (
          <div key={idx} onClick={() => setActiveStep(idx)} style={{ position: 'relative', zIndex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: activeStep >= idx ? '#ffffff' : '#111111',
              border: `2px solid ${activeStep >= idx ? '#ffffff' : 'rgba(255,255,255,0.2)'}`,
              color: activeStep >= idx ? '#000000' : 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              transition: 'all 0.3s ease'
            }}>
              {idx + 1}
            </div>
            <div style={{ fontSize: '13px', fontWeight: activeStep === idx ? 600 : 400, color: activeStep === idx ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>
              {step.title}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', minHeight: '120px' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 500 }}>
          {steps[activeStep].title} {steps[activeStep].duration && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px', fontWeight: 400 }}>({steps[activeStep].duration})</span>}
        </h4>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
          {steps[activeStep].description}
        </p>
      </div>
    </div>
  );
}
