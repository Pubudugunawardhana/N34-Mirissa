import { z } from 'zod';
import { parseDateOnly, todayDateOnly } from '@/lib/booking';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Please enter a valid email address'));

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password must be 72 characters or fewer')
  .regex(/[A-Za-z]/, 'Password must include at least one letter')
  .regex(/[0-9]/, 'Password must include at least one number');

export const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters long').max(80, 'Name is too long');

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 -]{7,17}$/, 'Please enter a valid phone number');

export const RegisterSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const LoginSchema = z.object({
  // Not checked as an email address: the default admin account signs in as plain "admin".
  email: z.string().trim().toLowerCase().min(1, 'Please enter your email'),
  password: z.string().min(1, 'Please enter your password'),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const RoomSchema = z.object({
  name: z.string().trim().min(2, 'Room name must be at least 2 characters long').max(80, 'Room name is too long'),
  description: z.string().trim().max(2000, 'Description is too long'),
  price: z.coerce.number('Enter a price').positive('Price must be more than 0').max(10_000_000, 'Price is too high'),
  area: z.coerce.number('Enter the area').int('Area must be a whole number').min(1, 'Area must be at least 1').max(100_000, 'Area is too large'),
  quantity: z.coerce.number('Enter a quantity').int('Quantity must be a whole number').min(1, 'Quantity must be at least 1').max(500, 'Quantity is too large'),
  maxAdults: z.coerce.number('Enter the number of adults').int().min(1, 'A room must fit at least 1 adult').max(20, 'Too many adults'),
  maxChildren: z.coerce.number('Enter the number of children').int().min(0, 'Cannot be negative').max(20, 'Too many children'),
});

export const BookingSchema = z.object({
  roomId: z.string().min(1),
  guestName: z.string().trim().min(2, 'Please enter your name').max(80, 'Name is too long'),
  email: emailSchema,
  phone: phoneSchema,
  adults: z.coerce.number().int().min(1, 'At least 1 adult is required'),
  children: z.coerce.number().int().min(0),
  mealPlan: z.enum(['ROOM_ONLY', 'BED_AND_BREAKFAST', 'HALF_BOARD', 'FULL_BOARD']),
  specialRequests: z.string().trim().max(1000, 'Special requests are too long'),
});

export const ProfileSchema = z.object({
  name: nameSchema,
  // Optional: an empty box clears the saved number.
  phone: z.union([z.literal(''), phoneSchema]),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Please enter your current password'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.password !== data.currentPassword, {
    message: 'Choose a password different from your current one',
    path: ['password'],
  });

export function isEmailVerificationRequired() {
  return process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
}

export type FieldErrors = Record<string, string[] | undefined>;

// A guest asking the hotel to arrange something (a special dinner, an experience) on a date.
export const RequestSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z.union([z.literal(''), phoneSchema]),
  date: z.string().refine((value) => !!parseDateOnly(value) && value >= todayDateOnly(), 'Choose today or a later date.'),
  guests: z.coerce.number('Enter the number of guests.').int().min(1, 'At least 1 guest.').max(40, 'For larger groups, please contact us.'),
  note: z.string().trim().max(1000, 'The note is too long.'),
});

export function readRequest(formData: FormData) {
  return RequestSchema.safeParse({
    name: formData.get('name') ?? '',
    email: formData.get('email') ?? '',
    phone: String(formData.get('phone') ?? '').trim(),
    date: formData.get('date') ?? '',
    guests: formData.get('guests') ?? '',
    note: formData.get('note') ?? '',
  });
}
