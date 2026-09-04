declare global {
  interface Window {
    __ENV__?: {
      VITE_API_BASE_URL?: string;
    };
  }
}

export const getBaseUrl = (): string => {
  // 1. Explicit local storage override (useful for debugging or custom orchestrator endpoints)
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('mesh_orchestrator_url');
    if (customUrl && customUrl.trim()) {
      return customUrl.trim().replace(/\/+$/, '');
    }
  }
  // 2. Runtime environment variable injected via /env-config.js (Cloud Run / Docker)
  if (typeof window !== 'undefined' && window.__ENV__?.VITE_API_BASE_URL) {
    return window.__ENV__.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  // 3. Build-time Vite env variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return (import.meta.env.VITE_API_BASE_URL as string).replace(/\/+$/, '');
  }
  // 4. Local browser execution fallback: if running on localhost/127.0.0.1 on non-orchestrator port
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    if (window.location.port !== '3001') {
      return 'http://localhost:3001';
    }
  }
  return import.meta.env.DEV ? 'http://localhost:3001' : '';
};

async function request(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getBaseUrl();
  const token = localStorage.getItem('mesh_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}`, 'X-Mesh-Token': token } : {}),
    ...options.headers,
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('mesh_auth_token');
    window.location.reload();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText || 'An unknown error occurred' }));
    throw new Error(error.error || response.statusText);
  }

  return response.json();
}

export const api = {
  get: (endpoint: string) => request(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};
