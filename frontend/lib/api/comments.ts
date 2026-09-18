import { apiFetch } from './client';

export const commentsApi = {
  async findByProject(projectId: string) {
    const res = await apiFetch(`/projects/${projectId}/comments`);
    if (!res.ok) throw new Error('Failed to fetch project comments');
    return res.json();
  },

  async findByVersion(versionId: string) {
    const res = await apiFetch(`/versions/${versionId}/comments`);
    if (!res.ok) throw new Error('Failed to fetch version comments');
    return res.json();
  },

  async createForProject(projectId: string, content: string) {
    const res = await apiFetch(`/projects/${projectId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  },

  async createForVersion(versionId: string, content: string) {
    const res = await apiFetch(`/versions/${versionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  },

  async update(commentId: string, content: string) {
    const res = await apiFetch(`/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to update comment');
    return res.json();
  },

  async remove(commentId: string) {
    const res = await apiFetch(`/comments/${commentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete comment');
    return res.json();
  }
};
