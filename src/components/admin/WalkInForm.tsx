'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import type { MealPlan } from '@prisma/client';
import { createWalkInBooking, getWalkInOptions, type WalkInFormState, type WalkInOptions } from '@/app/actions/walk-in';
import { MEAL_PLANS, MEAL_PLAN_KEYS, addDays, formatLKR, formatStayDate, parseDateOnly, quoteBooking } from '@/lib/booking';
import { RoomChooser } from './AssignRoomDialog';

type WalkInFormProps = {
  today: string;
  initialOptions: WalkInOptions;
};

const initialState: WalkInFormState = {};

const cardClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';
const fieldClass =
  'block h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20';
const tileClass =
  'group/tile relative flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 transition-colors hover:border-ocean-400 has-[:checked]:border-ocean-600 has-[:checked]:bg-ocean-600 has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ocean-500 has-[:focus-visible]:ring-offset-2';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className={cardClass}>
      <h2 className="mb-4 flex items-center gap-3 font-semibold text-slate-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ocean-50 text-sm font-bold text-ocean-700">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const button =
    'flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-lg font-semibold text-slate-700 transition-colors hover:border-ocean-600 hover:text-ocean-700 disabled:pointer-events-none disabled:opacity-40';
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Fewer ${label.toLowerCase()}`}>
          −
        </button>
        <span className="w-10 text-center text-lg font-semibold text-slate-800" aria-live="polite">
          {value}
        </span>
        <button type="button" className={button} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`More ${label.toLowerCase()}`}>
          +
        </button>
      </div>
    </div>
  );
}

function FieldError({ errors, name }: { errors?: Record<string, string[] | undefined>; name: string }) {
  const error = errors?.[name]?.[0];
  return error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null;
}

// The desk's booking screen: dates and guests, a room type and room, meals, the guest's details and how they pay.
export default function WalkInForm({ today, initialOptions }: WalkInFormProps) {
  const [state, formAction, saving] = useActionState(createWalkInBooking, initialState);
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(addDays(today, 1));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomId, setRoomId] = useState('');
  const [mealPlan, setMealPlan] = useState<MealPlan>('BED_AND_BREAKFAST');
  const [payment, setPayment] = useState<'now' | 'later'>('now');
  const [guest, setGuest] = useState({ guestName: '', phone: '', email: '', idNumber: '', specialRequests: '' });
  const [options, setOptions] = useState(initialOptions);
  const [loading, startLoading] = useTransition();

  const nights = (() => {
    const from = parseDateOnly(checkIn);
    const to = parseDateOnly(checkOut);
    return from && to ? Math.round((to.getTime() - from.getTime()) / 86_400_000) : 0;
  })();

  // Fresh availability whenever the dates change, and after a failed save (a room may have gone in the meantime).
  useEffect(() => {
    startLoading(async () => {
      setOptions(await getWalkInOptions(checkIn, checkOut));
    });
  }, [checkIn, checkOut, state]);

  const rooms = options.ok ? options.rooms : [];
  const fits = (room: (typeof rooms)[number]) => adults <= room.maxAdults && children <= room.maxChildren;
  const room = rooms.find((item) => item.id === roomId && item.roomsLeft > 0 && fits(item));
  const quote = room && nights > 0 ? quoteBooking({ pricePerNight: room.price, nights, adults, children, mealPlan }) : null;
  const maxAdults = Math.max(1, ...rooms.map((item) => item.maxAdults));
  const maxChildren = Math.max(0, ...rooms.map((item) => item.maxChildren));
  const setField = (name: keyof typeof guest) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setGuest((current) => ({ ...current, [name]: event.target.value }));

  return (
    <form action={formAction} className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
      <input type="hidden" name="checkIn" value={checkIn} />
      <input type="hidden" name="checkOut" value={checkOut} />
      <input type="hidden" name="adults" value={adults} />
      <input type="hidden" name="children" value={children} />

      <div className="space-y-6">
        <Step number={1} title="Stay">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Check-in</span>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(event) => {
                  const value = event.target.value;
                  setCheckIn(value);
                  // Keep the same number of nights when the arrival moves.
                  if (parseDateOnly(value)) setCheckOut(addDays(value, Math.max(1, nights)));
                }}
                className={fieldClass}
                required
              />
            </label>
            <label className="block">
              <span className={labelClass}>Check-out</span>
              <input type="date" min={addDays(checkIn, 1)} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className={fieldClass} required />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {[1, 2, 3, 7].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setCheckOut(addDays(checkIn, count))}
                aria-pressed={nights === count}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  nights === count ? 'border-ocean-600 bg-ocean-50 text-ocean-700' : 'border-slate-200 text-slate-600 hover:border-ocean-600 hover:text-ocean-700'
                }`}
              >
                {count} {count === 1 ? 'night' : 'nights'}
              </button>
            ))}
            <span className="ml-auto text-sm text-slate-500">
              {nights > 0 ? `${nights} ${nights === 1 ? 'night' : 'nights'}` : 'Check-out must be after check-in'}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-8">
            <Stepper label="Adults" value={adults} min={1} max={maxAdults} onChange={setAdults} />
            <Stepper label="Children" value={children} min={0} max={maxChildren} onChange={setChildren} />
          </div>
        </Step>

        <Step number={2} title="Room type">
          {!options.ok ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-inset ring-amber-200">{options.message}</p>
          ) : (
            <div className={`grid gap-3 transition-opacity sm:grid-cols-2 ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
              {rooms.map((item) => {
                const soldOut = item.roomsLeft < 1;
                const tooSmall = !fits(item);
                const disabled = soldOut || tooSmall;
                return (
                  <label
                    key={item.id}
                    data-walkin-room={item.name}
                    className={`group/type relative flex overflow-hidden rounded-xl border bg-white transition-colors ${
                      disabled
                        ? 'cursor-not-allowed border-dashed border-slate-200 opacity-60'
                        : 'cursor-pointer border-slate-200 hover:border-ocean-400 has-[:checked]:border-ocean-600 has-[:checked]:ring-2 has-[:checked]:ring-ocean-600/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="roomId"
                      value={item.id}
                      checked={roomId === item.id && !disabled}
                      disabled={disabled}
                      onChange={() => setRoomId(item.id)}
                      className="sr-only"
                      required
                    />
                    <span className="relative w-24 shrink-0 bg-slate-100">
                      {item.image && <Image src={item.image} alt="" fill sizes="96px" className="object-cover" />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1 p-3">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            soldOut ? 'bg-red-50 text-red-700' : item.roomsLeft <= 2 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {soldOut ? 'Full' : `${item.roomsLeft} left`}
                        </span>
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatLKR(item.price)} / night · fits {item.maxAdults} {item.maxAdults === 1 ? 'adult' : 'adults'}
                        {item.maxChildren > 0 && ` · ${item.maxChildren} ${item.maxChildren === 1 ? 'child' : 'children'}`}
                      </span>
                      {tooSmall && !soldOut && <span className="text-xs font-medium text-amber-700">Too small for this group</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <FieldError errors={state.errors} name="roomId" />
        </Step>

        <Step number={3} title="Room">
          {room ? (
            <RoomChooser
              // A new set of tiles for each room type and stay, so the first free room is picked again.
              key={`${room.id}-${checkIn}-${checkOut}-${room.taken.length}`}
              reference="walk-in"
              roomId={room.id}
              roomName={room.name}
              roomNumbers={room.roomNumbers}
              taken={room.taken}
              currentRoomNumber={null}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">Choose a room type first.</p>
          )}
          <FieldError errors={state.errors} name="roomNumber" />
        </Step>

        <Step number={4} title="Meals">
          <div className="grid gap-2 sm:grid-cols-2">
            {MEAL_PLAN_KEYS.map((key) => {
              const plan = MEAL_PLANS[key];
              const total = nights > 0 ? plan.pricePerGuestNight * (adults + children) * nights : 0;
              return (
                <label key={key} className={tileClass}>
                  <input type="radio" name="mealPlan" value={key} checked={mealPlan === key} onChange={() => setMealPlan(key)} className="sr-only" />
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{plan.label}</span>
                    <span className="text-sm font-semibold">{formatLKR(total)}</span>
                  </span>
                  <span className="mt-1 text-xs text-slate-500 group-has-[:checked]/tile:text-ocean-100">
                    {plan.pricePerGuestNight ? `${formatLKR(plan.pricePerGuestNight)} per guest per night` : 'No meals included'}
                  </span>
                </label>
              );
            })}
          </div>
        </Step>

        <Step number={5} title="Guest details">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Full name</span>
              <input name="guestName" value={guest.guestName} onChange={setField('guestName')} autoComplete="off" className={fieldClass} required />
              <FieldError errors={state.errors} name="guestName" />
            </label>
            <label className="block">
              <span className={labelClass}>Phone</span>
              <input name="phone" type="tel" value={guest.phone} onChange={setField('phone')} placeholder="07X XXX XXXX" className={fieldClass} required />
              <FieldError errors={state.errors} name="phone" />
            </label>
            <label className="block">
              <span className={labelClass}>
                Email <span className="font-normal text-slate-400">(optional, for the receipt)</span>
              </span>
              <input name="email" type="email" value={guest.email} onChange={setField('email')} className={fieldClass} />
              <FieldError errors={state.errors} name="email" />
            </label>
            <label className="block">
              <span className={labelClass}>
                NIC / passport <span className="font-normal text-slate-400">(optional)</span>
              </span>
              <input name="idNumber" value={guest.idNumber} onChange={setField('idNumber')} maxLength={30} autoComplete="off" className={fieldClass} />
              <FieldError errors={state.errors} name="idNumber" />
            </label>
          </div>
          <label className="mt-4 block">
            <span className={labelClass}>
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <textarea
              name="specialRequests"
              rows={2}
              value={guest.specialRequests}
              onChange={setField('specialRequests')}
              placeholder="Extra bed, late arrival…"
              className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20"
            />
          </label>
        </Step>

        <Step number={6} title="Payment">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { key: 'now', title: 'Paid now', text: 'The guest pays the full amount at the desk.' },
                { key: 'later', title: 'Pay at check-out', text: 'The bill stays open; mark it paid later.' },
              ] as const
            ).map((option) => (
              <label key={option.key} className={tileClass}>
                <input type="radio" name="payment" value={option.key} checked={payment === option.key} onChange={() => setPayment(option.key)} className="sr-only" />
                <span className="text-sm font-semibold">{option.title}</span>
                <span className="mt-1 text-xs text-slate-500 group-has-[:checked]/tile:text-ocean-100">{option.text}</span>
              </label>
            ))}
          </div>
        </Step>
      </div>

      {/* The bill, kept in view while filling in the steps */}
      <aside className={`${cardClass} lg:sticky lg:top-0`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Walk-in bill</p>
        <p className="mt-2 font-semibold text-slate-800">{room?.name ?? 'No room chosen yet'}</p>
        <p className="text-sm text-slate-500">
          {parseDateOnly(checkIn) && parseDateOnly(checkOut) && nights > 0
            ? `${formatStayDate(parseDateOnly(checkIn)!)} → ${formatStayDate(parseDateOnly(checkOut)!)}`
            : 'Choose the dates'}
        </p>

        <dl className="mt-4 divide-y divide-slate-100 text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-slate-500">
              Room {room && nights > 0 ? `(${formatLKR(room.price)} × ${nights})` : ''}
            </dt>
            <dd className="font-medium text-slate-800">{quote ? formatLKR(quote.roomTotal) : '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-slate-500">Meals ({MEAL_PLANS[mealPlan].label})</dt>
            <dd className="font-medium text-slate-800">{quote ? formatLKR(quote.mealTotal) : '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3 text-base">
            <dt className="font-semibold text-ocean-900">Total</dt>
            <dd className="font-display text-xl font-semibold text-ocean-900">{quote ? formatLKR(quote.total) : '—'}</dd>
          </div>
        </dl>
        <p className={`mt-1 rounded-lg px-3 py-2 text-xs font-medium ${payment === 'now' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {payment === 'now' ? 'Paid in full at the desk' : 'To be paid at check-out'}
        </p>

        {state.message && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !quote}
          className="mt-5 h-12 w-full rounded-xl bg-ocean-600 text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Create walk-in booking'}
        </button>
        <p className="mt-2 text-center text-xs text-slate-400">Confirmed straight away. The receipt opens next.</p>
      </aside>
    </form>
  );
}
