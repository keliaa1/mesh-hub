"use client";

import { useState } from 'react';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { projectsApi } from '@/lib/api/projects';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { IconGlobe, IconLock, IconLink } from '@/components/icons';

const VISIBILITY_OPTIONS = [
  {
    value: 'PUBLIC',
    label: 'Public',
    desc: 'Anyone on the internet can view this project. You choose who can edit.',
    icon: <IconGlobe size={18} />,
  },
  {
    value: 'PRIVATE',
    label: 'Private',
    desc: 'You choose who can see and commit to this project.',
    icon: <IconLock size={18} />,
  },
  {
    value: 'UNLISTED',
    label: 'Unlisted',
    desc: 'Anyone with the link can view. Does not show up in searches.',
    icon: <IconLink size={18} />,
  },
];

export default function NewProject() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const project = await projectsApi.create({ title, description, visibility });
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8 sm:px-10">
          <div className="mb-8">
            <Link href="/dashboard" className="text-sm font-semibold text-[#8e8e8e] hover:text-white">
              ← Back to Dashboard
            </Link>
            <h1
              className="mt-4 text-3xl tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
            >
              Create a new project
            </h1>
            <p className="mt-2 text-[#8e8e8e]">
              A project contains all versions of your 3D assets and its history.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-6 rounded-3xl p-8">
            {error && (
              <div className="rounded-xl border border-[#ff6b81]/30 bg-[#ff6b81]/10 p-4 text-sm font-medium text-[#ff6b81]">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white">
                Project Name <span className="text-white/60">*</span>
              </label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g. Hero Character Model"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white">Description</label>
              <textarea
                className="input h-24 resize-none"
                placeholder="Brief description of your project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="border-t border-white/10 pt-6">
              <label className="mb-3 block text-sm font-semibold text-white">Visibility</label>
              <div className="space-y-3">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors duration-200 ${
                      visibility === opt.value
                        ? 'border-white/40 bg-white/5'
                        : 'border-white/10 bg-transparent hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={opt.value}
                      checked={visibility === opt.value}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="sr-only"
                    />
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                      {opt.icon}
                    </span>
                    <span>
                      <span className="block font-bold text-white">{opt.label}</span>
                      <span className="block text-sm text-[#8e8e8e]">{opt.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
              <Link href="/dashboard" className="btn-light">
                Cancel
              </Link>
              <button type="submit" disabled={loading} className="btn-dark">
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
