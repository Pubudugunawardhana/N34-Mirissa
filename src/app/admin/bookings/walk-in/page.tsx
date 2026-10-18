import type { Metadata } from 'next';
import Link from 'next/link';
import { getWalkInOptions } from '@/app/actions/walk-in';
import WalkInForm from '@/components/admin/WalkInForm';
import { addDays, todayDateOnly } from '@/lib/booking';

export const metadata: Metadata = { title: 'Walk-in booking | N34 Admin' };
export const dynamic = 'force-dynamic';

export default async function WalkInBookingPage() {
  const today = todayDateOnly();
  // Tonight's availability, so the room types show straight away.
  const initialOptions = await getWalkInOptions(today, addDays(today, 1));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Walk-in booking</h1>
          <p className="mt-1 text-sm text-slate-500">For a guest at the desk. The booking is confirmed with its room straight away.</p>
        </div>
        <Link href="/admin/bookings/records" className="text-sm text-slate-500 hover:text-ocean-600">
          ← Booking records
        </Link>
      </div>
      <WalkInForm today={today} initialOptions={initialOptions} />
    </div>
  );
}
