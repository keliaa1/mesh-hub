"use client";

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { projectsApi } from '@/lib/api/projects';
import { collaboratorsApi } from '@/lib/api/collaborators';
import { useAuth } from '@/lib/auth/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';

export default function ProjectSettings() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit project state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Add collaborator state
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState('VIEWER');
  const [addingCollab, setAddingCollab] = useState(false);
  const [collabError, setCollabError] = useState('');

  // Delete project
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [proj, collabs] = await Promise.all([
        projectsApi.findOne(id),
        collaboratorsApi.findAll(id).catch(() => []),
      ]);
      setProject(proj);
      setTitle(proj.title);
      setDescription(proj.description || '');
      setVisibility(proj.visibility);
      setCollaborators(collabs);
    } catch (err: any) {
      setError('Failed to load project settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await projectsApi.update(id, { title, description, visibility } as any);
      setSaveMsg('Project settings saved!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveMsg('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCollab(true);
    setCollabError('');
    try {
      await collaboratorsApi.add(id, collabEmail, collabRole);
      setCollabEmail('');
      await loadData();
    } catch (err: any) {
      setCollabError(err.message || 'Failed to add collaborator');
    } finally {
      setAddingCollab(false);
    }
  };

  const handleRemoveCollab = async (collabId: string) => {
    if (!confirm('Remove this collaborator?')) return;
    try {
      await collaboratorsApi.remove(id, collabId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove collaborator');
    }
  };

  const handleRoleChange = async (collabId: string, role: string) => {
    try {
      await collaboratorsApi.updateRole(id, collabId, role);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== project?.title) {
      alert('Project name does not match. Please type the exact project name to confirm.');
      return;
    }
    setDeleting(true);
    try {
      await projectsApi.remove(id);
      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
      setDeleting(false);
    }
  };

  const isOwner = user?.id === project?.ownerId;

  if (loading)
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white" />
          </div>
        </AppShell>
      </ProtectedRoute>
    );

  if (error || !project)
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="p-10 text-center font-semibold text-[#ff6b81]">
            {error || 'Project not found'}
          </div>
        </AppShell>
      </ProtectedRoute>
    );

  if (!isOwner)
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="p-10 text-center font-semibold text-[#ff6b81]">
            Only the project owner can access settings.
          </div>
        </AppShell>
      </ProtectedRoute>
    );

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-6 py-8 sm:px-10">
          <div>
            <Link href={`/projects/${id}`} className="text-sm font-semibold text-[#8e8e8e] hover:text-white">
              ← Back to Project
            </Link>
            <h1
              className="mt-4 text-3xl tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
            >
              Project Settings
            </h1>
          </div>

          {/* General Settings */}
          <section className="card rounded-3xl p-7">
            <h2 className="mb-5 text-lg font-bold text-white">General</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white">Project Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="input resize-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">Visibility</label>
                <div className="flex flex-wrap gap-2">
                  {['PUBLIC', 'PRIVATE', 'UNLISTED'].map((v) => (
                    <label
                      key={v}
                      className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                        visibility === v
                          ? 'bg-white text-black'
                          : 'bg-[#141416] text-[#8e8e8e] ring-1 ring-white/10 hover:text-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={v}
                        checked={visibility === v}
                        onChange={(e) => setVisibility(e.target.value)}
                        className="sr-only"
                      />
                      {v.charAt(0) + v.slice(1).toLowerCase()}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-dark">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {saveMsg && (
                  <span className={`text-sm font-semibold ${saveMsg.startsWith('Failed') ? 'text-[#ff6b81]' : 'text-[#4ade80]'}`}>
                    {saveMsg}
                  </span>
                )}
              </div>
            </form>
          </section>

          {/* Collaborators */}
          <section className="card rounded-3xl p-7">
            <h2 className="mb-5 text-lg font-bold text-white">Collaborators</h2>

            {/* Add collaborator form */}
            <form onSubmit={handleAddCollab} className="mb-6 flex flex-wrap gap-3">
              <input
                type="email"
                required
                placeholder="Collaborator email"
                value={collabEmail}
                onChange={(e) => setCollabEmail(e.target.value)}
                className="input flex-1"
              />
              <select
                value={collabRole}
                onChange={(e) => setCollabRole(e.target.value)}
                className="input !w-auto cursor-pointer"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
              <button type="submit" disabled={addingCollab} className="btn-dark whitespace-nowrap">
                {addingCollab ? 'Adding...' : 'Add'}
              </button>
            </form>
            {collabError && <p className="mb-4 text-sm font-semibold text-[#ff6b81]">{collabError}</p>}

            {/* Collaborator list */}
            <div className="space-y-2">
              {/* Owner row */}
              <div className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                    {project.owner?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{project.owner?.username}</div>
                    <div className="text-xs text-[#6f6f6f]">Owner</div>
                  </div>
                </div>
                <span className="chip bg-white/10 text-white">owner</span>
              </div>

              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                      {c.user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{c.user?.username}</div>
                      <div className="text-xs text-[#6f6f6f]">{c.user?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={c.role}
                      onChange={(e) => handleRoleChange(c.id, e.target.value)}
                      className="cursor-pointer rounded-full border border-white/10 bg-[#141416] px-3 py-1.5 text-xs font-semibold text-white focus:outline-none"
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="EDITOR">Editor</option>
                    </select>
                    <button
                      onClick={() => handleRemoveCollab(c.id)}
                      className="rounded-full p-2 text-[#6f6f6f] transition-colors duration-200 hover:bg-[#ff6b81]/10 hover:text-[#ff6b81]"
                      title="Remove collaborator"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {collaborators.length === 0 && (
                <p className="py-4 text-center text-sm text-[#6f6f6f]">
                  No collaborators yet. Add someone by email above.
                </p>
              )}
            </div>
          </section>

          {/* Danger Zone */}
          <section className="rounded-3xl border border-[#ff6b81]/30 bg-[#ff6b81]/5 p-7">
            <h2 className="mb-2 text-lg font-bold text-[#ff6b81]">Danger Zone</h2>
            <p className="mb-4 text-sm text-[#c8a3a9]">
              Deleting a project is permanent and cannot be undone. All versions and uploaded files will be removed.
            </p>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white">
                Type <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs ring-1 ring-[#ff6b81]/30">{project.title}</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={project.title}
                className="input focus:border-[#ff6b81]/50"
              />
              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirm !== project.title}
                className="btn-pink disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </section>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
