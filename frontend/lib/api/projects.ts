import { apiFetch } from './client';

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function extractErrorMessage(res: Response, fallback: string) {
  try {
    const err = await res.json();
    return err.message || fallback;
  } catch {
    return fallback;
  }
}

export interface Project {
  id: string;
  title: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; username: string; avatar: string | null };
  collaborators?: any[];
  versions?: any[];
}

export const projectsApi = {
  async findAll(page = 1, limit = 10, search = '', sort = '', order = 'desc') {
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(sort && { sort, order }),
    });
    const res = await apiFetch(`/projects?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async findOne(id: string) {
    const res = await apiFetch(`/projects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch project details');
    return res.json();
  },

  async create(data: { title: string; description?: string; visibility: string }) {
    const res = await apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create project');
    }
    return res.json();
  },

  async update(id: string, data: Partial<Project>) {
    const res = await apiFetch(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  async remove(id: string) {
    const res = await apiFetch(`/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },

  // Push the current working file (matches the Blender add-on's push flow)
  async push(id: string, file: File, commitMessage?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (commitMessage) formData.append('commitMessage', commitMessage);

    const res = await apiFetch(`/projects/${id}/push`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Push failed'));
    }
    return res.json();
  },

  // Download the current working file ("pull" in the Blender add-on)
  async downloadCurrent(id: string, filename: string) {
    const res = await apiFetch(`/projects/${id}/download`);
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Download failed'));
    }
    triggerBlobDownload(await res.blob(), filename);
  },

  async downloadVersion(id: string, versionNumber: number, filename: string) {
    const res = await apiFetch(`/projects/${id}/versions/${versionNumber}/download`);
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Download failed'));
    }
    triggerBlobDownload(await res.blob(), filename);
  },

  async restoreVersion(id: string, versionNumber: number) {
    const res = await apiFetch(`/projects/${id}/versions/${versionNumber}/restore`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Restore failed'));
    }
    return res.json();
  }
};
