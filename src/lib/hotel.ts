import { parseMapLocation, pinText } from '@/lib/map';
import prisma from '@/lib/prisma';

// The one row Site Settings saves to.
export const SETTINGS_ID = 'default';

// Shown until the admin fills these in under Site Settings.
const FALLBACK = {
  address: 'N34 Mirissa, Beach Road, Mirissa, Sri Lanka',
  phone: '+94 77 123 4567',
  email: 'info@n34mirissa.com',
  bookingsPausedMessage: 'Online booking is paused for a short while. Please call or message us and we will book your stay.',
  maintenanceMessage: 'We are making a few improvements to our website. Please check back soon, or contact us directly.',
  roomServiceHours: '7:00 am – 10:00 pm',
  roomServiceNote: 'Meals and drinks brought to your room, fresh from our kitchen.',
};

export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  tripadvisor?: string;
  // A link to chat on WhatsApp, built from the saved number.
  whatsapp?: string;
};

export function whatsappLink(number: string) {
  const digits = number.replace(/\D/g, '');
  // A Sri Lankan number written as 07X… becomes 947X…
  return `https://wa.me/${digits.startsWith('0') ? `94${digits.slice(1)}` : digits}`;
}

// Everything the public site needs from Site Settings, with defaults for what is left empty.
export async function getSiteSettings() {
  const settings = await prisma.setting.findUnique({ where: { id: SETTINGS_ID } });

  const social: SocialLinks = {};
  if (settings?.facebookUrl) social.facebook = settings.facebookUrl;
  if (settings?.instagramUrl) social.instagram = settings.instagramUrl;
  if (settings?.tiktokUrl) social.tiktok = settings.tiktokUrl;
  if (settings?.youtubeUrl) social.youtube = settings.youtubeUrl;
  if (settings?.tripadvisorUrl) social.tripadvisor = settings.tripadvisorUrl;
  if (settings?.whatsapp) social.whatsapp = whatsappLink(settings.whatsapp);

  const address = settings?.address || FALLBACK.address;
  const mapPin = parseMapLocation(settings?.googleMap);

  return {
    aboutUs: settings?.aboutUs || null,
    address,
    // The pin from Site Settings; the map falls back to searching the address.
    mapPin,
    mapQuery: mapPin ? pinText(mapPin) : address,
    phone: settings?.phone || FALLBACK.phone,
    email: settings?.email || FALLBACK.email,
    whatsapp: settings?.whatsapp || null,
    social,
    bookingsPaused: settings?.bookingsPaused ?? false,
    bookingsPausedMessage: settings?.bookingsPausedMessage || FALLBACK.bookingsPausedMessage,
    maintenance: settings?.isMaintenance ?? false,
    maintenanceMessage: settings?.maintenanceMessage || FALLBACK.maintenanceMessage,
    roomServiceHours: settings?.roomServiceHours || FALLBACK.roomServiceHours,
    roomServiceNote: settings?.roomServiceNote || FALLBACK.roomServiceNote,
  };
}

export type SiteSettings = Awaited<ReturnType<typeof getSiteSettings>>;

// The hotel's public contact details (receipt, emails, contact page).
export async function getHotelContact() {
  const { address, phone, email, social, mapPin, mapQuery } = await getSiteSettings();
  return { address, phone, email, social, mapPin, mapQuery };
}
