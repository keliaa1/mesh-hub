"use client";

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { projectsApi, Project } from '@/lib/api/projects';
import { useAuth } from '@/lib/auth/AuthContext';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import {
  IconGlobe,
  IconLock,
  IconLink,
  IconSettings,
  IconPlus,
  IconClock,
  IconBox3d,
  IconUpload,
  IconDownload,
  IconRefresh,
  IconX,
} from '@/components/icons';

function VisibilityIcon({ visibility }: { visibility: string }) {
  if (visibility === 'PUBLIC') return <IconGlobe size={12} />;
  if (visibility === 'UNLISTED') return <IconLink size={12} />;
  return <IconLock size={12} />;
}

export default function ProjectPage() {
  const { id } = useParams() as { id: string };
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const [showPushModal, setShowPushModal] = useState(false);
  const [pushFile, setPushFile] = useState<File | null>(null);
  const [pushMessage, setPushMessage] = useState('');
  const [pushing, setPushing] = useState(false);
  const [pushError, setPushError] = useState('');

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [busyVersionId, setBusyVersionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const fetchProject = async () => {
    try {
      const data = await projectsApi.findOne(id);
      setProject(data);
    } catch (err: any) {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushFile) return;
    setPushing(true);
    setPushError('');
    try {
      await projectsApi.push(id, pushFile, pushMessage);
      setShowPushModal(false);
      setPushFile(null);
      setPushMessage('');
      await fetchProject();
    } catch (err: any) {
      setPushError(err.message || 'Push failed');
    } finally {
      setPushing(false);
    }
  };

  const handleDownloadCurrent = async () => {
    if (!project) return;
    setDownloading(true);
    setDownloadError('');
    try {
      await projectsApi.downloadCurrent(id, `${project.title}.blend`);
    } catch (err: any) {
      setDownloadError(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadVersion = async (versionNumber: number, versionKey: string) => {
    if (!project) return;
    setBusyVersionId(versionKey);
    setActionError('');
    try {
      await projectsApi.downloadVersion(id, versionNumber, `${project.title}_v${versionNumber}.blend`);
    } catch (err: any) {
      setActionError(err.message || 'Download failed');
    } finally {
      setBusyVersionId(null);
    }
  };

  const handleRestoreVersion = async (versionNumber: number, versionKey: string) => {
    if (!confirm(`Restore version ${versionNumber}? This will create a new version with its contents.`)) return;
    setBusyVersionId(versionKey);
    setActionError('');
    try {
      await projectsApi.restoreVersion(id, versionNumber);
      await fetchProject();
    } catch (err: any) {
      setActionError(err.message || 'Restore failed');
    } finally {
      setBusyVersionId(null);
    }
  };

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

  // Check permissions based on backend logic
  const isOwner = user?.id === project.ownerId;
  const collabRole = project.collaborators?.find((c: any) => c.userId === user?.id)?.role;
  const canEdit = isOwner || collabRole === 'EDITOR';

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 sm:px-10">
          {/* Header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Link href="/dashboard" className="font-semibold text-[#8e8e8e] hover:text-white">
                  {project.owner?.username}
                </Link>
                <span className="text-[#6f6f6f]">/</span>
                <h1
                  className="text-2xl tracking-tight text-white sm:text-3xl"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
                >
                  {project.title}
                </h1>
                <span className="chip ml-1 bg-white/10 text-white">
                  <VisibilityIcon visibility={project.visibility} />
                  {project.visibility.toLowerCase()}
                </span>
              </div>
              <p className="text-[#8e8e8e]">{project.description}</p>
            </div>

            <div className="flex items-center gap-3">
              {isOwner && (
                <Link href={`/projects/${id}/settings`} className="btn-light !py-2">
                  <IconSettings size={16} />
                  Settings
                </Link>
              )}
              <button
                onClick={handleDownloadCurrent}
                disabled={downloading}
                className="btn-light !py-2"
                title="Download the current working file"
              >
                <IconDownload size={16} />
                {downloading ? 'Downloading...' : 'Pull / Download'}
              </button>
              {canEdit && (
                <button onClick={() => setShowPushModal(true)} className="btn-dark !py-2">
                  <IconUpload size={16} />
                  Push
                </button>
              )}
              {canEdit && (
                <Link href={`/projects/${id}/versions/new`} className="btn-light !py-2">
                  <IconPlus size={16} />
                  New version
                </Link>
              )}
            </div>
          </div>

          {downloadError && (
            <div className="mb-4 rounded-xl border border-[#ff6b81]/30 bg-[#ff6b81]/10 p-3 text-sm font-medium text-[#ff6b81]">
              {downloadError}
            </div>
          )}
          {actionError && (
            <div className="mb-4 rounded-xl border border-[#ff6b81]/30 bg-[#ff6b81]/10 p-3 text-sm font-medium text-[#ff6b81]">
              {actionError}
            </div>
          )}

          {showPushModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="card w-full max-w-md rounded-3xl p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Push to project</h2>
                  <button
                    onClick={() => setShowPushModal(false)}
                    className="rounded-full p-1.5 text-[#8e8e8e] hover:bg-white/10 hover:text-white"
                  >
                    <IconX size={16} />
                  </button>
                </div>
                <form onSubmit={handlePush} className="space-y-4">
                  {pushError && (
                    <div className="rounded-xl border border-[#ff6b81]/30 bg-[#ff6b81]/10 p-3 text-sm font-medium text-[#ff6b81]">
                      {pushError}
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-white">
                      Blender file (.blend)
                    </label>
                    <input
                      type="file"
                      accept=".blend"
                      required
                      onChange={(e) => setPushFile(e.target.files?.[0] || null)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-white">
                      Commit message <span className="font-medium text-[#6f6f6f]">(optional)</span>
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Added kitchen model"
                      value={pushMessage}
                      onChange={(e) => setPushMessage(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                    <button type="button" onClick={() => setShowPushModal(false)} className="btn-light">
                      Cancel
                    </button>
                    <button type="submit" disabled={pushing || !pushFile} className="btn-dark">
                      {pushing ? 'Pushing...' : 'Push'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Version history */}
            <div className="space-y-6 md:col-span-2">
              <div className="card overflow-hidden rounded-3xl">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                  <h2 className="flex items-center gap-2 font-bold text-white">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <IconClock size={15} />
                    </span>
                    Version History
                  </h2>
                </div>

                <div className="divide-y divide-white/10">
                  {project.versions?.length === 0 ? (
                    <div className="p-10 text-center text-[#8e8e8e]">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                        <IconBox3d size={22} className="text-[#6f6f6f]" />
                      </div>
                      No versions yet.
                    </div>
                  ) : (
                    project.versions?.map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between gap-3 p-4 transition-colors duration-200 hover:bg-white/5">
                        <Link href={`/projects/${id}/versions/${v.id}`} className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-black">
                              v{v.versionNumber}
                            </span>
                            <span className="truncate font-semibold text-white">
                              {v.commitMessage || `Update ${v.versionNumber}`}
                            </span>
                          </div>
                          <div className="mt-1.5 text-xs font-medium text-[#6f6f6f]">
                            {new Date(v.createdAt).toLocaleString()} • {v.files?.length || 0} files
                          </div>
                        </Link>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleDownloadVersion(v.versionNumber, v.id);
                            }}
                            disabled={busyVersionId === v.id}
                            className="rounded-full p-2 text-[#8e8e8e] transition-colors duration-200 hover:bg-white/10 hover:text-white disabled:opacity-40"
                            title={`Download version ${v.versionNumber}`}
                          >
                            <IconDownload size={15} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleRestoreVersion(v.versionNumber, v.id);
                              }}
                              disabled={busyVersionId === v.id}
                              className="rounded-full p-2 text-[#8e8e8e] transition-colors duration-200 hover:bg-[#ff6b81]/10 hover:text-[#ff6b81] disabled:opacity-40"
                              title={`Restore version ${v.versionNumber}`}
                            >
                              <IconRefresh size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar cards */}
            <div className="space-y-6">
              <div className="card rounded-3xl p-5">
                <h3 className="mb-4 font-bold text-white">About</h3>
                <div className="mb-4 text-sm text-[#8e8e8e]">
                  {project.description || 'No description provided.'}
                </div>
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs font-semibold text-[#6f6f6f]">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="text-white">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visibility</span>
                    <span className="capitalize text-white">{project.visibility.toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Owner</span>
                    <span className="text-white">{project.owner?.username}</span>
                  </div>
                </div>
              </div>

              <div className="card rounded-3xl p-5">
                <h3 className="mb-4 flex items-center justify-between font-bold text-white">
                  <span>Collaborators ({project.collaborators?.length || 0})</span>
                  {isOwner && (
                    <Link
                      href={`/projects/${id}/settings`}
                      className="text-xs font-bold text-white hover:text-[#c8c8c8]"
                    >
                      Manage
                    </Link>
                  )}
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                        {project.owner?.username?.[0]?.toUpperCase()}
                      </span>
                      {project.owner?.username}
                    </span>
                    <span className="chip bg-white/10 text-white">owner</span>
                  </li>
                  {project.collaborators?.map((c: any) => (
                    <li key={c.id} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-white">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                          {(c.user?.username || 'U')[0].toUpperCase()}
                        </span>
                        {c.user?.username || `User ${c.userId.substring(0, 8)}`}
                      </span>
                      <span className="chip bg-white/10 text-[#8e8e8e]">{c.role.toLowerCase()}</span>
                    </li>
                  ))}
                  {(project.collaborators?.length || 0) === 0 && (
                    <li className="pb-1 text-sm text-[#6f6f6f]">No collaborators yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
