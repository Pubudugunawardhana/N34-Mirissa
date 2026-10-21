import type { Metadata } from 'next';
import Link from 'next/link';
import { addMenuItem, deleteMenuItem, moveMenuItem, saveMealService, updateMenuItem } from '@/app/actions/dining';
import { AddMenuItemForm, EditMenuItemButton, MealServiceForm } from '@/components/admin/DiningForms';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import { formatLKR } from '@/lib/booking';
import { getDiningMenu } from '@/lib/dining';

export const metadata: Metadata = { title: 'Dining | N34 Admin' };
export const dynamic = 'force-dynamic';

const arrowButton =
  'flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30';

export default async function AdminDining() {
  const services = await getDiningMenu();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dining</h1>
          <p className="mt-1 text-sm text-slate-500">Breakfast, lunch and dinner: the hours, photos and menus shown on the Dining page.</p>
        </div>
        <Link href="/dining" target="_blank" className="text-sm font-medium text-ocean-600 hover:text-ocean-800">
          View Dining page ↗
        </Link>
      </div>

      {services.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
          No meals set up yet. Run <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run seed</code> to add breakfast, lunch and dinner.
        </div>
      )}

      {services.map((service) => (
        <section key={service.id} id={service.key.toLowerCase()} className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm" data-meal={service.key}>
          <header className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-800">{service.title}</h2>
            <span className="text-sm text-slate-500">{service.hours}</span>
            <span
              className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                service.isAvailable ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'
              }`}
            >
              {service.isAvailable ? 'Served' : 'Not served'}
            </span>
          </header>

          <div className="space-y-6 p-6">
            <MealServiceForm
              action={saveMealService.bind(null, service.id)}
              values={{
                title: service.title,
                tagline: service.tagline ?? '',
                hours: service.hours,
                description: service.description,
                isAvailable: service.isAvailable,
                imageUrl: service.imageUrl,
              }}
            />

            {/* Menu */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Menu · {service.items.length} {service.items.length === 1 ? 'dish' : 'dishes'}
              </p>
              {service.items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">No dishes yet. Add the first one below.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {service.items.map((item, index) => (
                    <li key={item.id} className="flex items-center gap-3 px-3 py-2.5" data-dish={item.name}>
                      <div className="flex flex-col">
                        <form action={moveMenuItem.bind(null, item.id, 'up')}>
                          <button className={arrowButton} disabled={index === 0} aria-label={`Move ${item.name} up`}>
                            ↑
                          </button>
                        </form>
                        <form action={moveMenuItem.bind(null, item.id, 'down')}>
                          <button className={arrowButton} disabled={index === service.items.length - 1} aria-label={`Move ${item.name} down`}>
                            ↓
                          </button>
                        </form>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-800">
                          {item.name}
                          {item.isVegetarian && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Veg</span>}
                          {item.isSpicy && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">Spicy</span>}
                        </p>
                        {item.description && <p className="truncate text-xs text-slate-500">{item.description}</p>}
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-ocean-900">{item.price ? formatLKR(item.price) : 'Included'}</p>
                      <EditMenuItemButton
                        action={updateMenuItem.bind(null, item.id)}
                        values={{
                          name: item.name,
                          description: item.description ?? '',
                          price: item.price ? String(item.price) : '',
                          isVegetarian: item.isVegetarian,
                          isSpicy: item.isSpicy,
                        }}
                      />
                      <form action={deleteMenuItem.bind(null, item.id)}>
                        <ConfirmSubmitButton
                          title="Remove this dish?"
                          confirmLabel="Remove"
                          cancelLabel="Keep it"
                          confirmMessage={`${item.name} will be taken off the ${service.title.toLowerCase()} menu.`}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <AddMenuItemForm action={addMenuItem.bind(null, service.id)} />
          </div>
        </section>
      ))}
    </div>
  );
}
