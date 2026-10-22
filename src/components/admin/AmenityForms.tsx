'use client';

import { useActionState, useState } from 'react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { addFacility, addFeature, type AmenityFormState } from '@/app/actions/amenities';
import { FALLBACK_FACILITY_ICON, POPULAR_FACILITY_ICONS, suggestFacilityIcon } from '@/lib/facility-icons';

const initialState: AmenityFormState = {};

const MAX_SEARCH_RESULTS = 30;

const inputClass =
  'block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors hover:border-slate-300 focus:border-ocean-500 focus:bg-white focus:ring-2 focus:ring-ocean-500/20 aria-[invalid=true]:border-red-400';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';
const errorClass = 'mt-1.5 text-xs text-red-600';
const buttonClass =
  'inline-flex h-[42px] items-center justify-center gap-1.5 rounded-xl bg-ocean-600 px-5 text-sm font-semibold text-white shadow-sm shadow-ocean-600/20 transition-colors hover:bg-ocean-700 disabled:cursor-not-allowed disabled:opacity-70';
const linkButtonClass = 'text-sm font-semibold';

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// The icon follows the name until the admin picks one by hand.
function useIconChoice(name: string) {
  // null = follow the name; a value = chosen by hand.
  const [chosenIcon, setChosenIcon] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const suggestedIcon = suggestFacilityIcon(name);
  const icon = chosenIcon ?? suggestedIcon ?? FALLBACK_FACILITY_ICON;

  let hint = 'Type a name and an icon is picked for you.';
  if (chosenIcon) hint = 'Chosen by you.';
  else if (suggestedIcon) hint = 'Suggested from the name.';
  else if (name.trim()) hint = 'No match for this name yet. Pick one below.';

  return { icon, hint, chosenIcon, setChosenIcon, showPicker, setShowPicker };
}

type IconChoice = ReturnType<typeof useIconChoice>;

function IconPreview({ icon }: { icon: string }) {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-ocean-50 text-ocean-700">
      <DynamicIcon key={icon} name={icon as IconName} className="h-7 w-7" strokeWidth={1.7} aria-hidden="true" />
    </span>
  );
}

function IconLinks({ choice }: { choice: IconChoice }) {
  return (
    <span className="flex flex-wrap gap-x-4 gap-y-1">
      <button
        type="button"
        onClick={() => choice.setShowPicker((open) => !open)}
        aria-expanded={choice.showPicker}
        className={`${linkButtonClass} text-ocean-600 hover:text-ocean-800`}
      >
        {choice.showPicker ? 'Hide icons' : 'Change icon'}
      </button>
      {choice.chosenIcon && (
        <button type="button" onClick={() => choice.setChosenIcon(null)} className={`${linkButtonClass} text-slate-500 hover:text-slate-700`}>
          Use automatic
        </button>
      )}
    </span>
  );
}

