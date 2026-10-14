'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const SLIDE_INTERVAL_MS = 5000;

type PhotoSlideshowProps = {
  slides: string[];
  sizes: string;
  dotsClassName?: string;
};

// Cross-fading background photos. The parent must be `relative` with `overflow-hidden`.
export default function PhotoSlideshow({ slides, sizes, dotsClassName = 'bottom-12 right-12' }: PhotoSlideshowProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    // People who ask for reduced motion keep the first photo.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <>
      {slides.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={index === 0}
          sizes={sizes}
          className={`object-cover ${index === active ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
          // Fade in while slowly zooming; the zoom resets only after the photo has faded out.
          style={{
            transition:
              index === active
                ? 'opacity 1.2s ease, scale 7s ease-out'
                : 'opacity 1.2s ease, scale 0s linear 1.2s',
          }}
        />
      ))}

      <div className={`absolute z-10 flex gap-2 ${dotsClassName}`}>
        {slides.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Show photo ${index + 1}`}
            aria-current={index === active}
            className={`h-1.5 rounded-full transition-all duration-500 ${index === active ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </>
  );
}
