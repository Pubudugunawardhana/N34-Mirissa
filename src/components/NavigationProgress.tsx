'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GIVE_UP_AFTER_MS = 15000;

// A thin bar across the top of the screen from the moment an internal link is clicked until the new page is shown,
// so a click never looks like it did nothing while the server is working.
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = `${pathname}?${searchParams}`;

  // The address the click was made from. The bar shows while we are still on it; arriving anywhere else hides it.
  const [startedFrom, setStartedFrom] = useState<string | null>(null);
  const loading = startedFrom !== null && startedFrom === currentUrl;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as Element | null)?.closest?.('a');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page, or only a jump to an anchor on it: nothing will load.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      const from = `${window.location.pathname}?${new URLSearchParams(window.location.search)}`;
      setStartedFrom(from);
      // Never leave the bar running if the navigation was cancelled.
      window.setTimeout(() => setStartedFrom((value) => (value === from ? null : value)), GIVE_UP_AFTER_MS);
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  if (!loading) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5" role="progressbar" aria-label="Loading page">
      <div className="nav-progress h-full origin-left bg-sand-500 shadow-[0_0_8px] shadow-sand-500" />
    </div>
  );
}
