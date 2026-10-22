import type { Metadata } from 'next';
import Image from 'next/image';
import { auth } from '@/auth';
import ContactForm from '@/components/contact/ContactForm';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { getHotelContact } from '@/lib/hotel';
import { NEARBY, directionsUrl, distanceKm, formatDistance, mapEmbedUrl, mapSearchUrl } from '@/lib/map';
import prisma from '@/lib/prisma';
import SocialIcons, { hasSocialLinks } from '@/components/SocialIcons';

export const metadata: Metadata = { title: 'Contact us | N34 Mirissa' };

const eyebrowClass = 'block text-xs font-medium uppercase tracking-[0.3em] text-sand-600';
const sectionTitleClass = 'font-display text-3xl font-semibold text-ocean-900 md:text-4xl';
const iconClass = 'h-6 w-6';
const socialClass =
  'flex h-12 w-12 items-center justify-center rounded-full bg-sand-500 text-white shadow-md shadow-sand-500/25 transition-colors hover:bg-sand-600';

const PIN_ICON = (
  <>
    <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </>
);

function LineIcon({ children, className = 'h-5 w-5' }: { children: React.ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function ContactItem({ label, children, icon }: { label: string; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 p-6 sm:p-8">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sand-50 text-sand-600 ring-1 ring-sand-200">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="mt-1 break-words font-medium text-ocean-900">{children}</div>
      </div>
    </div>
  );
}

export default async function ContactPage() {
  const [contact, session] = await Promise.all([getHotelContact(), auth()]);

  // A signed-in guest does not have to type their own details again.
  const user = session?.user ? await prisma.user.findUnique({ where: { id: session.user.id } }) : null;
  const hasSocial = hasSocialLinks(contact.social);
  const pin = contact.mapPin;
  const nearby = pin ? NEARBY.map((place) => ({ ...place, distance: formatDistance(distanceKm(pin, place)) })) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      {/* Hero */}
      <header className="theme-fixed relative flex h-screen min-h-[640px] items-center justify-center overflow-hidden bg-ocean-900 text-white">
        <Image src="/images/hero-3.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        {/* Darkens the photo so the white text stays readable */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ocean-900/65 via-ocean-900/30 to-ocean-900/70" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 pt-10 text-center">
          <span className="mb-4 block text-xs font-medium uppercase tracking-[0.3em] text-sand-200 sm:text-sm">Get in touch</span>
          <h1 className="font-display text-5xl font-semibold drop-shadow-lg md:text-6xl">Contact Us</h1>
          <p className="mt-5 font-light text-slate-200">Questions about your stay, a booking or a special occasion? We are happy to help.</p>
        </div>
      </header>

      <main>
        {/* Introduction */}
        <section className="mx-auto max-w-4xl px-4 pt-20 text-center sm:px-6">
          <span className={eyebrowClass}>N34 Mirissa</span>
          <h2 className={`mt-3 ${sectionTitleClass}`}>Contact Us</h2>
          <span className="mx-auto mt-4 block h-0.5 w-16 rounded-full bg-sand-500" aria-hidden="true" />
          <p className="mt-8 leading-loose text-slate-600">
            Thank you for reaching out to us. Your enquiries matter to us, and our team is glad to help with reservations,
            special requests and anything else you would like to know about staying in Mirissa. We reply to every message
            as soon as we can.
          </p>
        </section>

        {/* Address, phone, email */}
        <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 lg:px-8">
          <div className="grid divide-y divide-slate-100 rounded-3xl border border-sand-200 bg-white shadow-xl shadow-ocean-900/5 md:grid-cols-[1.4fr_1fr_1.2fr] md:divide-x md:divide-y-0">
            <ContactItem
              label="Address"
              icon={
                <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
              }
            >
              {contact.address}
            </ContactItem>
            <ContactItem
              label="Phone"
              icon={
                <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 4h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
                </svg>
              }
            >
              <a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`} className="transition-colors hover:text-ocean-600">{contact.phone}</a>
            </ContactItem>
            <ContactItem
              label="Email"
              icon={
                <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <path d="M3.5 7.5l8.5 6 8.5-6" />
                </svg>
              }
            >
              <a href={`mailto:${contact.email}`} className="transition-colors hover:text-ocean-600">{contact.email}</a>
            </ContactItem>
          </div>
        </section>

        {/* Find us: the map from Site Settings, how to get here and what is nearby */}
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6 lg:px-8" data-contact="map">
          <div className="text-center">
            <span className={eyebrowClass}>How to reach us</span>
            <h2 className={`mt-3 ${sectionTitleClass}`}>Find Us</h2>
            <span className="mx-auto mt-4 block h-0.5 w-16 rounded-full bg-sand-500" aria-hidden="true" />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="theme-fixed relative h-80 overflow-hidden rounded-3xl border border-slate-100 bg-slate-100 shadow-xl shadow-ocean-900/5 sm:h-[420px] lg:h-full lg:min-h-[480px]">
              <iframe
                src={mapEmbedUrl(contact.mapQuery)}
                title="N34 Mirissa on Google Maps"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>

            <div className="flex flex-col rounded-3xl border border-sand-200 bg-white p-6 shadow-xl shadow-ocean-900/5 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sand-50 text-sand-600 ring-1 ring-sand-200">
                  <LineIcon className={iconClass}>{PIN_ICON}</LineIcon>
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-500">N34 Mirissa</p>
                  <p className="mt-1 break-words font-medium leading-relaxed text-ocean-900">{contact.address}</p>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <a href={`tel:${contact.phone.replace(/[^+d]/g, '')}`} className="flex items-center gap-3 text-slate-600 transition-colors hover:text-ocean-600">
                  <LineIcon className="h-4 w-4 text-sand-600">
                    <path d="M5 4h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
                  </LineIcon>
                  {contact.phone}
                </a>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-3 break-all text-slate-600 transition-colors hover:text-ocean-600">
                  <LineIcon className="h-4 w-4 shrink-0 text-sand-600">
                    <rect x="3" y="5" width="18" height="14" rx="2.5" />
                    <path d="M3.5 7.5l8.5 6 8.5-6" />
                  </LineIcon>
                  {contact.email}
                </a>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                <a
                  href={directionsUrl(contact.mapQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-sand-500 px-6 font-semibold text-white shadow-lg shadow-sand-500/25 transition-all hover:scale-105 hover:bg-sand-600"
                  data-directions
                >
                  <LineIcon>
                    <path d="M3 11l18-8-8 18-2-8-8-2z" />
                  </LineIcon>
                  Get directions
                </a>
                <a href={mapSearchUrl(contact.mapQuery)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-ocean-600 hover:text-ocean-800 hover:underline">
                  Open in Google Maps ↗
                </a>
              </div>

              {nearby.length > 0 && (
                <div className="mt-8 border-t border-slate-100 pt-6" data-nearby>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Nearby</p>
                  <ul className="mt-4 space-y-3">
                    {nearby.map((place) => (
                      <li key={place.name} className="flex items-center gap-3" data-place={place.name}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ocean-50 text-ocean-600">
                          <LineIcon className="h-4 w-4">{PIN_ICON}</LineIcon>
                        </span>
                        <span className="min-w-0 flex-1 font-medium text-ocean-900">{place.name}</span>
                        <span className="text-right text-sm text-slate-500">
                          <span className="font-semibold text-ocean-900">{place.distance}</span>
                          {place.note && <span className="block text-xs">{place.note}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="mx-auto max-w-4xl px-4 pb-24 pt-20 sm:px-6">
          <div className="text-center">
            <span className={eyebrowClass}>Write to us</span>
            <h2 className={`mt-3 ${sectionTitleClass}`}>Send a Message</h2>
            <p className="mt-4 text-slate-600">Want to make a reservation or have a question? Fill in the form and we will get back to you soon.</p>

            {hasSocial && (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <SocialIcons links={contact.social} className={socialClass} />
              </div>
            )}
          </div>

          <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-ocean-900/5 sm:p-10">
            <ContactForm
              initial={{
                name: user?.name ?? '',
                email: user?.email.includes('@') ? user.email : '',
                phone: user?.phone ?? '',
              }}
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
