'use client';

import { useActionState, useState } from 'react';
import { updateSettings, type SettingsFormState } from '@/app/actions/settings';
import { mapSearchUrl } from '@/lib/map';

type SettingsValues = {
  address: string;
  googleMap: string;
  phone: string;
  email: string;
  whatsapp: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  tripadvisorUrl: string;
  bookingsPaused: boolean;
  bookingsPausedMessage: string;
  isMaintenance: boolean;
  maintenanceMessage: string;
};

const initialState: SettingsFormState = {};

const cardClass = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm';
const fieldClass =
  'block h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

function FieldError({ state, name }: { state: SettingsFormState; name: string }) {
  const error = state.errors?.[name]?.[0];
  return error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null;
}

function CardTitle({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500">{text}</p>
    </div>
  );
}

// A switch row: an icon, what it does, an on/off pill, and a message shown to visitors while it is on.
function StatusSwitch({
  name,
  title,
  text,
  onLabel,
  icon,
  checked,
  onChange,
  messageName,
  messageLabel,
  message,
  placeholder,
  state,
}: {
  name: string;
  title: string;
  text: string;
  onLabel: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
  messageName: string;
  messageLabel: string;
  message: string;
  placeholder: string;
  state: SettingsFormState;
}) {
  return (
    <div className={`flex flex-col rounded-2xl border p-5 transition-colors ${checked ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <label className="flex cursor-pointer items-start gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${checked ? 'bg-white text-amber-700' : 'bg-ocean-50 text-ocean-700'}`}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {icon}
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-800">{title}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                checked ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              }`}
            >
              {checked ? onLabel : 'Off'}
            </span>
          </span>
          <span className="mt-1 block text-sm text-slate-500">{text}</span>
        </span>
        {/* The switch itself */}
        <input type="checkbox" name={name} checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" role="switch" />
        <span
          className="relative mt-1 h-7 w-12 shrink-0 rounded-full bg-slate-300 transition-colors after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-amber-500 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-ocean-500 peer-focus-visible:ring-offset-2"
          aria-hidden="true"
        />
      </label>

      <div className="mt-4 flex flex-1 flex-col justify-end sm:pl-[3.75rem]">
        <label className={labelClass} htmlFor={messageName}>
          {messageLabel} <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id={messageName}
          name={messageName}
          rows={2}
          maxLength={300}
          defaultValue={message}
          placeholder={placeholder}
          className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20"
        />
        <FieldError state={state} name={messageName} />
      </div>
    </div>
  );
}

const SOCIAL_FIELDS: { name: keyof SettingsValues; label: string; placeholder: string; icon: React.ReactNode }[] = [
  {
    name: 'facebookUrl',
    label: 'Facebook',
    placeholder: 'https://facebook.com/n34mirissa',
    icon: <path fill="currentColor" stroke="none" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.7V21h2.8z" />,
  },
  {
    name: 'instagramUrl',
    label: 'Instagram',
    placeholder: 'https://instagram.com/n34mirissa',
    icon: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.2 6.8h.01" />
      </>
    ),
  },
  { name: 'tiktokUrl', label: 'TikTok', placeholder: 'https://tiktok.com/@n34mirissa', icon: <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.6 2.2 4.4 5 4.6" /> },
  {
    name: 'youtubeUrl',
    label: 'YouTube',
    placeholder: 'https://youtube.com/@n34mirissa',
    icon: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path fill="currentColor" stroke="none" d="M10 9.2v5.6l4.8-2.8z" />
      </>
    ),
  },
  {
    name: 'tripadvisorUrl',
    label: 'Tripadvisor',
    placeholder: 'https://tripadvisor.com/…',
    icon: (
      <>
        <circle cx="7" cy="13.5" r="3.5" />
        <circle cx="17" cy="13.5" r="3.5" />
        <path d="M3.5 10a12 12 0 0 1 17 0" />
      </>
    ),
  },
  {
    name: 'whatsapp',
    label: 'WhatsApp number',
    placeholder: '+94 77 123 4567',
    icon: <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1L4 20z" />,
  },
];

