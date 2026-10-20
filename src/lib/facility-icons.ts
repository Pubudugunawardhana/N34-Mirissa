// Picks a Lucide icon for a facility or a room feature from its name. Plain data and string matching only,
// so the same rules run in the admin form (as you type) and on the server.

export const FALLBACK_FACILITY_ICON = 'sparkles';

// Lucide icon name -> words that should bring it up. Multi-word phrases win over single words,
// so "mini bar" is a fridge, not a cocktail glass.
const ICON_KEYWORDS: Record<string, string[]> = {
  wifi: ['wifi', 'wi fi', 'internet', 'wireless', 'broadband'],
  'air-vent': ['air conditioner', 'air conditioning', 'air conditioned', 'air con', 'aircon', 'ac', 'a c'],
  heater: ['heater', 'heating'],
  fan: ['fan', 'ceiling fan'],
  tv: ['tv', 'television', 'smart tv', 'cable', 'satellite', 'netflix'],
  'shower-head': ['hot water', 'geyser', 'shower', 'rain shower'],
  bath: ['bath', 'bathtub', 'tub', 'jacuzzi', 'bathroom'],
  toilet: ['toilet'],
  'waves-ladder': ['pool', 'swimming', 'swim', 'private pool', 'plunge pool', 'pool view'],
  'flower-2': ['spa', 'massage', 'sauna', 'wellness', 'ayurveda', 'steam', 'yoga', 'meditation'],
  dumbbell: ['gym', 'fitness', 'workout', 'exercise'],
  croissant: ['breakfast'],
  utensils: ['restaurant', 'dining', 'dining table', 'dining area', 'dinner', 'lunch', 'meal', 'meals', 'food', 'buffet'],
  'cooking-pot': ['kitchen', 'kitchenette', 'cooking', 'stove'],
  microwave: ['microwave', 'oven'],
  refrigerator: ['mini bar', 'minibar', 'fridge', 'refrigerator'],
  martini: ['bar', 'cocktail', 'cocktails', 'lounge'],
  wine: ['wine'],
  coffee: ['coffee', 'tea', 'kettle', 'espresso'],
  'glass-water': ['drinking water', 'water bottle', 'mineral water', 'bottled water'],
  'square-parking': ['parking', 'car park', 'garage'],
  car: ['car rental', 'taxi', 'car'],
  bus: ['shuttle', 'bus', 'transport', 'transfer'],
  plane: ['airport', 'airport shuttle', 'airport transfer'],
  bike: ['bicycle', 'bike', 'cycling'],
  vault: ['safe', 'locker', 'deposit box', 'safety box', 'safe box'],
  lock: ['lock', 'key card', 'secure'],
  cctv: ['cctv', 'security camera', 'surveillance'],
  'shield-check': ['security', 'guard'],
  'washing-machine': ['laundry', 'washing', 'washing machine', 'dry cleaning'],
  shirt: ['ironing', 'iron', 'wardrobe', 'closet'],
  'concierge-bell': ['room service', 'concierge', 'reception', 'front desk', 'service'],
  'brush-cleaning': ['housekeeping', 'cleaning', 'daily cleaning'],
  sunset: ['sea view', 'ocean view', 'beach view', 'view', 'sunset'],
  umbrella: ['beach', 'beachfront', 'beach access'],
  sun: ['sun deck', 'sunbed', 'sun bed', 'terrace'],
  trees: ['garden', 'garden view', 'park', 'nature'],
  'door-open': ['balcony', 'patio', 'private entrance'],
  'bed-double': ['bed', 'beds', 'bedroom', 'bedrooms', 'king bed', 'queen bed', 'double bed', 'twin bed', 'twin beds', 'bunk bed', 'extra bed'],
  sofa: ['sofa', 'seating', 'living room', 'couch'],
  'lamp-desk': ['desk', 'work desk', 'workspace', 'study'],
  'arrow-up-down': ['lift', 'elevator'],
  phone: ['phone', 'telephone'],
  plug: ['socket', 'power', 'charging', 'adapter'],
  wind: ['hair dryer', 'hairdryer', 'dryer'],
  'towel-rack': ['towel', 'towels', 'linen'],
  'soap-dispenser-droplet': ['toiletries', 'soap', 'shampoo'],
  'paw-print': ['pet', 'pets', 'pet friendly', 'dog'],
  baby: ['baby', 'kids', 'children', 'child', 'crib', 'cot', 'family'],
  accessibility: ['wheelchair', 'accessible', 'disabled'],
  'cigarette-off': ['non smoking', 'no smoking', 'smoke free'],
  cigarette: ['smoking'],
  flame: ['bbq', 'barbecue', 'fireplace', 'grill'],
  sailboat: ['boat', 'sailing', 'whale watching', 'cruise'],
  fish: ['fishing', 'snorkeling', 'snorkelling', 'diving'],
  volleyball: ['sports', 'volleyball'],
  'gamepad-2': ['game', 'games', 'playstation'],
  music: ['music', 'live music', 'speaker'],
  'book-open': ['library', 'books'],
  briefcase: ['business', 'meeting', 'conference'],
  printer: ['printer', 'printing'],
  map: ['tour', 'tours', 'excursion', 'guide'],
  'credit-card': ['card payment', 'credit card'],
  clock: ['24 hour', '24h', '24 7'],
  'briefcase-medical': ['first aid', 'doctor', 'medical'],
};

