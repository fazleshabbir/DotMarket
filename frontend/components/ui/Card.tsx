import React, { memo, forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  innerHighlight?: boolean;
}

export const Card = memo(forwardRef<HTMLDivElement, CardProps>(
  ({ children, hoverEffect = true, innerHighlight = true, className = '', style, ...props }, ref) => {
    const cardClasses = [
      'premium-card',
      hoverEffect ? 'hover-effect' : '',
      !innerHighlight ? 'no-inner-highlight' : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <div
        ref={ref}
        className={cardClasses}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
));

Card.displayName = 'Card';
