'use client';

import { useEffect, useRef, useState } from 'react';
import { formatLKR } from '@/lib/booking';

export type MenuDish = { id: string; name: string; description: string | null; price: number | null; isVegetarian: boolean; isSpicy: boolean };
export type BookingMenu = { meal: 'BREAKFAST' | 'LUNCH' | 'DINNER'; title: string; hours: string; isAvailable: boolean; items: MenuDish[] };

type MealChoicePickerProps = {
  // The menus of the meals the chosen plan includes, in breakfast, lunch, dinner order.
  menus: BookingMenu[];
  planLabel: string;
  // Meal -> chosen dish id ('' or missing: nothing chosen, the kitchen decides).
  choices: Record<string, string>;
  onChange: (meal: string, dishId: string) => void;
};

// Dishes per slide (two rows of two); longer menus continue on the next slide.
const PAGE_SIZE = 4;

const optionClass =
  'flex h-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 transition-colors hover:border-ocean-400 peer-checked:border-ocean-600 peer-checked:bg-ocean-50 peer-focus-visible:ring-2 peer-focus-visible:ring-ocean-500/50';
const arrowClass =
  'flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-ocean-900 transition-colors hover:border-ocean-600 hover:text-ocean-700 disabled:pointer-events-none disabled:opacity-30';

// The radio circle: empty, or filled with a tick when chosen.
function Check() {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 transition-colors group-has-[:checked]/option:border-ocean-600 group-has-[:checked]/option:bg-ocean-600"
      aria-hidden="true"
    >
      <svg className="h-3 w-3 text-white opacity-0 group-has-[:checked]/option:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function MealBlock({ menu, chosen, onChange }: { menu: BookingMenu; chosen: string; onChange: (dishId: string) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const pages: MenuDish[][] = [];
  for (let i = 0; i < menu.items.length; i += PAGE_SIZE) pages.push(menu.items.slice(i, i + PAGE_SIZE));

  const canChoose = menu.isAvailable && menu.items.length > 0;
  const name = `meal_${menu.meal}`;
  const chosenDish = menu.items.find((dish) => dish.id === chosen);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (track) track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
  };

  // Open on the slide that holds the dish already chosen (e.g. after switching plans back).
  useEffect(() => {
    const index = menu.items.findIndex((dish) => dish.id === chosen);
    const track = trackRef.current;
    if (index >= PAGE_SIZE && track) track.scrollLeft = Math.floor(index / PAGE_SIZE) * track.clientWidth;
    // Only when the block first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // min-w-0: a fieldset is otherwise as wide as its content and can push out of the card.
    <fieldset className="min-w-0 py-5 first:pt-0 last:pb-0" data-meal-choice={menu.meal}>
      <legend className="sr-only">{menu.title}</legend>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-sm font-semibold text-slate-800">{menu.title}</p>
        <p className="text-xs text-slate-400">{menu.hours}</p>
        {canChoose &&
          (chosenDish ? (
            <span className="ml-auto inline-flex max-w-full items-center gap-1.5 rounded-full bg-ocean-50 py-1 pl-2.5 pr-1 text-xs font-medium text-ocean-700">
              <span className="truncate">{chosenDish.name}</span>
              <button
                type="button"
                onClick={() => onChange('')}
                className="flex h-5 w-5 items-center justify-center rounded-full text-ocean-600 transition-colors hover:bg-ocean-100"
                aria-label={`Clear ${menu.title.toLowerCase()} choice`}
              >
                ✕
              </button>
            </span>
          ) : (
            <span className="ml-auto text-xs text-slate-400">Not chosen yet</span>
          ))}
      </div>

      {!canChoose ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">Our chef will choose for you.</p>
      ) : (
        <>
          {/* Slides of four dishes; swipe, scroll or use the arrows for more. */}
          <div
            ref={trackRef}
            onScroll={(event) => {
              const track = event.currentTarget;
              setPage(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
            }}
            className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {pages.map((dishes, index) => (
              <div key={index} className="grid w-full shrink-0 snap-start content-start gap-2.5 p-0.5 sm:grid-cols-2" data-choice-page={index + 1}>
                {dishes.map((dish) => (
                  <label key={dish.id} className="group/option min-w-0 cursor-pointer" data-dish-option={dish.name}>
                    <input type="radio" name={name} value={dish.id} checked={chosen === dish.id} onChange={() => onChange(dish.id)} className="peer sr-only" />
                    <span className={optionClass}>
                      <Check />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800">{dish.name}</span>
                        {dish.description && <span className="block truncate text-xs text-slate-500">{dish.description}</span>}
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs font-semibold text-sand-600">{dish.price ? formatLKR(dish.price) : 'Included'}</span>
                        <span className="flex gap-1">
                          {dish.isVegetarian && (
                            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700" title="Vegetarian">
                              Veg
                            </span>
                          )}
                          {dish.isSpicy && (
                            <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700" title="Spicy">
                              Spicy
                            </span>
                          )}
                        </span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>

          {pages.length > 1 && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                {pages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Show dishes ${index + 1} of ${pages.length}`}
                    aria-current={index === page ? 'true' : undefined}
                    className={`h-2 rounded-full transition-all ${index === page ? 'w-5 bg-sand-500' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="mr-1 text-xs text-slate-400">
                  {page + 1} / {pages.length}
                </span>
                <button type="button" onClick={() => goTo(page - 1)} disabled={page === 0} className={arrowClass} aria-label="Previous dishes">
                  ←
                </button>
                <button type="button" onClick={() => goTo(page + 1)} disabled={page === pages.length - 1} className={arrowClass} aria-label="More dishes">
                  →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </fieldset>
  );
}

// "Choose your favourites": for each meal in the plan, pick a dish from the Dining menu (optional).
export default function MealChoicePicker({ menus, planLabel, choices, onChange }: MealChoicePickerProps) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white" data-meal-picker>
      <div className="h-1 bg-gradient-to-r from-sand-500 via-sand-200 to-transparent" aria-hidden="true" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand-50 text-sand-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 21V3c-2 1-3 3-3 6v4h3" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ocean-900">Choose your favourites</p>
            <p className="text-sm text-slate-500">
              Pick one dish for each meal (optional). A chosen dish is charged at its own price, per guest per night; otherwise the {planLabel} plan price applies.
            </p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-slate-100">
          {menus.map((menu) => (
            <MealBlock key={menu.meal} menu={menu} chosen={choices[menu.meal] ?? ''} onChange={(dishId) => onChange(menu.meal, dishId)} />
          ))}
        </div>
      </div>
    </div>
  );
}
