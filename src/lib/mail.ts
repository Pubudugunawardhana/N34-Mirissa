import type { Booking as BookingRow, BookingCharge, BookingMealChoice } from '@prisma/client';

// Extras and dish choices are listed when they were loaded with the booking.
type Booking = BookingRow & { charges?: BookingCharge[]; mealChoices?: BookingMealChoice[] };
import nodemailer from 'nodemailer';
import { MEAL_NAMES, MEAL_PLANS, formatLKR, formatStayDate, guestSummary, nightsBetween } from '@/lib/booking';

const APP_NAME = 'N34 Mirissa';

// Shown in the footer of booking emails.
const HOTEL_CONTACT = {
  address: 'Beach Road, Mirissa, Sri Lanka',
  phone: '+94 77 123 4567',
  email: 'info@n34mirissa.com',
};

const FONT = "'Segoe UI',Helvetica,Arial,sans-serif";

function appUrl() {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

// False until the Gmail details are filled in; emails are then printed to the server console instead of sent.
export function isMailConfigured() {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

// Names typed by guests end up in these emails, so nothing is inserted as raw HTML.
function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
  // The one link that matters, printed to the console while Gmail is not configured.
  link: string;
};

async function deliver(email: Email) {
  const transport = getTransport();

  // Gmail is not configured yet: print the link so the flow can still be used locally.
  if (!transport) {
    console.info(`[mail] Gmail not configured. "${email.subject}" for ${email.to}: ${email.link}`);
    return;
  }

  await transport.sendMail({
    from: `"${APP_NAME}" <${process.env.GMAIL_USER}>`,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}

/* ---------------------------------------------------------------------------
   Account emails (verify address, reset password): one message and one button.
   --------------------------------------------------------------------------- */

type Notice = {
  to: string;
  subject: string;
  // Small coloured label above the heading.
  eyebrow: string;
  heading: string;
  body: string;
  buttonLabel: string;
  link: string;
  footnote: string;
};

function renderNotice(notice: Notice) {
  const heading = escapeHtml(notice.heading);
  const body = escapeHtml(notice.body);
  const { eyebrow, buttonLabel, link, footnote } = notice;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(notice.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef2f7;font-family:${FONT};color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;">${body}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:28px 36px;background:#0f172a;">
                <span style="font-size:26px;font-weight:800;letter-spacing:1px;color:#ffffff;">N34</span>
                <span style="font-size:12px;font-weight:600;letter-spacing:5px;color:#fde68a;">&nbsp;MIRISSA</span>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 36px 8px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#d97706;">${eyebrow}</div>
                <h1 style="margin:10px 0 12px;font-size:26px;line-height:1.25;color:#0f172a;">${heading}</h1>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;">${body}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 36px 8px;">
                <a href="${link}" style="display:inline-block;padding:15px 36px;background:#f59e0b;border-radius:999px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${buttonLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px 8px;">
                <div style="padding:16px 20px;background:#f8fafc;border-radius:14px;font-size:13px;line-height:1.6;color:#64748b;">
                  If the button does not work, copy this link into your browser:<br />
                  <a href="${link}" style="color:#2563eb;word-break:break-all;">${link}</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 36px 32px;">
                <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;text-align:center;">${footnote}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 36px;background:#f8fafc;border-top:1px solid #eef2f7;font-size:12px;line-height:1.8;color:#94a3b8;">
                <strong style="color:#475569;">${APP_NAME}</strong><br />
                ${HOTEL_CONTACT.address}<br />
                ${HOTEL_CONTACT.phone} &nbsp;·&nbsp; ${HOTEL_CONTACT.email}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendNotice(notice: Notice) {
  await deliver({
    to: notice.to,
    subject: notice.subject,
    text: `${notice.heading}\n\n${notice.body}\n\n${notice.link}\n\n${notice.footnote}`,
    html: renderNotice(notice),
    link: notice.link,
  });
}

export async function sendVerificationEmail(to: string, rawToken: string) {
  await sendNotice({
    to,
    subject: `Verify your email for ${APP_NAME}`,
    eyebrow: 'Welcome',
    heading: 'Confirm your email address',
    body: `Thanks for creating an account with ${APP_NAME}. Confirm your email address to finish setting it up.`,
    buttonLabel: 'Verify email',
    link: `${appUrl()}/verify-email?token=${rawToken}`,
    footnote: 'This link expires in 24 hours. If you did not create an account, you can ignore this email.',
  });
}

// Sent to the NEW address when a signed-in user asks to change their email.
export async function sendEmailChangeEmail(to: string, rawToken: string) {
  await sendNotice({
    to,
    subject: `Confirm your new email for ${APP_NAME}`,
    eyebrow: 'Email change',
    heading: 'Confirm your new email address',
    body: `You asked to use this address for your ${APP_NAME} account. Confirm it and it becomes the email you sign in with. Until then your current email keeps working.`,
    buttonLabel: 'Confirm new email',
    link: `${appUrl()}/verify-email?token=${rawToken}`,
    footnote: 'This link expires in 24 hours. If you did not ask for this, you can ignore this email and nothing will change.',
  });
}

export async function sendPasswordResetEmail(to: string, rawToken: string) {
  await sendNotice({
    to,
    subject: `Reset your ${APP_NAME} password`,
    eyebrow: 'Account security',
    heading: 'Reset your password',
    body: `We received a request to reset the password for your ${APP_NAME} account.`,
    buttonLabel: 'Choose a new password',
    link: `${appUrl()}/reset-password?token=${rawToken}`,
    footnote: 'This link expires in 1 hour and can be used once. If you did not ask for this, you can ignore this email and your password will stay the same.',
  });
}

/* ---------------------------------------------------------------------------
   Booking confirmation: the full details of the stay, laid out like a receipt.
   Email clients only understand tables and inline styles, hence the markup.
   --------------------------------------------------------------------------- */

type BookingRoom = { name: string; coverUrl?: string | null };

function detailRow(label: string, value: string) {
  return `<tr>
                    <td style="padding:10px 0;border-bottom:1px solid #eef2f7;font-size:14px;color:#64748b;">${escapeHtml(label)}</td>
                    <td align="right" style="padding:10px 0;border-bottom:1px solid #eef2f7;font-size:14px;font-weight:600;color:#0f172a;">${escapeHtml(value)}</td>
                  </tr>`;
}

function dateCell(label: string, date: Date) {
  return `<td width="48%" style="padding:18px 20px;background:#f8fafc;border-radius:14px;">
                      <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;">${label}</div>
                      <div style="margin-top:6px;font-size:16px;font-weight:700;color:#0f172a;">${escapeHtml(formatStayDate(date))}</div>
                    </td>`;
}

// The two booking emails share one layout; only these words change.
// "received" goes out when the guest books, "paid" when the hotel marks the stay as paid.
export type BookingEmailKind = 'received' | 'paid';

function bookingEmailCopy(kind: BookingEmailKind, booking: Booking, roomName: string) {
  if (kind === 'paid') {
    return {
      subject: `Payment received: ${booking.reference} (${APP_NAME})`,
      preview: `Payment of ${formatLKR(booking.totalAmount)} received for booking ${booking.reference}.`,
      eyebrow: 'Payment received',
      intro: `We have received your payment of <strong style="color:#0f172a;">${escapeHtml(formatLKR(booking.totalAmount))}</strong> for <strong style="color:#0f172a;">${escapeHtml(roomName)}</strong>. Your stay is fully paid.`,
      introText: `We have received your payment of ${formatLKR(booking.totalAmount)} for ${roomName}. Your stay is fully paid.`,
      pill: { label: 'Paid in full', background: '#d1fae5', color: '#065f46' },
      note: 'Keep this email as your receipt. We look forward to welcoming you to Mirissa.',
    };
  }
  return {
    subject: `Booking received: ${booking.reference} (${APP_NAME})`,
    preview: `Booking ${booking.reference} received: ${roomName}, ${formatStayDate(booking.checkIn)} to ${formatStayDate(booking.checkOut)}.`,
    eyebrow: 'Booking received',
    intro: `We have your booking for <strong style="color:#0f172a;">${escapeHtml(roomName)}</strong>. The hotel will confirm it shortly, and we look forward to welcoming you to Mirissa.`,
    introText: `We have your booking for ${roomName}. The hotel will confirm it shortly.`,
    pill: { label: 'Pending confirmation', background: '#fef3c7', color: '#92400e' },
    note: 'No payment is needed now; you pay at the hotel. You can cancel from the booking page up to the day before check-in.',
  };
}

// Exported so the admin panel can preview exactly what the guest receives.
export function renderBookingEmail(booking: Booking, room: BookingRoom, kind: BookingEmailKind = 'received') {
  const copy = bookingEmailCopy(kind, booking, room.name);
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const nightsLabel = `${nights} ${nights === 1 ? 'night' : 'nights'}`;
  const guests = guestSummary(booking.adults, booking.children);
  const meal = MEAL_PLANS[booking.mealPlan].label;
  const roomTotal = booking.pricePerNight * nights;
  // Extras the hotel added during the stay get their own small section under the booking.
  const charges = booking.charges ?? [];
  const extras = charges.length
    ? `<tr><td colspan="2" style="padding:18px 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#d97706;">Extra charges during the stay</td></tr>` +
      charges
        .map((charge) => detailRow(charge.quantity > 1 ? `${charge.description} (${charge.quantity} × ${formatLKR(charge.unitPrice)})` : charge.description, formatLKR(charge.quantity * charge.unitPrice)))
        .join('') +
      detailRow('Extras total', formatLKR(booking.extrasTotal))
    : '';
  // A booking made without an account is opened with its secret key instead of a sign-in.
  const link = `${appUrl()}/book/confirmation/${booking.id}${booking.guestToken ? `?key=${booking.guestToken}` : ''}`;

  // A photo is only included when it has a full web address; mail apps cannot load files from this server by path.
  const photo = room.coverUrl?.startsWith('https://')
    ? `<tr><td><img src="${escapeHtml(room.coverUrl)}" width="600" alt="${escapeHtml(room.name)}" style="display:block;width:100%;height:220px;object-fit:cover;" /></td></tr>`
    : '';

  const requests = booking.specialRequests
    ? `<tr><td style="padding:16px 36px 8px;">
                <div style="padding:16px 20px;background:#fffbeb;border-radius:14px;font-size:14px;line-height:1.6;color:#78350f;">
                  <strong style="display:block;margin-bottom:4px;color:#92400e;">Your special requests</strong>${escapeHtml(booking.specialRequests).replace(/\n/g, '<br />')}
                </div>
              </td></tr>`
    : '';

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Booking ${escapeHtml(booking.reference)}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef2f7;font-family:${FONT};color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(copy.preview)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:28px 36px;background:#0f172a;">
                <span style="font-size:26px;font-weight:800;letter-spacing:1px;color:#ffffff;">N34</span>
                <span style="font-size:12px;font-weight:600;letter-spacing:5px;color:#fde68a;">&nbsp;MIRISSA</span>
              </td>
            </tr>
            ${photo}
            <tr>
              <td style="padding:36px 36px 8px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#d97706;">${copy.eyebrow}</div>
                <h1 style="margin:10px 0 12px;font-size:26px;line-height:1.25;color:#0f172a;">Thank you, ${escapeHtml(booking.guestName)}</h1>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;">${copy.intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:18px;">
                  <tr>
                    <td style="padding:20px 24px;">
                      <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#64748b;">Booking reference</div>
                      <div style="margin-top:6px;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:700;letter-spacing:4px;color:#1e3a8a;">${escapeHtml(booking.reference)}</div>
                    </td>
                    <td align="right" style="padding:20px 24px;">
                      <span style="display:inline-block;padding:7px 14px;background:${copy.pill.background};border-radius:999px;font-size:12px;font-weight:700;color:${copy.pill.color};">${copy.pill.label}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 36px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;">
                  <tr>
                    ${dateCell('Check-in', booking.checkIn)}
                    <td width="4%" style="font-size:0;line-height:0;">&nbsp;</td>
                    ${dateCell('Check-out', booking.checkOut)}
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 36px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${detailRow('Room', room.name)}
                  ${booking.roomNumber ? detailRow('Room number', booking.roomNumber) : ''}
                  ${detailRow('Length of stay', nightsLabel)}
                  ${detailRow('Guests', guests)}
                  ${detailRow('Meals', meal)}
                  ${(booking.mealChoices ?? []).map((choice) => detailRow(`${MEAL_NAMES[choice.meal]} choice`, choice.dishName)).join('')}
                  ${detailRow(`Room (${formatLKR(booking.pricePerNight)} × ${nightsLabel})`, formatLKR(roomTotal))}
                  ${detailRow('Meals total', formatLKR(booking.mealTotal))}
                  ${extras}
                  <tr>
                    <td style="padding:18px 0 4px;font-size:16px;font-weight:700;color:#0f172a;">Total</td>
                    <td align="right" style="padding:18px 0 4px;font-size:24px;font-weight:800;color:#1e3a8a;">${formatLKR(booking.totalAmount)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            ${requests}
            <tr>
              <td align="center" style="padding:24px 36px 8px;">
                <a href="${link}" style="display:inline-block;padding:15px 36px;background:#f59e0b;border-radius:999px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">View your booking</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 36px 32px;">
                <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;text-align:center;">${copy.note}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 36px;background:#f8fafc;border-top:1px solid #eef2f7;font-size:12px;line-height:1.8;color:#94a3b8;">
                <strong style="color:#475569;">${APP_NAME}</strong><br />
                ${HOTEL_CONTACT.address}<br />
                ${HOTEL_CONTACT.phone} &nbsp;·&nbsp; ${HOTEL_CONTACT.email}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Thank you, ${booking.guestName}`,
    '',
    copy.introText,
    '',
    `Booking reference: ${booking.reference}`,
    `Check-in: ${formatStayDate(booking.checkIn)}`,
    `Check-out: ${formatStayDate(booking.checkOut)} (${nightsLabel})`,
    `Guests: ${guests}`,
    `Meals: ${meal}`,
    `Total: ${formatLKR(booking.totalAmount)}`,
    ...(booking.specialRequests ? ['', `Special requests: ${booking.specialRequests}`] : []),
    '',
    `View your booking: ${link}`,
    '',
    copy.note,
    '',
    `${APP_NAME}, ${HOTEL_CONTACT.address}, ${HOTEL_CONTACT.phone}`,
  ].join('\n');

  return { subject: copy.subject, html, text, link };
}

export async function sendBookingConfirmationEmail(booking: Booking, room: BookingRoom) {
  await deliver({ to: booking.email, ...renderBookingEmail(booking, room) });
}

export async function sendPaymentReceivedEmail(booking: Booking, room: BookingRoom) {
  await deliver({ to: booking.email, ...renderBookingEmail(booking, room, 'paid') });
}

/* ---------------------------------------------------------------------------
   Reply to a Contact Us message: the hotel's answer, with the guest's question quoted below.
   --------------------------------------------------------------------------- */

type ContactQuestion = { name: string; email: string; subject: string | null; message: string; createdAt: Date };

function paragraphs(text: string) {
  return escapeHtml(text).replace(/\n/g, '<br />');
}

export function renderContactReplyEmail(question: ContactQuestion, reply: string) {
  const subject = `Re: ${question.subject || 'Your message'} (${APP_NAME})`;
  const asked = question.createdAt.toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'long', year: 'numeric' });
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef2f7;font-family:${FONT};color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(reply.slice(0, 140))}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:28px 36px;background:#0f172a;">
                <span style="font-size:26px;font-weight:800;letter-spacing:1px;color:#ffffff;">N34</span>
                <span style="font-size:12px;font-weight:600;letter-spacing:5px;color:#fde68a;">&nbsp;MIRISSA</span>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 36px 8px;">
                <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#d97706;">Reply from ${APP_NAME}</div>
                <h1 style="margin:10px 0 16px;font-size:26px;line-height:1.25;color:#0f172a;">Hello ${escapeHtml(question.name)}</h1>
                <p style="margin:0;font-size:15px;line-height:1.75;color:#334155;">${paragraphs(reply)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 32px;">
                <div style="padding:16px 20px;background:#f8fafc;border-left:3px solid #cbd5e1;border-radius:10px;font-size:13px;line-height:1.6;color:#64748b;">
                  <strong style="display:block;margin-bottom:4px;color:#475569;">Your message on ${escapeHtml(asked)}${question.subject ? `: ${escapeHtml(question.subject)}` : ''}</strong>
                  ${paragraphs(question.message)}
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 36px;background:#f8fafc;border-top:1px solid #eef2f7;font-size:12px;line-height:1.8;color:#94a3b8;">
                <strong style="color:#475569;">${APP_NAME}</strong><br />
                ${HOTEL_CONTACT.address}<br />
                ${HOTEL_CONTACT.phone} &nbsp;·&nbsp; ${HOTEL_CONTACT.email}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  const text = `Hello ${question.name},\n\n${reply}\n\n---\nYour message on ${asked}:\n${question.message}\n\n${APP_NAME}, ${HOTEL_CONTACT.address}, ${HOTEL_CONTACT.phone}`;
  return { subject, html, text };
}

export async function sendContactReplyEmail(question: ContactQuestion, reply: string) {
  await deliver({ to: question.email, link: `${appUrl()}/contact`, ...renderContactReplyEmail(question, reply) });
}
