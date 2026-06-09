import { tenant } from '../config/tenant';
import type { ApiRow } from './apiData';

export function getTenantWebsiteId(): number | null {
  if (!tenant.lockWebsite || !tenant.websiteId) return null;
  const id = Number(tenant.websiteId);
  return Number.isNaN(id) ? null : id;
}

export function filterParentCategoryRows(rows: ApiRow[]): ApiRow[] {
  const wid = getTenantWebsiteId();
  if (!wid) return rows;
  return rows.filter((row) => Number(row.website_id) === wid);
}

export function filterCategoryRows(
  rows: ApiRow[],
  parentCategories: { id: number; website_id: number }[]
): ApiRow[] {
  const wid = getTenantWebsiteId();
  if (!wid) return rows;

  const parentIds = new Set(
    parentCategories.filter((p) => p.website_id === wid).map((p) => p.id)
  );

  return rows.filter((row) => {
    if (row.website_id != null && row.website_id !== '') {
      return Number(row.website_id) === wid;
    }
    if (row.parent_id != null && row.parent_id !== '') {
      return parentIds.has(Number(row.parent_id));
    }
    return false;
  });
}

export function filterProductRows(rows: ApiRow[]): ApiRow[] {
  const wid = getTenantWebsiteId();
  if (!wid) return rows;

  return rows.filter((row) => {
    if (row.website_id == null || row.website_id === '') return true;
    return Number(row.website_id) === wid;
  });
}

export function filterResourceRows(
  resourceId: string,
  rows: ApiRow[],
  parentCategories: { id: number; website_id: number }[]
): ApiRow[] {
  if (resourceId === 'parent-categories') return filterParentCategoryRows(rows);
  if (resourceId === 'categories') return filterCategoryRows(rows, parentCategories);
  return rows;
}

export function filterParentCategoryOptions<T extends { website_id: number }>(items: T[]): T[] {
  const wid = getTenantWebsiteId();
  if (!wid) return items;
  return items.filter((item) => item.website_id === wid);
}

export function filterCategoryOptions<
  T extends { id: number; parent_id: number | null },
>(categories: T[], parentCategories: { id: number; website_id: number }[]): T[] {
  const wid = getTenantWebsiteId();
  if (!wid) return categories;

  const parentIds = new Set(
    parentCategories.filter((p) => p.website_id === wid).map((p) => p.id)
  );

  return categories.filter(
    (cat) => cat.parent_id === null || parentIds.has(cat.parent_id)
  );
}
