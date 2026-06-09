const resourceIds = (import.meta.env.VITE_RESOURCE_IDS ?? '')
  .split(',')
  .map((id: string) => id.trim())
  .filter(Boolean);

export const tenant = {
  appTitle: import.meta.env.VITE_APP_TITLE || 'MenuWall Admin',
  brandName: import.meta.env.VITE_BRAND_NAME || 'MenuWall',
  websiteId: import.meta.env.VITE_WEBSITE_ID || '',
  lockWebsite: import.meta.env.VITE_LOCK_WEBSITE === 'true',
  useHashRouter: import.meta.env.VITE_USE_HASH_ROUTER === 'true',
  resourceIds: resourceIds.length ? resourceIds : null as string[] | null,
};

export const isCholoTenant = tenant.lockWebsite && Boolean(tenant.websiteId);

export const NAV_PATHS = tenant.resourceIds
  ? ['/', '/products', '/categories', '/parent-categories']
  : null;
