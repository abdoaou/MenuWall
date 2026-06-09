import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  IconApi,
  IconCategory,
  IconHome,
  IconLayoutDashboard,
  IconLogout,
  IconMenu2,
  IconPackage,
  IconSettings,
  IconUsers,
  IconWorld,
} from '@tabler/icons-react';
import { DEFAULT_API_BASE } from '../config/api';
import { tenant } from '../config/tenant';
import { useApi } from '../context/ApiContext';

const ALL_NAV = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: IconPackage },
  { to: '/categories', label: 'Categories', icon: IconCategory },
  { to: '/parent-categories', label: 'Parent Categories', icon: IconCategory },
  { to: '/websites', label: 'Websites', icon: IconWorld },
  { to: '/menus', label: 'Menus', icon: IconMenu2 },
  { to: '/settings', label: 'Settings', icon: IconSettings },
  { to: '/api-keys', label: 'API Keys', icon: IconApi },
  { to: '/admins', label: 'Admins', icon: IconUsers },
];

const NAV = tenant.resourceIds
  ? ALL_NAV.filter(({ to }) =>
      ['/', '/products', '/categories', '/parent-categories'].includes(to)
    )
  : ALL_NAV;

export function AdminLayout() {
  const { config, setConfig, logout, isLoggedIn } = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const adminName = config.token ? 'Admin' : 'Guest';

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page">
      {mobileNavOpen && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside className="navbar navbar-vertical navbar-expand-lg" data-bs-theme="dark">
        <div className="container-fluid">
          <div className="d-flex align-items-center w-100 gap-2">
            <button
              className="navbar-toggler"
              type="button"
              aria-controls="sidebar-menu"
              aria-expanded={mobileNavOpen}
              aria-label="Toggle navigation"
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              <span className="navbar-toggler-icon" />
            </button>

            <h1 className="navbar-brand navbar-brand-autodark mb-0">
              <NavLink to="/" className="navbar-brand-link">
                <IconHome size={22} className="navbar-brand-image me-2" stroke={1.8} />
                {tenant.brandName}
              </NavLink>
            </h1>

            {isLoggedIn && (
              <button
                type="button"
                className="btn btn-ghost-secondary btn-sm ms-auto d-lg-none"
                onClick={handleLogout}
              >
                <IconLogout size={18} />
                <span className="ms-1">Sign out</span>
              </button>
            )}
          </div>

          <div
            className={`collapse navbar-collapse${mobileNavOpen ? ' show' : ''}`}
            id="sidebar-menu"
          >
            <ul className="navbar-nav pt-lg-3">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <li className="nav-item" key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  >
                    <span className="nav-link-icon d-md-none d-lg-inline-block">
                      <Icon size={20} stroke={1.75} />
                    </span>
                    <span className="nav-link-title">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <header className="navbar navbar-expand-md d-none d-lg-flex d-print-none">
        <div className="container-xl">
          <div className="navbar-nav flex-row order-md-last ms-auto gap-2 align-items-center">
            <label className="form-label mb-0 me-1 text-secondary small">Website</label>
            <input
              className="form-control form-control-sm"
              style={{ width: 90 }}
              placeholder="ID"
              value={tenant.lockWebsite ? tenant.websiteId : config.websiteId}
              onChange={(e) => {
                if (!tenant.lockWebsite) setConfig({ websiteId: e.target.value });
              }}
              readOnly={tenant.lockWebsite}
              title="x-website-id for menus, settings, API keys"
            />
            <span className="avatar avatar-sm bg-primary-lt">{adminName.charAt(0)}</span>
            <span className="text-secondary small d-none d-xl-inline">{adminName}</span>
            {isLoggedIn && (
              <button type="button" className="btn btn-sm btn-ghost-secondary" onClick={handleLogout}>
                <IconLogout size={18} />
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="page-wrapper">
        <Outlet />
        <footer className="footer footer-transparent d-print-none">
          <div className="container-xl">
            <div className="text-secondary small py-3">
              {tenant.brandName} · <code className="text-secondary">{DEFAULT_API_BASE}</code>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
