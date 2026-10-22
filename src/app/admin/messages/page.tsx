import type { Prisma } from '@prisma/client';
import type { Metadata } from 'next';
import Link from 'next/link';
import { archiveMessage, deleteMessage, markMessageRead, replyToMessage } from '@/app/actions/messages';
import BookingSearch from '@/components/admin/BookingSearch';
import MessageReplyForm from '@/components/admin/MessageReplyForm';
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton';
import { firstParam } from '@/lib/admin-bookings';
import { whatsappLink } from '@/lib/hotel';
import prisma from '@/lib/prisma';

export const metadata: Metadata = { title: 'Messages | N34 Admin' };
export const dynamic = 'force-dynamic';

const PER_PAGE = 20;

type View = 'inbox' | 'unread' | 'replied' | 'archived';

const VIEWS: { key: View; label: string; where: Prisma.ContactMessageWhereInput; empty: string }[] = [
  { key: 'inbox', label: 'Inbox', where: { archivedAt: null }, empty: 'No messages yet. Messages sent from the Contact Us page will appear here.' },
  { key: 'unread', label: 'Unread', where: { archivedAt: null, isRead: false }, empty: 'All caught up: every message has been read.' },
  { key: 'replied', label: 'Replied', where: { repliedAt: { not: null } }, empty: 'No replies sent yet.' },
  { key: 'archived', label: 'Archived', where: { archivedAt: { not: null } }, empty: 'Nothing archived.' },
];

const quietButton =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-ocean-600 hover:text-ocean-700';

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('') || '?'
  );
}

