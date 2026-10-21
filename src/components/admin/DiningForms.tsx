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

function FieldError({ state, name }: { state: DiningFormState; name: string }) {
  const error = state.errors?.[name]?.[0];
  return error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null;
}

function Feedback({ state, savedText }: { state: DiningFormState; savedText: string }) {
  if (state.error) return <p role="alert" className="text-sm font-medium text-red-600">{state.error}</p>;
  if (state.saved) return <p role="status" className="text-sm font-medium text-emerald-700">{savedText}</p>;
  return null;
}

type ServiceValues = { title: string; tagline: string; hours: string; description: string; isAvailable: boolean; imageUrl: string | null };

// A meal's details: title, hours, description, photo and whether it is served at the moment.
export function MealServiceForm({ action, values }: { action: FormAction; values: ServiceValues }) {
  const [state, formAction, saving] = useActionState(action, initialState);
  const [preview, setPreview] = useState<string | null>(null);
  const [available, setAvailable] = useState(values.isAvailable);
  const id = useId();

  // The preview holds the chosen file in memory until it is released.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const photo = preview ?? values.imageUrl;

  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-[14rem_1fr]">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element -- also shows a local preview, which the image optimizer cannot */}
          {photo && <img src={photo} alt="" className="h-full w-full object-cover" />}
          {!values.imageUrl && !preview && <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">No photo</span>}
        </div>
        <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-ocean-600 hover:text-ocean-700">
          {preview ? 'Choose another photo' : 'Replace photo'}
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
        </label>
        <FieldError state={state} name="photo" />
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor={`${id}-title`}>Title</label>
            <input id={`${id}-title`} name="title" defaultValue={values.title} required maxLength={40} className={fieldClass} />
            <FieldError state={state} name="title" />
          </div>
          <div>
            <label className={labelClass} htmlFor={`${id}-hours`}>Hours</label>
            <input id={`${id}-hours`} name="hours" defaultValue={values.hours} required maxLength={40} placeholder="7:00 – 10:30 am" className={fieldClass} />
            <FieldError state={state} name="hours" />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor={`${id}-tagline`}>
            Tagline <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input id={`${id}-tagline`} name="tagline" defaultValue={values.tagline} maxLength={80} className={fieldClass} />
          <FieldError state={state} name="tagline" />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${id}-description`}>Description</label>
          <textarea id={`${id}-description`} name="description" rows={3} defaultValue={values.description} required maxLength={600} className={fieldClass} />
          <FieldError state={state} name="description" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
            <input type="checkbox" name="isAvailable" checked={available} onChange={(event) => setAvailable(event.target.checked)} className="peer sr-only" role="switch" />
            <span
              className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-emerald-500 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-ocean-500 peer-focus-visible:ring-offset-2"
              aria-hidden="true"
            />
            {available ? 'Served at the moment' : 'Not served at the moment'}
          </label>
          <div className="flex items-center gap-3">
            <Feedback state={state} savedText="Saved." />
            <button type="submit" disabled={saving} className={primaryClass}>
              {saving ? 'Saving…' : 'Save details'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

type ItemValues = { name: string; description: string; price: string; isVegetarian: boolean; isSpicy: boolean };

const EMPTY_ITEM: ItemValues = { name: '', description: '', price: '', isVegetarian: false, isSpicy: false };

// The dish fields, shared by "Add dish" and the edit window.
function ItemFields({ state, values }: { state: DiningFormState; values: ItemValues }) {
  const id = useId();
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
      <div>
        <label className="sr-only" htmlFor={`${id}-name`}>Dish name</label>
        <input id={`${id}-name`} name="name" defaultValue={values.name} required maxLength={80} placeholder="Dish name" className={fieldClass} />
        <FieldError state={state} name="name" />
      </div>
      <div>
        <label className="sr-only" htmlFor={`${id}-price`}>Price in LKR</label>
        <input id={`${id}-price`} name="price" type="number" min="1" step="1" defaultValue={values.price} placeholder="Price (LKR)" className={fieldClass} />
        <FieldError state={state} name="price" />
      </div>
      <div className="sm:col-span-2">
        <label className="sr-only" htmlFor={`${id}-description`}>Description</label>
        <input id={`${id}-description`} name="description" defaultValue={values.description} maxLength={200} placeholder="Short description (optional)" className={fieldClass} />
        <FieldError state={state} name="description" />
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-700 sm:col-span-2">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="isVegetarian" defaultChecked={values.isVegetarian} className="h-4 w-4 rounded border-slate-300 accent-emerald-600" />
          Vegetarian
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="isSpicy" defaultChecked={values.isSpicy} className="h-4 w-4 rounded border-slate-300 accent-red-600" />
          Spicy
        </label>
        <span className="text-xs text-slate-400">Leave the price empty when it is included.</span>
      </div>
    </div>
  );
}

export function AddMenuItemForm({ action }: { action: FormAction }) {
  const [state, formAction, saving] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // A fresh form for the next dish.
  useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state.saved]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-2xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">Add a dish</p>
      <ItemFields state={state} values={EMPTY_ITEM} />
      <div className="flex items-center justify-end gap-3">
        <Feedback state={state} savedText="Dish added." />
        <button type="submit" disabled={saving} className={primaryClass}>
          {saving ? 'Adding…' : '+ Add dish'}
        </button>
      </div>
    </form>
  );
}

// "Edit" next to a dish: a small window with its fields. It closes once saved.
export function EditMenuItemButton({ action, values }: { action: FormAction; values: ItemValues }) {
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
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl bg-transparent p-0 text-left font-sans text-base font-normal normal-case tracking-normal backdrop:bg-ocean-900/60 backdrop:backdrop-blur-sm"
      >
        <form action={formAction} className="space-y-4 rounded-3xl bg-white p-6 shadow-2xl shadow-ocean-900/30 ring-1 ring-slate-200 sm:p-8">
          <h2 id={titleId} className="font-display text-xl font-semibold text-ocean-900">Edit dish</h2>
          <ItemFields state={state} values={values} />
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
              {saving ? 'Saving…' : 'Save dish'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
