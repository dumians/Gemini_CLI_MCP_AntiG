declare global {
  interface Window {
    __ENV__?: {
      VITE_API_BASE_URL?: string;
    };
  }
}

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.__ENV__?.VITE_API_BASE_URL) {
    return window.__ENV__.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return (import.meta.env.VITE_API_BASE_URL as string).replace(/\/+$/, '');
  }
  return import.meta.env.DEV ? 'http://localhost:3001' : '';
};

const BASE_URL = getBaseUrl();

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('mesh_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}`, 'X-Mesh-Token': token } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('mesh_auth_token');
    window.location.reload();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
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
