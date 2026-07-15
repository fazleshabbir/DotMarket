'use client';

import React from 'react';

interface Node {
  id: string;
  label: string;
  type?: 'default' | 'decision' | 'action';
}

interface Edge {
  from: string;
  to: string;
  label?: string;
}

interface FlowchartProps {
  nodes: Node[];
  edges: Edge[];
}

export function Flowchart({ nodes = [], edges = [] }: { nodes?: Node[]; edges?: Edge[] }) {
  // A simplified premium vertical flowchart for documentation
  
  if (nodes.length === 0) return null;

  return (
    <div style={{
      padding: '32px',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '24px',
      margin: '32px 0'
    }}>
      {nodes.map((node, i) => (
        <React.Fragment key={node.id}>
          <div style={{
            padding: '16px 24px',
            background: node.type === 'decision' ? 'rgba(255,200,0,0.1)' : node.type === 'action' ? 'rgba(50,255,100,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${node.type === 'decision' ? 'rgba(255,200,0,0.3)' : node.type === 'action' ? 'rgba(50,255,100,0.3)' : 'rgba(255,255,255,0.2)'}`,
            borderRadius: node.type === 'decision' ? '4px' : '8px',
            color: '#ffffff',
            fontWeight: 500,
            fontSize: '15px',
            textAlign: 'center',
            minWidth: '200px',
            transform: node.type === 'decision' ? 'rotate(45deg)' : 'none',
          }}>
            <div style={{ transform: node.type === 'decision' ? 'rotate(-45deg)' : 'none' }}>
              {node.label}
            </div>
          </div>
          
          {i < nodes.length - 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '2px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
