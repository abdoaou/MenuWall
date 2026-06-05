import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert } from '../components/Alert';
import { useApi } from '../context/ApiContext';

export function LoginPage() {
  const { request, setConfig, isLoggedIn } = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isLoggedIn) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body: Record<string, string> = { password };
      if (email.includes('@')) body.email = email.trim();
      else body.username = email.trim();

      const res = await request({ method: 'POST', path: '/auth/login', body });
      if (!res.ok) {
        const msg = (res.data as { message?: string })?.message ?? 'Login failed';
        setError(msg);
        return;
      }

      const data = res.data as {
        token?: string;
        data?: { accessToken?: string; refreshToken?: string; admin?: { websiteId?: number } };
      };
      const token = data.token ?? data.data?.accessToken ?? '';
      const refresh = data.data?.refreshToken ?? '';
      const partial: { token: string; refreshToken: string; websiteId?: string } = { token, refreshToken: refresh };
      if (data.data?.admin?.websiteId) {
        partial.websiteId = String(data.data.admin.websiteId);
      }
      setConfig(partial);
      navigate(from, { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <h1 className="h2">MenuWall Admin</h1>
          <p className="text-secondary">Sign in to manage your menu</p>
        </div>
        <div className="card card-md">
          <div className="card-body">
            <h2 className="h2 text-center mb-4">Login to your account</h2>
            <Alert type="danger" message={error} onClose={() => setError('')} />
            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label className="form-label">Email or username</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                />
              </div>
              <div className="form-footer">
                <button type="submit" className="btn btn-primary w-100" disabled={busy}>
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
