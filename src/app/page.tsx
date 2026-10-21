import Image from 'next/image';
import Link from 'next/link';
import AmenityStrip from '@/components/AmenityStrip';
import BookingPausedNotice from '@/components/booking/BookingPausedNotice';
import PhotoSlideshow from '@/components/PhotoSlideshow';
import Reveal from '@/components/Reveal';
import SelectMenu from '@/components/SelectMenu';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import RoomCover from '@/components/rooms/RoomCover';
import { formatLKR, guestSummary, todayDateOnly } from '@/lib/booking';
import { getDiningMenu } from '@/lib/dining';
import { EXPERIENCE_CATEGORIES, PRICE_UNIT_TEXT } from '@/lib/experiences';
import { getSiteSettings } from '@/lib/hotel';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Free stock beach photos. Replace the files in public/images with real photos of the hotel.
const HERO_SLIDES = ['/images/hero-1.jpg', '/images/hero-2.jpg', '/images/hero-3.jpg', '/images/hero-4.jpg', '/images/hero-5.jpg'];

const ADULT_OPTIONS = [
  { value: '1', label: '1 Adult' },
  { value: '2', label: '2 Adults' },
  { value: '3', label: '3 Adults' },
  { value: '4', label: '4 Adults' },
  { value: '5', label: '5+ Adults' },
];

const CHILD_OPTIONS = [
  { value: '0', label: 'No children' },
  { value: '1', label: '1 Child' },
  { value: '2', label: '2 Children' },
  { value: '3', label: '3 Children' },
  { value: '4', label: '4+ Children' },
];

const FALLBACK_ABOUT =
  'A small, calm hideaway a short walk from Mirissa beach. Wake up to the sound of the waves, start the day with a fresh Sri Lankan breakfast, and let our team arrange whale watching, surf lessons and sunset walks. Simple comfort, warm service, and the Indian Ocean on your doorstep.';

// Written out in full so Tailwind sees each class.
const ROOM_GRID_COLUMNS: Record<number, string> = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' };

// Questions guests ask most. Check the times and answers against how the hotel actually runs.
function faqs(roomServiceHours: string) {
  return [
    {
      question: 'How far is the hotel from the airport?',
      answer:
        'Bandaranaike International Airport (Colombo) is about 3 to 3½ hours away by car on the Southern Expressway. Mirissa beach itself is just a short walk from the hotel.',
    },
    {
      question: 'Can you arrange an airport transfer?',
      answer: 'Yes. Send us your flight details after you book and we will have a driver waiting for you at arrivals. The fare depends on the vehicle you need.',
    },
    {
      question: 'What are the check-in and check-out times?',
      answer: 'Check-in is from 2:00 pm and check-out is until 11:00 am. Early check-in or late check-out can often be arranged; just ask us.',
    },
    {
      question: 'Are meals included in the room price?',
      answer: 'You choose when you book: room only, bed & breakfast, half board or full board. You can even pick your dish for each meal from our menu.',
    },
    {
      question: 'Do you have room service?',
      answer: `Yes, room service runs ${roomServiceHours}. Meals and drinks are brought to your room, fresh from our kitchen.`,
    },
    {
      question: 'Can you organise whale watching and other tours?',
      answer: 'Of course. Whale watching, snorkelling, surf lessons and day trips can all be requested from our Experiences page, and our team confirms the details by email.',
    },
    {
      question: 'How can I check my booking?',
      answer: 'Use "Find my booking" at the bottom of any page with your booking reference and email, or simply contact us and we will help.',
    },
  ];
}

const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-[0.15em] mb-2.5';
const dateInputClass =
  'w-full h-14 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 outline-none hover:border-slate-300 focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/30 focus:bg-white transition-all';

function SectionHeading({ eyebrow, title, light = false, center = false }: { eyebrow: string; title: string; light?: boolean; center?: boolean }) {
  return (
    <div className={center ? 'text-center' : ''}>
      <span className={`block text-xs font-medium uppercase tracking-[0.3em] ${light ? 'text-sand-200' : 'text-sand-600'}`}>{eyebrow}</span>
      <h2 className={`mt-3 font-display text-3xl font-semibold md:text-4xl ${light ? 'text-white' : 'text-ocean-900'}`}>{title}</h2>
      <span className={`mt-4 block h-0.5 w-16 rounded-full bg-sand-500 ${center ? 'mx-auto' : ''}`} aria-hidden="true" />
    </div>
  );
}

