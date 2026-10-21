// Booking rules shared by the server and the booking form. No database access in this file.

export const MEAL_PLANS = {
  ROOM_ONLY: { label: 'Room Only', pricePerGuestNight: 0 },
  BED_AND_BREAKFAST: { label: 'Breakfast', pricePerGuestNight: 1500 },
  HALF_BOARD: { label: 'Half Board', pricePerGuestNight: 3500 },
  FULL_BOARD: { label: 'Full Board', pricePerGuestNight: 5500 },
} as const;

export type MealPlanKey = keyof typeof MEAL_PLANS;

export const MEAL_PLAN_KEYS = Object.keys(MEAL_PLANS) as MealPlanKey[];

// The meals each plan includes; the guest can pick a dish from the Dining menu for each.
export const MEAL_PLAN_MEALS: Record<MealPlanKey, ('BREAKFAST' | 'LUNCH' | 'DINNER')[]> = {
  ROOM_ONLY: [],
  BED_AND_BREAKFAST: ['BREAKFAST'],
  HALF_BOARD: ['BREAKFAST', 'DINNER'],
  FULL_BOARD: ['BREAKFAST', 'LUNCH', 'DINNER'],
};

export const MEAL_NAMES = { BREAKFAST: 'Breakfast', LUNCH: 'Lunch', DINNER: 'Dinner' } as const;

export const MAX_NIGHTS = 30;

const HOTEL_TIME_ZONE = 'Asia/Colombo';
const DAY_MS = 24 * 60 * 60 * 1000;

export function formatLKR(amount: number) {
  return `LKR ${Math.round(amount).toLocaleString('en-US')}`;
}

// Stay dates are plain calendar days, stored as midnight UTC so they never shift with time zones.
export function parseDateOnly(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || toDateOnly(date) !== value) return null;
  return date;
}

export function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function todayDateOnly() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: HOTEL_TIME_ZONE }).format(new Date());
}

export function addDays(dateOnly: string, days: number) {
  const date = parseDateOnly(dateOnly);
  return date ? toDateOnly(new Date(date.getTime() + days * DAY_MS)) : dateOnly;
}

export function nightsBetween(checkIn: Date, checkOut: Date) {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
}

export function formatStayDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function guestSummary(adults: number, children: number) {
  const parts = [`${adults} ${adults === 1 ? 'Adult' : 'Adults'}`];
  if (children > 0) parts.push(`${children} ${children === 1 ? 'Child' : 'Children'}`);
  return parts.join(' · ');
}

type StayCheck = { ok: true; checkIn: Date; checkOut: Date; nights: number } | { ok: false; message: string };

export function validateStay(checkInValue: unknown, checkOutValue: unknown): StayCheck {
  const checkIn = parseDateOnly(checkInValue);
  const checkOut = parseDateOnly(checkOutValue);

  if (!checkIn || !checkOut) return { ok: false, message: 'Provide check-in and check-out dates.' };
  if (toDateOnly(checkIn) < todayDateOnly()) return { ok: false, message: 'Check-in cannot be in the past.' };

  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return { ok: false, message: 'Check-out must be after check-in.' };
  if (nights > MAX_NIGHTS) return { ok: false, message: `Stays are limited to ${MAX_NIGHTS} nights.` };

  return { ok: true, checkIn, checkOut, nights };
}

type QuoteInput = {
  pricePerNight: number;
  nights: number;
  adults: number;
  children: number;
  mealPlan: MealPlanKey;
  // Price per guest of the dish chosen for an included meal. A meal with no priced dish costs its share of the plan.
  dishPrices?: Partial<Record<'BREAKFAST' | 'LUNCH' | 'DINNER', number | null>>;
};

// What meals cost per guest per night: the plan price, with each chosen dish's own price
// taking the place of that meal's share of the plan (e.g. Half Board 3,500 = 1,750 per meal).
export function mealPricePerGuestNight(mealPlan: MealPlanKey, dishPrices: QuoteInput['dishPrices'] = {}) {
  const meals = MEAL_PLAN_MEALS[mealPlan];
  const planPrice = MEAL_PLANS[mealPlan].pricePerGuestNight;
  if (meals.length === 0) return planPrice;
  const share = planPrice / meals.length;
  return meals.reduce((sum, meal) => {
    const dishPrice = dishPrices[meal];
    return sum + (typeof dishPrice === 'number' && dishPrice > 0 ? dishPrice : share);
  }, 0);
}

export function quoteBooking({ pricePerNight, nights, adults, children, mealPlan, dishPrices }: QuoteInput) {
  const roomTotal = pricePerNight * nights;
  const mealTotal = Math.round(mealPricePerGuestNight(mealPlan, dishPrices) * (adults + children) * nights);
  return { roomTotal, mealTotal, total: roomTotal + mealTotal };
}

// Guests can cancel up to the day before check-in.
export function isCancellable(booking: { bookingStatus: string; checkIn: Date }) {
  return booking.bookingStatus !== 'CANCELLED' && toDateOnly(booking.checkIn) > todayDateOnly();
}
