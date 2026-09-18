import { apiFetch } from './client';

export const versionsApi = {
  async findAll(projectId: string) {
    const res = await apiFetch(`/projects/${projectId}/versions`);
    if (!res.ok) throw new Error('Failed to fetch versions');
    return res.json();
  },

  async findOne(projectId: string, id: string) {
    const res = await apiFetch(`/projects/${projectId}/versions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch version details');
    return res.json();
  },

  async create(projectId: string, data: { commitMessage?: string }) {
    const res = await apiFetch(`/projects/${projectId}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create version');
    }
    return res.json();
  },

  async remove(projectId: string, id: string) {
    const res = await apiFetch(`/projects/${projectId}/versions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete version');
    return res.json();
  }
};
