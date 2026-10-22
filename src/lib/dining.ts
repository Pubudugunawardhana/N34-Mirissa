import type { MealTime } from '@prisma/client';
import prisma from '@/lib/prisma';

export const MEAL_ORDER: MealTime[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

// Breakfast, lunch and dinner in that order, each with its menu. Used by the Dining page and the admin.
export async function getDiningMenu() {
  const services = await prisma.mealService.findMany({ include: { items: { orderBy: { position: 'asc' } } } });
  return services.sort((a, b) => MEAL_ORDER.indexOf(a.key) - MEAL_ORDER.indexOf(b.key));
}

export type DiningService = Awaited<ReturnType<typeof getDiningMenu>>[number];
