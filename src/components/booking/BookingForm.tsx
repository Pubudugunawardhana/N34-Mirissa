'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { checkAvailability, createBooking, type AvailabilityResult, type BookingFormState } from '@/app/actions/book';
import Alert from '@/components/auth/Alert';
import Field, { FieldError, inputClass } from '@/components/auth/Field';
import SubmitButton from '@/components/auth/SubmitButton';
import RoomCover from '@/components/rooms/RoomCover';
import SelectMenu from '@/components/SelectMenu';
import {
  MEAL_PLANS,
  MEAL_PLAN_KEYS,
  addDays,
  formatLKR,
  formatStayDate,
  guestSummary,
  quoteBooking,
  todayDateOnly,
  validateStay,
  type MealPlanKey,
} from '@/lib/booking';

type BookingFormProps = {
  room: {
    id: string;
    name: string;
    price: number;
    area: number;
    maxAdults: number;
    maxChildren: number;
    image: string | null;
  };
  // Set for visitors without a session: where "sign in" should take them.
  signInHref: string | null;
  initial: { guestName: string; email: string; phone: string; checkIn: string; checkOut: string; adults: number; children: number };
};

const initialState: BookingFormState = {};

const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';
const cardClass = 'rounded-3xl border border-slate-100 bg-white shadow-xl shadow-ocean-900/5';

function countOptions(from: number, to: number, singular: string, plural: string) {
  return Array.from({ length: to - from + 1 }, (_, index) => {
    const count = from + index;
    return { value: String(count), label: count === 0 ? `No ${plural.toLowerCase()}` : `${count} ${count === 1 ? singular : plural}` };
  });
}

