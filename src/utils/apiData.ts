import { API_ROOT } from '../config/api';

export type ApiRow = Record<string, unknown>;

export function unwrapList(data: unknown): ApiRow[] {
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  if (Array.isArray(d)) return d as ApiRow[];
  if (Array.isArray(d.items)) return d.items as ApiRow[];
  if (d.data) return unwrapList(d.data);
  return [];
}

export function unwrapMeta(data: unknown): { total?: number; page?: number } {
  if (!data || typeof data !== 'object') return {};
  const d = data as Record<string, unknown>;
  if (d.meta && typeof d.meta === 'object') return d.meta as { total?: number; page?: number };
  if (d.data && typeof d.data === 'object') return unwrapMeta(d.data);
  return {};
}

export function assetUrl(path: unknown): string {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('http')) return path;
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}

export function formatDate(value: unknown): string {
  if (!value) return '—';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export function formatMoney(value: unknown, sale?: unknown): string {
  const price = Number(value);
  const salePrice = sale !== undefined && sale !== null && sale !== '' ? Number(sale) : null;
  if (salePrice !== null && !Number.isNaN(salePrice) && salePrice < price) {
    return `$${salePrice.toFixed(2)}`;
  }
  if (!Number.isNaN(price)) return `$${price.toFixed(2)}`;
  return '—';
}

export function rowText(row: ApiRow, ...keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (v !== undefined && v !== null && v !== '') return String(v);
  }
  return '—';
}
