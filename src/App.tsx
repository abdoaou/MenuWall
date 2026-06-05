import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ApiProvider } from './context/ApiContext';
import { ADMIN_RESOURCES } from './config/adminResources';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { ResourceListPage } from './pages/ResourceListPage';

export default function App() {
  return (
    <ApiProvider>
      <BrowserRouter>
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
            {ADMIN_RESOURCES.map((r) => (
              <Route
                key={r.id}
                path={r.id}
                element={<ResourceListPage resource={r} />}
              />
            ))}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ApiProvider>
  );
}