function MoreLink({ href, children, light = false }: { href: string; children: string; light?: boolean }) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 text-sm font-semibold transition-colors ${light ? 'text-sand-200 hover:text-white' : 'text-ocean-600 hover:text-ocean-800'}`}
    >
      {children}
      <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

function Icon({ path, className = 'h-4 w-4' }: { path: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  phone: 'M5 4h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  tray: 'M3 17h18M5 17a7 7 0 0 1 14 0M12 7V5M10 5h4',
  chat: 'M4 4h16v12H5.2L4 17.2V4zM8 9h8M8 12h5',
};

export default async function Home() {
  const [site, rooms, meals, experiences, photos, facilities] = await Promise.all([
    getSiteSettings(),
    prisma.room.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { position: 'asc' }, take: 1 } },
      orderBy: { price: 'asc' },
    }),
    getDiningMenu(),
    prisma.experience.findMany({ where: { isActive: true }, orderBy: { position: 'asc' } }),
    prisma.diningPhoto.findMany({ orderBy: { position: 'asc' }, take: 5 }),
    prisma.facility.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const featuredRooms = rooms.slice(0, 3);
  const shownMeals = meals.filter((meal) => meal.isAvailable);
  const shownExperiences = experiences.slice(0, 4);
  const today = todayDateOnly();
  const phoneHref = `tel:${site.phone.replace(/[^+\d]/g, '')}`;

  // Until the admin adds dining photos, the gallery shows the hotel's beach photos.
  const gallery = photos.length > 0 ? photos.map((photo) => ({ id: photo.id, url: photo.url, caption: photo.caption })) : HERO_SLIDES.map((url) => ({ id: url, url, caption: null }));

  return (
    <div className="min-h-screen bg-slate-50" suppressHydrationWarning>
      <SiteNav />

      {/* 1. Hero: photos, the headline, and the booking bar at the bottom */}
      <section className="theme-fixed relative flex min-h-[100svh] flex-col overflow-hidden bg-ocean-900" data-home="hero">
        <PhotoSlideshow slides={HERO_SLIDES} sizes="100vw" dotsClassName="bottom-6 right-6 sm:right-10" />
        {/* Darkens the photos so the white text stays readable */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ocean-900/70 via-ocean-900/30 to-ocean-900/85" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 pb-12 pt-36 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-sand-200 ring-1 ring-inset ring-white/20 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-sand-500" aria-hidden="true" />
            Mirissa · Sri Lanka
          </span>
          <h1 className="mt-7 font-display text-5xl font-semibold leading-[1.05] text-white drop-shadow-lg sm:text-6xl md:text-7xl lg:text-8xl">
            Where the Ocean
            <br />
            <span className="bg-gradient-to-r from-ocean-400 via-sky-200 to-sand-200 bg-clip-text text-transparent">Meets Calm</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg font-light leading-relaxed text-slate-200">
            A serene stay steps from the beach. Fresh Sri Lankan food, whales on the horizon, and evenings that end with the sunset.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/rooms"
              className="rounded-full bg-sand-500 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-sand-500/30 transition-all hover:scale-105 hover:bg-sand-600"
            >
              Explore Rooms
            </Link>
            <Link
              href="/experiences"
              className="rounded-full border border-white/30 bg-white/10 px-8 py-4 text-lg font-medium text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              Discover Experiences
            </Link>
          </div>
        </div>

        {/* Booking bar: a white form inside a frosted frame */}
        <div className="relative z-20 mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6" id="book-bar">
          <div className="rounded-[2rem] bg-white/10 p-2 ring-1 ring-inset ring-white/20 backdrop-blur-xl">
            {site.bookingsPaused ? (
              <div className="rounded-[1.6rem] bg-white p-3">
                <BookingPausedNotice site={site} />
              </div>
            ) : (
              <form
                action="/rooms"
                className="grid grid-cols-2 items-end gap-4 rounded-[1.6rem] bg-white p-5 shadow-2xl shadow-ocean-900/30 md:p-6 lg:grid-cols-[1.2fr_1.2fr_1fr_1fr_1.2fr] lg:gap-5"
                suppressHydrationWarning
              >
                <div>
                  <label htmlFor="check-in" className={labelClass}>
                    Check In
                  </label>
                  <input id="check-in" name="checkIn" type="date" min={today} required className={dateInputClass} />
                </div>
                <div>
                  <label htmlFor="check-out" className={labelClass}>
                    Check Out
                  </label>
                  <input id="check-out" name="checkOut" type="date" min={today} required className={dateInputClass} />
                </div>
                <SelectMenu id="adults" name="adults" label="Adults" options={ADULT_OPTIONS} defaultValue="2" />
                <SelectMenu id="children" name="children" label="Children" options={CHILD_OPTIONS} defaultValue="0" />
                <div className="col-span-2 lg:col-span-1">
                  <button className="h-14 w-full rounded-xl bg-ocean-800 px-4 font-semibold text-white shadow-lg shadow-ocean-800/25 transition-all hover:bg-ocean-900 hover:shadow-xl">
                    Check Availability
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <a href="#welcome" className="scroll-cue absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 text-white/70 hover:text-white md:block" aria-label="Scroll down">
          <Icon path="M6 9l6 6 6-6" className="h-6 w-6" />
        </a>
      </section>

      {/* 2. Welcome: About Us from Site Settings and two photos */}
      <section id="welcome" className="scroll-mt-24 py-24 sm:py-28" data-home="about">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Reveal>
            <SectionHeading eyebrow="Welcome to N34 Mirissa" title="Your Quiet Corner of the South Coast" />
            <p className="mt-8 whitespace-pre-line text-lg font-light leading-relaxed text-slate-600">{site.aboutUs || FALLBACK_ABOUT}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <MoreLink href="/rooms">See our rooms</MoreLink>
              <MoreLink href="/contact">Get in touch</MoreLink>
            </div>
          </Reveal>

          <Reveal delay={150} className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative ml-auto aspect-[4/5] w-4/5 overflow-hidden rounded-[2rem] shadow-2xl shadow-ocean-900/20">
              <Image src="/images/hero-2.jpg" alt="The beach at Mirissa" fill sizes="(min-width: 1024px) 40vw, 80vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-10 left-0 aspect-square w-1/2 overflow-hidden rounded-[1.5rem] border-[6px] border-slate-50 shadow-xl shadow-ocean-900/20">
              <Image src="/images/hero-4.jpg" alt="Palm trees by the sea" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </div>
            <div className="theme-fixed absolute -top-6 left-6 rounded-2xl bg-ocean-900 px-5 py-4 text-white shadow-xl shadow-ocean-900/30 sm:left-10">
              <p className="font-display text-2xl font-semibold text-sand-200">Mirissa</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Southern Province</p>
            </div>
          </Reveal>
        </div>

      </section>

      {/* 3. Rooms: the first one large, two beside it */}
      {featuredRooms.length > 0 && (
        <section className="pb-24 pt-8" data-home="rooms">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow="Stay with us" title="Our Rooms" />
              <MoreLink href="/rooms">View all rooms</MoreLink>
            </Reveal>

            <div className={`grid gap-6 md:auto-rows-[280px] ${ROOM_GRID_COLUMNS[featuredRooms.length]}`}>
              {featuredRooms.map((room, index) => {
                const large = featuredRooms.length === 3 && index === 0;
                return (
                  <Reveal key={room.id} delay={index * 120} className={large ? 'md:col-span-2 md:row-span-2' : featuredRooms.length < 3 ? 'md:row-span-2' : ''}>
                    <Link
                      href={`/rooms/${room.id}`}
                      className="theme-fixed group relative flex h-80 flex-col justify-end overflow-hidden rounded-[2rem] bg-ocean-900 shadow-lg shadow-ocean-900/10 transition-shadow hover:shadow-2xl hover:shadow-ocean-900/25 md:h-full"
                      data-room-card
                    >
                      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                        <RoomCover src={room.images[0]?.url} alt={room.name} sizes={large ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 100vw'} />
                      </div>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ocean-900/90 via-ocean-900/20 to-transparent" aria-hidden="true" />

                      <span className="absolute right-5 top-5 rounded-full bg-white/15 px-4 py-1.5 text-sm text-white ring-1 ring-inset ring-white/25 backdrop-blur-md">
                        from <span className="font-semibold">{formatLKR(room.price)}</span>
                        <span className="text-white/70"> / night</span>
                      </span>

                      <div className="relative p-6 sm:p-8">
                        <h3 className={`font-display font-semibold text-white ${large ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>{room.name}</h3>
                        <p className="mt-2 text-sm text-slate-200">
                          {guestSummary(room.maxAdults, room.maxChildren)} · {room.area} sq ft
                        </p>
                        {large && room.description && <p className="mt-3 line-clamp-2 max-w-xl text-sm font-light text-slate-300">{room.description}</p>}
                        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sand-200">
                          View room
                          <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">
                            →
                          </span>
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. Dining: breakfast, lunch and dinner on a dark band */}
      {shownMeals.length > 0 && (
        <section className="theme-fixed relative overflow-hidden bg-ocean-900 py-24 text-white sm:py-28" data-home="dining">
          <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-sand-500/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-ocean-500/25 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <SectionHeading eyebrow="From our kitchen" title="Fresh, Local & Made Daily" light />
                <p className="mt-6 font-light leading-relaxed text-slate-300">
                  Sri Lankan favourites and fresh seafood, cooked to order. Eat by the ocean, or have it brought to your room.
                </p>
              </div>
              <div className="flex flex-col items-start gap-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm ring-1 ring-inset ring-white/15">
                  <Icon path={ICONS.tray} className="h-4 w-4 text-sand-200" />
                  Room service <span className="font-semibold text-sand-200">{site.roomServiceHours}</span>
                </span>
                <MoreLink href="/dining" light>
                  See the full menu
                </MoreLink>
              </div>
            </Reveal>

            <div className={`mt-12 grid gap-6 ${shownMeals.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {shownMeals.map((meal, index) => (
                <Reveal key={meal.id} delay={index * 120}>
                  <Link href="/dining" className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[2rem] ring-1 ring-inset ring-white/10" data-meal={meal.title}>
                    <Image
                      src={meal.imageUrl || HERO_SLIDES[index % HERO_SLIDES.length]}
                      alt={meal.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ocean-900 via-ocean-900/30 to-transparent" aria-hidden="true" />
                    <div className="relative p-7">
                      {meal.hours && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-sand-200">
                          <Icon path={ICONS.clock} className="h-3.5 w-3.5" />
                          {meal.hours}
                        </span>
                      )}
                      <h3 className="mt-2 font-display text-3xl font-semibold">{meal.title}</h3>
                      {meal.tagline && <p className="mt-2 text-sm font-light text-slate-300">{meal.tagline}</p>}
                      <p className="mt-4 text-xs text-slate-400">
                        {meal.items.length} {meal.items.length === 1 ? 'dish' : 'dishes'} on the menu
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Experiences */}
      {shownExperiences.length > 0 && (
        <section className="py-24 sm:py-28" data-home="experiences">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow="Discover Mirissa" title="Unforgettable Experiences" />
              <MoreLink href="/experiences">See all experiences</MoreLink>
            </Reveal>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {shownExperiences.map((experience, index) => (
                <Reveal key={experience.id} delay={index * 100}>
                  <Link
                    href={`/experiences?category=${experience.category}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ocean-900/10"
                    data-experience={experience.title}
                  >
                    <div className="theme-fixed relative aspect-[4/3] overflow-hidden bg-ocean-900">
                      <Image
                        src={experience.imageUrl || HERO_SLIDES[(index + 2) % HERO_SLIDES.length]}
                        alt={experience.title}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ocean-900 backdrop-blur">
                        {EXPERIENCE_CATEGORIES[experience.category]}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-lg font-semibold text-ocean-900 transition-colors group-hover:text-ocean-600">{experience.title}</h3>
                      {experience.duration && (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-500">
                          <Icon path={ICONS.clock} className="h-3.5 w-3.5" />
                          {experience.duration}
                        </p>
                      )}
                      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                        {experience.price !== null ? (
                          <p className="text-sm">
                            <span className="font-display text-lg font-semibold text-ocean-900">{formatLKR(experience.price)}</span>
                            <span className="text-xs text-slate-500"> {PRICE_UNIT_TEXT[experience.priceUnit]}</span>
                          </p>
                        ) : (
                          <span className="text-sm text-slate-500">Ask at the front desk</span>
                        )}
                        <span className="text-sm font-semibold text-sand-600" aria-hidden="true">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Facilities: the sliding cards from the Rooms page */}
      <AmenityStrip eyebrow="Every stay includes" title="Our Facilities" items={facilities} section="facilities" className="pb-24" />

      {/* 7. Gallery mosaic */}
      <section className="pb-24" data-home="gallery">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-10">
            <SectionHeading eyebrow="Moments at N34" title="Gallery" center />
          </Reveal>
          <div className="grid auto-rows-[160px] grid-cols-2 gap-4 sm:auto-rows-[220px] md:grid-cols-4">
            {gallery.map((photo, index) => (
              <Reveal key={photo.id} delay={index * 80} className={index === 0 ? 'col-span-2 row-span-2' : ''}>
                <figure className="theme-fixed group relative h-full overflow-hidden rounded-[1.5rem] bg-ocean-900">
                  <Image
                    src={photo.url}
                    alt={photo.caption || 'N34 Mirissa'}
                    fill
                    sizes={index === 0 ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 50vw'}
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {photo.caption && (
                    <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-ocean-900/90 to-transparent p-4 pt-10 text-sm text-white transition-transform duration-300 group-hover:translate-y-0">
                      {photo.caption}
                    </figcaption>
                  )}
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Frequently asked questions: an accordion beside a tall photo */}
      <section className="pb-24" data-home="faq">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-12">
            <SectionHeading eyebrow="Frequently asked questions" title="Your Guide to a Seamless Stay" center />
          </Reveal>
          <div className="grid items-start gap-12 lg:grid-cols-[1.4fr_1fr]">
            <Reveal className="divide-y divide-sand-200 border-y border-sand-200">
              {faqs(site.roomServiceHours).map((faq, index) => (
                <details key={faq.question} className="group" open={index === 0} data-faq>
                  <summary className="flex cursor-pointer list-none items-center gap-5 py-5 text-left [&::-webkit-details-marker]:hidden">
                    {/* A plus that turns into a minus when the answer is open */}
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean-50 text-ocean-700 transition-colors group-open:bg-sand-500 group-open:text-white" aria-hidden="true">
                      <span className="absolute h-0.5 w-3.5 rounded-full bg-current" />
                      <span className="absolute h-3.5 w-0.5 rounded-full bg-current transition-transform duration-300 group-open:rotate-90 group-open:opacity-0" />
                    </span>
                    <span className="font-medium text-ocean-900 transition-colors group-hover:text-ocean-600 sm:text-lg">{faq.question}</span>
                  </summary>
                  <p className="pb-6 pl-[3.25rem] pr-4 font-light leading-relaxed text-slate-600">{faq.answer}</p>
                </details>
              ))}
              <p className="py-5 text-sm text-slate-500">
                Still have a question?{' '}
                <Link href="/contact" className="font-semibold text-ocean-600 hover:text-ocean-800 hover:underline">
                  Send us a message
                </Link>
              </p>
            </Reveal>

            <Reveal delay={150} className="relative hidden lg:sticky lg:top-28 lg:block">
              <div className="theme-fixed relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-ocean-900 shadow-2xl shadow-ocean-900/20">
                <Image src="/images/hero-3.jpg" alt="The coast near N34 Mirissa" fill sizes="35vw" className="object-cover" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 9. Closing call to action */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8" data-home="cta">
        <Reveal className="theme-fixed relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-ocean-900 shadow-2xl shadow-ocean-900/20">
          <Image src="/images/hero-5.jpg" alt="" fill sizes="100vw" className="object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ocean-900/90 via-ocean-900/60 to-ocean-900/30" aria-hidden="true" />
          <div className="relative px-8 py-16 sm:px-14 sm:py-20 md:py-24">
            <span className="block text-xs font-medium uppercase tracking-[0.3em] text-sand-200">Plan your stay</span>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight text-white md:text-5xl">Your Mirissa escape starts here</h2>
            <p className="mt-5 max-w-xl font-light text-slate-200">Pick your dates and choose a room in a minute, or talk to us and we will plan it all for you.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={site.bookingsPaused ? '/contact' : '/rooms'}
                className="inline-flex h-12 items-center rounded-full bg-sand-500 px-7 font-semibold text-white shadow-lg shadow-sand-500/30 transition-all hover:scale-105 hover:bg-sand-600"
              >
                {site.bookingsPaused ? 'Contact us' : 'Book your stay'}
              </Link>
              <a
                href={phoneHref}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <Icon path={ICONS.phone} />
                {site.phone}
              </a>
              {site.social.whatsapp && (
                <a
                  href={site.social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  <Icon path={ICONS.chat} />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
