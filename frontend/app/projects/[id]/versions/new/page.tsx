"use client";

import { useState } from 'react';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { versionsApi } from '@/lib/api/versions';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Link from 'next/link';

export default function NewVersion() {
  const { id } = useParams() as { id: string };
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const version = await versionsApi.create(id, { commitMessage });
      // Go directly to the version page to upload files
      router.push(`/projects/${id}/versions/${version.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create version');
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8 sm:px-10">
          <div className="mb-8">
            <Link href={`/projects/${id}`} className="text-sm font-semibold text-[#8e8e8e] hover:text-white">
              ← Back to Project
            </Link>
            <h1
              className="mt-4 text-3xl tracking-tight text-white"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
            >
              Create a new version
            </h1>
            <p className="mt-2 text-[#8e8e8e]">
              Initialize a new version record before uploading your files.
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
                Version Message <span className="font-medium text-[#6f6f6f]">(optional)</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Added textures and optimized topology"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-[#6f6f6f]">
                A short description of what changed in this version.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
              <Link href={`/projects/${id}`} className="btn-light">
                Cancel
              </Link>
              <button type="submit" disabled={loading} className="btn-dark">
                {loading ? 'Creating...' : 'Create & Continue'}
              </button>
            </div>
          </form>
        </main>
      </AppShell>
    </ProtectedRoute>
  );
}
