'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQProps {
  question: string;
  children: React.ReactNode;
}

export function FAQAccordion({ question, children }: FAQProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '16px 0'
    }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 500,
          cursor: 'pointer',
          padding: '8px 0',
          textAlign: 'left'
        }}
      >
        <span>{question}</span>
        <ChevronDown 
          size={18} 
          style={{ 
            transition: 'transform 0.3s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'rgba(255,255,255,0.5)'
          }} 
        />
      </button>
      
      <div style={{
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        maxHeight: isOpen ? '1000px' : '0',
        opacity: isOpen ? 1 : 0
      }}>
        <div style={{ paddingTop: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
