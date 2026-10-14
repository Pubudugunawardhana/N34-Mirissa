import type { Metadata } from 'next';
import Image from 'next/image';
import { auth } from '@/auth';
import ContactForm from '@/components/contact/ContactForm';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { getHotelContact } from '@/lib/hotel';
import prisma from '@/lib/prisma';

export const metadata: Metadata = { title: 'Contact us | N34 Mirissa' };

const eyebrowClass = 'block text-xs font-medium uppercase tracking-[0.3em] text-sand-600';
const sectionTitleClass = 'font-display text-3xl font-semibold text-ocean-900 md:text-4xl';
const iconClass = 'h-6 w-6';
const socialClass =
  'flex h-12 w-12 items-center justify-center rounded-full bg-sand-500 text-white shadow-md shadow-sand-500/25 transition-colors hover:bg-sand-600';

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
  const hasSocial = contact.facebookUrl || contact.instagramUrl;

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

        {/* Form */}
        <section className="mx-auto max-w-4xl px-4 pb-10 pt-20 sm:px-6">
          <div className="text-center">
            <span className={eyebrowClass}>Write to us</span>
            <h2 className={`mt-3 ${sectionTitleClass}`}>Send a Message</h2>
            <p className="mt-4 text-slate-600">Want to make a reservation or have a question? Fill in the form and we will get back to you soon.</p>

            {hasSocial && (
              <div className="mt-6 flex justify-center gap-3">
                {contact.facebookUrl && (
                  <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={socialClass}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.7V21h2.8z" />
                    </svg>
                  </a>
                )}
                {contact.instagramUrl && (
                  <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={socialClass}>
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <path d="M17.2 6.8h.01" />
                    </svg>
                  </a>
                )}
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
