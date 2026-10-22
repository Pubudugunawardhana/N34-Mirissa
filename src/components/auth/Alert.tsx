const VARIANTS = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-ocean-100 bg-ocean-50 text-ocean-800',
};

type AlertProps = {
  variant?: keyof typeof VARIANTS;
  children: React.ReactNode;
};

export default function Alert({ variant = 'error', children }: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${VARIANTS[variant]}`}
    >
      {children}
    </div>
  );
}
