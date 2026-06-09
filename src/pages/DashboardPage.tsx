import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconCategory, IconMenu2, IconPackage, IconWorld } from '@tabler/icons-react';
import { PageHeader } from '../components/PageHeader';
import { tenant } from '../config/tenant';
import { useApi } from '../context/ApiContext';
import {
  filterCategoryRows,
  filterParentCategoryRows,
  filterProductRows,
} from '../utils/tenantFilters';
import { unwrapList } from '../utils/apiData';

type Stat = { label: string; value: number | string; icon: typeof IconPackage; color: string };

const ALL_TARGETS = [
  { label: 'Products', resource: '/products', icon: IconPackage, color: 'blue' },
  { label: 'Categories', resource: '/categories', icon: IconCategory, color: 'green' },
  { label: 'Parent Categories', resource: '/parent-categories', icon: IconCategory, color: 'orange' },
];

const TARGETS = tenant.resourceIds
  ? ALL_TARGETS
  : [
      { label: 'Products', resource: '/products', icon: IconPackage, color: 'blue' },
      { label: 'Categories', resource: '/categories', icon: IconCategory, color: 'green' },
      { label: 'Websites', resource: '/websites', icon: IconWorld, color: 'azure' },
      { label: 'Menus', resource: '/menus', icon: IconMenu2, color: 'orange' },
    ];

export function DashboardPage() {
  const { request } = useApi();
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const results = await Promise.all(
        TARGETS.map(async (t) => {
          const res = await request({
            method: 'GET',
            path: t.resource,
            query: { page: 1, limit: 100 },
          });
          const list = unwrapList((res.data as { data?: unknown })?.data ?? res.data);
          let filtered = list;

          if (t.resource === '/products') filtered = filterProductRows(list);
          else if (t.resource === '/parent-categories') filtered = filterParentCategoryRows(list);
          else if (t.resource === '/categories') {
            const parentRes = await request({
              method: 'GET',
              path: '/parent-categories',
              query: { page: 1, limit: 100 },
            });
            const parentList = filterParentCategoryRows(
              unwrapList((parentRes.data as { data?: unknown })?.data ?? parentRes.data)
            );
            filtered = filterCategoryRows(
              list,
              parentList.map((p) => ({
                id: Number(p.id),
                website_id: Number(p.website_id),
              }))
            );
          }

          return {
            label: t.label,
            value: filtered.length,
            icon: t.icon,
            color: t.color,
          };
        })
      );

      if (!cancelled) {
        setStats(results);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [request]);

  const subtitle = tenant.lockWebsite
    ? `Overview for ${tenant.brandName} (website ${tenant.websiteId})`
    : 'Overview of your menu store';

  return (
    <>
      <PageHeader title="Dashboard" subtitle={subtitle} />
      <div className="page-body">
        <div className="container-xl">
          <div className="row row-deck row-cards">
            {loading &&
              TARGETS.map((_, i) => (
                <div className="col-sm-6 col-lg-3" key={i}>
                  <div className="card">
                    <div className="card-body">
                      <div className="placeholder col-9" />
                      <div className="placeholder col-6 mt-3" />
                    </div>
                  </div>
                </div>
              ))}

            {!loading &&
              stats.map((s) => (
                <div className="col-sm-6 col-lg-3" key={s.label}>
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className={`subheader text-${s.color}`}>{s.label}</div>
                        <div className="ms-auto">
                          <span className={`bg-${s.color}-lt text-${s.color} avatar`}>
                            <s.icon size={22} stroke={1.75} />
                          </span>
                        </div>
                      </div>
                      <div className="h1 mb-0 mt-2">{s.value}</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Quick actions</h3>
                </div>
                <div className="card-body">
                  <div className="btn-list">
                    <Link to="/products" className="btn btn-primary">
                      View all products
                    </Link>
                    <Link to="/categories" className="btn btn-outline-primary">
                      Manage categories
                    </Link>
                    <Link to="/parent-categories" className="btn btn-outline-secondary">
                      Manage parent categories
                    </Link>
                    {tenant.resourceIds ? (
                      <a href="../menu.html" target="_blank" rel="noreferrer" className="btn btn-outline-secondary">
                        Preview menu
                      </a>
                    ) : (
                      <Link to="/websites" className="btn btn-outline-primary">
                        Manage websites
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
