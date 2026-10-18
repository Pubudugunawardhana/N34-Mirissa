'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { sendContactReplyEmail } from '@/lib/mail';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

function revalidateMessages() {
  // "layout": the sidebar's unread count changes with the list.
  revalidatePath('/admin', 'layout');
}

// returnTo: where to go afterwards. Marking the open message unread closes it, or opening it would read it again.
export async function markMessageRead(id: string, read: boolean, returnTo?: string) {
  await requireAdmin();
  await prisma.contactMessage.updateMany({ where: { id }, data: { isRead: read } });
  revalidateMessages();
  if (returnTo?.startsWith('/admin/messages')) redirect(returnTo);
}

export async function archiveMessage(id: string, archived: boolean) {
  await requireAdmin();
  await prisma.contactMessage.updateMany({ where: { id }, data: { archivedAt: archived ? new Date() : null } });
  revalidateMessages();
}

export async function deleteMessage(id: string) {
  await requireAdmin();
  await prisma.contactMessage.deleteMany({ where: { id } });
  revalidateMessages();
  redirect('/admin/messages');
}

export type ReplyFormState = { error?: string; saved?: number };

const ReplySchema = z.string().trim().min(2, 'Write a reply first.').max(4000, 'The reply is too long.');

// Emails the hotel's answer to the guest and keeps it with the message.
export async function replyToMessage(id: string, prevState: ReplyFormState, formData: FormData): Promise<ReplyFormState> {
  await requireAdmin();

  const parsed = ReplySchema.safeParse(formData.get('reply') ?? '');
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) return { error: 'This message no longer exists.' };

  try {
    await sendContactReplyEmail(message, parsed.data);
  } catch (error) {
    console.error('Failed to send the reply email', error);
    return { error: 'The email could not be sent. Please try again, or reply from your own email.' };
  }

  await prisma.contactMessage.update({ where: { id }, data: { reply: parsed.data, repliedAt: new Date(), isRead: true } });
  revalidateMessages();
  return { saved: Date.now() };
}
