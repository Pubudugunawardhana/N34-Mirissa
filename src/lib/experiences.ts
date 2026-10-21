// Labels shared by the Experiences page and its admin screen.
export const EXPERIENCE_CATEGORIES = {
  OCEAN: 'Ocean & Wildlife',
  CULTURE: 'Culture',
  ADVENTURE: 'Adventure',
  WELLNESS: 'Wellness',
} as const;

export type ExperienceCategoryKey = keyof typeof EXPERIENCE_CATEGORIES;

export const PRICE_UNIT_TEXT = { PER_PERSON: 'per person', PER_COUPLE: 'per couple', PER_GROUP: 'per group' } as const;
