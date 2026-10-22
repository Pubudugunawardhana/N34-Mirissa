'use client';

import { useState } from 'react';
import { FieldError, inputClass } from './Field';

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'id' | 'type'> & {
  id: string;
  label: string;
  error?: string;
  labelAction?: React.ReactNode;
  showStrength?: boolean;
};

const STRENGTH = [
  { label: 'Too short', bar: 'bg-slate-200', text: 'text-slate-500' },
  { label: 'Weak', bar: 'bg-red-500', text: 'text-red-600' },
  { label: 'Fair', bar: 'bg-sand-500', text: 'text-sand-600' },
  { label: 'Good', bar: 'bg-ocean-500', text: 'text-ocean-600' },
  { label: 'Strong', bar: 'bg-green-500', text: 'text-green-600' },
];

function scorePassword(password: string) {
  if (password.length < 8) return 0;

  let score = 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[A-Za-z]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++;
  return score;
}

export default function PasswordInput({
  id,
  label,
  error,
  labelAction,
  showStrength = false,
  className,
  onChange,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState('');

  const score = scorePassword(value);
  const strength = STRENGTH[score];

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass} pr-12 ${className ?? ''}`}
          onChange={(event) => {
            setValue(event.target.value);
            onChange?.(event);
          }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-ocean-600 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {visible ? (
              <>
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.4 5.2A9.7 9.7 0 0 1 12 5c5 0 8.5 4.2 9.5 7a11.6 11.6 0 0 1-3 4.3M6.3 6.3A11.8 11.8 0 0 0 2.5 12c1 2.8 4.5 7 9.5 7 1.4 0 2.7-.3 3.9-.9" />
              </>
            ) : (
              <>
                <path d="M2.5 12C3.5 9.2 7 5 12 5s8.5 4.2 9.5 7c-1 2.8-4.5 7-9.5 7s-8.5-4.2-9.5-7z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="mt-2" aria-live="polite">
          <div className="flex gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors ${step <= score ? strength.bar : 'bg-slate-200'}`}
              />
            ))}
          </div>
          <p className={`mt-1 text-xs ${strength.text}`}>Password strength: {strength.label}</p>
        </div>
      )}

      <FieldError id={id} error={error} />
    </div>
  );
}
