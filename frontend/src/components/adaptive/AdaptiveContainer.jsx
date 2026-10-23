import React from 'react';
import { useAdaptive } from '../../context/AdaptiveContext';

/**
 * AdaptiveContainer:
 * Implements discrete Adaptive Stage Containers rather than infinitely fluid percentage containers.
 * 
 * - Mobile Stage: locked at max-w-lg (or full phone width) with safe bottom padding for thumb navigation
 * - Tablet Stage: locked at max-w-3xl with balanced 2-column padding
 * - Desktop Stage: locked at max-w-7xl (1280px)
 * - Wide Stage: locked at max-w-[1440px] with proportional typography margins
 * - Forced Desktop Mode: maintains min-w-[1100px] with horizontal scroll wrapper for phone users
 */
export default function AdaptiveContainer({
  children,
  className = '',
  stage = 'default', // 'default' | 'narrow' | 'wide' | 'full'
  as: Component = 'div',
  ...rest
}) {
  const { isForcedDesktop, isForcedMobile, isMobile } = useAdaptive();

  // Handle stage widths
  let stageClasses = '';

  if (isForcedDesktop) {
    stageClasses = 'w-[1200px] min-w-[1200px] mx-auto px-6';
  } else if (isForcedMobile) {
    stageClasses = 'max-w-md mx-auto px-4 pb-20';
  } else {
    switch (stage) {
      case 'narrow':
        stageClasses = 'max-w-3xl mx-auto px-4 sm:px-6';
        break;
      case 'wide':
        stageClasses = 'max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10';
        break;
      case 'full':
        stageClasses = 'w-full px-4 sm:px-6 lg:px-8';
        break;
      case 'default':
      default:
        stageClasses = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
        break;
    }

    // Add bottom padding for mobile to prevent content being covered by AdaptiveBottomNav
    if (isMobile) {
      stageClasses += ' pb-20';
    }
  }

  const containerContent = (
    <Component className={`${stageClasses} ${className}`} {...rest}>
      {children}
    </Component>
  );

  // If forced desktop on a small screen, wrap in a smooth horizontal scroll container with indicator
  if (isForcedDesktop) {
    return (
      <div className="w-full overflow-x-auto overflow-y-hidden bg-slate-900/5 pb-4">
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-[11px] text-amber-800 text-center font-medium sticky left-0 z-30">
          💻 กำลังแสดงผลใน "มุมมองเดสก์ท็อป (Desktop View)" — สามารถเลื่อนซ้าย-ขวาเพื่อดูแบบเต็มจอได้
        </div>
        {containerContent}
      </div>
    );
  }

  return containerContent;
}
