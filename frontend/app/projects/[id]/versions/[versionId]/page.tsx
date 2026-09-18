"use client";

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { versionsApi } from '@/lib/api/versions';
import { filesApi } from '@/lib/api/files';
import { commentsApi } from '@/lib/api/comments';
import { useAuth } from '@/lib/auth/AuthContext';
import { useParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import ModelViewer from '@/components/ModelViewer';
import {
  IconBox3d,
  IconUpload,
  IconDownload,
  IconTrash,
  IconComment,
  IconChevronLeft,
} from '@/components/icons';

export default function VersionPage() {
  const { id: projectId, versionId } = useParams() as { id: string; versionId: string };
  const [version, setVersion] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const loadData = async () => {
    try {
      const [vData, fData, cData] = await Promise.all([
        versionsApi.findOne(projectId, versionId),
        filesApi.findByVersion(versionId).catch(() => []),
        commentsApi.findByVersion(versionId).catch(() => []),
      ]);
      setVersion(vData);
      setFiles(fData);
      setComments(cData);

      if (!selectedFile && fData.length > 0) {
        const viewable = fData.find((f: any) =>
          f.name.endsWith('.glb') || f.name.endsWith('.gltf') || f.name.endsWith('.blend')
        );
        if (viewable) handleSelectFile(viewable);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load version');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = async (file: any) => {
    setSelectedFile(file);
    const isViewable = file.name.endsWith('.glb') || file.name.endsWith('.gltf');
    const isBlend = file.name.endsWith('.blend');
    if (isViewable) {
      setLoadingModel(true);
      if (blobUrl) URL.revokeObjectURL(blobUrl); // cleanup
      try {
        const blob = await filesApi.downloadBlob(file.id);
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        console.error('Failed to download model', err);
      } finally {
        setLoadingModel(false);
      }
    } else if (isBlend) {
      // .blend files can't be rendered in browser — show the rich blend preview panel
      setBlobUrl('__blend__');
    } else {
      setBlobUrl(null);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, versionId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);
    setUploadError('');

    try {
      await filesApi.upload(versionId, file);
      await loadData();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await filesApi.remove(fileId);
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setBlobUrl(null);
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete file');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await commentsApi.createForVersion(versionId, newComment);
      setNewComment('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete comment?')) return;
    try {
      await commentsApi.remove(commentId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
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

  if (error || !version)
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="p-10 text-center font-semibold text-[#ff6b81]">
            {error || 'Version not found'}
          </div>
        </AppShell>
      </ProtectedRoute>
    );

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center gap-1 font-semibold text-[#8e8e8e] transition-colors hover:text-white"
            >
              <IconChevronLeft size={16} />
              {version.project?.title || 'Project'}
            </Link>
            <span className="text-[#6f6f6f]">/</span>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-black">
              v{version.versionNumber}
            </span>
            <h1
              className="text-xl tracking-tight text-white sm:text-2xl"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
            >
              {version.commitMessage || 'Unnamed Version'}
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* 3D Preview */}
              <div className="card relative flex h-[500px] flex-col overflow-hidden rounded-3xl">
                {selectedFile ? (
                  <div className="relative w-full flex-1">
                    {loadingModel && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white" />
                      </div>
                    )}
                    {blobUrl === '__blend__' ? (
                      /* ── Blend file rich preview ── */
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0 overflow-hidden">
                        {/* Animated background glow */}
                        <div className="pointer-events-none absolute inset-0">
                          <div
                            className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
                            style={{ background: 'radial-gradient(circle, #e87d0d 0%, #1a3a5c 60%, transparent 100%)' }}
                          />
                        </div>

                        {/* Blender icon + ring animation */}
                        <div className="relative mb-5 flex h-24 w-24 items-center justify-center">
                          <div
                            className="absolute inset-0 rounded-full border-2 border-[#e87d0d]/30 animate-ping"
                            style={{ animationDuration: '2.5s' }}
                          />
                          <div className="absolute inset-2 rounded-full border border-[#e87d0d]/20" />
                          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl"
                            style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #0d1f35 100%)', border: '1.5px solid rgba(232,125,13,0.4)' }}
                          >
                            {/* Blender Logo SVG */}
                            <svg viewBox="0 0 248 248" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                              <g fill="none">
                                <circle cx="124" cy="124" r="124" fill="#1a3a5c"/>
                                <path d="M105 68h61l-4 8H109z" fill="#e87d0d"/>
                                <ellipse cx="124" cy="130" rx="46" ry="46" stroke="#e87d0d" strokeWidth="14" fill="none"/>
                                <circle cx="124" cy="130" r="16" fill="#e87d0d"/>
                                <rect x="68" y="118" width="14" height="24" rx="7" fill="#e87d0d"/>
                                <path d="M78 130 L56 108 L56 152 Z" fill="#e87d0d"/>
                              </g>
                            </svg>
                          </div>
                        </div>

                        <p className="relative z-10 text-base font-bold text-white tracking-tight">Blender File</p>
                        <p className="relative z-10 mt-1 mb-4 text-xs text-[#8e8e8e] text-center px-8 max-w-xs">
                          .blend files cannot be rendered directly in the browser.
                          Download the file and open it in Blender to view and edit.
                        </p>

                        {/* File metadata pill */}
                        <div className="relative z-10 mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold text-white"
                            style={{ background: 'linear-gradient(135deg,#e87d0d,#c06000)' }}
                          >
                            .blend
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white leading-tight">{selectedFile.name}</p>
                            <p className="text-xs text-[#8e8e8e]">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB &nbsp;·&nbsp; Blender Scene
                            </p>
                          </div>
                        </div>

                        <a
                          href={filesApi.getDownloadUrl(selectedFile.id)}
                          download
                          target="_blank"
                          className="relative z-10 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                          style={{ background: 'linear-gradient(135deg,#e87d0d,#c06000)', boxShadow: '0 4px 20px rgba(232,125,13,0.35)' }}
                        >
                          <IconDownload size={15} />
                          Download &amp; Open in Blender
                        </a>
                      </div>
                    ) : blobUrl ? (
                      <div className="absolute inset-0">
                        <ModelViewer url={blobUrl} fileName={selectedFile?.name} />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8e8e8e]">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
                          <IconBox3d size={26} />
                        </div>
                        <p className="text-sm font-medium">No 3D preview available for this format.</p>
                        <a
                          href={filesApi.getDownloadUrl(selectedFile.id)}
                          target="_blank"
                          className="mt-3 text-sm font-bold text-white hover:text-[#c8c8c8]"
                        >
                          Download file instead
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center bg-[#0b0b0c] text-[#6f6f6f]">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <IconBox3d size={26} />
                    </div>
                    <p className="text-sm font-medium">Select a 3D file to preview</p>
                  </div>
                )}

                {selectedFile && (
                  <div className="z-20 flex items-center justify-between border-t border-white/10 bg-[#0b0b0c] px-4 py-3 text-sm">
                    <span className="truncate font-mono text-white">{selectedFile.name}</span>
                    <a
                      href={filesApi.getDownloadUrl(selectedFile.id)}
                      download
                      target="_blank"
                      className="btn-light !px-4 !py-1.5 !text-xs"
                    >
                      <IconDownload size={13} />
                      Download
                    </a>
                  </div>
                )}
              </div>

              {/* Files */}
              <div className="card overflow-hidden rounded-3xl">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                  <h2 className="font-bold text-white">Files ({files.length})</h2>
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      accept=".glb,.gltf,.obj,.fbx,.blend,.stl,.ply,.3ds,.dae"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`btn-dark !px-4 !py-2 !text-xs ${uploading ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      <IconUpload size={14} />
                      {uploading ? 'Uploading...' : 'Upload File'}
                    </label>
                  </div>
                </div>

                {uploadError && (
                  <div className="border-b border-[#ff6b81]/30 bg-[#ff6b81]/10 p-4 text-sm font-medium text-[#ff6b81]">
                    {uploadError}
                  </div>
                )}

                <div className="divide-y divide-white/10">
                  {files.length === 0 ? (
                    <div className="p-10 text-center text-sm text-[#6f6f6f]">No files uploaded yet.</div>
                  ) : (
                    files.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center justify-between p-4 transition-colors duration-200 ${
                          selectedFile?.id === file.id ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex flex-1 cursor-pointer items-center gap-3" onClick={() => handleSelectFile(file)}>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[10px] font-bold text-white">
                            {file.name.split('.').pop()?.toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{file.name}</div>
                            <div className="text-xs font-medium text-[#6f6f6f]">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={filesApi.getDownloadUrl(file.id)}
                            target="_blank"
                            className="rounded-full p-2 text-[#8e8e8e] transition-colors duration-200 hover:bg-white/10 hover:text-white"
                            title="Download"
                          >
                            <IconDownload size={15} />
                          </a>
                          <button
                            onClick={() => handleFileDelete(file.id)}
                            className="rounded-full p-2 text-[#8e8e8e] transition-colors duration-200 hover:bg-[#ff6b81]/10 hover:text-[#ff6b81]"
                            title="Delete"
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-6">
              <div className="card flex h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-3xl">
                <div className="border-b border-white/10 px-5 py-4">
                  <h2 className="flex items-center gap-2 font-bold text-white">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                      <IconComment size={14} />
                    </span>
                    Comments ({comments.length})
                  </h2>
                </div>

                <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-5">
                  {comments.length === 0 ? (
                    <div className="my-10 text-center text-sm text-[#6f6f6f]">
                      No comments yet. Be the first to comment!
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
                        <div className="mb-2 flex items-start justify-between">
                          <span className="flex items-center gap-2 text-sm font-bold text-white">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
                              {c.user?.username?.[0]?.toUpperCase()}
                            </span>
                            {c.user.username}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[#6f6f6f]">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                            {user?.id === c.userId && (
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-[#6f6f6f] transition-colors hover:text-[#ff6b81]"
                                title="Delete comment"
                              >
                                <IconTrash size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-white/80">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-white/10 bg-[#0b0b0c] p-4">
                  <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="input h-20 resize-none"
                      required
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="btn-dark self-end !px-4 !py-1.5 !text-xs"
                    >
                      Comment
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
