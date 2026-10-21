import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { requestDiningExperience } from '@/app/actions/dining-request';
import DiningGallery from '@/components/dining/DiningGallery';
import ExperienceRequestButton from '@/components/dining/ExperienceRequestButton';
import MenuSlider from '@/components/dining/MenuSlider';
import { formatLKR, todayDateOnly } from '@/lib/booking';
import { getDiningMenu, type DiningService } from '@/lib/dining';
import { getSiteSettings } from '@/lib/hotel';
import prisma from '@/lib/prisma';

export const metadata: Metadata = { title: 'Dining | N34 Mirissa' };
export const dynamic = 'force-dynamic';

const PRICE_UNITS = { PER_PERSON: 'per person', PER_COUPLE: 'per couple', PER_GROUP: 'per group' } as const;

function TrayIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 17h18M5 17a7 7 0 0 1 14 0M12 7V5M10 5h4M2 20h20" />
    </svg>
  );
}

const eyebrowClass = 'block text-xs font-medium uppercase tracking-[0.3em] text-sand-600';
const sectionTitleClass = 'font-display text-3xl font-semibold text-ocean-900 md:text-4xl';

function LeafIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 12-4 16-9 16z" />
      <path d="M4 20c4-4 7-6 11-8" />
    </svg>
  );
}

function ChilliIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6c-1-2-3-3-4-2M17 7c2 3 1 8-4 11s-9 3-10 2c3-1 6-3 8-7s3-6 6-6z" />
    </svg>
  );
}

// Dishes per menu card; longer menus continue on the next card, reached by sliding sideways.
const MENU_PAGE_SIZE = 5;
const menuCardClass = 'h-full divide-y divide-slate-100 rounded-3xl border border-slate-100 bg-white px-6 shadow-sm';

function chunk<T>(items: T[], size: number) {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

function DishRow({ item }: { item: DiningService['items'][number] }) {
  return (
    <li className="py-4" data-dish={item.name}>
      <div className="flex items-baseline gap-3">
        <span className="font-semibold text-ocean-900">{item.name}</span>
        {/* Dotted leader between the dish and its price, as on a printed menu */}
        <span className="flex-1 translate-y-[-3px] border-b border-dotted border-slate-300" aria-hidden="true" />
        <span className="shrink-0 font-semibold text-sand-600">{item.price ? formatLKR(item.price) : 'Included'}</span>
      </div>
      {(item.description || item.isVegetarian || item.isSpicy) && (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          {item.description && <span>{item.description}</span>}
          {item.isVegetarian && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <LeafIcon /> Vegetarian
            </span>
          )}
          {item.isSpicy && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
              <ChilliIcon /> Spicy
            </span>
          )}
        </div>
      )}
    </li>
  );
}