function Step({ number, title, hint, children }: { number: number; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean-600 text-sm font-semibold text-white shadow-md shadow-ocean-600/25">
          {number}
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-ocean-900">{title}</h2>
          <p className="text-sm text-slate-500">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function BookingForm({ room, initial, signInHref }: BookingFormProps) {
  const [state, formAction, isPending] = useActionState(createBooking, initialState);

  // Controlled, so nothing the guest typed is lost when the server sends back an error.
  const [guestName, setGuestName] = useState(initial.guestName);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [specialRequests, setSpecialRequests] = useState('');
  const [checkIn, setCheckIn] = useState(initial.checkIn);
  const [checkOut, setCheckOut] = useState(initial.checkOut);
  const [adults, setAdults] = useState(initial.adults);
  const [children, setChildren] = useState(initial.children);
  const [mealPlan, setMealPlan] = useState<MealPlanKey>('ROOM_ONLY');

  const today = todayDateOnly();
  const stay = validateStay(checkIn, checkOut);
  const stayKey = stay.ok ? `${checkIn}|${checkOut}` : '';

  const [availability, setAvailability] = useState<{ key: string; result: AvailabilityResult } | null>(null);

  useEffect(() => {
    if (!stayKey) return;

    let ignore = false;
    const [from, to] = stayKey.split('|');
    checkAvailability(room.id, from, to)
      .then((result) => {
        if (!ignore) setAvailability({ key: stayKey, result });
      })
      .catch(() => {
        if (!ignore) setAvailability({ key: stayKey, result: { ok: false, message: 'Could not check availability. Please try again.' } });
      });

    return () => {
      ignore = true;
    };
    // state: re-check after a submit, because a failed booking usually means availability changed.
  }, [room.id, stayKey, state]);

  const current = availability?.key === stayKey ? availability.result : null;
  const quote = stay.ok ? quoteBooking({ pricePerNight: room.price, nights: stay.nights, adults, children, mealPlan }) : null;
  const guests = adults + children;

  let blocker: string | null = null;
  if (!checkIn || !checkOut) blocker = 'Provide check-in & check-out dates.';
  else if (!stay.ok) blocker = stay.message;
  else if (!current) blocker = 'Checking availability...';
  else if (!current.ok) blocker = current.message;
  else if (current.roomsLeft < 1) blocker = 'Sold out for these dates. Please choose different dates.';

  return (
    <form action={formAction} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px]" noValidate>
      <input type="hidden" name="roomId" value={room.id} />

      {/* Details */}
      <div className={`${cardClass} divide-y divide-slate-100`}>
        {state.message && (
          <div className="p-6 sm:px-8">
            <Alert>{state.message}</Alert>
          </div>
        )}

        <Step number={1} title="Guest details" hint="Who is the booking for?">
          {signInHref && (
            <p className="mb-5 rounded-2xl bg-ocean-50 px-4 py-3 text-sm text-ocean-800">
              No account needed to book. Already have one?{' '}
              <Link href={signInHref} className="font-semibold underline-offset-2 hover:underline">Sign in</Link> to fill in your details.
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="guestName"
              name="guestName"
              label="Name"
              autoComplete="name"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              error={state.errors?.guestName?.[0]}
              required
            />
            <Field
              id="phone"
              name="phone"
              type="tel"
              label="Phone number"
              autoComplete="tel"
              placeholder="071 234 5678"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              error={state.errors?.phone?.[0]}
              required
            />
            <div className="sm:col-span-2">
              <Field
                id="email"
                name="email"
                type="email"
                label="Email address"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={state.errors?.email?.[0]}
                required
              />
              <p className="mt-1.5 text-xs text-slate-500">Your booking confirmation is sent to this address.</p>
            </div>
          </div>
        </Step>

        <Step number={2} title="Your stay" hint="Dates and number of guests.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="checkIn"
              name="checkIn"
              type="date"
              label="Check-in"
              min={today}
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
              required
            />
            <Field
              id="checkOut"
              name="checkOut"
              type="date"
              label="Check-out"
              min={checkIn ? addDays(checkIn, 1) : today}
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
              required
            />
            <SelectMenu
              id="adults"
              name="adults"
              label="Number of adults"
              options={countOptions(1, room.maxAdults, 'Adult', 'Adults')}
              defaultValue={String(initial.adults)}
              variant="form"
              onChange={(value) => setAdults(Number(value))}
            />
            <SelectMenu
              id="children"
              name="children"
              label="Number of children"
              options={countOptions(0, room.maxChildren, 'Child', 'Children')}
              defaultValue={String(initial.children)}
              variant="form"
              onChange={(value) => setChildren(Number(value))}
            />
          </div>
        </Step>

        <Step number={3} title="Meals and requests" hint="Add meals to your stay, or tell us anything we should know.">
          <fieldset>
            <legend className={labelClass}>Meal options</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {MEAL_PLAN_KEYS.map((key) => {
                const plan = MEAL_PLANS[key];
                return (
                  <label key={key} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="mealPlan"
                      value={key}
                      checked={mealPlan === key}
                      onChange={() => setMealPlan(key)}
                      className="peer sr-only"
                    />
                    <span className="flex h-full items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 transition-all hover:border-ocean-400 peer-checked:border-ocean-600 peer-checked:ring-2 peer-checked:ring-ocean-600/30 peer-focus-visible:ring-2 peer-focus-visible:ring-ocean-500/50">
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">{plan.label}</span>
                        <span className="block text-xs text-slate-500">
                          {plan.pricePerGuestNight ? `${formatLKR(plan.pricePerGuestNight)} per guest, per night` : 'No extra charge'}
                        </span>
                      </span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          mealPlan === key ? 'border-ocean-600 bg-ocean-600' : 'border-slate-300'
                        }`}
                        aria-hidden="true"
                      >
                        {mealPlan === key && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6">
            <label htmlFor="specialRequests" className={labelClass}>
              Special requests <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="specialRequests"
              name="specialRequests"
              rows={3}
              placeholder="Late arrival, extra bed, dietary needs..."
              value={specialRequests}
              onChange={(event) => setSpecialRequests(event.target.value)}
              aria-invalid={state.errors?.specialRequests ? true : undefined}
              className={inputClass}
            />
            <FieldError id="specialRequests" error={state.errors?.specialRequests?.[0]} />
          </div>
        </Step>
      </div>

      {/* Summary. The server recalculates the price when the booking is saved. */}
      <aside className={`${cardClass} overflow-hidden lg:sticky lg:top-28`}>
        <div className="relative aspect-[16/9] bg-slate-200">
          <RoomCover src={room.image} alt={room.name} sizes="(min-width: 1024px) 400px, 100vw" priority />
        </div>

        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sand-600">Your booking</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ocean-900">{room.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Up to {guestSummary(room.maxAdults, room.maxChildren)} · {room.area} sq ft
          </p>

          <dl className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 text-sm" aria-live="polite">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Check-in</dt>
              <dd className="font-medium text-slate-800">{stay.ok ? formatStayDate(stay.checkIn) : 'Not chosen'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Check-out</dt>
              <dd className="font-medium text-slate-800">{stay.ok ? formatStayDate(stay.checkOut) : 'Not chosen'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Guests</dt>
              <dd className="font-medium text-slate-800">{guestSummary(adults, children)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Meals</dt>
              <dd className="font-medium text-slate-800">{MEAL_PLANS[mealPlan].label}</dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-slate-100 pt-5 text-sm" aria-live="polite">
            {quote && stay.ok ? (
              <dl className="space-y-2.5">
                <div className="flex justify-between gap-4 text-slate-600">
                  <dt>{formatLKR(room.price)} × {stay.nights} {stay.nights === 1 ? 'night' : 'nights'}</dt>
                  <dd>{formatLKR(quote.roomTotal)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-slate-600">
                  <dt>{MEAL_PLANS[mealPlan].label} × {guests} {guests === 1 ? 'guest' : 'guests'}</dt>
                  <dd>{formatLKR(quote.mealTotal)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-slate-100 pt-4">
                  <dt className="text-base font-semibold text-ocean-900">Total</dt>
                  <dd className="font-display text-2xl font-semibold text-ocean-900">{formatLKR(quote.total)}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-slate-500">
                From <span className="font-semibold text-ocean-900">{formatLKR(room.price)}</span> per night. Choose your dates to see the total.
              </p>
            )}
          </div>

          <div className="mt-6 space-y-3">
            {blocker ? (
              <>
                <p className={`text-sm font-medium ${blocker.startsWith('Checking') ? 'text-slate-500' : 'text-red-600'}`} aria-live="polite">
                  {blocker}
                </p>
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-lg bg-ocean-600/40 px-4 py-3 text-sm font-semibold text-white"
                >
                  Confirm booking
                </button>
              </>
            ) : (
              <>
                {current?.ok && (
                  <p className="text-sm font-medium text-emerald-700">
                    {current.roomsLeft} {current.roomsLeft === 1 ? 'room' : 'rooms'} left for these dates.
                  </p>
                )}
                <SubmitButton pending={isPending} pendingLabel="Saving your booking...">
                  Confirm booking
                </SubmitButton>
              </>
            )}
            <p className="text-center text-xs text-slate-400">No payment now. You pay at the hotel.</p>
          </div>
        </div>
      </aside>
    </form>
  );
}
