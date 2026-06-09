import { useCallback, useEffect, useState } from 'react';
import { useApi } from '../context/ApiContext';
import {
  filterCategoryOptions,
  filterParentCategoryOptions,
  getTenantWebsiteId,
} from '../utils/tenantFilters';
import { unwrapList, type ApiRow } from '../utils/apiData';

export type WebsiteOption = { id: number; name: string };
export type CategoryOption = { id: number; name: string; parent_id: number | null };
export type ParentCategoryOption = { id: number; name: string; website_id: number };

export function useLookupData() {
  const { request } = useApi();
  const [websites, setWebsites] = useState<WebsiteOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [parentCategories, setParentCategories] = useState<ParentCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [wRes, cRes, pRes] = await Promise.all([
      request({ method: 'GET', path: '/websites' }),
      request({ method: 'GET', path: '/categories', query: { format: 'flat' } }),
      request({ method: 'GET', path: '/parent-categories' }),
    ]);

    const pRows = unwrapList((pRes.data as { data?: unknown })?.data ?? pRes.data);
    const allParents = pRows.map((r) => ({
      id: Number(r.id),
      name: String(r.name ?? `Parent #${r.id}`),
      website_id: Number(r.website_id) || 1,
    }));
    setParentCategories(filterParentCategoryOptions(allParents));

    const cRows = unwrapList((cRes.data as { data?: unknown })?.data ?? cRes.data);
    const allCategories = cRows.map((r) => ({
      id: Number(r.id),
      name: String(r.name ?? `Category #${r.id}`),
      parent_id:
        r.parent_id === null || r.parent_id === undefined || r.parent_id === ''
          ? null
          : Number(r.parent_id),
    }));
    setCategories(filterCategoryOptions(allCategories, allParents));

    const wRows = unwrapList((wRes.data as { data?: unknown })?.data ?? wRes.data);
    const wid = getTenantWebsiteId();
    setWebsites(
      wRows
        .map((r) => ({
          id: Number(r.id),
          name: String(r.name ?? `Website #${r.id}`),
        }))
        .filter((w) => (wid ? w.id === wid : true))
    );

    setLoading(false);
  }, [request]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const parentById = useCallback(
    (id: number) => parentCategories.find((p) => p.id === id),
    [parentCategories]
  );

  const categoriesForWebsite = useCallback(
    (websiteId: number | '', parentCategoryId?: number | string) => {
      let list = categories;

      if (websiteId) {
        const wid = Number(websiteId);
        const parentIds = new Set(
          parentCategories.filter((p) => p.website_id === wid).map((p) => p.id)
        );
        list = categories.filter(
          (c) => c.parent_id === null || parentIds.has(c.parent_id)
        );
      }

      if (parentCategoryId) {
        const pid = Number(parentCategoryId);
        list = list.filter((c) => c.parent_id === pid);
      }

      return list;
    },
    [categories, parentCategories]
  );

  const parentCategoriesForWebsite = useCallback(
    (websiteId: number | '') => {
      if (!websiteId) return parentCategories;
      return parentCategories.filter((p) => p.website_id === Number(websiteId));
    },
    [parentCategories]
  );

  return {
    websites,
    categories,
    parentCategories,
    loading,
    refresh,
    parentById,
    categoriesForWebsite,
    parentCategoriesForWebsite,
  };
}

export function rowToForm(row: ApiRow, fields: string[]): Record<string, string> {
  const form: Record<string, string> = {};
  fields.forEach((key) => {
    const v = row[key];
    if (v === null || v === undefined) {
      form[key] = '';
    } else if (typeof v === 'boolean') {
      form[key] = v ? 'true' : 'false';
    } else {
      form[key] = String(v);
    }
  });
  return form;
}
