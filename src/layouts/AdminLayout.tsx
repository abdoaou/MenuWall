import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
import { useApi } from '../context/ApiContext';

const NAV = [
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

export function AdminLayout() {
  const { config, setConfig, logout, isLoggedIn } = useApi();
  const navigate = useNavigate();
  const adminName = config.token ? 'Admin' : 'Guest';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page">
      <aside className="navbar navbar-vertical navbar-expand-lg" data-bs-theme="dark">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#sidebar-menu"
            aria-controls="sidebar-menu"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <h1 className="navbar-brand navbar-brand-autodark">
            <NavLink to="/" className="navbar-brand-link">
              <IconHome size={22} className="navbar-brand-image me-2" stroke={1.8} />
              MenuWall
            </NavLink>
          </h1>

          <div className="collapse navbar-collapse" id="sidebar-menu">
            <ul className="navbar-nav pt-lg-3">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <li className="nav-item" key={to}>
                  <NavLink
                    to={to}
                    end={end}
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
              value={config.websiteId}
              onChange={(e) => setConfig({ websiteId: e.target.value })}
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
              Menu API · <code className="text-secondary">{DEFAULT_API_BASE}</code>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
