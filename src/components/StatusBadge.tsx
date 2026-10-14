import type { BookingStatus, PaymentStatus } from '@prisma/client';

const BOOKING_STYLES: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-50 text-red-700 ring-red-200' },
};

const PAYMENT_STYLES: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: { label: 'Unpaid', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
  PARTIAL: { label: 'Part paid', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  PAID: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  REFUNDED: { label: 'Refunded', className: 'bg-ocean-50 text-ocean-700 ring-ocean-100' },
};

const BASE = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset';

// className: extra layout classes, e.g. to stretch the badge across a column.
export function BookingStatusBadge({ status, className = '' }: { status: BookingStatus; className?: string }) {
  const style = BOOKING_STYLES[status];
  return (
    <span className={`${BASE} ${style.className} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {style.label}
    </span>
  );
}

export function PaymentStatusBadge({ status, className = '' }: { status: PaymentStatus; className?: string }) {
  const style = PAYMENT_STYLES[status];
  return <span className={`${BASE} ${style.className} ${className}`}>{style.label}</span>;
}
