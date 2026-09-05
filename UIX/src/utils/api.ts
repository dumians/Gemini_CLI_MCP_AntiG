import { clientLogger } from './logger';

if (typeof window !== 'undefined') {
  clientLogger.initGlobalErrorLogging();
}

import { getBaseUrl } from './env';
export { getBaseUrl };

async function request(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getBaseUrl();
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('mesh_auth_token') : null;
  const traceId = `uix-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  const startTime = Date.now();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': traceId,
    'X-Trace-ID': traceId,
    ...(token ? { 'Authorization': `Bearer ${token}`, 'X-Mesh-Token': token } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const durationMs = Date.now() - startTime;
    const serverTraceId = response.headers.get('x-trace-id') || traceId;

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      clientLogger.warn(`API Unauthorized on ${endpoint}`, { endpoint, traceId: serverTraceId }, serverTraceId);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('mesh_auth_token');
      }
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText || 'An unknown error occurred' }));
      const errorMsg = error.error || response.statusText;
      clientLogger.error(`API Error ${response.status} on ${endpoint}: ${errorMsg}`, {
        endpoint,
        status: response.status,
        durationMs,
        traceId: serverTraceId
      }, serverTraceId);
      throw new Error(errorMsg);
    }

    return response.json();
  } catch (err: any) {
    if (err.message !== 'Unauthorized') {
      clientLogger.error(`Network or fetch exception on ${endpoint}: ${err.message}`, {
        endpoint,
        durationMs: Date.now() - startTime,
        traceId
      }, traceId);
    }
    throw err;
  }
}

export const api = {
  get: (endpoint: string) => request(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};