// Longest phrase first, so the most specific keyword decides.
const KEYWORDS = Object.entries(ICON_KEYWORDS)
  .flatMap(([icon, keywords]) => keywords.map((keyword) => ({ icon, keyword })))
  .sort((a, b) => b.keyword.length - a.keyword.length);

// "Wi-Fi (free)" -> " wi fi free ": lower case, punctuation to spaces, padded so whole words can be matched.
function normalise(name: string) {
  return ` ${name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
}

// Returns the best icon for the name, or null when no keyword matches.
export function suggestFacilityIcon(name: string | null | undefined) {
  if (!name) return null;

  const text = normalise(name);
  return KEYWORDS.find(({ keyword }) => text.includes(` ${keyword} `))?.icon ?? null;
}

// The first icon set used short keys of its own. Facilities saved back then still carry them.
export const LEGACY_FACILITY_ICONS: Record<string, string> = {
  ac: 'air-vent',
  shower: 'shower-head',
  pool: 'waves-ladder',
  spa: 'flower-2',
  gym: 'dumbbell',
  dining: 'utensils',
  minibar: 'refrigerator',
  parking: 'square-parking',
  safe: 'vault',
  view: 'sunset',
  bed: 'bed-double',
  laundry: 'washing-machine',
  service: 'concierge-bell',
  star: 'sparkles',
};

// Shown in the admin form as one-click choices.
export const POPULAR_FACILITY_ICONS = [
  { icon: 'wifi', label: 'WiFi' },
  { icon: 'air-vent', label: 'Air conditioner' },
  { icon: 'tv', label: 'Television' },
  { icon: 'shower-head', label: 'Hot water' },
  { icon: 'bath', label: 'Bath' },
  { icon: 'waves-ladder', label: 'Pool' },
  { icon: 'flower-2', label: 'Spa' },
  { icon: 'dumbbell', label: 'Gym' },
  { icon: 'utensils', label: 'Restaurant' },
  { icon: 'croissant', label: 'Breakfast' },
  { icon: 'coffee', label: 'Tea & coffee' },
  { icon: 'refrigerator', label: 'Mini bar' },
  { icon: 'martini', label: 'Bar' },
  { icon: 'square-parking', label: 'Parking' },
  { icon: 'vault', label: 'Safe' },
  { icon: 'washing-machine', label: 'Laundry' },
  { icon: 'concierge-bell', label: 'Room service' },
  { icon: 'sunset', label: 'Sea view' },
  { icon: 'door-open', label: 'Balcony' },
  { icon: 'trees', label: 'Garden' },
  { icon: 'bed-double', label: 'Bed' },
  { icon: 'sofa', label: 'Sofa' },
  { icon: 'lamp-desk', label: 'Desk' },
  { icon: 'fan', label: 'Fan' },
];

export const ALL_KEYWORD_ICONS = Object.keys(ICON_KEYWORDS);
