'use client';

import { useEffect, useState } from 'react';

/** True at tablet and phone widths (the app switches to its mobile layout at 1024px). */
export function useIsMobile(max = 1024): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const q = window.matchMedia(`(max-width:${max}px)`);
    const on = () => setMobile(q.matches);
    on();
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, [max]);
  return mobile;
}
