import prisma from '@/lib/prisma';
import { SETTINGS_ID } from '@/lib/hotel';

// Read on every page request by the proxy, so it is kept in memory for a few seconds
// instead of costing a database round trip each time. A change shows within this time.
const CACHE_MS = 10_000;

let cached: { maintenance: boolean; at: number } | null = null;

export async function isMaintenanceOn() {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.maintenance;
  try {
    const settings = await prisma.setting.findUnique({ where: { id: SETTINGS_ID }, select: { isMaintenance: true } });
    cached = { maintenance: settings?.isMaintenance ?? false, at: Date.now() };
  } catch (error) {
    // Unreachable database: keep the last known state rather than locking everyone out.
    console.error('Could not read maintenance mode', error);
    cached = { maintenance: cached?.maintenance ?? false, at: Date.now() };
  }
  return cached.maintenance;
}

// Called after the admin saves Site Settings, so this server picks up the change straight away.
export function forgetSiteStatus() {
  cached = null;
}
