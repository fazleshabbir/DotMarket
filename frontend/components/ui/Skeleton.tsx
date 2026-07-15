import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', style }: SkeletonProps) {
  return (
    <div
      className="animate-pulse"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        background: 'rgba(255, 255, 255, 0.04)',
        ...style
      }}
    />
  );
}
