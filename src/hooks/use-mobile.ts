/**
 * Hook for detecting mobile viewport
 * Determines if the current viewport width is below the mobile breakpoint
 *
 * @module useIsMobile
 */

import * as React from "react";

/** Breakpoint in pixels below which the viewport is considered mobile */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook that returns whether the current viewport is mobile-sized
 * Uses window.matchMedia to listen for viewport changes
 *
 * @returns True if viewport width is below the mobile breakpoint, false otherwise
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile()
 *
 * if (isMobile) {
 *   // Render mobile layout
 * }
 * ```
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
