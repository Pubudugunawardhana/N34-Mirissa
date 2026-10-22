'use client';

import { useRef, useState } from 'react';

const arrowClass =
  'flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-ocean-900 shadow-sm transition-colors hover:border-ocean-600 hover:text-ocean-700 disabled:pointer-events-none disabled:opacity-30';

// Menu cards side by side: swipe, scroll or use the arrows to see the next card of dishes.
export default function MenuSlider({ pages, label }: { pages: React.ReactNode[]; label: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="mt-8" role="group" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={trackRef}
        onScroll={(event) => {
          const track = event.currentTarget;
          setActive(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((page, index) => (
          <div
            key={index}
            className="w-full shrink-0 snap-start px-px"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${pages.length}`}
            data-menu-page={index + 1}
          >
            {page}
          </div>
        ))}
      </div>

      {pages.length > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5">
            {pages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show dishes ${index + 1} of ${pages.length}`}
                aria-current={index === active ? 'true' : undefined}
                className={`h-2 rounded-full transition-all ${index === active ? 'w-6 bg-sand-500' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="mr-1 text-xs text-slate-400">
              {active + 1} / {pages.length}
            </span>
            <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} className={arrowClass} aria-label="Previous dishes">
              ←
            </button>
            <button type="button" onClick={() => goTo(active + 1)} disabled={active === pages.length - 1} className={arrowClass} aria-label="More dishes">
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
