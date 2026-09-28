'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: '0px 0px 100px 0px' }
    );

    const initReveal = () => {
      const elements = document.querySelectorAll('[data-reveal]');
      elements.forEach((el) => {
        observer.observe(el);
        // Failsafe: force reveal if already high up in the viewport
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('revealed');
        }
      });
    };

    // Run after a short delay to allow DOM to settle
    const timeoutId = setTimeout(initReveal, 150);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
