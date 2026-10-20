'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import type { MealPlan } from '@prisma/client';
import type { AssignRoomState, BillFormState } from '@/app/actions/bookings-admin';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import { MEAL_PLANS, MEAL_PLAN_KEYS, formatLKR, quoteBooking } from '@/lib/booking';
import { RoomChooser, roomChoice, type TakenRoom } from './AssignRoomDialog';

type FormAction<State> = (prevState: State, formData: FormData) => Promise<State>;

export type ChargeRow = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  // Server action with this charge bound to it.
  remove: () => Promise<void>;
};

type UpdateBookingDialogProps = {
  assignAction: FormAction<AssignRoomState>;
  mealAction: FormAction<BillFormState>;
  addChargeAction: FormAction<BillFormState>;
  reference: string;
  guestName: string;
  roomId: string;
  roomName: string;
  roomNumbers: string[];
  taken: TakenRoom[];
  currentRoomNumber: string | null;
  stay: string;
  nights: number;
  adults: number;
  // Number of children on the booking ("children" is reserved by React).
  childCount: number;
  pricePerNight: number;
  mealPlan: MealPlan;
  mealTotal: number;
  totalAmount: number;
  amountPaid: number;
  charges: ChargeRow[];
  className?: string;
};

type Tab = 'room' | 'meals' | 'extras';

// Things the hotel often adds; they fill in the description, the price is always typed.
const QUICK_CHARGES = ['Airport transfer', 'Laundry', 'Minibar', 'Spa treatment', 'Dinner', 'Late check-out'];

const tileClass =
  'group/tile relative flex cursor-pointer flex-col justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-slate-800 transition-colors hover:border-ocean-400 has-[:checked]:border-ocean-600 has-[:checked]:bg-ocean-600 has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ocean-500 has-[:focus-visible]:ring-offset-2';
const fieldClass =
  'block h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20';
const primaryClass =
  'h-11 rounded-xl bg-ocean-600 px-5 text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 disabled:opacity-60';

function Feedback({ state, savedText }: { state: { error?: string; saved?: number }; savedText: string }) {
  if (state.error) {
    return (
      <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
        {state.error}
      </p>
    );
  }
  if (state.saved) {
    return (
      <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200">
        {savedText}
      </p>
    );
  }
  return null;
}

