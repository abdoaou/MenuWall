import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiRequest, type ApiResult, type RequestOptions } from '../api/client';
import { clearAuth, loadConfig, saveConfig } from '../api/storage';

type Config = ReturnType<typeof loadConfig>;

type ApiContextValue = {
  config: Config;
  setConfig: (partial: Partial<Config>) => void;
  lastResponse: ApiResult | null;
  setLastResponse: (r: ApiResult | null) => void;
  request: (opts: Omit<RequestOptions, 'baseUrl' | 'token' | 'websiteId' | 'apiKey'>) => Promise<ApiResult>;
  logout: () => void;
  isLoggedIn: boolean;
};

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState(loadConfig);
  const [lastResponse, setLastResponse] = useState<ApiResult | null>(null);

  const setConfig = useCallback((partial: Partial<Config>) => {
    setConfigState((prev) => saveConfig({ ...prev, ...partial }));
  }, []);

  const request = useCallback(
    async (opts: Omit<RequestOptions, 'baseUrl' | 'token' | 'websiteId' | 'apiKey'>) => {
      const result = await apiRequest({
        ...opts,
        baseUrl: config.baseUrl,
        token: config.token || undefined,
        websiteId: config.websiteId || undefined,
        apiKey: config.apiKey || undefined,
      });
      setLastResponse(result);
      return result;
    },
    [config]
  );

  const logout = useCallback(() => {
    clearAuth();
    setConfigState(loadConfig());
    setLastResponse(null);
  }, []);

  const value = useMemo(
    () => ({
      config,
      setConfig,
      lastResponse,
      setLastResponse,
      request,
      logout,
      isLoggedIn: Boolean(config.token),
    }),
    [config, lastResponse, request, logout]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used within ApiProvider');
  return ctx;
}
