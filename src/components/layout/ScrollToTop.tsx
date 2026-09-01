'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Disable browser's automatic scroll restoration to avoid restoring previous scroll positions
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Scroll window immediately to top left without delayed smooth scroll animations
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });

    // Reset standard root document scroll offsets
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Reset main content container if present
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
  }, [pathname, searchParams]);

  return null;
}
