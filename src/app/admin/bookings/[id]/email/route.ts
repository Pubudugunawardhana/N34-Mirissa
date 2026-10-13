import { auth } from '@/auth';
import { renderBookingEmail } from '@/lib/mail';
import prisma from '@/lib/prisma';

// Shows the confirmation email for a booking exactly as the guest receives it. Admins only.
export async function GET(request: Request, { params }: RouteContext<'/admin/bookings/[id]/email'>) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') return new Response('Not found', { status: 404 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { room: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } },
  });
  if (!booking) return new Response('Not found', { status: 404 });

  const { html } = renderBookingEmail(booking, { name: booking.room.name, coverUrl: booking.room.images[0]?.url });
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
