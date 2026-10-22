'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import type { DiningFormState } from '@/app/actions/dining';

type FormAction = (prevState: DiningFormState, formData: FormData) => Promise<DiningFormState>;

const initialState: DiningFormState = {};
const fieldClass =
  'block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';
const primaryClass =
  'h-10 rounded-xl bg-ocean-600 px-5 text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 disabled:opacity-60';

export const PRICE_UNIT_LABELS = { PER_PERSON: 'per person', PER_COUPLE: 'per couple', PER_GROUP: 'per group' } as const;

function FieldError({ state, name }: { state: DiningFormState; name: string }) {
  const error = state.errors?.[name]?.[0];
  return error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null;
}

function Feedback({ state, savedText }: { state: DiningFormState; savedText: string }) {
  if (state.error) return <p role="alert" className="text-sm font-medium text-red-600">{state.error}</p>;
  if (state.saved) return <p role="status" className="text-sm font-medium text-emerald-700">{savedText}</p>;
  return null;
}

type ExperienceValues = { title: string; description: string; price: string; priceUnit: keyof typeof PRICE_UNIT_LABELS; duration: string; isActive: boolean };

const EMPTY_EXPERIENCE: ExperienceValues = { title: '', description: '', price: '', priceUnit: 'PER_PERSON', duration: '', isActive: true };

// A photo button with a small preview of the chosen picture, instead of the browser's plain file box.
export function PhotoPicker() {
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  // The preview holds the file in memory until it is released.
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );

  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-2 pl-2 pr-4 transition-colors hover:border-ocean-600">
      <span className="relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview, which the image optimizer cannot load
          <img src={preview.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="m21 16-5-5-9 8" />
          </svg>
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-700">{preview ? 'Change photo' : 'Choose photo'}</span>
        <span className="block max-w-48 truncate text-xs text-slate-400">{preview ? preview.name : 'JPEG, PNG or WebP, up to 5 MB'}</span>
      </span>
      <input
        type="file"
        name="photo"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          setPreview(file ? { url: URL.createObjectURL(file), name: file.name } : null);
        }}
      />
    </label>
  );
}

function ExperienceFields({ state, values, showActive }: { state: DiningFormState; values: ExperienceValues; showActive: boolean }) {
  const id = useId();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor={`${id}-title`}>Title</label>
        <input id={`${id}-title`} name="title" defaultValue={values.title} required maxLength={60} placeholder="Candlelit beach dinner" className={fieldClass} />
        <FieldError state={state} name="title" />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor={`${id}-description`}>Description</label>
        <textarea id={`${id}-description`} name="description" rows={3} defaultValue={values.description} required maxLength={500} className={fieldClass} />
        <FieldError state={state} name="description" />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${id}-price`}>Price (LKR)</label>
        {/* The amount takes the room it needs; the unit sits beside it at a fixed width. */}
        <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-2">
          <input id={`${id}-price`} name="price" type="number" min="1" step="1" defaultValue={values.price} required placeholder="18000" className={fieldClass} />
          <select name="priceUnit" defaultValue={values.priceUnit} aria-label="Price is" className={fieldClass}>
            {Object.entries(PRICE_UNIT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <FieldError state={state} name="price" />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${id}-duration`}>
          Duration <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input id={`${id}-duration`} name="duration" defaultValue={values.duration} maxLength={40} placeholder="About 2 hours" className={fieldClass} />
        <FieldError state={state} name="duration" />
      </div>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
        {/* A new picker after each save, so the last preview does not linger. */}
        <PhotoPicker key={state.saved ?? 0} />
        {showActive && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="h-4 w-4 rounded border-slate-300 accent-ocean-600" />
            Show on the Dining page
          </label>
        )}
        <FieldError state={state} name="photo" />
      </div>
    </div>
  );
}

export function AddExperienceForm({ action }: { action: FormAction }) {
  const [state, formAction, saving] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state.saved]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-2xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">Add a special dinner</p>
      <ExperienceFields state={state} values={EMPTY_EXPERIENCE} showActive={false} />
      <div className="flex items-center justify-end gap-3">
        <Feedback state={state} savedText="Added." />
        <button type="submit" disabled={saving} className={primaryClass}>
          {saving ? 'Adding…' : '+ Add experience'}
        </button>
      </div>
    </form>
  );
}

export function EditExperienceButton({ action, values }: { action: FormAction; values: ExperienceValues }) {
  const [state, formAction, saving] = useActionState(action, initialState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (state.saved) dialogRef.current?.close();
  }, [state.saved]);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ocean-600 transition-colors hover:bg-ocean-50 hover:text-ocean-800"
      >
        Edit
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl bg-transparent p-0 text-left font-sans text-base font-normal normal-case tracking-normal backdrop:bg-ocean-900/60 backdrop:backdrop-blur-sm"
      >
        <form action={formAction} className="space-y-4 rounded-3xl bg-white p-6 shadow-2xl shadow-ocean-900/30 ring-1 ring-slate-200 sm:p-8">
          <h2 id={titleId} className="font-display text-xl font-semibold text-ocean-900">Edit special dinner</h2>
          <ExperienceFields state={state} values={values} showActive />
          {state.error && <p role="alert" className="text-sm font-medium text-red-600">{state.error}</p>}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="h-10 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className={primaryClass}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function RoomServiceForm({ action, hours, note }: { action: FormAction; hours: string; note: string }) {
  const [state, formAction, saving] = useActionState(action, initialState);
  const id = useId();
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-[14rem_1fr_auto] sm:items-end">
      <div>
        <label className={labelClass} htmlFor={`${id}-hours`}>Hours</label>
        <input id={`${id}-hours`} name="roomServiceHours" defaultValue={hours} required maxLength={40} className={fieldClass} />
        <FieldError state={state} name="roomServiceHours" />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${id}-note`}>Note for guests</label>
        <input id={`${id}-note`} name="roomServiceNote" defaultValue={note} maxLength={160} className={fieldClass} />
        <FieldError state={state} name="roomServiceNote" />
      </div>
      <div className="flex items-center gap-3">
        <Feedback state={state} savedText="Saved." />
        <button type="submit" disabled={saving} className={primaryClass}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export function GalleryUploadForm({ action, remaining }: { action: FormAction; remaining: number }) {
  const [state, formAction, saving] = useActionState(action, initialState);
  // How many files are chosen, remembered with the upload it belongs to, so it reads 0 again after an upload.
  const [choice, setChoice] = useState({ count: 0, after: 0 });
  const count = choice.after === (state.saved ?? 0) ? choice.count : 0;
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state.saved]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4">
      <label className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-ocean-600 hover:text-ocean-700">
        {count > 0 ? `${count} ${count === 1 ? 'photo' : 'photos'} chosen` : 'Choose photos'}
        <input
          type="file"
          name="photos"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => setChoice({ count: event.target.files?.length ?? 0, after: state.saved ?? 0 })}
        />
      </label>
      <span className="text-xs text-slate-400">JPEG, PNG or WebP, up to 5 MB each · {remaining} more can be added</span>
      <span className="ml-auto flex items-center gap-3">
        <Feedback state={state} savedText="Uploaded." />
        <button type="submit" disabled={saving || count === 0} className={primaryClass}>
          {saving ? 'Uploading…' : 'Upload'}
        </button>
      </span>
    </form>
  );
}