function IconTile({ icon, label, selected, onSelect }: { icon: string; label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex aspect-square items-center justify-center rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40 ${
        selected
          ? 'border-ocean-600 bg-ocean-600 text-white shadow-md shadow-ocean-600/25'
          : 'border-slate-200 bg-white text-slate-500 hover:border-ocean-400 hover:text-ocean-600'
      }`}
    >
      <DynamicIcon name={icon as IconName} className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
    </button>
  );
}

// The common icons as one-click tiles, plus a search over every Lucide icon.
function IconPicker({ choice, iconNames }: { choice: IconChoice; iconNames: string[] }) {
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase().replace(/\s+/g, '-');
  const searchResults = query ? iconNames.filter((iconName) => iconName.includes(query)).slice(0, MAX_SEARCH_RESULTS) : [];

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search all icons, e.g. umbrella, wine, yoga"
        aria-label="Search icons"
        className={inputClass}
      />

      {query && searchResults.length === 0 ? (
        <p className="px-1 py-2 text-sm text-slate-500">No icons match &quot;{search.trim()}&quot;. Try a simpler word.</p>
      ) : (
        <div className="grid grid-cols-6 gap-2">
          {(query ? searchResults.map((iconName) => ({ icon: iconName, label: iconName.replace(/-/g, ' ') })) : POPULAR_FACILITY_ICONS).map((item) => (
            <IconTile
              key={item.icon}
              icon={item.icon}
              label={item.label}
              selected={item.icon === choice.icon}
              onSelect={() => choice.setChosenIcon(item.icon)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type AmenityCopy = {
  // Prefix for input ids, so the two forms on the page do not clash.
  idPrefix: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
  submitLabel: string;
};

type AmenityFieldsProps = AmenityCopy & {
  state: AmenityFormState;
  isPending: boolean;
  // Every Lucide icon the site can render, sent from the server for the search box.
  iconNames: string[];
};

// Holds what the admin has typed. Remounted (emptied) after each successful save.
function AmenityFields({ state, isPending, iconNames, idPrefix, namePlaceholder, descriptionPlaceholder, submitLabel }: AmenityFieldsProps) {
  const [name, setName] = useState(state.values?.name ?? '');
  const [description, setDescription] = useState(state.values?.description ?? '');
  const choice = useIconChoice(name);

  return (
    <>
      <input type="hidden" name="icon" value={choice.icon} />

      <div>
        <label htmlFor={`${idPrefix}-name`} className={labelClass}>Name</label>
        <input
          id={`${idPrefix}-name`}
          name="name"
          maxLength={40}
          placeholder={namePlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={state.errors?.name ? true : undefined}
          className={inputClass}
        />
        {state.errors?.name && <p className={errorClass} role="alert">{state.errors.name[0]}</p>}
      </div>

      <div>
        <span className={labelClass}>Icon</span>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3">
          <IconPreview icon={choice.icon} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-600" aria-live="polite">{choice.hint}</p>
            <div className="mt-1">
              <IconLinks choice={choice} />
            </div>
          </div>
        </div>
        {state.errors?.icon && <p className={errorClass} role="alert">{state.errors.icon[0]}</p>}

        {choice.showPicker && (
          <div className="mt-3">
            <IconPicker choice={choice} iconNames={iconNames} />
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-description`} className={labelClass}>Description</label>
        <textarea
          id={`${idPrefix}-description`}
          name="description"
          rows={3}
          maxLength={200}
          placeholder={descriptionPlaceholder}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={state.errors?.description ? true : undefined}
          className={inputClass}
        />
        {state.errors?.description && <p className={errorClass} role="alert">{state.errors.description[0]}</p>}
      </div>

      <button disabled={isPending} className={`${buttonClass} w-full`}>
        <PlusIcon />
        {isPending ? 'Adding...' : submitLabel}
      </button>
    </>
  );
}

const FEATURE_COPY: AmenityCopy = {
  idPrefix: 'feature',
  namePlaceholder: 'e.g. Balcony, Sofa, Bedroom',
  descriptionPlaceholder: 'e.g. Private balcony with two chairs and a sea view.',
  submitLabel: 'Add feature',
};

const FACILITY_COPY: AmenityCopy = {
  idPrefix: 'facility',
  namePlaceholder: 'e.g. WiFi, Spa, Swimming Pool',
  descriptionPlaceholder: 'e.g. High-speed WiFi in every room and all public areas.',
  submitLabel: 'Add facility',
};

export function FeatureForm({ iconNames }: { iconNames: string[] }) {
  const [state, formAction, isPending] = useActionState(addFeature, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <AmenityFields key={state.savedAt ?? 'draft'} state={state} isPending={isPending} iconNames={iconNames} {...FEATURE_COPY} />
    </form>
  );
}

export function FacilityForm({ iconNames }: { iconNames: string[] }) {
  const [state, formAction, isPending] = useActionState(addFacility, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <AmenityFields key={state.savedAt ?? 'draft'} state={state} isPending={isPending} iconNames={iconNames} {...FACILITY_COPY} />
    </form>
  );
}
