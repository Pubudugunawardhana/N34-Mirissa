'use client';

export type MenuDish = { id: string; name: string; description: string | null; isVegetarian: boolean; isSpicy: boolean };
export type BookingMenu = { meal: 'BREAKFAST' | 'LUNCH' | 'DINNER'; title: string; hours: string; isAvailable: boolean; items: MenuDish[] };

type MealChoicePickerProps = {
  // The menus of the meals the chosen plan includes, in breakfast, lunch, dinner order.
  menus: BookingMenu[];
  planLabel: string;
  // Meal -> chosen dish id ('' or missing: the chef chooses).
  choices: Record<string, string>;
  onChange: (meal: string, dishId: string) => void;
};

const cardClass =
  'flex h-full w-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-ocean-400 peer-checked:border-ocean-600 peer-checked:bg-ocean-50 peer-checked:ring-2 peer-checked:ring-ocean-600/30 peer-focus-visible:ring-2 peer-focus-visible:ring-ocean-500/50';

function Tick() {
  return (
    <span
      className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 transition-colors group-has-[:checked]/dish:border-ocean-600 group-has-[:checked]/dish:bg-ocean-600"
      aria-hidden="true"
    >
      <svg className="h-3 w-3 text-white opacity-0 group-has-[:checked]/dish:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

// "Choose your favourites": for each meal in the plan, a row of dishes from the Dining menu to swipe through and pick one.
export default function MealChoicePicker({ menus, planLabel, choices, onChange }: MealChoicePickerProps) {
  return (
    <div className="mt-6 rounded-2xl border border-sand-200 bg-sand-50/60 p-4 sm:p-5" data-meal-picker>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-ocean-900">Choose your favourites</p>
        <p className="text-xs text-slate-500">Optional · included in your {planLabel.toLowerCase()} plan</p>
      </div>

      <div className="mt-4 space-y-5">
        {menus.map((menu) => {
          const name = `meal_${menu.meal}`;
          const chosen = choices[menu.meal] ?? '';
          const canChoose = menu.isAvailable && menu.items.length > 0;
          return (
            <fieldset key={menu.meal} data-meal-choice={menu.meal}>
              <legend className="mb-2 flex w-full flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">{menu.title}</span>
                <span className="text-xs text-slate-500">{menu.hours}</span>
              </legend>

              {!canChoose ? (
                <p className="rounded-xl bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-inset ring-slate-200">Our chef will choose for you.</p>
              ) : (
                // Swipe sideways through the dishes; each stops neatly at the edge.
                <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
                  <label className="group/dish w-40 shrink-0 snap-start">
                    <input type="radio" name={name} value="" checked={chosen === ''} onChange={() => onChange(menu.meal, '')} className="peer sr-only" />
                    <span className={cardClass}>
                      <span className="flex items-start gap-2">
                        <span className="text-sm font-semibold text-slate-800">Chef&rsquo;s choice</span>
                        <Tick />
                      </span>
                      <span className="mt-1 text-xs leading-relaxed text-slate-500">Let our kitchen surprise you on the day.</span>
                    </span>
                  </label>
                  {menu.items.map((dish) => (
                    <label key={dish.id} className="group/dish w-56 shrink-0 snap-start" data-dish-option={dish.name}>
                      <input
                        type="radio"
                        name={name}
                        value={dish.id}
                        checked={chosen === dish.id}
                        onChange={() => onChange(menu.meal, dish.id)}
                        className="peer sr-only"
                      />
                      <span className={cardClass}>
                        <span className="flex items-start gap-2">
                          <span className="text-sm font-semibold text-slate-800">{dish.name}</span>
                          <Tick />
                        </span>
                        {dish.description && <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{dish.description}</span>}
                        {(dish.isVegetarian || dish.isSpicy) && (
                          <span className="mt-auto flex gap-1.5 pt-2">
                            {dish.isVegetarian && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Vegetarian</span>}
                            {dish.isSpicy && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">Spicy</span>}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