export default function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, formAction, saving] = useActionState(updateSettings, initialState);
  const [bookingsPaused, setBookingsPaused] = useState(values.bookingsPaused);
  const [maintenance, setMaintenance] = useState(values.isMaintenance);

  return (
    <form action={formAction} className="space-y-6">
      {/* Site status */}
      <section className={cardClass}>
        <CardTitle title="Site status" text="Take online booking or the whole public website offline for a while." />
        <div className="grid gap-4 lg:grid-cols-2">
          <StatusSwitch
            name="bookingsPaused"
            title="Pause online booking"
            text="Guests can still browse the website, but cannot book a room online. Walk-in bookings at the desk still work."
            onLabel="Paused"
            icon={
              <>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18M10 14v4M14 14v4" />
              </>
            }
            checked={bookingsPaused}
            onChange={setBookingsPaused}
            messageName="bookingsPausedMessage"
            messageLabel="Message to guests"
            message={values.bookingsPausedMessage}
            placeholder="Online booking is paused for a short while. Please call or message us and we will book your stay."
            state={state}
          />
          <StatusSwitch
            name="isMaintenance"
            title="Maintenance mode"
            text="Visitors see a “We’ll be back soon” page instead of the website. Admins can still use the site and this panel."
            onLabel="Website offline"
            icon={<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z" />}
            checked={maintenance}
            onChange={setMaintenance}
            messageName="maintenanceMessage"
            messageLabel="Message to visitors"
            message={values.maintenanceMessage}
            placeholder="We are making a few improvements to our website. Please check back soon, or contact us directly."
            state={state}
          />
        </div>
      </section>

      {/* Contact and social side by side on wide screens */}
      <div className="grid items-start gap-6 xl:grid-cols-2">
      {/* Contact */}
      <section className={cardClass}>
        <CardTitle title="Contact information" text="Shown on the Contact page, in the footer, on receipts and in emails." />
        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={values.address}
              required
              className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20"
            />
            <FieldError state={state} name="address" />
          </div>
          <div>
            <label className={labelClass} htmlFor="googleMap">Map location</label>
            <input
              id="googleMap"
              name="googleMap"
              defaultValue={values.googleMap}
              placeholder="5.9483, 80.4716"
              className={fieldClass}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Paste the hotel&apos;s coordinates or a Google Maps link. Leave empty to use the address.
              {values.googleMap && (
                <>
                  {' '}
                  <a
                    href={mapSearchUrl(values.googleMap)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ocean-600 hover:underline"
                  >
                    Preview on Google Maps ↗
                  </a>
                </>
              )}
            </p>
            <FieldError state={state} name="googleMap" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="phone">Phone</label>
              <input id="phone" name="phone" type="tel" defaultValue={values.phone} required className={fieldClass} />
              <FieldError state={state} name="phone" />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">Email</label>
              <input id="email" name="email" type="email" defaultValue={values.email} required className={fieldClass} />
              <FieldError state={state} name="email" />
            </div>
          </div>
        </div>
      </section>

      {/* Social */}
      <section className={cardClass}>
        <CardTitle title="Social media" text="Icons appear on the Contact page and in the footer. Leave a box empty to hide that icon." />
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.name}>
              <label className={labelClass} htmlFor={field.name}>{field.label}</label>
              <div className="relative">
                <svg
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {field.icon}
                </svg>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.name === 'whatsapp' ? 'tel' : 'url'}
                  defaultValue={String(values[field.name] ?? '')}
                  placeholder={field.placeholder}
                  className={`${fieldClass} pl-10`}
                />
              </div>
              <FieldError state={state} name={field.name} />
            </div>
          ))}
        </div>
      </section>

      </div>

      {/* Save bar */}
      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 px-5 py-4 shadow-lg shadow-ocean-900/5 backdrop-blur">
        {state.message && !state.saved && (
          <p role="alert" className="mr-auto text-sm font-medium text-red-600">
            {state.message}
          </p>
        )}
        {state.saved && (
          <p role="status" className="mr-auto flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Saved. Changes show on the website within a few seconds.
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="h-11 rounded-xl bg-ocean-600 px-6 text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
