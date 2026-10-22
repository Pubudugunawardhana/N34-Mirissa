'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

type Photo = { id: string; url: string; caption: string | null };

const arrowClass =
  'absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ocean-900 shadow-lg transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500';

// Photos in loose columns; a click opens the photo large, with arrows and Esc to close.
export default function DiningGallery({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const step = (offset: number) => setOpen((current) => (current + offset + photos.length) % photos.length);
  const current = photos[open];

  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {photos.map((photo, index) => (
          <li key={photo.id} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => {
                setOpen(index);
                dialogRef.current?.showModal();
              }}
              className="group relative block w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
              aria-label={photo.caption ? `Open photo: ${photo.caption}` : 'Open photo'}
            >
              <Image
                src={photo.url}
                alt={photo.caption ?? ''}
                width={800}
                height={600}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {photo.caption && (
                <span className="theme-fixed absolute inset-x-0 bottom-0 bg-gradient-to-t from-ocean-900/80 to-transparent px-4 pb-3 pt-10 text-left text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {photo.caption}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label="Photo"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') step(-1);
          if (event.key === 'ArrowRight') step(1);
        }}
        className="theme-fixed m-auto w-[calc(100%-2rem)] max-w-5xl bg-transparent p-0 backdrop:bg-ocean-900/85 backdrop:backdrop-blur-sm"
      >
        {current && (
          <figure className="relative">
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-ocean-900">
              <Image src={current.url} alt={current.caption ?? ''} fill sizes="100vw" className="object-contain" />
            </div>
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} className={`${arrowClass} left-3`} aria-label="Previous photo">
                  ←
                </button>
                <button type="button" onClick={() => step(1)} className={`${arrowClass} right-3`} aria-label="Next photo">
                  →
                </button>
              </>
            )}
            <figcaption className="mt-3 flex items-center justify-between gap-4 text-sm text-white/90">
              <span>{current.caption}</span>
              <span className="text-white/60">
                {open + 1} / {photos.length}
              </span>
            </figcaption>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="absolute -top-12 right-0 rounded-full px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Close ✕
            </button>
          </figure>
        )}
      </dialog>
    </>
  );
}
