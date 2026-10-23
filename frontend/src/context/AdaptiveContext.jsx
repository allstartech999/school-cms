import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

/**
 * AdaptiveContext provides runtime device profiling and user-controlled viewport modes
 * for true Adaptive Web Design (AWD) rather than purely fluid responsive CSS.
 * 
 * Supports:
 * - Device categorization (mobile, tablet, desktop, wide)
 * - Orientation detection (portrait, landscape)
 * - Touch vs mouse pointer capabilities
 * - Viewport mode override (auto, mobile, desktop)
 */
const AdaptiveContext = createContext(null);

import { VIEWPORT_MODES, DEVICE_TYPES, BREAKPOINTS } from './AdaptiveConstants';
export { VIEWPORT_MODES, DEVICE_TYPES, BREAKPOINTS };

export function AdaptiveProvider({ children }) {
  // Screen dimensions
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  // Touch capability
  const [isTouch, setIsTouch] = useState(false);

  // User preferred viewport mode: 'auto' | 'mobile' | 'desktop'
  const [viewportMode, setViewportMode] = useState(() => {
    if (typeof window === 'undefined') return VIEWPORT_MODES.AUTO;
    try {
      return localStorage.getItem('ppk_adaptive_mode') || VIEWPORT_MODES.AUTO;
    } catch {
      return VIEWPORT_MODES.AUTO;
    }
  });

  // Track window resize and orientation change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Touch detection
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    };

    checkTouch();
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Set & persist viewport mode
  const setMode = useCallback((mode) => {
    setViewportMode(mode);
    try {
      localStorage.setItem('ppk_adaptive_mode', mode);
    } catch (e) {
      console.warn('Could not save adaptive mode to localStorage:', e);
    }
  }, []);

  // Compute natural device type based on physical width
  const physicalDeviceType = useMemo(() => {
    const { width } = dimensions;
    if (width < BREAKPOINTS.TABLET) return DEVICE_TYPES.MOBILE;
    if (width < BREAKPOINTS.DESKTOP) return DEVICE_TYPES.TABLET;
    if (width < BREAKPOINTS.WIDE) return DEVICE_TYPES.DESKTOP;
    return DEVICE_TYPES.WIDE;
  }, [dimensions]);

  // Compute active effective profile based on viewport mode override
  const activeProfile = useMemo(() => {
    if (viewportMode === VIEWPORT_MODES.MOBILE) return DEVICE_TYPES.MOBILE;
    if (viewportMode === VIEWPORT_MODES.DESKTOP) return DEVICE_TYPES.DESKTOP;
    return physicalDeviceType;
  }, [viewportMode, physicalDeviceType]);

  const orientation = dimensions.width >= dimensions.height ? 'landscape' : 'portrait';

  // Thai label for display
  const profileLabel = useMemo(() => {
    switch (activeProfile) {
      case DEVICE_TYPES.MOBILE:
        return 'สมาร์ทโฟน (Mobile)';
      case DEVICE_TYPES.TABLET:
        return 'แท็บเล็ต (Tablet)';
      case DEVICE_TYPES.WIDE:
        return 'จอกว้างพิเศษ (Ultrawide)';
      case DEVICE_TYPES.DESKTOP:
      default:
        return 'คอมพิวเตอร์ (Desktop)';
    }
  }, [activeProfile]);

  const value = useMemo(() => ({
    // Dimensions
    width: dimensions.width,
    height: dimensions.height,
    orientation,
    isTouch,

    // Device profiles
    physicalDeviceType,
    activeProfile,
    profileLabel,

    // Booleans for fast branching
    isMobile: activeProfile === DEVICE_TYPES.MOBILE,
    isTablet: activeProfile === DEVICE_TYPES.TABLET,
    isDesktop: activeProfile === DEVICE_TYPES.DESKTOP || activeProfile === DEVICE_TYPES.WIDE,
    isWide: activeProfile === DEVICE_TYPES.WIDE,

    // Emulation flags
    viewportMode,
    setMode,
    isForcedDesktop: viewportMode === VIEWPORT_MODES.DESKTOP && physicalDeviceType === DEVICE_TYPES.MOBILE,
    isForcedMobile: viewportMode === VIEWPORT_MODES.MOBILE && physicalDeviceType !== DEVICE_TYPES.MOBILE,
  }), [
    dimensions,
    orientation,
    isTouch,
    physicalDeviceType,
    activeProfile,
    profileLabel,
    viewportMode,
    setMode
  ]);

  return (
    <AdaptiveContext.Provider value={value}>
      {children}
    </AdaptiveContext.Provider>
  );
}

export function useAdaptive() {
  const context = useContext(AdaptiveContext);
  if (!context) {
    throw new Error('useAdaptive must be used within an AdaptiveProvider');
  }
  return context;
}
