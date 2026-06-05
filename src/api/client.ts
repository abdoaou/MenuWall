export type ApiResult<T = unknown> = {
  ok: boolean;
  status: number;
  data: T;
  durationMs: number;
};

export type RequestOptions = {
  baseUrl: string;
  token?: string;
  websiteId?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  tenantHeader?: string;
  method: string;
  path: string;
  body?: unknown;
  formData?: FormData;
  query?: Record<string, string | number | boolean | undefined>;
};

function buildUrl(baseUrl: string, path: string, query?: RequestOptions['query']) {
  const base = baseUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  const full = `${base}${p}`;
  const url = full.startsWith('http')
    ? new URL(full)
    : new URL(full, window.location.origin);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export async function apiRequest<T = unknown>(opts: RequestOptions): Promise<ApiResult<T>> {
  const {
    baseUrl,
    token,
    websiteId,
    apiKey,
    apiKeyHeader = 'x-api-key',
    tenantHeader = 'x-website-id',
    method,
    path,
    body,
    formData,
    query,
  } = opts;

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (websiteId) headers[tenantHeader] = websiteId;
  if (apiKey) headers[apiKeyHeader] = apiKey;

  const init: RequestInit = { method, headers };
  if (formData) {
    init.body = formData;
  } else if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const url = buildUrl(baseUrl, path, query);
  const start = performance.now();
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : 'Network request failed';
    return {
      ok: false,
      status: 0,
      durationMs,
      data: {
        success: false,
        message: 'Could not reach API server',
        error: message,
        hint: 'Check API base URL (Railway: https://menuapi-v2-test.up.railway.app/api/v1) and your network connection.',
      } as T,
    };
  }
  const durationMs = Math.round(performance.now() - start);

  const text = await res.text();
  let data: T;
  try {
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    data = { raw: text } as T;
  }

  return { ok: res.ok, status: res.status, data, durationMs };
}
