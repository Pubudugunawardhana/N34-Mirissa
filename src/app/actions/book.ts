'use server';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export async function createBooking(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const roomId = formData.get('roomId') as string;
  const checkInStr = formData.get('checkIn') as string;
  const checkOutStr = formData.get('checkOut') as string;
  const amountStr = formData.get('amount') as string;

  const booking = await prisma.booking.create({
    data: {
      userId: session.user.id,
      roomId: roomId,
      checkIn: new Date(checkInStr),
      checkOut: new Date(checkOutStr),
      totalAmount: parseFloat(amountStr),
      bookingStatus: 'PENDING',
      paymentStatus: 'PENDING',
    }
  });

  // Redirect to a placeholder payment processing page or user dashboard
  redirect(`/user?bookingSuccess=` + booking.id);
}


