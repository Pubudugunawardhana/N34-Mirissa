'use client';

import { useActionState, useState } from 'react';
import {
  cancelEmailChange,
  changePassword,
  removeAvatar,
  resendEmailChange,
  updateAvatar,
  updateProfile,
  type ProfileFormState,
} from '@/app/actions/profile';
import Alert from '@/components/auth/Alert';
import Field from '@/components/auth/Field';
import PasswordInput from '@/components/auth/PasswordInput';
import SubmitButton from '@/components/auth/SubmitButton';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import UserAvatar from '@/components/UserAvatar';

const initialState: ProfileFormState = {};

const cardClass = 'rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8';

function CardHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-xl font-semibold text-ocean-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

// Errors need attention (red); a saved change is good news (green).
function Result({ state }: { state: ProfileFormState }) {
  if (!state.message) return null;
  return <Alert variant={state.savedAt ? 'success' : 'error'}>{state.message}</Alert>;
}

// Shown while a new email address is waiting for its verification link to be opened.
function PendingEmailNotice({ pendingEmail }: { pendingEmail: string }) {
  const [state, resendAction, isResending] = useActionState(resendEmailChange, initialState);

  return (
    <div className="mb-6 rounded-2xl border border-ocean-100 bg-ocean-50 p-4 text-sm text-ocean-800">
      <p>
        We sent a verification link to <strong className="break-all">{pendingEmail}</strong>. Your email changes once you
        open it. Until then you keep signing in with your current email.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-semibold">
        <form action={resendAction}>
          <button disabled={isResending} className="text-ocean-700 hover:underline disabled:opacity-60">
            {isResending ? 'Sending...' : 'Resend link'}
          </button>
        </form>
        <form action={cancelEmailChange}>
          <button className="text-slate-600 hover:underline">Cancel change</button>
        </form>
      </div>
      {state.message && (
        <p className="mt-2 text-xs" aria-live="polite">{state.message}</p>
      )}
    </div>
  );
}

type DetailsFormProps = {
  user: { name: string; phone: string; email: string; pendingEmail: string | null };
};

export function DetailsForm({ user }: DetailsFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);

  // Controlled, so nothing typed is lost when the server sends back an error.
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);

  // After a save the email box goes back to the current address: a requested change is shown in the notice instead.
  const [lastSavedAt, setLastSavedAt] = useState(state.savedAt);
  if (state.savedAt !== lastSavedAt) {
    setLastSavedAt(state.savedAt);
    setEmail(user.email);
  }

  const emailChanged = email.trim().toLowerCase() !== user.email.toLowerCase();

  return (
    <div className={cardClass}>
      <CardHeading title="Personal details" hint="Used to fill in your bookings and to contact you about your stay." />

      {user.pendingEmail && <PendingEmailNotice pendingEmail={user.pendingEmail} />}

      <form action={formAction} className="space-y-5" noValidate>
        <Result state={state} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="profile-name"
            name="name"
            label="Name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={state.errors?.name?.[0]}
            required
          />
          <Field
            id="profile-phone"
            name="phone"
            type="tel"
            label="Phone number"
            autoComplete="tel"
            placeholder="071 234 5678"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            error={state.errors?.phone?.[0]}
          />
        </div>

        <Field
          id="profile-email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={state.errors?.email?.[0]}
          required
        />

        {emailChanged && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-3 text-sm text-slate-600">
              You sign in with your email, so changing it needs your password.
            </p>
            {/* Remounted when the form is saved, so the password box is emptied. */}
            <PasswordInput
              key={state.savedAt ?? 'draft'}
              id="profile-current-password"
              name="currentPassword"
              label="Current password"
              autoComplete="current-password"
              error={state.errors?.currentPassword?.[0]}
              required
            />
          </div>
        )}

        <div className="flex justify-end">
          <div className="w-full sm:w-48">
            <SubmitButton pending={isPending} pendingLabel="Saving...">
              Save changes
            </SubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className={cardClass} noValidate>
      <CardHeading title="Password" hint="At least 8 characters, with a letter and a number." />

      {/* The fields are remounted after a successful change, which empties them. */}
      <div key={state.savedAt ?? 'draft'} className="space-y-5">
        <Result state={state} />

        <PasswordInput
          id="current-password"
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
          error={state.errors?.currentPassword?.[0]}
          required
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordInput
            id="new-password"
            name="password"
            label="New password"
            autoComplete="new-password"
            error={state.errors?.password?.[0]}
            showStrength
            required
          />
          <PasswordInput
            id="confirm-new-password"
            name="confirmPassword"
            label="Confirm new password"
            autoComplete="new-password"
            error={state.errors?.confirmPassword?.[0]}
            required
          />
        </div>

        <div className="flex justify-end">
          <div className="w-full sm:w-48">
            <SubmitButton pending={isPending} pendingLabel="Saving...">
              Change password
            </SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}

export function AvatarForm({ name, image }: { name: string; image: string | null }) {
  const [state, uploadAction, isUploading] = useActionState(updateAvatar, initialState);

  return (
    <div className={cardClass}>
      <CardHeading title="Profile photo" hint="Shown on your account and in the menu. JPEG, PNG or WebP, up to 5 MB." />

      <div className="flex flex-wrap items-center gap-6">
        <UserAvatar name={name} image={image} pixels={192} className="h-24 w-24 text-4xl ring-4 ring-ocean-50" />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Choosing a file sends the form straight away; there is nothing else to fill in. */}
            <form action={uploadAction}>
              <label
                className={`relative inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-ocean-600 px-5 text-sm font-semibold text-white shadow-md shadow-ocean-600/20 transition-colors hover:bg-ocean-700 focus-within:ring-2 focus-within:ring-ocean-500 focus-within:ring-offset-2 ${
                  isUploading ? 'pointer-events-none opacity-70' : ''
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
                </svg>
                {isUploading ? 'Uploading...' : image ? 'Change photo' : 'Upload photo'}
                <input
                  type="file"
                  name="photo"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={(event) => {
                    if (event.target.files?.length) event.target.form?.requestSubmit();
                  }}
                />
              </label>
            </form>

            {image && (
              <form action={removeAvatar}>
                <ConfirmSubmitButton
                  title="Remove your photo?"
                  confirmLabel="Remove photo"
                  cancelLabel="Keep photo"
                  confirmMessage="Your initial will be shown instead. You can upload a new photo at any time."
                  className="h-11 rounded-xl px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  Remove
                </ConfirmSubmitButton>
              </form>
            )}
          </div>

          {state.message && (
            <p className={`text-sm ${state.savedAt ? 'text-emerald-700' : 'text-red-600'}`} role={state.savedAt ? 'status' : 'alert'}>
              {state.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
