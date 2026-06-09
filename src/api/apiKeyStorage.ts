export type StoredApiKey = {
  id: string;
  name: string;
  key: string;
  savedAt: string;
};

const STORAGE_KEY = 'menuwall_stored_api_keys';

export function loadStoredApiKeys(): Record<string, StoredApiKey> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredApiKey>) : {};
  } catch {
    return {};
  }
}

export function saveStoredApiKey(entry: StoredApiKey) {
  const all = loadStoredApiKeys();
  all[entry.id] = entry;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function removeStoredApiKey(id: string | number) {
  const all = loadStoredApiKeys();
  delete all[String(id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
