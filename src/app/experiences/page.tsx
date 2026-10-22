import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { requestExperience } from '@/app/actions/experience-request';
import ExperienceRequestButton from '@/components/dining/ExperienceRequestButton';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import { formatLKR, todayDateOnly } from '@/lib/booking';
import { EXPERIENCE_CATEGORIES, PRICE_UNIT_TEXT, type ExperienceCategoryKey } from '@/lib/experiences';
import { getSiteSettings } from '@/lib/hotel';
import prisma from '@/lib/prisma';

export const metadata: Metadata = { title: 'Experiences | N34 Mirissa' };
export const dynamic = 'force-dynamic';

const eyebrowClass = 'block text-xs font-medium uppercase tracking-[0.3em] text-sand-600';
const sectionTitleClass = 'font-display text-3xl font-semibold text-ocean-900 md:text-4xl';

const FACTS = [
  { label: 'Arranged by the front desk', icon: 'M5 4h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z' },
  { label: 'Pick-up from the hotel', icon: 'M5 17h14l-1.5-6.5A2 2 0 0 0 15.6 9H8.4a2 2 0 0 0-1.9 1.5L5 17zM5 17v2M19 17v2M7.5 14h.01M16.5 14h.01' },
  { label: 'Friendly local guides', icon: 'M16 11a4 4 0 1 0-8 0M3 21a9 9 0 0 1 18 0M12 7V3' },
];

const CATEGORY_ICONS: Record<ExperienceCategoryKey, string> = {
  OCEAN: 'M2 12c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M2 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M12 3l2 4h-4l2-4z',
  CULTURE: 'M3 21h18M5 21V10M19 21V10M9 21v-6h6v6M3 10l9-6 9 6',
  ADVENTURE: 'M3 20l6-10 4 6 3-4 5 8H3zM14 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  WELLNESS: 'M12 21c-4-2-8-6-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-4 9-8 11z',
};

