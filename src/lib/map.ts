// The hotel's pin on the map, saved in Site Settings as "lat,lng". Used by the Contact page and the admin.

export type MapPin = { lat: number; lng: number };

const NUMBER = '(-?\\d{1,3}(?:\\.\\d+)?)';

// Where coordinates can sit in a Google Maps link, most precise first: the place itself (!3d…!4d…),
// the map centre (@lat,lng), then the search or destination in the query string.
const PATTERNS = [
  new RegExp(`!3d${NUMBER}!4d${NUMBER}`),
  new RegExp(`@${NUMBER},${NUMBER}`),
  new RegExp(`[?&](?:q|query|ll|destination|center)=${NUMBER}(?:,|%2C)\\s*${NUMBER}`, 'i'),
  new RegExp(`^\\s*${NUMBER}\\s*,\\s*${NUMBER}\\s*$`),
];

// Reads coordinates or a full Google Maps link. Short links (maps.app.goo.gl) hold no coordinates, so they give null.
export function parseMapLocation(input: string | null | undefined): MapPin | null {
  if (!input) return null;
  for (const pattern of PATTERNS) {
    const match = input.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}

export function pinText(pin: MapPin) {
  return `${pin.lat.toFixed(6)},${pin.lng.toFixed(6)}`;
}

// Google's embeddable map; needs no API key.
export function mapEmbedUrl(query: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

// Opens Google Maps (the app on phones) with the route to the hotel ready.
export function directionsUrl(query: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function mapSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// Places guests ask about. Far ones carry a rough travel time, since a straight line says little about the road.
export const NEARBY = [
  { name: 'Mirissa Beach', lat: 5.944, lng: 80.459, note: null },
  { name: 'Coconut Tree Hill', lat: 5.9374, lng: 80.4669, note: null },
  { name: 'Galle Fort', lat: 6.0262, lng: 80.217, note: 'about 45 min by car' },
  { name: 'Bandaranaike Airport', lat: 7.1808, lng: 79.8841, note: 'about 3 h by car' },
];

// Straight-line distance between two points (haversine).
export function distanceKm(a: MapPin, b: MapPin) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number) {
  if (km < 1) return `≈ ${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return km < 10 ? `≈ ${km.toFixed(1)} km` : `≈ ${Math.round(km)} km`;
}
