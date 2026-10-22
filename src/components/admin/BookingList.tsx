import Link from 'next/link';
import { addCharge, assignRoom, changeMealPlan, removeCharge, setBookingStatus, setPaymentStatus } from '@/app/actions/bookings-admin';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import AssignRoomDialog from './AssignRoomDialog';
import UpdateBookingDialog from './UpdateBookingDialog';
import BookingSearch from './BookingSearch';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/StatusBadge';
import { BOOKINGS_PER_PAGE, type BookingListResult } from '@/lib/admin-bookings';
import { MEAL_NAMES, MEAL_PLANS, formatLKR, formatStayDate, guestSummary, nightsBetween, toDateOnly, todayDateOnly } from '@/lib/booking';

type BookingListProps = {
  result: BookingListResult;
  // The screen's own address, e.g. "/admin/bookings/records".
  basePath: string;
  // Other query values to keep when searching or changing page (e.g. the status filter).
  keep?: Record<string, string>;
  // "new" shows only what a waiting booking needs; "records" shows everything.
  mode: 'new' | 'records';
  emptyText: string;
  // Added after "No bookings match …", e.g. to point at another tab.
  emptySearchHint?: string;
};

type Booking = BookingListResult['bookings'][number];

const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400';
const primaryButton =
  'inline-flex h-9 items-center justify-center rounded-lg bg-ocean-600 px-3.5 text-sm font-semibold text-white shadow-sm shadow-ocean-600/20 transition-colors hover:bg-ocean-700';
const quietButton =
  'inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3.5 text-sm font-medium text-slate-700 transition-colors hover:border-ocean-600 hover:text-ocean-700';
const dangerButton =
  'inline-flex h-9 items-center justify-center rounded-lg border border-red-200 px-3.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50';

function href(basePath: string, values: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '' && !(key === 'page' && value === 1)) query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `${basePath}?${text}` : basePath;
}

// A read-only note on confirmed stays that are happening now or start today.
function StayTag({ booking, today }: { booking: Booking; today: string }) {
  if (booking.bookingStatus !== 'CONFIRMED') return null;
  const arrives = toDateOnly(booking.checkIn);
  const label = arrives === today ? 'Arrives today' : arrives < today && toDateOnly(booking.checkOut) > today ? 'Staying now' : null;
  if (!label) return null;
  return (
    <span className="-mt-1 mb-1 inline-flex items-center justify-center rounded-full bg-ocean-50 px-2.5 py-1 text-xs font-semibold text-ocean-700 ring-1 ring-inset ring-ocean-100">
      {label}
    </span>
  );
}

function AssignRoom({ booking }: { booking: Booking }) {
  const isNew = booking.bookingStatus === 'PENDING';
  return (
    <AssignRoomDialog
      action={assignRoom.bind(null, booking.id)}
      reference={booking.reference}
      guestName={booking.guestName || 'Guest'}
      roomId={booking.roomId}
      roomName={booking.room.name}
      roomNumbers={booking.room.roomNumbers}
      taken={booking.taken}
      stay={stayText(booking)}
      currentRoomNumber={booking.roomNumber}
      isNew={isNew}
      className={`${isNew ? primaryButton : quietButton} w-full`}
    />
  );
}

function stayText(booking: Booking) {
  return `${formatStayDate(booking.checkIn)} → ${formatStayDate(booking.checkOut)}`;
}

// The small "Update booking" button next to a record's Room heading: room, meal option and extra charges.
function UpdateBooking({ booking }: { booking: Booking }) {
  return (
    <UpdateBookingDialog
      assignAction={assignRoom.bind(null, booking.id)}
      mealAction={changeMealPlan.bind(null, booking.id)}
      addChargeAction={addCharge.bind(null, booking.id)}
      reference={booking.reference}
      guestName={booking.guestName || 'Guest'}
      roomId={booking.roomId}
      roomName={booking.room.name}
      roomNumbers={booking.room.roomNumbers}
      taken={booking.taken}
      currentRoomNumber={booking.roomNumber}
      stay={stayText(booking)}
      nights={nightsBetween(booking.checkIn, booking.checkOut)}
      adults={booking.adults}
      childCount={booking.children}
      pricePerNight={booking.pricePerNight}
      mealPlan={booking.mealPlan}
      mealTotal={booking.mealTotal}
      dishPrices={Object.fromEntries(booking.mealChoices.map((choice) => [choice.meal, choice.price]))}
      totalAmount={booking.totalAmount}
      amountPaid={booking.amountPaid}
      charges={booking.charges.map((charge) => ({
        id: charge.id,
        description: charge.description,
        quantity: charge.quantity,
        unitPrice: charge.unitPrice,
        remove: removeCharge.bind(null, charge.id),
      }))}
      className="inline-flex h-7 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:border-ocean-600 hover:text-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
    />
  );
}

