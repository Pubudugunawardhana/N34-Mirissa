export const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/30 aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-400/30';

type FieldProps = Omit<React.ComponentProps<'input'>, 'id'> & {
  id: string;
  label: string;
  error?: string;
  labelAction?: React.ReactNode;
};

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
      {error}
    </p>
  );
}

export default function Field({ id, label, error, labelAction, className, ...props }: FieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        {labelAction}
      </div>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass} ${className ?? ''}`}
        {...props}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}
