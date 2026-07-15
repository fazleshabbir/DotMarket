import React from 'react';
import { Callout } from './Callout';
import { InteractiveTimeline } from './InteractiveTimeline';
import { FAQAccordion } from './FAQAccordion';
import { Flowchart } from './Flowchart';

// Default HTML elements styling for markdown
const H1 = ({ children, id }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h1 id={id} style={{ fontSize: '36px', fontWeight: 300, fontFamily: "'Cormorant Garamond', serif", marginTop: '48px', marginBottom: '24px' }}>{children}</h1>
);

const H2 = ({ children, id }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 id={id} style={{ fontSize: '28px', fontWeight: 400, marginTop: '40px', marginBottom: '20px', letterSpacing: '-0.01em', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>{children}</h2>
);

const H3 = ({ children, id }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 id={id} style={{ fontSize: '20px', fontWeight: 500, marginTop: '32px', marginBottom: '16px' }}>{children}</h3>
);

const P = ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p style={{ marginBottom: '20px', lineHeight: 1.7, color: 'rgba(255,255,255,0.75)' }}>{children}</p>
);

const A = ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a href={href} style={{ color: '#ffffff', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.3)', textUnderlineOffset: '4px' }}>
    {children}
  </a>
);

const UL = ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
  <ul style={{ paddingLeft: '24px', marginBottom: '24px', color: 'rgba(255,255,255,0.75)' }}>{children}</ul>
);

const LI = ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
  <li style={{ marginBottom: '8px' }}>{children}</li>
);

const Code = ({ children }: React.HTMLAttributes<HTMLElement>) => (
  <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
    {children}
  </code>
);

const Pre = ({ children }: React.HTMLAttributes<HTMLPreElement>) => (
  <pre style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', overflowX: 'auto', marginBottom: '24px' }}>
    {children}
  </pre>
);

const SectionDivider = () => (
  <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', margin: '48px 0' }} />
);

export const MDXComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  a: A,
  ul: UL,
  li: LI,
  code: Code,
  pre: Pre,
  Callout,
  InteractiveTimeline,
  FAQAccordion,
  Flowchart,
  SectionDivider
};
