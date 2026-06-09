import { DEFAULT_API_BASE } from '../config/api';
import { tenant } from '../config/tenant';

const KEYS = {
  baseUrl: 'menuwall_base_url',
  token: 'menuwall_token',
  refreshToken: 'menuwall_refresh_token',
  websiteId: 'menuwall_website_id',
  apiKey: 'menuwall_api_key',
} as const;

const LEGACY_LOCAL_BASES = ['/api/v1', 'http://localhost:3000/api/v1'];

function resolveBaseUrl(): string {
  const stored = localStorage.getItem(KEYS.baseUrl);
  if (!stored) {
    localStorage.setItem(KEYS.baseUrl, DEFAULT_API_BASE);
    return DEFAULT_API_BASE;
  }
  if (LEGACY_LOCAL_BASES.includes(stored)) {
    localStorage.setItem(KEYS.baseUrl, DEFAULT_API_BASE);
    return DEFAULT_API_BASE;
  }
  return stored;
}

export function loadConfig() {
  const websiteId = localStorage.getItem(KEYS.websiteId) || tenant.websiteId || '';
  if (tenant.lockWebsite && tenant.websiteId && !localStorage.getItem(KEYS.websiteId)) {
    localStorage.setItem(KEYS.websiteId, tenant.websiteId);
  }
  return {
    baseUrl: resolveBaseUrl(),
    token: localStorage.getItem(KEYS.token) || '',
    refreshToken: localStorage.getItem(KEYS.refreshToken) || '',
    websiteId: tenant.lockWebsite ? tenant.websiteId || websiteId : websiteId,
    apiKey: localStorage.getItem(KEYS.apiKey) || '',
  };
}

export function saveConfig(partial: Partial<ReturnType<typeof loadConfig>>) {
  const current = loadConfig();
  const next = { ...current, ...partial };
  if (tenant.lockWebsite && tenant.websiteId) {
    next.websiteId = tenant.websiteId;
  }
  localStorage.setItem(KEYS.baseUrl, next.baseUrl);
  localStorage.setItem(KEYS.token, next.token);
  localStorage.setItem(KEYS.refreshToken, next.refreshToken);
  localStorage.setItem(KEYS.websiteId, next.websiteId);
  localStorage.setItem(KEYS.apiKey, next.apiKey);
  return next;
}

export function clearAuth() {
  saveConfig({ token: '', refreshToken: '' });
}