function MealSection({ service, reverse }: { service: DiningService; reverse: boolean }) {
  return (
    <section id={service.key.toLowerCase()} className="scroll-mt-28" data-meal={service.key}>
      <div className={`grid items-start gap-10 lg:grid-cols-2 lg:gap-16 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100 shadow-xl shadow-ocean-900/10 lg:sticky lg:top-28">
          {service.imageUrl && <Image src={service.imageUrl} alt={service.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ocean-900/50 via-transparent to-transparent" aria-hidden="true" />
          <span className="theme-fixed absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ocean-900 shadow-lg backdrop-blur">
            <svg className="h-4 w-4 text-sand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {service.hours}
          </span>
        </div>

        {/* Words and menu */}
        <div>
          <span className={eyebrowClass}>{service.tagline || service.hours}</span>
          <h2 className={`mt-3 ${sectionTitleClass}`}>{service.title}</h2>
          <span className="mt-4 block h-0.5 w-16 rounded-full bg-sand-500" aria-hidden="true" />
          <p className="mt-6 leading-loose text-slate-600">{service.description}</p>

          {!service.isAvailable ? (
            <p className="mt-8 rounded-2xl border border-sand-200 bg-sand-50 px-5 py-4 text-sm text-slate-700">
              <span className="font-semibold text-ocean-900">Not served at the moment.</span> Please ask at the front desk for what we can prepare for you.
            </p>
          ) : (
            <MenuSlider
              label={`${service.title} menu`}
              pages={
                service.items.length === 0
                  ? [
                      <ul key="empty" className={menuCardClass}>
                        <li className="py-6 text-center text-sm text-slate-500">The menu is being updated.</li>
                      </ul>,
                    ]
                  : chunk(service.items, MENU_PAGE_SIZE).map((page, index) => (
                      <ul key={index} className={menuCardClass}>
                        {page.map((item) => (
                          <DishRow key={item.id} item={item} />
                        ))}
                      </ul>
                    ))
              }
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default async function DiningPage() {
  const [services, site, experiences, photos] = await Promise.all([
    getDiningMenu(),
    getSiteSettings(),
    prisma.diningExperience.findMany({ where: { isActive: true }, orderBy: { position: 'asc' } }),
    prisma.diningPhoto.findMany({ orderBy: { position: 'asc' } }),
  ]);
  const today = todayDateOnly();
  const phoneHref = `tel:${site.phone.replace(/[^+\d]/g, '')}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      {/* Hero */}
      <header className="theme-fixed relative flex h-screen min-h-[640px] items-center justify-center overflow-hidden bg-ocean-900 text-white">
        <Image src={services.find((service) => service.key === 'DINNER')?.imageUrl ?? '/images/hero-5.jpg'} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ocean-900/65 via-ocean-900/35 to-ocean-900/75" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 pt-10 text-center">
          <span className="mb-4 block text-xs font-medium uppercase tracking-[0.3em] text-sand-200 sm:text-sm">Dining at N34</span>
          <h1 className="font-display text-5xl font-semibold drop-shadow-lg md:text-6xl">Taste of Mirissa</h1>
          <p className="mt-5 font-light text-slate-200">Fresh, home-style Sri Lankan food by the sea, from the first cup of tea to dinner under the stars.</p>

          {services.length > 0 && (
            <nav aria-label="Meals" className="mt-10 flex flex-wrap justify-center gap-3">
              {services.map((service) => (
                <a
                  key={service.id}
                  href={`#${service.key.toLowerCase()}`}
                  className="rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm backdrop-blur transition-colors hover:bg-white/20"
                >
                  <span className="font-semibold">{service.title}</span> <span className="text-white/70">· {service.hours}</span>
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main>
        {/* Introduction */}
        <section className="mx-auto max-w-4xl px-4 pt-20 text-center sm:px-6">
          <span className={eyebrowClass}>Our kitchen</span>
          <h2 className={`mt-3 ${sectionTitleClass}`}>Small Kitchen, Big Flavours</h2>
          <span className="mx-auto mt-4 block h-0.5 w-16 rounded-full bg-sand-500" aria-hidden="true" />
          <p className="mt-8 leading-loose text-slate-600">
            N34 is a small hotel, so there is no big restaurant: just our own kitchen, cooking for our guests. The fish comes from Mirissa harbour
            in the morning, the fruit from the village market, and the curries from family recipes. Eat on the terrace facing the ocean, in the
            garden, or have your meal brought to your room.
          </p>
          <div
            id="room-service"
            className="mx-auto mt-10 flex max-w-2xl scroll-mt-28 flex-wrap items-center justify-center gap-4 rounded-3xl border border-sand-200 bg-white px-6 py-5 text-left shadow-sm"
            data-room-service
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sand-50 text-sand-600">
              <TrayIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ocean-900">
                Room service <span className="font-normal text-slate-500">· {site.roomServiceHours}</span>
              </p>
              <p className="text-sm text-slate-600">{site.roomServiceNote}</p>
            </div>
          </div>
        </section>

        {/* Breakfast, lunch, dinner */}
        <div className="mx-auto max-w-7xl space-y-24 px-4 pt-20 sm:px-6 lg:px-8">
          {services.map((service, index) => (
            <MealSection key={service.id} service={service} reverse={index % 2 === 1} />
          ))}
          {services.length === 0 && <p className="text-center text-slate-500">Our menus are coming soon.</p>}
        </div>

        {/* Special dinners */}
        {experiences.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8" id="special-dinners">
            <div className="text-center">
              <span className={eyebrowClass}>Make it special</span>
              <h2 className={`mt-3 ${sectionTitleClass}`}>Special Dinners</h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-600">For a honeymoon, a birthday or simply a night to remember. Send a request and we will confirm by email.</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {experiences.map((experience) => (
                <article key={experience.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm" data-experience={experience.title}>
                  <div className="relative aspect-[4/3] bg-slate-100">
                    {experience.imageUrl && (
                      <Image src={experience.imageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                    )}
                    {experience.duration && (
                      <span className="theme-fixed absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ocean-900 shadow backdrop-blur">
                        {experience.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-semibold text-ocean-900">{experience.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{experience.description}</p>
                    <div className="mt-6 flex items-end justify-between gap-3 border-t border-slate-100 pt-5">
                      <p>
                        <span className="font-display text-2xl font-semibold text-ocean-900">{formatLKR(experience.price)}</span>
                        <span className="block text-xs text-slate-400">{PRICE_UNITS[experience.priceUnit]}</span>
                      </p>
                      <ExperienceRequestButton action={requestDiningExperience.bind(null, experience.id)} title={experience.title} today={today} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {photos.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8" data-gallery>
            <div className="text-center">
              <span className={eyebrowClass}>From our kitchen</span>
              <h2 className={`mt-3 ${sectionTitleClass}`}>Gallery</h2>
            </div>
            <div className="mt-10">
              <DiningGallery photos={photos.map((photo) => ({ id: photo.id, url: photo.url, caption: photo.caption }))} />
            </div>
          </section>
        )}

        {/* Special requests */}
        <section className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
          <div className="theme-fixed relative overflow-hidden rounded-3xl bg-ocean-900 px-6 py-14 text-center text-white sm:px-12">
            <Image src="/images/hero-3.jpg" alt="" fill sizes="100vw" className="object-cover opacity-25" />
            <div className="relative">
              <h2 className="font-display text-3xl font-semibold md:text-4xl">Dietary needs or a special dinner?</h2>
              <p className="mx-auto mt-4 max-w-2xl font-light text-slate-200">
                Vegetarian, gluten-free or a candlelit dinner on the beach for a birthday or honeymoon: tell us and our kitchen will prepare it.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a href={phoneHref} className="rounded-full bg-sand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sand-600">
                  Call {site.phone}
                </a>
                {site.social.whatsapp && (
                  <a
                    href={site.social.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    WhatsApp us
                  </a>
                )}
                <Link href="/contact" className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                  Send a message
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