// One column of equal-width buttons, so every card's actions line up.
function Actions({ booking, mode }: { booking: Booking; mode: BookingListProps['mode'] }) {
  const isCancelled = booking.bookingStatus === 'CANCELLED';
  const isPaid = booking.paymentStatus === 'PAID';
  const guest = booking.guestName || 'this guest';
  const hasEmail = booking.email.includes('@');

  const cancel = !isCancelled && (
    <form action={setBookingStatus.bind(null, booking.id, 'CANCELLED')}>
      <ConfirmSubmitButton
        title="Cancel this booking?"
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        confirmMessage={`Booking ${booking.reference} for ${guest} will be cancelled. The room becomes available again and this cannot be undone.`}
        className={`${dangerButton} w-full`}
      >
        Cancel booking
      </ConfirmSubmitButton>
    </form>
  );

  if (mode === 'new') {
    return (
      <>
        <AssignRoom booking={booking} />
        {cancel}
      </>
    );
  }

  return (
    <>
      {!isCancelled && !isPaid && (
        <form action={setPaymentStatus.bind(null, booking.id, 'PAID')}>
          <ConfirmSubmitButton
            tone="primary"
            title="Mark as paid?"
            confirmLabel="Mark paid"
            cancelLabel="Not yet"
            confirmMessage={`Booking ${booking.reference} for ${guest} will be marked as paid in full (${formatLKR(booking.totalAmount)}).${
              hasEmail ? ` A payment receipt will be emailed to ${booking.email}.` : ''
            }`}
            className={`${quietButton} w-full`}
          >
            Mark paid
          </ConfirmSubmitButton>
        </form>
      )}
      {!isCancelled && isPaid && (
        <form action={setPaymentStatus.bind(null, booking.id, 'PENDING')}>
          <ConfirmSubmitButton
            tone="primary"
            title="Mark as unpaid?"
            confirmLabel="Mark unpaid"
            cancelLabel="Keep as paid"
            confirmMessage={`Booking ${booking.reference} for ${guest} will be marked as not paid yet.`}
            className={`${quietButton} w-full`}
          >
            Mark unpaid
          </ConfirmSubmitButton>
        </form>
      )}
      {cancel}
    </>
  );
}

