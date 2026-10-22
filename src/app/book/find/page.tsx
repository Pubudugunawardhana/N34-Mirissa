import type { Metadata } from 'next';
import Link from 'next/link';
import FindBookingForm from '@/components/booking/FindBookingForm';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';

export const metadata: Metadata = { title: 'Find my booking | N34 Mirissa' };

export default function FindBookingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav variant="solid" />

      <main className="mx-auto max-w-lg px-4 pb-20 pt-36 sm:px-6">
        <div className="text-center">
          <span className="block text-xs font-medium uppercase tracking-[0.3em] text-sand-600">Reservation</span>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ocean-900 md:text-4xl">Find my booking</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Booked without an account? Enter your booking reference and the email address you used, and we will take you to
            your booking.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-ocean-900/5 sm:p-8">
          <FindBookingForm />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Have an account?{' '}
          <Link href="/user" className="font-semibold text-ocean-600 hover:underline">See your bookings in My Account</Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
