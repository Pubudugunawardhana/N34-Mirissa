import type { SocialLinks } from '@/lib/hotel';

type Network = keyof SocialLinks;

const NETWORKS: { key: Network; label: string; icon: React.ReactNode }[] = [
  {
    key: 'facebook',
    label: 'Facebook',
    icon: <path fill="currentColor" stroke="none" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.7V21h2.8z" />,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.2 6.8h.01" />
      </>
    ),
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: (
      <>
        <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1L4 20z" />
        <path d="M9.2 8.6c.2-.4.5-.5.8-.5h.5c.2 0 .4.1.5.4l.6 1.4c.1.3 0 .5-.1.7l-.5.6c.6 1.1 1.4 1.9 2.6 2.5l.6-.6c.2-.2.5-.2.7-.1l1.4.6c.3.1.4.3.4.6v.4c0 .4-.2.7-.5.9-.6.4-1.5.5-2.5.1-2.2-.9-3.9-2.6-4.7-4.6-.3-1-.2-1.8.2-2.4z" />
      </>
    ),
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.6 2.2 4.4 5 4.6" />,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path fill="currentColor" stroke="none" d="M10 9.2v5.6l4.8-2.8z" />
      </>
    ),
  },
  {
    key: 'tripadvisor',
    label: 'Tripadvisor',
    icon: (
      <>
        <circle cx="7" cy="13.5" r="3.5" />
        <circle cx="17" cy="13.5" r="3.5" />
        <circle cx="7" cy="13.5" r="1" fill="currentColor" />
        <circle cx="17" cy="13.5" r="1" fill="currentColor" />
        <path d="M3.5 10a12 12 0 0 1 17 0M12 17l-1.5-1.5M12 17l1.5-1.5" />
      </>
    ),
  },
];

// Round icon links to the hotel's social pages; networks without a saved link are left out.
export default function SocialIcons({ links, className, iconClassName = 'h-5 w-5' }: { links: SocialLinks; className: string; iconClassName?: string }) {
  const present = NETWORKS.filter((network) => links[network.key]);
  if (present.length === 0) return null;
  return (
    <>
      {present.map((network) => (
        <a key={network.key} href={links[network.key]} target="_blank" rel="noopener noreferrer" aria-label={network.label} className={className}>
          <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {network.icon}
          </svg>
        </a>
      ))}
    </>
  );
}

export function hasSocialLinks(links: SocialLinks) {
  return Object.values(links).some(Boolean);
}
