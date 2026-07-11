import React, { memo } from 'react';

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  maxWidth?: number;
}

export const Section = memo(function Section({ children, id, maxWidth = 1200, style, ...props }: SectionProps) {
  return (
    <section
      id={id}
      style={{
        position: 'relative',
        zIndex: 10,
        padding: '100px 24px',
        width: '100%',
        maxWidth: `${maxWidth}px`,
        margin: '0 auto',
        ...style
      }}
      {...props}
    >
      {children}
    </section>
  );
});

Section.displayName = 'Section';
