'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import type { AssignRoomState } from '@/app/actions/bookings-admin';

export type TakenRoom = { roomNumber: string; reference: string; guestName: string };

type AssignRoomDialogProps = {
  // The server action with the booking already bound to it.
  action: (prevState: AssignRoomState, formData: FormData) => Promise<AssignRoomState>;
  reference: string;
  guestName: string;
  roomId: string;
  roomName: string;
  // The room type's own numbers; empty when the hotel has not listed them yet.
  roomNumbers: string[];
  // Numbers other bookings hold for nights that overlap this stay.
  taken: TakenRoom[];
  stay: string;
  currentRoomNumber: string | null;
  // A waiting booking is confirmed by this; a confirmed one only gets a different room.
  isNew: boolean;
  // What opens the window: a button by default, or e.g. a small link with an icon.
  trigger?: React.ReactNode;
  className?: string;
};

const initialState: AssignRoomState = {};

// "Assign room" button that opens a small window showing which rooms of the type are free for the stay.
export default function AssignRoomDialog({
  action,
  reference,
  guestName,
  roomId,
  roomName,
  roomNumbers,
  taken,
  stay,
  currentRoomNumber,
  isNew,
  trigger,
  className,
}: AssignRoomDialogProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => dialogRef.current?.close();

  // Close once the room has been saved.
  useEffect(() => {
    if (state.saved) dialogRef.current?.close();
  }, [state.saved]);

  const { nothingFree } = roomChoice({ roomNumbers, taken, currentRoomNumber });

  return (
    <>
      <button type="button" className={className} onClick={() => dialogRef.current?.showModal()}>
        {trigger ?? (isNew ? 'Assign room' : 'Update room')}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        // A click on the dimmed area lands on the dialog element itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl bg-transparent p-0 text-left font-sans text-base font-normal normal-case tracking-normal backdrop:bg-ocean-900/60 backdrop:backdrop-blur-sm"
      >
        <form action={formAction} className="rounded-3xl bg-white p-6 shadow-2xl shadow-ocean-900/30 ring-1 ring-slate-200 sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ocean-50 text-ocean-700">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 15h18M6 10V7h12v3M4 18v2M20 18v2" />
            </svg>
          </span>

          <h2 id={titleId} className="mt-5 font-display text-xl font-semibold text-ocean-900">
            {isNew ? 'Assign a room' : 'Change the room'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            <span className="font-mono font-semibold text-ocean-700">{reference}</span> · {guestName} · {roomName}
            <br />
            {stay}
            {isNew && <> · Saving the room confirms the booking.</>}
          </p>

          <RoomChooser
            reference={reference}
            roomId={roomId}
            roomName={roomName}
            roomNumbers={roomNumbers}
            taken={taken}
            currentRoomNumber={currentRoomNumber}
          />

          {state.error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
              {state.error}
            </p>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={pending}
              onClick={close}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || nothingFree}
              className="h-11 rounded-xl bg-ocean-600 px-5 text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {pending ? 'Saving…' : isNew ? 'Assign & confirm' : 'Save room'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

type RoomChooserProps = {
  reference: string;
  roomId: string;
  roomName: string;
  roomNumbers: string[];
  taken: TakenRoom[];
  currentRoomNumber: string | null;
};

// Works out what the room tiles need: which numbers are free, and which one starts selected.
export function roomChoice({ roomNumbers, taken, currentRoomNumber }: Pick<RoomChooserProps, 'roomNumbers' | 'taken' | 'currentRoomNumber'>) {
  const takenBy = new Map(taken.map((room) => [room.roomNumber, room]));
  const freeCount = roomNumbers.filter((number) => !takenBy.has(number)).length;
  // The room the booking already has, otherwise the first free one.
  const preselected =
    currentRoomNumber && roomNumbers.includes(currentRoomNumber) && !takenBy.has(currentRoomNumber)
      ? currentRoomNumber
      : roomNumbers.find((number) => !takenBy.has(number));
  return { takenBy, freeCount, preselected, hasList: roomNumbers.length > 0, nothingFree: roomNumbers.length > 0 && freeCount === 0 };
}

// The room-number tiles (free ones selectable, taken ones greyed out with the guest), or a plain box
// when the room type has no numbers listed. Renders the "roomNumber" field of the surrounding form.
export function RoomChooser({ reference, roomId, roomName, roomNumbers, taken, currentRoomNumber }: RoomChooserProps) {
  const inputId = useId();
  const { takenBy, freeCount, preselected, hasList, nothingFree } = roomChoice({ roomNumbers, taken, currentRoomNumber });
  return (
    <>
            {hasList ? (
              <fieldset className="mt-6">
                <legend className="mb-3 flex w-full flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-slate-700">Choose a room</span>
                  <span className="text-sm text-slate-500" data-free-count={freeCount}>
                    <span className={`font-semibold ${freeCount > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{freeCount} of {roomNumbers.length}</span> free
                  </span>
                </legend>
  
                <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto p-0.5 sm:grid-cols-4">
                  {roomNumbers.map((number) => {
                    const holder = takenBy.get(number);
                    if (holder) {
                      return (
                        <div
                          key={number}
                          title={`Taken by ${holder.guestName || 'a guest'} (${holder.reference})`}
                          data-room-taken={number}
                          className="flex min-h-16 flex-col justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-400"
                        >
                          <span className="flex items-center gap-1.5 text-sm font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" aria-hidden="true" />
                            {number}
                          </span>
                          <span className="mt-0.5 truncate text-[11px]">{holder.guestName || holder.reference}</span>
                          <span className="sr-only">taken</span>
                        </div>
                      );
                    }
                    return (
                      <label
                        key={number}
                        data-room-free={number}
                        className="group/room relative flex min-h-16 cursor-pointer flex-col justify-center rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-slate-800 transition-colors hover:border-ocean-400 has-[:checked]:border-ocean-600 has-[:checked]:bg-ocean-600 has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ocean-500 has-[:focus-visible]:ring-offset-2"
                      >
                        <input type="radio" name="roomNumber" value={number} defaultChecked={number === preselected} required className="sr-only" />
                        <span className="flex items-center gap-1.5 text-sm font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 group-has-[:checked]/room:bg-white" aria-hidden="true" />
                          {number}
                        </span>
                        <span className="mt-0.5 text-[11px] text-slate-500 group-has-[:checked]/room:text-ocean-100">
                          {number === currentRoomNumber ? 'Current' : 'Free'}
                        </span>
                      </label>
                    );
                  })}
                </div>
  
                {nothingFree && (
                  <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-inset ring-amber-200">
                    Every {roomName} room is taken for these dates.
                  </p>
                )}
              </fieldset>
            ) : (
              <>
                <label htmlFor={inputId} className="mt-6 mb-1.5 block text-sm font-medium text-slate-700">Room number</label>
                <input
                  id={inputId}
                  name="roomNumber"
                  required
                  maxLength={20}
                  autoFocus
                  autoComplete="off"
                  defaultValue={currentRoomNumber ?? ''}
                  placeholder="e.g. 204"
                  aria-label={`Room number for booking ${reference}`}
                  className="block h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition-colors focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20"
                />
                <p className="mt-2 text-xs text-slate-500">
                  <Link href={`/admin/rooms/${roomId}/edit`} className="font-medium text-ocean-600 hover:underline">
                    Add room numbers
                  </Link>{' '}
                  to this room type to pick a free room from a list.
                </p>
              </>
            )}
  
      </>
  );
}
