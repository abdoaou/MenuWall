import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconCategory,
  IconMenu2,
  IconPackage,
  IconWorld,
} from '@tabler/icons-react';
import { PageHeader } from '../components/PageHeader';
import { useApi } from '../context/ApiContext';
import { unwrapList } from '../utils/apiData';

type Stat = { label: string; value: number | string; icon: typeof IconPackage; color: string };

export function DashboardPage() {
  const { request } = useApi();
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const targets = [
        { label: 'Products', resource: '/products', icon: IconPackage, color: 'blue' },
        { label: 'Categories', resource: '/categories', icon: IconCategory, color: 'green' },
        { label: 'Websites', resource: '/websites', icon: IconWorld, color: 'azure' },
        { label: 'Menus', resource: '/menus', icon: IconMenu2, color: 'orange' },
      ];

      const results = await Promise.all(
        targets.map(async (t) => {
          const res = await request({
            method: 'GET',
            path: t.resource,
            query: { page: 1, limit: 1 },
          });
          const list = unwrapList((res.data as { data?: unknown })?.data ?? res.data);
          const total = (res.data as { data?: { meta?: { total?: number } } })?.data?.meta?.total;
          return {
            label: t.label,
            value: total ?? list.length,
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

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Overview of your menu store" />
      <div className="page-body">
        <div className="container-xl">
          <div className="row row-deck row-cards">
            {loading &&
              [1, 2, 3, 4].map((i) => (
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
                    <Link to="/websites" className="btn btn-outline-primary">
                      Manage websites
                    </Link>
                    <Link to="/categories" className="btn btn-outline-secondary">
                      Manage categories
                    </Link>
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