export default function BookingList({ result, basePath, keep = {}, mode, emptyText, emptySearchHint }: BookingListProps) {
  const { bookings, total, page, pages, search } = result;
  const first = (page - 1) * BOOKINGS_PER_PAGE + 1;
  const last = first + bookings.length - 1;
  const today = todayDateOnly();

  return (
    <div className="group/list space-y-4">
      {/* Count and search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500" aria-live="polite">
          {total === 0 ? 'No bookings' : `Showing ${first}–${last} of ${total}`}
          {search && <> for &ldquo;{search}&rdquo;</>}
        </p>
        {/* key: a fresh box when the screen or filter changes, so it never shows an old search. */}
        <BookingSearch key={href(basePath, keep)} basePath={basePath} keep={keep} initial={search} />
      </div>

      {/* Bookings */}
      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
          {search ? `No bookings match "${search}".${emptySearchHint ? ` ${emptySearchHint}` : ''}` : emptyText}
        </div>
      ) : (
        <ul className="space-y-4 transition-opacity group-has-[[data-search-pending]]/list:opacity-50">
          {bookings.map((booking) => {
            const nights = nightsBetween(booking.checkIn, booking.checkOut);
            return (
              <li
                key={booking.id}
                className="grid gap-x-6 gap-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1.1fr_auto]"
              >
                {/* Guest */}
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-ocean-50 px-2 py-1 font-mono text-xs font-semibold tracking-wider text-ocean-700">{booking.reference}</span>
                    {booking.source === 'WALK_IN' ? (
                      <span className="rounded-full bg-sand-50 px-2 py-0.5 text-[11px] font-semibold text-sand-600 ring-1 ring-inset ring-sand-200">Walk-in</span>
                    ) : (
                      !booking.userId && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">No account</span>
                    )}
                  </div>
                  <p className="font-semibold text-slate-800">{booking.guestName || 'Guest'}</p>
                  {booking.phone && <p className="text-sm text-slate-600">{booking.phone}</p>}
                  {booking.idNumber && <p className="text-xs text-slate-500">ID {booking.idNumber}</p>}
                  {booking.email && <p className="break-all text-sm text-slate-500">{booking.email}</p>}
                </div>

                {/* Room */}
                <div className="min-w-0">
                  <div className="flex min-h-7 items-center gap-2.5">
                    <p className={labelClass}>Room</p>
                    {mode === 'records' && booking.bookingStatus !== 'CANCELLED' && <UpdateBooking booking={booking} />}
                  </div>
                  <p className="mt-1 font-semibold text-slate-800">{booking.room.name}</p>
                  <p className="text-sm text-slate-600">
                    {booking.roomNumber ? `Room ${booking.roomNumber}` : 'No room assigned yet'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {guestSummary(booking.adults, booking.children)} · {MEAL_PLANS[booking.mealPlan].label}
                  </p>
                  {booking.mealChoices.length > 0 && (
                    <p className="mt-1 flex flex-wrap gap-1.5" data-meal-choices>
                      {booking.mealChoices.map((choice) => (
                        <span key={choice.id} className="rounded-md bg-sand-50 px-2 py-0.5 text-[11px] font-medium text-sand-600 ring-1 ring-inset ring-sand-200">
                          {MEAL_NAMES[choice.meal]}: {choice.dishName}
                        </span>
                      ))}
                    </p>
                  )}
                  {booking.specialRequests && <p className="mt-1 text-xs text-slate-500">Note: {booking.specialRequests}</p>}
                </div>

                {/* Stay and money */}
                <div className="min-w-0">
                  <p className={labelClass}>Stay</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">
                    {formatStayDate(booking.checkIn)} → {formatStayDate(booking.checkOut)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {nights} {nights === 1 ? 'night' : 'nights'} · booked {booking.createdAt.toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' })}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-ocean-900">{formatLKR(booking.totalAmount)}</p>
                  {booking.extrasTotal > 0 && <p className="text-xs text-slate-500">incl. {formatLKR(booking.extrasTotal)} extras</p>}
                  {booking.paymentStatus === 'PARTIAL' && (
                    <p className="text-xs font-semibold text-amber-700">Balance {formatLKR(Math.max(0, booking.totalAmount - booking.amountPaid))}</p>
                  )}
                </div>

                {/* Status and actions */}
                <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-1 xl:w-48">
                  {/* Two equal halves, the same width as the buttons below. */}
                  <div className="mb-1 grid grid-cols-2 gap-2">
                    <BookingStatusBadge status={booking.bookingStatus} className="justify-center" />
                    {/* Mark paid opens the receipt; afterwards the Paid badge leads back to it. */}
                    {booking.paymentStatus === 'PAID' ? (
                      <Link href={`/admin/bookings/${booking.id}/receipt`} title="Open the receipt" className="flex rounded-full transition-opacity hover:opacity-80">
                        <PaymentStatusBadge status={booking.paymentStatus} className="w-full justify-center" />
                      </Link>
                    ) : (
                      <PaymentStatusBadge status={booking.paymentStatus} className="justify-center" />
                    )}
                  </div>
                  <StayTag booking={booking} today={today} />
                  <Actions booking={booking} mode={mode} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Paging */}
      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between pt-2">
          <span className="text-sm text-slate-500">Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={href(basePath, { ...keep, q: search, page: page - 1 })} className={quietButton}>← Prev</Link>
            ) : (
              <span className={`${quietButton} pointer-events-none opacity-40`}>← Prev</span>
            )}
            {page < pages ? (
              <Link href={href(basePath, { ...keep, q: search, page: page + 1 })} className={quietButton}>Next →</Link>
            ) : (
              <span className={`${quietButton} pointer-events-none opacity-40`}>Next →</span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