// The record's "Update booking" window: move the guest to another room, change the meal option,
// or add things to the bill. Each tab saves on its own and the window stays open.
export default function UpdateBookingDialog(props: UpdateBookingDialogProps) {
  const { reference, guestName, roomName, stay, totalAmount, amountPaid, className } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [tab, setTab] = useState<Tab>('room');
  const balance = Math.max(0, totalAmount - amountPaid);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'room', label: 'Room' },
    { key: 'meals', label: 'Meals' },
    {
      key: 'extras',
      label: props.charges.length ? `Extras (${props.charges.length})` : 'Extras',
    },
  ];

  return (
    <>
      <button type="button" className={className} onClick={() => dialogRef.current?.showModal()}>
        Update booking
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-3xl bg-transparent p-0 text-left font-sans text-base font-normal normal-case tracking-normal backdrop:bg-ocean-900/60 backdrop:backdrop-blur-sm"
      >
        {/* Header, bill and tabs stay put; only the tab's content scrolls, inside the rounded card. */}
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-ocean-900/30 ring-1 ring-slate-200">
          <div className="shrink-0 px-6 pt-6 sm:px-8 sm:pt-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 id={titleId} className="font-display text-xl font-semibold text-ocean-900">
                  Update booking
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  <span className="font-mono font-semibold text-ocean-700">{reference}</span> · {guestName} · {roomName}
                  <br />
                  {stay}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {/* The bill as it stands */}
            <dl className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center" data-bill-total={totalAmount}>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800">{formatLKR(totalAmount)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Paid</dt>
                <dd className="mt-0.5 text-sm font-semibold text-slate-800">{formatLKR(amountPaid)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Balance</dt>
                <dd className={`mt-0.5 text-sm font-semibold ${balance > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>{formatLKR(balance)}</dd>
              </div>
            </dl>

            {/* Tabs */}
            <div role="tablist" aria-label="What to change" className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.key}
                  onClick={() => setTab(item.key)}
                  className={`h-9 rounded-lg text-sm font-semibold transition-colors ${
                    tab === item.key ? 'bg-white text-ocean-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 [scrollbar-color:var(--color-slate-300)_transparent] [scrollbar-width:thin] sm:px-8 sm:pb-8">
            {/* hidden keeps each tab's half-typed input when switching */}
            <div hidden={tab !== 'room'}>
              <RoomTab {...props} />
            </div>
            <div hidden={tab !== 'meals'}>
              <MealsTab {...props} />
            </div>
            <div hidden={tab !== 'extras'}>
              <ExtrasTab {...props} />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

function RoomTab({ assignAction, reference, roomId, roomName, roomNumbers, taken, currentRoomNumber }: UpdateBookingDialogProps) {
  const [state, formAction, pending] = useActionState(assignAction, {});
  const { nothingFree } = roomChoice({ roomNumbers, taken, currentRoomNumber });
  return (
    <form action={formAction} className="mt-5">
      <RoomChooser reference={reference} roomId={roomId} roomName={roomName} roomNumbers={roomNumbers} taken={taken} currentRoomNumber={currentRoomNumber} />
      <Feedback state={state} savedText="Room saved." />
      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={pending || nothingFree} className={primaryClass}>
          {pending ? 'Saving…' : 'Save room'}
        </button>
      </div>
    </form>
  );
}

function MealsTab({ mealAction, mealPlan, mealTotal, nights, adults, childCount: children, pricePerNight }: UpdateBookingDialogProps) {
  const [state, formAction, pending] = useActionState(mealAction, {});
  const [chosen, setChosen] = useState<MealPlan>(mealPlan);
  const mealsFor = (plan: MealPlan) => quoteBooking({ pricePerNight, nights, adults, children, mealPlan: plan }).mealTotal;
  const guests = adults + children;

  return (
    <form action={formAction} className="mt-5">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-slate-700">
          Meal option for {guests} {guests === 1 ? 'guest' : 'guests'} · {nights} {nights === 1 ? 'night' : 'nights'}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {MEAL_PLAN_KEYS.map((key) => {
            const plan = MEAL_PLANS[key];
            return (
              <label key={key} className={tileClass} data-meal-plan={key}>
                <input type="radio" name="mealPlan" value={key} checked={chosen === key} onChange={() => setChosen(key)} className="sr-only" />
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{plan.label}</span>
                  {key === mealPlan && (
                    <span className="rounded-full bg-ocean-50 px-2 py-0.5 text-[10px] font-semibold text-ocean-700 group-has-[:checked]/tile:bg-white/20 group-has-[:checked]/tile:text-white">
                      Current
                    </span>
                  )}
                </span>
                <span className="mt-1 text-xs text-slate-500 group-has-[:checked]/tile:text-ocean-100">
                  {plan.pricePerGuestNight ? `${formatLKR(plan.pricePerGuestNight)} per guest per night` : 'No meals included'}
                </span>
                <span className="mt-2 text-sm font-semibold">{formatLKR(mealsFor(key))}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {chosen !== mealPlan && (
        <p className="mt-4 rounded-xl bg-ocean-50 px-4 py-3 text-sm text-ocean-800 ring-1 ring-inset ring-ocean-100">
          Meals total changes from <strong>{formatLKR(mealTotal)}</strong> to <strong>{formatLKR(mealsFor(chosen))}</strong>.
        </p>
      )}
      <Feedback state={state} savedText="Meal option saved. The bill has been updated." />
      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={pending || chosen === mealPlan} className={primaryClass}>
          {pending ? 'Saving…' : 'Save meal option'}
        </button>
      </div>
    </form>
  );
}

function ExtrasTab({ addChargeAction, charges }: UpdateBookingDialogProps) {
  const [state, formAction, pending] = useActionState(addChargeAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const extrasTotal = charges.reduce((sum, charge) => sum + charge.quantity * charge.unitPrice, 0);

  // A fresh form for the next charge once one has been added.
  useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state.saved]);

  return (
    <div className="mt-5">
      {/* Charges on the bill */}
      {charges.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">No extra charges yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {charges.map((charge) => (
            <li key={charge.id} className="flex items-center gap-3 px-4 py-3" data-charge={charge.description}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{charge.description}</p>
                <p className="text-xs text-slate-500">
                  {charge.quantity} × {formatLKR(charge.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-800">{formatLKR(charge.quantity * charge.unitPrice)}</p>
              <form action={charge.remove}>
                <ConfirmSubmitButton
                  title="Remove this charge?"
                  confirmLabel="Remove"
                  cancelLabel="Keep it"
                  confirmMessage={`${charge.description} (${formatLKR(charge.quantity * charge.unitPrice)}) will be taken off the bill.`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                  </svg>
                  <span className="sr-only">Remove {charge.description}</span>
                </ConfirmSubmitButton>
              </form>
            </li>
          ))}
          <li className="flex justify-between px-4 py-3 text-sm">
            <span className="font-medium text-slate-500">Extras total</span>
            <span className="font-semibold text-ocean-900">{formatLKR(extrasTotal)}</span>
          </li>
        </ul>
      )}

      {/* Add a charge */}
      <form ref={formRef} action={formAction} className="mt-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">Add to the bill</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK_CHARGES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                if (descriptionRef.current) {
                  descriptionRef.current.value = name;
                  descriptionRef.current.form?.querySelector<HTMLInputElement>('input[name="unitPrice"]')?.focus();
                }
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-ocean-600 hover:text-ocean-700"
            >
              {name}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_5rem_8rem]">
          <input
            ref={descriptionRef}
            name="description"
            required
            maxLength={80}
            placeholder="What was it for?"
            aria-label="Description"
            className={fieldClass}
          />
          <input name="quantity" type="number" min="1" max="99" step="1" defaultValue="1" required aria-label="Quantity" className={fieldClass} />
          <input name="unitPrice" type="number" min="1" step="1" required placeholder="Price (LKR)" aria-label="Price each in LKR" className={fieldClass} />
        </div>
        <Feedback state={state} savedText="Added to the bill." />
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={pending} className={primaryClass}>
            {pending ? 'Adding…' : 'Add to bill'}
          </button>
        </div>
      </form>
    </div>
  );
}
