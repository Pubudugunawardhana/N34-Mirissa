'use client';

import { useState } from 'react';
import Image from 'next/image';

const arrowClass =
  'absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ocean-900 shadow-lg backdrop-blur transition-colors hover:bg-white hover:text-ocean-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 lg:bg-white';

// One wide photo at a time, with arrows at the sides and dash indicators underneath.
export default function RoomGallery({ images, roomName }: { images: string[]; roomName: string }) {
  const [active, setActive] = useState(0);

  const step = (offset: number) => setActive((current) => (current + offset + images.length) % images.length);

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={`${roomName} photos`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') step(-1);
        if (event.key === 'ArrowRight') step(1);
      }}
      className="rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50"
    >
      <div className="relative lg:px-20">
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-slate-200 shadow-sm">
          {images.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={index === active ? `${roomName}, photo ${index + 1} of ${images.length}` : ''}
              fill
              sizes="(min-width: 1280px) 1100px, 100vw"
              className={`object-cover transition-opacity duration-700 ${index === active ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        </div>

        <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className={`${arrowClass} left-3 lg:left-2`}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
        <button type="button" onClick={() => step(1)} aria-label="Next photo" className={`${arrowClass} right-3 lg:right-2`}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="mt-6 flex justify-center gap-2.5">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Show photo ${index + 1}`}
            aria-current={index === active}
            className="flex h-6 items-center"
          >
            <span className={`block h-0.5 w-10 rounded-full transition-colors ${index === active ? 'bg-sand-500' : 'bg-slate-300 hover:bg-slate-400'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