// "Just now", "2 h ago", "Yesterday", or a date.
function received(date: Date) {
  const minutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} h ago`;
  if (minutes < 48 * 60) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short' });
}

function fullDate(date: Date) {
  return date.toLocaleString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function Icon({ path }: { path: string }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export default async function AdminMessages({ searchParams }: PageProps<'/admin/messages'>) {
  const params = await searchParams;
  const view = VIEWS.find((item) => item.key === firstParam(params.view)) ?? VIEWS[0];
  const search = firstParam(params.q)?.trim() ?? '';
  const openId = firstParam(params.id);
  const page = Math.max(1, Math.floor(Number(firstParam(params.page)) || 1));

  const where: Prisma.ContactMessageWhereInput = search
    ? {
        AND: [
          view.where,
          {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
              { message: { contains: search, mode: 'insensitive' } },
            ],
          },
        ],
      }
    : view.where;

  // Opening a message counts as reading it.
  if (openId) await prisma.contactMessage.updateMany({ where: { id: openId, isRead: false }, data: { isRead: true } });

  const [messages, total, open, ...counts] = await Promise.all([
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    prisma.contactMessage.count({ where }),
    openId ? prisma.contactMessage.findUnique({ where: { id: openId } }) : null,
    ...VIEWS.map((item) => prisma.contactMessage.count({ where: item.where })),
    prisma.contactMessage.count({ where: { archivedAt: null, repliedAt: null } }),
    prisma.contactMessage.count(),
  ]);
  const countFor = (key: View) => counts[VIEWS.findIndex((item) => item.key === key)];
  const waiting = counts[VIEWS.length];
  const allMessages = counts[VIEWS.length + 1];
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  // Links keep the chosen tab and search.
  const href = (values: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    const merged = { view: view.key === 'inbox' ? undefined : view.key, q: search || undefined, ...values };
    for (const [key, value] of Object.entries(merged)) if (value !== undefined && value !== '' && !(key === 'page' && String(value) === '1')) query.set(key, String(value));
    const text = query.toString();
    return text ? `/admin/messages?${text}` : '/admin/messages';
  };

  const summary = [
    { label: 'Unread', value: countFor('unread'), hint: 'Not opened yet', accent: countFor('unread') > 0 ? 'text-ocean-700' : 'text-slate-800' },
    { label: 'Waiting for a reply', value: waiting, hint: 'In the inbox, not answered', accent: waiting > 0 ? 'text-amber-600' : 'text-slate-800' },
    { label: 'Replied', value: countFor('replied'), hint: 'Answered from here', accent: 'text-emerald-600' },
    { label: 'All messages', value: allMessages, hint: 'Including archived', accent: 'text-slate-800' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">Questions sent from the Contact Us page. Read them, reply by email, and archive what is done.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className={`mt-1 text-3xl font-bold ${item.accent}`}>{item.value}</p>
            <p className="mt-1 text-xs text-slate-400">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {VIEWS.map((item) => (
            <Link
              key={item.key}
              href={href({ view: item.key === 'inbox' ? undefined : item.key, id: undefined, page: undefined })}
              aria-current={item.key === view.key ? 'page' : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                item.key === view.key
                  ? 'bg-ocean-600 text-white shadow-sm shadow-ocean-600/20'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-ocean-600 hover:text-ocean-700'
              }`}
            >
              {item.label} <span className="opacity-70">({countFor(item.key)})</span>
            </Link>
          ))}
        </div>
        <BookingSearch
          key={`${view.key}`}
          basePath="/admin/messages"
          keep={view.key === 'inbox' ? {} : { view: view.key }}
          initial={search}
          placeholder="Search name, email, subject or text"
          label="Search messages"
        />
      </div>

      <div className="group/list grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* The list: on small screens it gives way to the open message. */}
        <section className={`${open ? 'hidden lg:block' : ''} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm`}>
          {messages.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm text-slate-500">{search ? `No messages match “${search}”.` : view.empty}</p>
          ) : (
            <ul className="divide-y divide-slate-100 transition-opacity group-has-[[data-search-pending]]/list:opacity-50">
              {messages.map((message) => {
                const selected = message.id === open?.id;
                return (
                  <li key={message.id}>
                    <Link
                      href={href({ id: message.id, page })}
                      data-message={message.id}
                      aria-current={selected ? 'true' : undefined}
                      className={`flex gap-3 px-4 py-3.5 transition-colors ${selected ? 'bg-ocean-50' : 'hover:bg-slate-50'}`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          message.isRead ? 'bg-slate-100 text-slate-600' : 'bg-ocean-600 text-white'
                        }`}
                      >
                        {initials(message.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={`truncate text-sm ${message.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{message.name}</span>
                          <span className="shrink-0 text-xs text-slate-400">{received(message.createdAt)}</span>
                        </span>
                        <span className={`block truncate text-sm ${message.isRead ? 'text-slate-600' : 'font-semibold text-slate-800'}`}>
                          {message.subject || 'No subject'}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-xs text-slate-500">{message.message}</span>
                          {!message.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-ocean-600" aria-label="Unread" />}
                          {message.repliedAt && (
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                              Replied
                            </span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {pages > 1 && (
            <nav aria-label="Pages" className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
              <span className="text-slate-500">
                Page {page} of {pages}
              </span>
              <span className="flex gap-2">
                {page > 1 && (
                  <Link href={href({ page: page - 1, id: open?.id })} className={quietButton}>
                    ← Prev
                  </Link>
                )}
                {page < pages && (
                  <Link href={href({ page: page + 1, id: open?.id })} className={quietButton}>
                    Next →
                  </Link>
                )}
              </span>
            </nav>
          )}
        </section>

        {/* The open message */}
        {open ? (
          <article className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" data-open-message={open.id}>
            <Link href={href({ id: undefined, page })} className="text-sm text-slate-500 hover:text-ocean-600 lg:hidden">
              ← All messages
            </Link>

            <header className="flex flex-wrap items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ocean-50 text-base font-semibold text-ocean-700">
                {initials(open.name)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-slate-800">{open.subject || 'No subject'}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{open.name}</span> ·{' '}
                  <a href={`mailto:${open.email}`} className="break-all hover:text-ocean-600">
                    {open.email}
                  </a>
                  {open.phone && (
                    <>
                      {' '}
                      ·{' '}
                      <a href={`tel:${open.phone.replace(/[^+\d]/g, '')}`} className="hover:text-ocean-600">
                        {open.phone}
                      </a>
                    </>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">Received {fullDate(open.createdAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {open.archivedAt && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Archived</span>}
                {open.repliedAt && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">Replied</span>
                )}
              </div>
            </header>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 border-y border-slate-100 py-3">
              <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject || 'Your message'}`)}`} className={quietButton}>
                <Icon path="M3 7l9 6 9-6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
                Email
              </a>
              {open.phone && (
                <>
                  <a href={`tel:${open.phone.replace(/[^+\d]/g, '')}`} className={quietButton}>
                    <Icon path="M5 4h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
                    Call
                  </a>
                  <a href={whatsappLink(open.phone)} target="_blank" rel="noopener noreferrer" className={quietButton}>
                    <Icon path="M4 20l1.3-3.9A8 8 0 1 1 8 19.1L4 20z" />
                    WhatsApp
                  </a>
                </>
              )}
              <span className="flex-1" />
              <form action={markMessageRead.bind(null, open.id, false, href({ id: undefined, page }))}>
                <button className={quietButton}>Mark unread</button>
              </form>
              <form action={archiveMessage.bind(null, open.id, !open.archivedAt)}>
                <button className={quietButton}>{open.archivedAt ? 'Move to inbox' : 'Archive'}</button>
              </form>
              <form action={deleteMessage.bind(null, open.id)}>
                <ConfirmSubmitButton
                  title="Delete this message?"
                  confirmLabel="Delete"
                  cancelLabel="Keep it"
                  confirmMessage={`The message from ${open.name} will be deleted for good. Archive it instead to keep it out of the inbox.`}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Delete
                </ConfirmSubmitButton>
              </form>
            </div>

            {/* The guest's message */}
            <div className="whitespace-pre-line rounded-2xl bg-slate-50 px-5 py-4 text-[15px] leading-relaxed text-slate-700">{open.message}</div>

            {/* What the hotel answered */}
            {open.reply && open.repliedAt && (
              <div className="ml-auto max-w-[90%] rounded-2xl bg-ocean-50 px-5 py-4 ring-1 ring-inset ring-ocean-100">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ocean-700">Your reply · {fullDate(open.repliedAt)}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{open.reply}</p>
              </div>
            )}

            <MessageReplyForm action={replyToMessage.bind(null, open.id)} guestName={open.name} email={open.email} hasReply={!!open.repliedAt} />
          </article>
        ) : (
          <div className="hidden rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-24 text-center lg:block">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ocean-50 text-ocean-700">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 7l9 6 9-6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
              </svg>
            </span>
            <p className="mt-4 font-medium text-slate-700">Choose a message to read it</p>
            <p className="mt-1 text-sm text-slate-500">Unread messages are marked with a blue dot.</p>
          </div>
        )}
      </div>
    </div>
  );
}
