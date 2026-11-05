import { useState, useEffect } from 'react';

/**
 * useResponsive Hook - Detect current breakpoint
 * Returns: 'mobile' (< 768px), 'tablet' (768px - 1023px), 'desktop' (1024px+)
 */
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let newBreakpoint;

      if (width < 768) newBreakpoint = 'mobile';
      else if (width < 1024) newBreakpoint = 'tablet';
      else newBreakpoint = 'desktop';

      setBreakpoint(newBreakpoint);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isSmall: breakpoint === 'mobile' || breakpoint === 'tablet'
  };
};

export default useResponsive;
