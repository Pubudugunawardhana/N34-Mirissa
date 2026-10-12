import prisma from '@/lib/prisma';
import { updateSettings } from '@/app/actions/settings';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await prisma.setting.findUnique({
    where: { id: 'default' }
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Site Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage global website content and contact information.</p>
      </div>

      <form action={updateSettings} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">General Content</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Site Title</label>
            <input type="text" name="siteTitle" defaultValue={settings?.siteTitle || 'N34 Mirissa'} required className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">About Us Section Content</label>
            <textarea name="aboutUs" rows={5} defaultValue={settings?.aboutUs || 'Welcome to N34 Mirissa. Experience luxury and comfort at our oceanfront resort.'} required className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500"></textarea>
          </div>

          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2 mt-8">Contact Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
              <input type="text" name="phone" defaultValue={settings?.phone || '+94 77 123 4567'} required className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
              <input type="email" name="email" defaultValue={settings?.email || 'info@n34mirissa.com'} required className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-ocean-500 focus:ring-1 focus:ring-ocean-500" />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button type="submit" className="bg-ocean-600 hover:bg-ocean-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-ocean-600/20">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

