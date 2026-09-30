import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50" suppressHydrationWarning>
      {/* Navigation */}
      <nav className="absolute top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-ocean-800 tracking-wider">N34</span>
            <span className="text-xl font-light text-ocean-600">Mirissa</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-ocean-600 transition-colors">Home</Link>
            <Link href="/rooms" className="hover:text-ocean-600 transition-colors">Rooms</Link>
            <Link href="/experiences" className="hover:text-ocean-600 transition-colors">Experiences</Link>
            <Link href="/dining" className="hover:text-ocean-600 transition-colors">Dining</Link>
            <Link href="/contact" className="hover:text-ocean-600 transition-colors">Contact</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-medium text-ocean-800 hover:text-ocean-600 px-4 py-2">
              Log In
            </Link>
            <Link href="/book" className="bg-ocean-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-ocean-800 transition-colors shadow-md shadow-ocean-600/30">
              Book Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* We use a placeholder image for the hero background. The user can replace this later with a real Mirissa beach photo */}
        <div className="absolute inset-0 z-0 bg-ocean-900 pointer-events-none overflow-hidden">
          <iframe
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300vw] h-[300vh] min-w-full min-h-full opacity-50"
            src="https://www.youtube.com/embed/2x7VaiWa-60?autoplay=1&mute=1&controls=0&showinfo=0&autohide=1&loop=1&playlist=2x7VaiWa-60&playsinline=1"
            allow="autoplay; encrypted-media"
            title="Background Video"
          />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
          <span className="text-sand-500 font-medium tracking-[0.2em] uppercase text-sm mb-4 block">
            Welcome to Paradise
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            Experience the Magic of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocean-400 to-sand-200">Mirissa</span>
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
      <div className="relative z-20 max-w-5xl mx-auto -mt-16 px-4" suppressHydrationWarning>
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row gap-4 items-end border border-slate-100">
          <div className="w-full md:w-1/4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Check In</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-3 outline-none focus:border-ocean-400 focus:ring-1 focus:ring-ocean-400 transition-all" />
          </div>
          <div className="w-full md:w-1/4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Check Out</label>
            <input type="date" className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-3 outline-none focus:border-ocean-400 focus:ring-1 focus:ring-ocean-400 transition-all" />
          </div>
          <div className="w-full md:w-1/4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Guests</label>
            <select className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-3 outline-none focus:border-ocean-400 focus:ring-1 focus:ring-ocean-400 transition-all">
              <option>1 Adult</option>
              <option>2 Adults</option>
              <option>2 Adults, 1 Child</option>
              <option>Family (4+)</option>
            </select>
          </div>
          <div className="w-full md:w-1/4">
            <button className="w-full bg-ocean-800 text-white rounded-lg p-3 font-semibold hover:bg-ocean-900 transition-colors h-[50px] shadow-md shadow-ocean-800/20">
              Check Availability
            </button>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-ocean-900 mb-12">Why Choose N34 Mirissa?</h2>
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
