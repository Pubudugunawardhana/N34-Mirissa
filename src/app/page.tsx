import Link from "next/link";
import PhotoSlideshow from "@/components/PhotoSlideshow";
import SelectMenu from "@/components/SelectMenu";
import SiteNav from "@/components/SiteNav";
import { todayDateOnly } from "@/lib/booking";

const HERO_SLIDES = [
  "/images/hero-1.jpg",
  "/images/hero-2.jpg",
  "/images/hero-3.jpg",
  "/images/hero-4.jpg",
  "/images/hero-5.jpg",
];

const ADULT_OPTIONS = [
  { value: "1", label: "1 Adult" },
  { value: "2", label: "2 Adults" },
  { value: "3", label: "3 Adults" },
  { value: "4", label: "4 Adults" },
  { value: "5", label: "5+ Adults" },
];

const CHILD_OPTIONS = [
  { value: "0", label: "No children" },
  { value: "1", label: "1 Child" },
  { value: "2", label: "2 Children" },
  { value: "3", label: "3 Children" },
  { value: "4", label: "4+ Children" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50" suppressHydrationWarning>
      <SiteNav />

      {/* Hero Section */}
      <section className="relative h-screen min-h-[640px] flex items-center justify-center overflow-hidden bg-ocean-900">
        {/* Free stock beach photos. Replace the files in public/images with real photos of the hotel. */}
        <PhotoSlideshow slides={HERO_SLIDES} sizes="100vw" dotsClassName="bottom-32 left-1/2 -translate-x-1/2" />
        {/* Darkens the photos so the white text stays readable */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ocean-900/60 via-ocean-900/35 to-ocean-900/70" aria-hidden="true" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
          <span className="text-sand-200 font-medium tracking-[0.3em] uppercase text-xs sm:text-sm mb-5 block">
            Welcome to Paradise
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-semibold text-white mb-6 leading-[1.1] drop-shadow-lg">
            Experience the Magic of <br />
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-ocean-400 to-sand-200">Mirissa</span>
          </h1>
          <p className="text-lg text-slate-200 mb-10 max-w-2xl mx-auto font-light">
            Discover a serene getaway at N34 Mirissa. Where the ocean breeze meets luxury comfort, creating memories that last a lifetime.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rooms" className="bg-sand-500 text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-sand-600 transition-all hover:scale-105 shadow-lg shadow-sand-500/30">
              Explore Our Rooms
            </Link>
            <Link href="/experiences" className="bg-white/10 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-full font-medium text-lg hover:bg-white/20 transition-all">
              Discover Experiences
            </Link>
          </div>
        </div>
      </section>

      {/* Booking Widget (Floating) */}
      <div className="relative z-20 max-w-6xl mx-auto -mt-16 px-4 sm:px-6" suppressHydrationWarning>
        <form action="/rooms" className="bg-white rounded-3xl shadow-2xl shadow-ocean-900/10 p-6 md:p-8 lg:px-10 lg:py-9 grid grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1fr_1fr_1.2fr] gap-4 lg:gap-6 items-end border border-slate-100">
          <div>
            <label htmlFor="check-in" className="block text-xs font-semibold text-slate-500 uppercase tracking-[0.15em] mb-2.5">Check In</label>
            <input id="check-in" name="checkIn" type="date" min={todayDateOnly()} required className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 outline-none hover:border-slate-300 focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/30 focus:bg-white transition-all" />
          </div>
          <div>
            <label htmlFor="check-out" className="block text-xs font-semibold text-slate-500 uppercase tracking-[0.15em] mb-2.5">Check Out</label>
            <input id="check-out" name="checkOut" type="date" min={todayDateOnly()} required className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 outline-none hover:border-slate-300 focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/30 focus:bg-white transition-all" />
          </div>
          <SelectMenu id="adults" name="adults" label="Adults" options={ADULT_OPTIONS} defaultValue="2" />
          <SelectMenu id="children" name="children" label="Children" options={CHILD_OPTIONS} defaultValue="0" />
          <div className="col-span-2 lg:col-span-1">
            <button className="w-full h-14 bg-ocean-800 text-white rounded-xl px-4 font-semibold hover:bg-ocean-900 transition-all hover:shadow-xl shadow-lg shadow-ocean-800/25">
              Check Availability
            </button>
          </div>
        </form>
      </div>
      
      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ocean-900 mb-12">Why Choose N34 Mirissa?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <span className="w-14 h-14 bg-ocean-50 text-ocean-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl" suppressHydrationWarning>
                🌊
              </span>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Oceanfront Views</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Wake up to the sound of waves and breathtaking views of the Indian Ocean right from your balcony.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <span className="w-14 h-14 bg-sand-50 text-sand-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl" suppressHydrationWarning>
                ✨
              </span>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Luxury Amenities</h3>
              <p className="text-slate-500 text-sm leading-relaxed">From premium bedding to high-speed WiFi, we provide everything you need for a comfortable stay.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <span className="w-14 h-14 bg-ocean-50 text-ocean-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl" suppressHydrationWarning>
                🍽️
              </span>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Exquisite Dining</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Savor authentic Sri Lankan seafood and international cuisines at our ocean-view restaurant.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
