import { apiFetch } from './client';

export const authApi = {
  async login(email: string, password: string) {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  },

  async register(username: string, email: string, password: string) {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Registration failed');
    }
    return res.json();
  },

  async getMe() {
    const res = await apiFetch('/users/me', {
      method: 'GET',
    });
    if (!res.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return res.json();
  }
};
