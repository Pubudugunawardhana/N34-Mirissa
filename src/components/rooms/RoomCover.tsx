import Image from 'next/image';

type RoomCoverProps = {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
};

// Fills its parent, which must be `relative` and have a size. Shows a soft placeholder until a photo is uploaded.
export default function RoomCover({ src, alt, sizes, priority }: RoomCoverProps) {
  if (!src) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-ocean-100 to-sand-50 text-ocean-600/70">
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 15h18M6 10V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3M4 18v2M20 18v2" />
        </svg>
        <span className="text-xs font-medium">Photo coming soon</span>
      </div>
    );
  }

  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />;
}
