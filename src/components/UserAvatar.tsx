import Image from 'next/image';

type UserAvatarProps = {
  name?: string | null;
  image?: string | null;
  // Size, text size and any ring: e.g. "h-20 w-20 text-3xl".
  className?: string;
  // Rendered width in pixels, so the browser asks for a suitably small file.
  pixels?: number;
};

// The user's photo, or their initial on the brand colour when they have none.
export default function UserAvatar({ name, image, className = 'h-8 w-8 text-sm', pixels = 80 }: UserAvatarProps) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ocean-600 font-bold uppercase text-white ${className}`}
    >
      {image ? <Image src={image} alt="" fill sizes={`${pixels}px`} className="object-cover" /> : name?.[0] || 'U'}
    </span>
  );
}
