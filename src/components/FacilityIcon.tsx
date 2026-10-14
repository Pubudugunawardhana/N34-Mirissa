import { createElement } from 'react';
import { icons } from 'lucide-react';
// Only the list of names is needed here. ('lucide-react/dynamic' is a client module, so it cannot be read on the server.)
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { FALLBACK_FACILITY_ICON, LEGACY_FACILITY_ICONS, suggestFacilityIcon } from '@/lib/facility-icons';

// Server components only: this pulls in the whole Lucide set, which must not reach the browser.
// Client code uses DynamicIcon from 'lucide-react/dynamic' instead.

type IconKey = keyof typeof icons;

// Lucide stores names as "flower-2" but exports components as "Flower2".
function toComponentKey(name: string) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function findIcon(name: string | null | undefined) {
  if (!name) return null;
  const key = toComponentKey(LEGACY_FACILITY_ICONS[name] ?? name);
  return key in icons ? icons[key as IconKey] : null;
}

// A few Lucide names are aliases with no component of their own; those are left out so every choice renders.
export const FACILITY_ICON_NAMES: string[] = Object.keys(dynamicIconImports).filter((name) => toComponentKey(name) in icons);

export function isFacilityIcon(name: unknown): name is string {
  return typeof name === 'string' && FACILITY_ICON_NAMES.includes(name);
}

type FacilityIconProps = {
  // The icon saved on the facility (a Lucide name), if any.
  name?: string | null;
  // The facility's own name, used to pick an icon when none was saved.
  facilityName?: string | null;
  className?: string;
};

export default function FacilityIcon({ name, facilityName, className = 'h-5 w-5' }: FacilityIconProps) {
  // Looked up from Lucide's existing components, not created here.
  const icon = findIcon(name) ?? findIcon(suggestFacilityIcon(facilityName)) ?? icons[toComponentKey(FALLBACK_FACILITY_ICON) as IconKey];

  return createElement(icon, { className, strokeWidth: 1.7, 'aria-hidden': true });
}
