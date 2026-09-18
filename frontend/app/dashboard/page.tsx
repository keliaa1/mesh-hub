"use client";

import { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { projectsApi, Project } from '@/lib/api/projects';
import { useAuth } from '@/lib/auth/AuthContext';
import AppShell from '@/components/AppShell';
import Link from 'next/link';
import {
  IconSearch,
  IconPlus,
  IconBox3d,
  IconGlobe,
  IconLock,
  IconLink,
  IconClock,
} from '@/components/icons';

const CARD_TONES = [
  { bg: 'bg-[#141416] border border-white/10', chip: 'bg-white/10 text-white', ring: 'hover:border-white/25' },
];

function VisibilityIcon({ visibility }: { visibility: string }) {
  if (visibility === 'PUBLIC') return <IconGlobe size={12} />;
  if (visibility === 'UNLISTED') return <IconLink size={12} />;
  return <IconLock size={12} />;
}

const FILTERS = ['All', 'Public', 'Private', 'Unlisted'] as const;

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectsApi.findAll(1, 50);
        setProjects(data.data);
      } catch (err: any) {
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const visible = useMemo(() => {
    return projects.filter((p) => {
      const matchesQuery =
        !query.trim() ||
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === 'All' || p.visibility === filter.toUpperCase();
      return matchesQuery && matchesFilter;
    });
  }, [projects, query, filter]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex-1 px-6 py-6 sm:px-10 sm:py-8">
          {/* Top bar: search + create */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-[#141416] px-5 py-2.5 border border-white/10 sm:max-w-md">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                <IconSearch size={14} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects..."
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white placeholder-[#6f6f6f] focus:outline-none"
              />
            </div>

            <Link href="/projects/new" className="btn-dark shrink-0">
              <IconPlus size={16} />
              New project
            </Link>
          </div>

          {/* Greeting */}
          <div className="mb-8">
            <h1
              className="text-3xl tracking-tight text-white sm:text-4xl"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
            >
              Welcome back{user ? `, ${user.username}` : ''}
            </h1>
            <p className="mt-2 text-[#8e8e8e]">
              {projects.length} project{projects.length === 1 ? '' : 's'} in your workspace
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                  filter === f
                    ? 'bg-white text-black'
                    : 'bg-[#141416] text-[#8e8e8e] border border-white/10 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-[#ff6b81]/30 bg-[#ff6b81]/10 p-4 text-sm font-medium text-[#ff6b81]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-52 animate-pulse rounded-3xl bg-[#141416] border border-white/10" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="card rounded-3xl border-dashed py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
                <IconBox3d size={26} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">
                {projects.length === 0 ? 'No projects yet' : 'Nothing matches your search'}
              </h3>
              <p className="mx-auto mb-6 max-w-sm text-sm text-[#8e8e8e]">
                {projects.length === 0
                  ? 'Create your first project to start uploading and versioning your 3D assets.'
                  : 'Try a different search term or filter.'}
              </p>
              {projects.length === 0 && (
                <Link href="/projects/new" className="btn-dark">
                  <IconPlus size={16} />
                  Create project
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((project, i) => {
                const tone = CARD_TONES[i % CARD_TONES.length];
                return (
                  <Link key={project.id} href={`/projects/${project.id}`} className="group">
                    <div
                      className={`flex h-full flex-col rounded-3xl p-5 transition-all duration-200 ${tone.bg} ${tone.ring} hover:-translate-y-0.5`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                          <IconBox3d size={20} />
                        </div>
                        <span className={`chip ${tone.chip}`}>
                          <VisibilityIcon visibility={project.visibility} />
                          {project.visibility.toLowerCase()}
                        </span>
                      </div>
                      <h3 className="mb-1 text-lg font-bold leading-snug text-white">
                        {project.title}
                      </h3>
                      <p className="mb-6 line-clamp-2 flex-1 text-sm text-[#8e8e8e]">
                        {project.description || 'No description provided.'}
                      </p>
                      <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs font-semibold text-[#8e8e8e]">
                        <span className="flex items-center gap-1.5">
                          <IconClock size={13} />
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                        {project.owner && <span>by {project.owner.username}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
