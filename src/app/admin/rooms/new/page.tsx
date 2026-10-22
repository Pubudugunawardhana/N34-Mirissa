import Link from 'next/link';
import RoomForm from '@/components/admin/RoomForm';
import prisma from '@/lib/prisma';

export default async function AddRoomPage() {
  const [features, facilities] = await Promise.all([
    prisma.feature.findMany({ orderBy: { name: 'asc' } }),
    prisma.facility.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/rooms" className="text-slate-500 hover:text-ocean-600 transition-colors">
          ← Back to Rooms
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Add New Room</h1>
      </div>

      <RoomForm features={features} facilities={facilities} />
    </div>
  );
}
