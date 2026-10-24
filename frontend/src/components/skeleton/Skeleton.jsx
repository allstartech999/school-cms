import React from 'react';

/**
 * Base atomic Skeleton component with configurable animation variant.
 * 
 * @param {string} [variant='shimmer'] - 'shimmer' | 'strip' | 'strip-emerald' | 'pulse' | 'dark'
 * @param {string} [className=''] - Tailwind CSS classes for width, height, margin, etc.
 * @param {string} [rounded='rounded-md'] - Border radius class
 * @param {React.ElementType} [as='div'] - Element tag to render
 */
export default function Skeleton({
  variant = 'shimmer',
  className = '',
  rounded = 'rounded-md',
  style,
  as: Component = 'div',
  children,
  ...rest
}) {
  let variantClass = 'skeleton-shimmer';
  if (variant === 'strip') {
    variantClass = 'skeleton-strip';
  } else if (variant === 'strip-emerald') {
    variantClass = 'skeleton-strip-emerald';
  } else if (variant === 'dark') {
    variantClass = 'skeleton-shimmer-dark';
  } else if (variant === 'pulse') {
    variantClass = 'animate-pulse bg-neutral-200/80';
  }

  const hasRoundedInClassName = /\brounded(-[\w\d]+)?\b/.test(className);
  const finalRounded = hasRoundedInClassName ? '' : rounded;

  return (
    <Component
      className={`${variantClass} ${finalRounded} ${className}`.trim()}
      style={style}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </Component>
  );
}
