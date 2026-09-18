import { apiFetch } from './client';

export const collaboratorsApi = {
  async findAll(projectId: string) {
    const res = await apiFetch(`/projects/${projectId}/collaborators`);
    if (!res.ok) throw new Error('Failed to fetch collaborators');
    return res.json();
  },

  async add(projectId: string, email: string, role: string) {
    const res = await apiFetch(`/projects/${projectId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to add collaborator');
    }
    return res.json();
  },

  async updateRole(projectId: string, collaboratorId: string, role: string) {
    const res = await apiFetch(`/projects/${projectId}/collaborators/${collaboratorId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update role');
    }
    return res.json();
  },

  async remove(projectId: string, collaboratorId: string) {
    const res = await apiFetch(`/projects/${projectId}/collaborators/${collaboratorId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to remove collaborator');
    }
    return res.json();
  }
};
