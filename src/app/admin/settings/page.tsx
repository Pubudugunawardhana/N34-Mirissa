import SettingsForm from '@/components/admin/SettingsForm';
import { SETTINGS_ID, getSiteSettings } from '@/lib/hotel';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  // The saved row for the boxes, and the site's defaults to fill in what was never set.
  const [saved, site] = await Promise.all([prisma.setting.findUnique({ where: { id: SETTINGS_ID } }), getSiteSettings()]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Site Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Contact details, social media, and switches for taking booking or the website offline.</p>
      </div>

      <SettingsForm
        values={{
          address: site.address,
          phone: site.phone,
          email: site.email,
          whatsapp: saved?.whatsapp ?? '',
          facebookUrl: saved?.facebookUrl ?? '',
          instagramUrl: saved?.instagramUrl ?? '',
          tiktokUrl: saved?.tiktokUrl ?? '',
          youtubeUrl: saved?.youtubeUrl ?? '',
          tripadvisorUrl: saved?.tripadvisorUrl ?? '',
          bookingsPaused: site.bookingsPaused,
          bookingsPausedMessage: saved?.bookingsPausedMessage ?? '',
          isMaintenance: site.maintenance,
          maintenanceMessage: saved?.maintenanceMessage ?? '',
        }}
      />
    </div>
  );
}
