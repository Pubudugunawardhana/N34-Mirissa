import Link from 'next/link';
import { notFound } from 'next/navigation';
import RoomForm from '@/components/admin/RoomForm';
import prisma from '@/lib/prisma';

export default async function EditRoomPage({ params }: PageProps<'/admin/rooms/[id]/edit'>) {
  const { id } = await params;

  const [room, features, facilities] = await Promise.all([
    prisma.room.findUnique({
      where: { id },
      include: { images: { orderBy: { position: 'asc' } }, features: true, facilities: true },
    }),
    prisma.feature.findMany({ orderBy: { name: 'asc' } }),
    prisma.facility.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!room) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/rooms" className="text-slate-500 hover:text-ocean-600 transition-colors">
          ← Back to Rooms
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Edit {room.name}</h1>
      </div>

      <RoomForm
        room={{
          id: room.id,
          name: room.name,
          description: room.description,
          price: room.price,
          area: room.area,
          quantity: room.quantity,
          maxAdults: room.maxAdults,
          maxChildren: room.maxChildren,
          isActive: room.isActive,
          images: room.images.map((image) => ({ id: image.id, url: image.url })),
          featureIds: room.features.map((feature) => feature.featureId),
          facilityIds: room.facilities.map((facility) => facility.facilityId),
        }}
        features={features}
        facilities={facilities}
      />
    </div>
  );
}
