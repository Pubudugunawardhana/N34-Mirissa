'use client';

import { useActionState, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { saveRoom, type RoomFormState } from '@/app/actions/rooms';
import Alert from '@/components/auth/Alert';
import Field, { FieldError, inputClass } from '@/components/auth/Field';
import SubmitButton from '@/components/auth/SubmitButton';

type Option = { id: string; name: string };

type RoomFormProps = {
  room?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    area: number;
    quantity: number;
    roomNumbers: string[];
    maxAdults: number;
    maxChildren: number;
    isActive: boolean;
    images: { id: string; url: string }[];
    featureIds: string[];
    facilityIds: string[];
  };
  features: Option[];
  facilities: Option[];
};

const initialState: RoomFormState = {};

const sectionTitleClass = 'text-sm font-semibold uppercase tracking-[0.15em] text-ocean-900';
const checkboxClass = 'h-4 w-4 rounded border-slate-300 accent-ocean-600';

function CheckboxGroup({ name, options, selected, emptyHint }: { name: string; options: Option[]; selected: string[]; emptyHint: string }) {
  if (options.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {emptyHint}{' '}
        <Link href="/admin/amenities" className="font-medium text-ocean-600 hover:underline">
          Add some first
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
      {options.map((option) => (
        <label key={option.id} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
          <input type="checkbox" name={name} value={option.id} defaultChecked={selected.includes(option.id)} className={checkboxClass} />
          {option.name}
        </label>
      ))}
    </div>
  );
}

export default function RoomForm({ room, features, facilities }: RoomFormProps) {
  const [state, formAction, isPending] = useActionState(saveRoom, initialState);
  const [previews, setPreviews] = useState<string[]>([]);

  // Preview URLs hold the files in memory until they are released.
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const value = (field: 'name' | 'description' | 'price' | 'area' | 'quantity' | 'maxAdults' | 'maxChildren') =>
    state.values?.[field] ?? (room?.[field] != null ? String(room[field]) : '');
  const roomNumbers = state.values?.roomNumbers ?? room?.roomNumbers.join(', ') ?? '';

  return (
    <form action={formAction} className="space-y-6">
      {room && <input type="hidden" name="id" value={room.id} />}

      {state.message && <Alert>{state.message}</Alert>}

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={sectionTitleClass}>Room details</h2>

        <Field id="name" name="name" label="Room name" placeholder="e.g. Ocean View Suite" defaultValue={value('name')} error={state.errors?.name?.[0]} required />

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Describe the room, its view and what makes it special..."
            defaultValue={value('description')}
            className={inputClass}
          />
          <FieldError id="description" error={state.errors?.description?.[0]} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="price" name="price" type="number" min="1" step="1" label="Price per night (LKR)" placeholder="15000" defaultValue={value('price')} error={state.errors?.price?.[0]} required />
          <Field id="area" name="area" type="number" min="1" step="1" label="Area (sq ft)" placeholder="450" defaultValue={value('area')} error={state.errors?.area?.[0]} required />
          <Field id="quantity" name="quantity" type="number" min="1" step="1" label="Quantity (rooms of this type)" placeholder="5" defaultValue={value('quantity')} error={state.errors?.quantity?.[0]} required />
        </div>

        <div>
          <label htmlFor="roomNumbers" className="mb-1.5 block text-sm font-medium text-slate-700">Room numbers</label>
          <input
            id="roomNumbers"
            name="roomNumbers"
            placeholder="e.g. 101, 102, 103"
            autoComplete="off"
            defaultValue={roomNumbers}
            aria-describedby={state.errors?.roomNumbers ? 'roomNumbers-hint roomNumbers-error' : 'roomNumbers-hint'}
            aria-invalid={state.errors?.roomNumbers ? true : undefined}
            className={inputClass}
          />
          <p id="roomNumbers-hint" className="mt-1.5 text-xs text-slate-500">
            Separate with commas or spaces. When filled, Quantity becomes the number of rooms listed, and the admin can pick a free room when confirming a booking.
          </p>
          <FieldError id="roomNumbers" error={state.errors?.roomNumbers?.[0]} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field id="maxAdults" name="maxAdults" type="number" min="1" step="1" label="Max adults" placeholder="2" defaultValue={value('maxAdults')} error={state.errors?.maxAdults?.[0]} required />
          <Field id="maxChildren" name="maxChildren" type="number" min="0" step="1" label="Max children" placeholder="1" defaultValue={value('maxChildren')} error={state.errors?.maxChildren?.[0]} required />
          <p className="self-end pb-3 text-xs text-slate-500">Capacity is saved as adults + children.</p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4">
          <input type="checkbox" name="isActive" defaultChecked={room ? room.isActive : true} className={`mt-0.5 ${checkboxClass}`} />
          <span>
            <span className="block text-sm font-medium text-slate-800">Available for booking</span>
            <span className="block text-xs text-slate-500">Untick to hide this room from guests without deleting it.</span>
          </span>
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className={sectionTitleClass}>Photos</h2>

        {room && room.images.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-slate-600">Current photos. Tick the ones to remove.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {room.images.map((image, index) => (
                <label key={image.id} className="group relative block aspect-[4/3] cursor-pointer overflow-hidden rounded-xl bg-slate-100">
                  <Image src={image.url} alt="" fill sizes="200px" className="object-cover transition-opacity group-has-[:checked]:opacity-30" />
                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ocean-800">Cover</span>
                  )}
                  <span className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-red-600 shadow-sm">
                    <input type="checkbox" name="removeImageIds" value={image.id} className="h-3.5 w-3.5 accent-red-600" />
                    Remove
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="images" className="mb-1.5 block text-sm font-medium text-slate-700">
            {room ? 'Add photos' : 'Upload photos'}
          </label>
          <input
            id="images"
            name="images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(event) => setPreviews(Array.from(event.target.files ?? []).map((file) => URL.createObjectURL(file)))}
            className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-ocean-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-ocean-700"
          />
          <p className="mt-1.5 text-xs text-slate-500">JPEG, PNG or WebP, up to 5 MB each, 8 photos per room. The first photo is the cover.</p>
          <FieldError id="images" error={state.errors?.images?.[0]} />
        </div>

        {previews.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previews.map((url) => (
              // Local blob previews cannot go through the image optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <h2 className={sectionTitleClass}>Features</h2>
          <CheckboxGroup name="featureIds" options={features} selected={room?.featureIds ?? []} emptyHint="No features yet." />
        </div>
        <div className="space-y-3 border-t border-slate-100 pt-6">
          <h2 className={sectionTitleClass}>Facilities</h2>
          <CheckboxGroup name="facilityIds" options={facilities} selected={room?.facilityIds ?? []} emptyHint="No facilities yet." />
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Link href="/admin/rooms" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
          Cancel
        </Link>
        <div className="w-44">
          <SubmitButton pending={isPending} pendingLabel="Saving...">
            {room ? 'Save changes' : 'Create room'}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