const STEPS = [
  {
    title: 'Choose',
    text: 'Pick an experience you like, or tell us what you have in mind.',
    icon: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  },
  { title: 'Send a request', text: 'Choose a date and how many of you are coming. It takes a minute.', icon: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z' },
  { title: 'We confirm', text: 'Our team checks with the guide and replies by email with the details.', icon: 'M4 4h16v12H5.2L4 17.2V4zM8 9h8M8 12h5' },
];

type Experience = Awaited<ReturnType<typeof prisma.experience.findMany>>[number];

function Duration({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      {value}
    </span>
  );
}

function Highlights({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-4 space-y-1.5">
      {items.slice(0, 3).map((highlight) => (
        <li key={highlight} className="flex items-start gap-2 text-sm text-slate-700">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg
              className="h-2.5 w-2.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          {highlight}
        </li>
      ))}
    </ul>
  );
}

function Price({ experience, price, large = false }: { experience: Experience; price: number; large?: boolean }) {
  return (
    <p>
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">From</span>
      <span className={`font-display font-semibold text-ocean-900 ${large ? 'text-3xl' : 'text-2xl'}`}>{formatLKR(price)}</span>
      <span className="ml-1 text-xs text-slate-400">{PRICE_UNIT_TEXT[experience.priceUnit]}</span>
    </p>
  );
}

// The big card at the top: photo on one side, the full story on the other.
function FeaturedExperience({ experience, today }: { experience: Experience; today: string }) {
  return (
    <article
      className="group mt-10 grid overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-ocean-900/5 lg:grid-cols-[1.3fr_1fr]"
      data-experience={experience.title}
      data-featured
    >
      <div className="relative min-h-72 overflow-hidden bg-slate-100 lg:min-h-[26rem]">
        {experience.imageUrl && (
          <Image
            src={experience.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ocean-900/40 via-transparent to-transparent" aria-hidden="true" />
        <span className="theme-fixed absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-sand-500 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="m12 2 3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8L12 2z" />
          </svg>
          Guest favourite
        </span>
      </div>
      <div className="flex flex-col p-7 sm:p-10">
        <span className={eyebrowClass}>{EXPERIENCE_CATEGORIES[experience.category]}</span>
        <h3 className="mt-3 font-display text-3xl font-semibold text-ocean-900">{experience.title}</h3>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          {experience.duration && <Duration value={experience.duration} />}
          {experience.bestTime && <span>· {experience.bestTime}</span>}
        </div>
        <p className="mt-5 leading-relaxed text-slate-600">{experience.description}</p>
        <Highlights items={experience.highlights} />
        <div className="min-h-6 flex-1" aria-hidden="true" />
        {experience.price !== null && (
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-6">
            <Price experience={experience} price={experience.price} large />
            <ExperienceRequestButton action={requestExperience.bind(null, experience.id)} title={experience.title} today={today} />
          </div>
        )}
      </div>
    </article>
  );
}

function ExperienceCard({ experience, today }: { experience: Experience; today: string }) {
  return (
    <article
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ocean-900/10"
      data-experience={experience.title}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {experience.imageUrl && (
          <Image
            src={experience.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}
        {/* Title over the photo, on a soft gradient so it stays readable */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ocean-900/85 via-ocean-900/10 to-transparent" aria-hidden="true" />
        <span className="theme-fixed absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ocean-900 shadow backdrop-blur">
          <svg
            className="h-3.5 w-3.5 text-sand-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={CATEGORY_ICONS[experience.category]} />
          </svg>
          {EXPERIENCE_CATEGORIES[experience.category]}
        </span>
        <div className="theme-fixed absolute inset-x-5 bottom-4 text-white">
          <h3 className="font-display text-xl font-semibold drop-shadow">{experience.title}</h3>
          {experience.duration && (
            <p className="mt-1 text-xs text-white/80">
              <Duration value={experience.duration} />
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{experience.description}</p>
        <Highlights items={experience.highlights} />
        {experience.bestTime && <p className="mt-4 text-xs text-slate-500">Best time: {experience.bestTime}</p>}
        {/* Pushes the price row to the bottom, so the cards in a row line up. */}
        <div className="min-h-6 flex-1" aria-hidden="true" />
        {experience.price !== null && (
          <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-5">
            <Price experience={experience} price={experience.price} />
            <ExperienceRequestButton action={requestExperience.bind(null, experience.id)} title={experience.title} today={today} />
          </div>
        )}
      </div>
    </article>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ExperiencesPage({ searchParams }: PageProps<'/experiences'>) {
  const params = await searchParams;
  const requested = first(params.category);
  const category = requested && requested in EXPERIENCE_CATEGORIES ? (requested as ExperienceCategoryKey) : null;

  const [experiences, site] = await Promise.all([prisma.experience.findMany({ where: { isActive: true }, orderBy: { position: 'asc' } }), getSiteSettings()]);
  const shown = category ? experiences.filter((experience) => experience.category === category) : experiences;
  const today = todayDateOnly();
  const phoneHref = `tel:${site.phone.replace(/[^+\d]/g, '')}`;

  // Only the categories that have something in them.
  const chips = (Object.keys(EXPERIENCE_CATEGORIES) as ExperienceCategoryKey[]).filter((key) => experiences.some((experience) => experience.category === key));

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      {/* Hero */}
      <header className="theme-fixed relative flex h-screen min-h-[640px] items-center justify-center overflow-hidden bg-ocean-900 text-white">
        <Image src="/images/hero-2.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ocean-900/65 via-ocean-900/35 to-ocean-900/75" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 pt-10 text-center">
          <span className="mb-4 block text-xs font-medium uppercase tracking-[0.3em] text-sand-200 sm:text-sm">Discover Mirissa</span>
          <h1 className="font-display text-5xl font-semibold drop-shadow-lg md:text-6xl">Unforgettable Experiences</h1>
          <p className="mt-5 font-light text-slate-200">
            Blue whales at sunrise, turtles on the reef, waves to surf and palm-lined sunsets, all a short ride from your room.
          </p>
          <a
            href="#experiences"
            className="mt-10 inline-block rounded-full bg-sand-500 px-10 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white shadow-lg shadow-sand-500/25 transition-colors hover:bg-sand-600"
          >
            Explore
          </a>
        </div>
      </header>

      <main>
        {/* Introduction */}
        <section className="mx-auto max-w-4xl px-4 pt-20 text-center sm:px-6">
          <span className={eyebrowClass}>Beyond the beach</span>
          <h2 className={`mt-3 ${sectionTitleClass}`}>Make the Most of Mirissa</h2>
          <span className="mx-auto mt-4 block h-0.5 w-16 rounded-full bg-sand-500" aria-hidden="true" />
          <p className="mt-8 leading-loose text-slate-600">
            Mirissa is one of the best places in the world to see blue whales, and there is much more close by: quiet coves, the old Dutch fort in Galle, surf
            breaks for beginners and Ayurvedic treatments to unwind. Tell us what you would like to do and we will arrange it with people we know and trust.
          </p>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {FACTS.map((fact) => (
              <li
                key={fact.label}
                className="inline-flex items-center gap-2 rounded-full border border-sand-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
              >
                <svg
                  className="h-4 w-4 text-sand-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={fact.icon} />
                </svg>
                {fact.label}
              </li>
            ))}
          </ul>
        </section>

        {/* Experiences */}
        <section id="experiences" className="mx-auto max-w-7xl scroll-mt-28 px-4 pt-20 sm:px-6 lg:px-8">
          {chips.length > 1 && (
            <nav aria-label="Categories" className="flex flex-wrap justify-center gap-2">
              {[null, ...chips].map((key) => {
                const active = key === category;
                const count = key ? experiences.filter((experience) => experience.category === key).length : experiences.length;
                return (
                  <Link
                    key={key ?? 'all'}
                    href={key ? `/experiences?category=${key}#experiences` : '/experiences#experiences'}
                    scroll={false}
                    aria-current={active ? 'page' : undefined}
                    className={`inline-flex items-center gap-2 rounded-full py-2 pl-3 pr-2 text-sm font-medium transition-all ${
                      active
                        ? 'bg-ocean-600 text-white shadow-md shadow-ocean-600/25'
                        : 'border border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-ocean-600 hover:text-ocean-700'
                    }`}
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d={key ? CATEGORY_ICONS[key] : 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'} />
                    </svg>
                    {key ? EXPERIENCE_CATEGORIES[key] : 'All'}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {count}
                    </span>
                  </Link>
                );
              })}
            </nav>
          )}

          {shown.length === 0 ? (
            <p className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
              {experiences.length === 0 ? 'New experiences are coming soon. Ask us at the front desk in the meantime.' : 'Nothing in this category yet.'}
            </p>
          ) : (
            <>
              {/* The first experience gets the big spot when everything is shown. */}
              {!category && <FeaturedExperience experience={shown[0]} today={today} />}
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {(category ? shown : shown.slice(1)).map((experience) => (
                  <ExperienceCard key={experience.id} experience={experience} today={today} />
                ))}
              </div>
            </>
          )}
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className={eyebrowClass}>Easy as one, two, three</span>
            <h2 className={`mt-3 ${sectionTitleClass}`}>How It Works</h2>
          </div>
          <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
            {/* The line joining the three steps on wide screens */}
            <span
              className="absolute left-[16%] right-[16%] top-8 hidden h-px bg-gradient-to-r from-sand-200 via-sand-500 to-sand-200 md:block"
              aria-hidden="true"
            />
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
                <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sand-50 text-sand-600 ring-8 ring-slate-50">
                  <svg
                    className="h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={step.icon} />
                  </svg>
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ocean-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                </span>
                <h3 className="mt-5 font-semibold text-ocean-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Plan your days */}
        <section className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
          <div className="theme-fixed relative overflow-hidden rounded-3xl bg-ocean-900 px-6 py-14 text-center text-white sm:px-12">
            <Image src="/images/hero-1.jpg" alt="" fill sizes="100vw" className="object-cover opacity-25" />
            <div className="relative">
              <h2 className="font-display text-3xl font-semibold md:text-4xl">Plan your days with us</h2>
              <p className="mx-auto mt-4 max-w-2xl font-light text-slate-200">
                Not sure what to choose, or want something not on the list? Tell us what you enjoy and we will put together the perfect day.
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
                <Link
                  href="/contact"
                  className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
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
