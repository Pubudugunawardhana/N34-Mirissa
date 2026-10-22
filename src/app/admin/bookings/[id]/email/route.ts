import { auth } from '@/auth';
import { renderBookingEmail } from '@/lib/mail';
import prisma from '@/lib/prisma';

// Shows a booking email exactly as the guest receives it: the booking email, or with ?type=payment the payment receipt. Admins only.
export async function GET(request: Request, { params }: RouteContext<'/admin/bookings/[id]/email'>) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') return new Response('Not found', { status: 404 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { charges: { orderBy: { createdAt: 'asc' } }, mealChoices: { orderBy: { meal: 'asc' } }, room: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
  });
  if (!booking) return new Response('Not found', { status: 404 });

  const kind = new URL(request.url).searchParams.get('type') === 'payment' ? 'paid' : 'received';
  const { html } = renderBookingEmail(booking, { name: booking.room.name, coverUrl: booking.room.images[0]?.url }, kind);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
