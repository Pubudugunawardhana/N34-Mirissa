import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { addExperience, deleteExperience, moveExperience, updateExperience } from '@/app/actions/experiences';
import { AddExperienceForm, EditExperienceButton } from '@/components/admin/ExperienceForms';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import { formatLKR } from '@/lib/booking';
import { EXPERIENCE_CATEGORIES, PRICE_UNIT_TEXT } from '@/lib/experiences';
import prisma from '@/lib/prisma';

export const metadata: Metadata = { title: 'Experiences | N34 Admin' };
export const dynamic = 'force-dynamic';

const arrowButton =
  'flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30';

export default async function AdminExperiences() {
  const experiences = await prisma.experience.findMany({ orderBy: { position: 'asc' } });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Experiences</h1>
          <p className="mt-1 text-sm text-slate-500">Trips and activities guests can ask you to arrange. Requests arrive in Messages.</p>
        </div>
        <Link href="/experiences" target="_blank" className="text-sm font-medium text-ocean-600 hover:text-ocean-800">
          View Experiences page ↗
        </Link>
      </div>

      {experiences.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
          No experiences yet. Add the first one below.
        </div>
      ) : (
        <ul className="space-y-3">
          {experiences.map((experience, index) => (
            <li
              key={experience.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-ocean-400"
              data-experience={experience.title}
            >
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
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {experience.imageUrl && <Image src={experience.imageUrl} alt="" fill sizes="96px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">{experience.title}</span>
                  <span className="rounded-full bg-ocean-50 px-2 py-0.5 text-[11px] font-semibold text-ocean-700">{EXPERIENCE_CATEGORIES[experience.category]}</span>
                  {!experience.isActive && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Hidden</span>}
                </p>
                <p className="mt-0.5 truncate text-sm text-slate-500">{experience.description}</p>
                {experience.duration && <p className="text-xs text-slate-400">{experience.duration}</p>}
              </div>
              <p className="shrink-0 text-right font-semibold text-ocean-900">
                {experience.price ? (
                  <>
                    {formatLKR(experience.price)}
                    <span className="block text-[11px] font-normal text-slate-400">{PRICE_UNIT_TEXT[experience.priceUnit]}</span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-slate-400">No price · no Request button</span>
                )}
              </p>
              <EditExperienceButton
                action={updateExperience.bind(null, experience.id)}
                values={{
                  title: experience.title,
                  category: experience.category,
                  description: experience.description,
                  highlights: experience.highlights,
                  price: experience.price ? String(experience.price) : '',
                  priceUnit: experience.priceUnit,
                  duration: experience.duration ?? '',
                  bestTime: experience.bestTime ?? '',
                  isActive: experience.isActive,
                }}
              />
              <form action={deleteExperience.bind(null, experience.id)}>
                <ConfirmSubmitButton
                  title="Delete this experience?"
                  confirmLabel="Delete"
                  cancelLabel="Keep it"
                  confirmMessage={`${experience.title} will be removed from the Experiences page.`}
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
  );
}
