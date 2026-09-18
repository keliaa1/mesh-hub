import { apiFetch, API_URL, getAuthToken } from './client';

export const filesApi = {
  async upload(versionId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiFetch(`/versions/${versionId}/files`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to upload file');
    }
    return res.json();
  },

  async findByVersion(versionId: string) {
    const res = await apiFetch(`/versions/${versionId}/files`);
    if (!res.ok) throw new Error('Failed to fetch files');
    return res.json();
  },

  async findOne(fileId: string) {
    const res = await apiFetch(`/files/${fileId}`);
    if (!res.ok) throw new Error('Failed to fetch file details');
    return res.json();
  },

  async remove(fileId: string) {
    const res = await apiFetch(`/files/${fileId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete file');
    return res.json();
  },

  getDownloadUrl(fileId: string) {
    // Return a URL that can be used in <a> href or <model-viewer> src
    // For protected files, using an endpoint that requires Authorization header is tricky in <img> or <model-viewer> tags.
    // In a real production app, we'd use signed URLs (like S3 pre-signed URLs).
    // For this implementation, we will append the token as a query param or fetch it manually.
    // Wait, the backend requires JwtAuthGuard which checks the Authorization header.
    // Fetching 3D models via fetch() to get a Blob and creating an object URL is the best approach for SPA.
    return `${API_URL}/files/${fileId}/download`;
  },

  async downloadBlob(fileId: string) {
    const res = await apiFetch(`/files/${fileId}/download`);
    if (!res.ok) throw new Error('Failed to download file');
    return res.blob();
  }
};
