export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Gets the JWT token from localStorage.
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

/**
 * Custom fetch wrapper that automatically adds the Authorization header
 * and handles common error responses.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type if we're sending FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete (headers as Record<string, string>)['Content-Type'];
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle unauthorized by removing token (if it's a 401 on a protected route)
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      // Only redirect if not already on login/register
      if (!window.location.pathname.startsWith('/auth/')) {
        window.location.href = '/auth/login';
      }
    }
  }

  return response;
}
