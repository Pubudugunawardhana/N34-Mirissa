import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  addExperience,
  addMenuItem,
  deleteDiningPhoto,
  deleteExperience,
  deleteMenuItem,
  moveDiningPhoto,
  moveExperience,
  moveMenuItem,
  saveMealService,
  saveRoomService,
  updateDiningPhoto,
  updateExperience,
  updateMenuItem,
  uploadDiningPhotos,
} from '@/app/actions/dining';
import { AddExperienceForm, EditExperienceButton, GalleryUploadForm, PRICE_UNIT_LABELS, RoomServiceForm } from '@/components/admin/DiningExtrasForms';
import { AddMenuItemForm, EditMenuItemButton, MealServiceForm } from '@/components/admin/DiningForms';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import { formatLKR } from '@/lib/booking';
import { getDiningMenu } from '@/lib/dining';
import { getSiteSettings } from '@/lib/hotel';
import prisma from '@/lib/prisma';

export const metadata: Metadata = { title: 'Dining | N34 Admin' };
export const dynamic = 'force-dynamic';

const cardClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const cardHeaderClass = 'flex flex-wrap items-center gap-3 border-b border-slate-100 px-6 py-4';
const arrowButton =
  'flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30';

export default async function AdminDining() {
  const [services, experiences, photos, site] = await Promise.all([
    getDiningMenu(),
    prisma.diningExperience.findMany({ orderBy: { position: 'asc' } }),
    prisma.diningPhoto.findMany({ orderBy: { position: 'asc' } }),
    getSiteSettings(),
  ]);

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

      {/* Room service */}
      <section className={cardClass} data-admin="room-service">
        <header className={cardHeaderClass}>
          <h2 className="text-lg font-semibold text-slate-800">Room service</h2>
          <span className="text-sm text-slate-500">Shown at the top of the Dining page</span>
        </header>
        <div className="p-6">
          <RoomServiceForm action={saveRoomService} hours={site.roomServiceHours} note={site.roomServiceNote} />
        </div>
      </section>

      {/* Special dinners */}
      <section className={cardClass} data-admin="experiences">
        <header className={cardHeaderClass}>
          <h2 className="text-lg font-semibold text-slate-800">Special dinners</h2>
          <span className="text-sm text-slate-500">Guests send a request; it arrives in Messages</span>
        </header>
        <div className="space-y-5 p-6">
          {experiences.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">No special dinners yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {experiences.map((experience, index) => (
                <li key={experience.id} className="flex items-center gap-3 px-3 py-3" data-experience={experience.title}>
                  <div className="flex flex-col">
                    <form action={moveExperience.bind(null, experience.id, 'up')}>
                      <button className={arrowButton} disabled={index === 0} aria-label={`Move ${experience.title} up`}>
                        ↑
                      </button>
                    </form>
                    <form action={moveExperience.bind(null, experience.id, 'down')}>
                      <button className={arrowButton} disabled={index === experiences.length - 1} aria-label={`Move ${experience.title} down`}>
                        ↓
                      </button>
                    </form>
                  </div>
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {experience.imageUrl && <Image src={experience.imageUrl} alt="" fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                      {experience.title}
                      {!experience.isActive && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Hidden</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">{experience.description}</p>
                  </div>
                  <p className="shrink-0 text-right text-sm font-semibold text-ocean-900">
                    {formatLKR(experience.price)}
                    <span className="block text-[11px] font-normal text-slate-400">{PRICE_UNIT_LABELS[experience.priceUnit]}</span>
                  </p>
                  <EditExperienceButton
                    action={updateExperience.bind(null, experience.id)}
                    values={{
                      title: experience.title,
                      description: experience.description,
                      price: String(experience.price),
                      priceUnit: experience.priceUnit,
                      duration: experience.duration ?? '',
                      isActive: experience.isActive,
                    }}
                  />
                  <form action={deleteExperience.bind(null, experience.id)}>
                    <ConfirmSubmitButton
                      title="Delete this special dinner?"
                      confirmLabel="Delete"
                      cancelLabel="Keep it"
                      confirmMessage={`${experience.title} will be removed from the Dining page.`}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <AddExperienceForm action={addExperience} />
        </div>
      </section>

      {/* Gallery */}
      <section className={cardClass} data-admin="gallery">
        <header className={cardHeaderClass}>
          <h2 className="text-lg font-semibold text-slate-800">Gallery</h2>
          <span className="text-sm text-slate-500">
            {photos.length === 0 ? 'Shows on the Dining page once photos are added' : `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`}
          </span>
        </header>
        <div className="space-y-5 p-6">
          {photos.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {photos.map((photo, index) => (
                <li key={photo.id} className="overflow-hidden rounded-xl border border-slate-200" data-photo={photo.id}>
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image src={photo.url} alt={photo.caption ?? ''} fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                  </div>
                  <div className="space-y-2 p-3">
                    <form action={updateDiningPhoto.bind(null, photo.id)} className="flex gap-2">
                      <input
                        name="caption"
                        defaultValue={photo.caption ?? ''}
                        maxLength={80}
                        placeholder="Caption (optional)"
                        aria-label="Caption"
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-ocean-500"
                      />
                      <button className="rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-ocean-600 hover:text-ocean-700">
                        Save
                      </button>
                    </form>
                    <div className="flex items-center justify-between">
                      <span className="flex">
                        <form action={moveDiningPhoto.bind(null, photo.id, 'up')}>
                          <button className={arrowButton} disabled={index === 0} aria-label="Move photo earlier">
                            ←
                          </button>
                        </form>
                        <form action={moveDiningPhoto.bind(null, photo.id, 'down')}>
                          <button className={arrowButton} disabled={index === photos.length - 1} aria-label="Move photo later">
                            →
                          </button>
                        </form>
                      </span>
                      <form action={deleteDiningPhoto.bind(null, photo.id)}>
                        <ConfirmSubmitButton
                          title="Delete this photo?"
                          confirmLabel="Delete"
                          cancelLabel="Keep it"
                          confirmMessage="The photo will be removed from the gallery."
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <GalleryUploadForm action={uploadDiningPhotos} remaining={Math.max(0, 24 - photos.length)} />
        </div>
      </section>
    </div>
  );
}
