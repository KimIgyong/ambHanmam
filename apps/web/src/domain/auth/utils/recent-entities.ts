const STORAGE_KEY = 'amb_recent_entities';
const MAX_ITEMS = 5;

export interface RecentEntity {
  entityId: string;
  code: string;
  name: string;
  nameEn: string | null;
  country: string;
}

export function getRecentEntities(): RecentEntity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function addRecentEntity(entity: RecentEntity): void {
  try {
    const list = getRecentEntities().filter((e) => e.entityId !== entity.entityId);
    list.unshift(entity);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {
    // localStorage unavailable (e.g. private browsing)
  }
}
