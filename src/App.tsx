import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ApiProvider } from './context/ApiContext';
import { getAdminResources } from './config/adminResources';
import { tenant } from './config/tenant';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { ResourceListPage } from './pages/ResourceListPage';

const Router = tenant.useHashRouter ? HashRouter : BrowserRouter;

export default function App() {
  const resources = getAdminResources();

  return (
    <ApiProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            {resources.map((r) => (
              <Route
                key={r.id}
                path={r.id}
                element={<ResourceListPage resource={r} />}
              />
            ))}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ApiProvider>
  );
}
