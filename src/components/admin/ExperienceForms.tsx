'use client';

import { useActionState, useEffect, useId, useRef } from 'react';
import type { ExperienceFormState } from '@/app/actions/experiences';
import { PhotoPicker } from '@/components/admin/DiningExtrasForms';
import { EXPERIENCE_CATEGORIES, PRICE_UNIT_TEXT } from '@/lib/experiences';

type FormAction = (prevState: ExperienceFormState, formData: FormData) => Promise<ExperienceFormState>;

export type ExperienceValues = {
  title: string;
  category: keyof typeof EXPERIENCE_CATEGORIES;
  description: string;
  highlights: string[];
  price: string;
  priceUnit: keyof typeof PRICE_UNIT_TEXT;
  duration: string;
  bestTime: string;
  isActive: boolean;
};

const EMPTY: ExperienceValues = {
  title: '',
  category: 'OCEAN',
  description: '',
  highlights: [],
  price: '',
  priceUnit: 'PER_PERSON',
  duration: '',
  bestTime: '',
  isActive: true,
};

const initialState: ExperienceFormState = {};
const fieldClass =
  'block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';
const primaryClass =
  'h-10 rounded-xl bg-ocean-600 px-5 text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 disabled:opacity-60';

function FieldError({ state, name }: { state: ExperienceFormState; name: string }) {
  const error = state.errors?.[name]?.[0];
  return error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null;
}

function Optional() {
  return <span className="font-normal text-slate-400">(optional)</span>;
}

function Fields({ state, values, showActive }: { state: ExperienceFormState; values: ExperienceValues; showActive: boolean }) {
  const id = useId();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className={labelClass} htmlFor={`${id}-title`}>Title</label>
        <input id={`${id}-title`} name="title" defaultValue={values.title} required maxLength={60} placeholder="Whale & dolphin watching" className={fieldClass} />
        <FieldError state={state} name="title" />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${id}-category`}>Category</label>
        <select id={`${id}-category`} name="category" defaultValue={values.category} className={fieldClass}>
          {Object.entries(EXPERIENCE_CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <FieldError state={state} name="category" />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor={`${id}-description`}>Description</label>
        <textarea id={`${id}-description`} name="description" rows={3} defaultValue={values.description} required maxLength={600} className={fieldClass} />
        <FieldError state={state} name="description" />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor={`${id}-highlights`}>
          Highlights <Optional /> <span className="font-normal text-slate-400">· one per line, up to 6</span>
        </label>
        <textarea
          id={`${id}-highlights`}
          name="highlights"
          rows={3}
          defaultValue={values.highlights.join('\n')}
          placeholder={'Breakfast on board\nHotel pick-up'}
          className={fieldClass}
        />
        <FieldError state={state} name="highlights" />
      </div>
      <div>
        <label className={labelClass} htmlFor={`${id}-price`}>
          Price (LKR) <Optional />
        </label>
        <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-2">
          <input id={`${id}-price`} name="price" type="number" min="1" step="1" defaultValue={values.price} placeholder="16000" className={fieldClass} />
          <select name="priceUnit" defaultValue={values.priceUnit} aria-label="Price is" className={fieldClass}>
            {Object.entries(PRICE_UNIT_TEXT).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-1.5 text-xs text-slate-400">Leave empty to show it without a Request button.</p>
        <FieldError state={state} name="price" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor={`${id}-duration`}>
            Duration <Optional />
          </label>
          <input id={`${id}-duration`} name="duration" defaultValue={values.duration} maxLength={40} placeholder="About 4 hours" className={fieldClass} />
          <FieldError state={state} name="duration" />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${id}-best`}>
            Best time <Optional />
          </label>
          <input id={`${id}-best`} name="bestTime" defaultValue={values.bestTime} maxLength={60} placeholder="6:30 am departure" className={fieldClass} />
          <FieldError state={state} name="bestTime" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        {/* A new picker after each save, so the last preview does not linger. */}
        <PhotoPicker key={state.saved ?? 0} />
        {showActive && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="h-4 w-4 rounded border-slate-300 accent-ocean-600" />
            Show on the Experiences page
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
    <form ref={formRef} action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-lg font-semibold text-slate-800">Add an experience</p>
      <Fields state={state} values={EMPTY} showActive={false} />
      <div className="flex items-center justify-end gap-3">
        {state.error && <p role="alert" className="text-sm font-medium text-red-600">{state.error}</p>}
        {state.saved && !state.error && <p role="status" className="text-sm font-medium text-emerald-700">Added.</p>}
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
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl bg-transparent p-0 text-left font-sans text-base font-normal normal-case tracking-normal backdrop:bg-ocean-900/60 backdrop:backdrop-blur-sm"
      >
        <form action={formAction} className="space-y-5 rounded-3xl bg-white p-6 shadow-2xl shadow-ocean-900/30 ring-1 ring-slate-200 sm:p-8">
          <h2 id={titleId} className="font-display text-xl font-semibold text-ocean-900">Edit experience</h2>
          <Fields state={state} values={values} showActive />
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
