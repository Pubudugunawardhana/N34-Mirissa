import type { Booking, BookingCharge } from '@prisma/client';
import { MEAL_PLANS, formatLKR, formatStayDate, guestSummary, nightsBetween } from '@/lib/booking';

type Row = { label: string; value: string };

function Rows({ rows }: { rows: Row[] }) {
  return (
    <dl className="divide-y divide-slate-100">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className="flex justify-between gap-4 py-3">
          <dt className="text-slate-500">{row.label}</dt>
          <dd className="text-right font-medium text-slate-800">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// "14 Oct", when an extra was added to the bill.
function addedOn(date: Date) {
  return date.toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short' });
}

// The facts of a booking as a two-column list, with the full bill. Shared by the confirmation page and the receipt.
export default function BookingSummary({ booking, roomName }: { booking: Booking & { charges?: BookingCharge[] }; roomName: string }) {
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const roomTotal = booking.pricePerNight * nights;
  const balance = Math.max(0, booking.totalAmount - booking.amountPaid);

  const rows: Row[] = [
    { label: 'Room', value: roomName },
    // Only once the hotel has assigned one.
    ...(booking.roomNumber ? [{ label: 'Room number', value: booking.roomNumber }] : []),
    { label: 'Check-in', value: formatStayDate(booking.checkIn) },
    { label: 'Check-out', value: formatStayDate(booking.checkOut) },
    { label: 'Guests', value: guestSummary(booking.adults, booking.children) },
    { label: 'Meal option', value: MEAL_PLANS[booking.mealPlan].label },
    { label: `Room (${nights} ${nights === 1 ? 'night' : 'nights'})`, value: formatLKR(roomTotal) },
    { label: 'Meals', value: formatLKR(booking.mealTotal) },
  ];
  const charges = booking.charges ?? [];
  // Added up from the lines shown, so the section always agrees with itself.
  const extrasTotal = charges.reduce((sum, charge) => sum + charge.quantity * charge.unitPrice, 0);

  return (
    <div className="text-sm">
      <Rows rows={rows} />

      {/* Extras the hotel added during the stay, kept apart from the booking itself. */}
      {charges.length > 0 && (
        <>
          <div className="flex justify-between gap-4 border-t border-slate-100 py-3">
            <span className="font-medium text-slate-700">Booking subtotal</span>
            <span className="font-semibold text-slate-800">{formatLKR(roomTotal + booking.mealTotal)}</span>
          </div>
          <section className="my-2 rounded-xl bg-sand-50 px-4 py-3 ring-1 ring-inset ring-sand-200" aria-label="Extra charges">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sand-600">Extra charges during the stay</p>
            <dl className="mt-1 divide-y divide-sand-200">
              {charges.map((charge) => (
                <div key={charge.id} className="flex justify-between gap-4 py-2.5">
                  <dt className="min-w-0 text-slate-600">
                    <span className="block font-medium text-slate-800">{charge.description}</span>
                    <span className="block text-xs text-slate-500">
                      {charge.quantity} × {formatLKR(charge.unitPrice)} · added {addedOn(charge.createdAt)}
                    </span>
                  </dt>
                  <dd className="text-right font-medium text-slate-800">{formatLKR(charge.quantity * charge.unitPrice)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 py-2.5">
                <dt className="font-medium text-slate-700">Extras total</dt>
                <dd className="text-right font-semibold text-slate-800">{formatLKR(extrasTotal)}</dd>
              </div>
            </dl>
          </section>
        </>
      )}

      <dl className="divide-y divide-slate-100 border-t border-slate-100">
        <div className="flex justify-between gap-4 py-4 text-base">
          <dt className="font-semibold text-ocean-900">Total</dt>
          <dd className="font-display text-xl font-semibold text-ocean-900">{formatLKR(booking.totalAmount)}</dd>
        </div>
        {/* Shown once something has been paid. */}
        {booking.amountPaid > 0 && (
          <>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-slate-500">Paid</dt>
              <dd className="text-right font-medium text-emerald-700">{formatLKR(booking.amountPaid)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="font-semibold text-slate-700">Balance due</dt>
              <dd className={`text-right font-semibold ${balance > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{formatLKR(balance)}</dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
}
