"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useState } from 'react';
import Logo from './Logo';
import {
  IconGrid,
  IconBox3d,
  IconCalendar,
  IconBlender,
  IconUsers,
  IconActivity,
  IconFileText,
  IconMessageSquare,
  IconDatabase,
  IconSettings,
  IconLogout,
  IconUser,
  IconSearch,
  IconBell,
  IconChevronRight,
} from './icons';

interface AppShellProps {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  searchPlaceholder?: string;
  headerAction?: React.ReactNode;
}

function SidebarLink({
  href,
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
}) {
  const content = (
    <div
      className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
        active
          ? 'bg-white/10 text-white font-bold border-l-2 border-white pl-3'
          : 'text-[#8e8e8e] hover:bg-white/5 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`shrink-0 transition-colors ${active ? 'text-white' : 'text-[#6f6f6f] group-hover:text-white'}`}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      {badge && (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className="w-full text-left">
      {content}
    </button>
  );
}

export default function AppShell({
  children,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  searchPlaceholder = "Search models, .blend files, versions...",
  headerAction,
}: AppShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  const handleSearchInput = (val: string) => {
    setLocalSearch(val);
    if (onSearchChange) onSearchChange(val);
  };

  return (
    <div className="min-h-screen bg-black p-2 sm:p-3 md:p-4 font-sans selection:bg-white/20 selection:text-white">
      {/* Outer Curved Tablet Container Frame */}
      <div className="relative flex min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-[2.2rem] md:rounded-[2.8rem] bg-[#0b0b0c] shadow-2xl shadow-black/50 border border-white/10">

        {/* ========================================================================= */}
        {/* Floating Dark Sidebar                                                     */}
        {/* ========================================================================= */}
        <aside
          className={`fixed inset-y-3 left-3 z-50 flex w-64 flex-col justify-between overflow-hidden rounded-[2.4rem] bg-black p-5 text-white shadow-2xl shadow-black/40 border border-white/10 transition-transform duration-300 ease-in-out lg:static lg:inset-auto lg:my-3 lg:ml-3 lg:flex lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-[110%] lg:translate-x-0'
          }`}
        >
          {/* Top Logo & Right Edge Pill Toggle */}
          <div className="relative">
            <div className="flex items-center justify-between pb-6 pt-1 px-2">
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shrink-0">
                  <Logo size={18} />
                </span>
                <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                  MeshHub
                </span>
              </Link>
            </div>

            {/* White right-docked toggle tab */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute -right-7 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-white text-black shadow-md transition-transform hover:scale-110 active:scale-95 lg:flex cursor-pointer"
              title="Toggle Sidebar"
            >
              <IconChevronRight size={14} className="stroke-[3]" />
            </button>
          </div>

          {/* Navigation Links Scrollable Area */}
          <div className="flex-1 space-y-6 py-2">
            {/* GENERAL SECTION */}
            <div>
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#6f6f6f]">
                General
              </p>
              <div className="space-y-1">
                <SidebarLink
                  href="/dashboard"
                  icon={<IconGrid size={17} />}
                  label="Dashboard"
                  active={pathname === '/dashboard'}
                />
                <SidebarLink
                  href="/dashboard?view=schedule"
                  icon={<IconCalendar size={17} />}
                  label="Activity & Board"
                  active={pathname.includes('schedule')}
                />
                <SidebarLink
                  href="/projects/new"
                  icon={<IconBox3d size={17} />}
                  label="3D Projects"
                  active={pathname.startsWith('/projects') && !pathname.includes('schedule')}
                />
                <SidebarLink
                  href="/profile"
                  icon={<IconUsers size={17} />}
                  label="Collaborators"
                  active={pathname === '/profile'}
                />
                <SidebarLink
                  href="/dashboard?tab=analytics"
                  icon={<IconActivity size={17} />}
                  label="Statistics & reports"
                  active={pathname.includes('analytics')}
                />
                <SidebarLink
                  href="/dashboard?tab=blender"
                  icon={<IconBlender size={17} />}
                  label="Blender Add-on"
                  badge="v1.0"
                  active={pathname.includes('blender')}
                />
                <SidebarLink
                  href="/dashboard?tab=docs"
                  icon={<IconFileText size={17} />}
                  label="Documentation"
                  active={pathname.includes('docs')}
                />
              </div>
            </div>

            {/* TOOLS SECTION */}
            <div>
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#6f6f6f]">
                Tools
              </p>
              <div className="space-y-1">
                <SidebarLink
                  href="/dashboard?tab=messages"
                  icon={<IconMessageSquare size={17} />}
                  label="Comments & calls"
                  active={pathname.includes('messages')}
                />
                <SidebarLink
                  href="/dashboard?tab=storage"
                  icon={<IconDatabase size={17} />}
                  label="Storage & assets"
                  active={pathname.includes('storage')}
                />
                <SidebarLink
                  href="/profile"
                  icon={<IconSettings size={17} />}
                  label="Settings"
                  active={pathname === '/profile'}
                />
              </div>
            </div>
          </div>

          {/* User profile & Log out at bottom */}
          <div className="border-t border-white/10 pt-4 mt-auto">
            {user && (
              <Link href="/profile" className="mb-2 flex items-center gap-2.5 rounded-2xl bg-white/5 p-2 transition-colors hover:bg-white/10">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">{user.username}</p>
                  <p className="truncate text-[10px] text-[#8e8e8e]">{user.email || '3D Artist'}</p>
                </div>
              </Link>
            )}
            <SidebarLink
              icon={<IconLogout size={16} />}
              label="Log out"
              onClick={logout}
            />
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* ========================================================================= */}
        {/* Main Content Pane with Header Navigation                                 */}
        {/* ========================================================================= */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 md:px-10 md:py-8">
          
          {/* TOP BAR: Search Capsule + Action Controls */}
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            
            {/* Mobile Sidebar Toggle Button */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="btn-icon-light"
                aria-label="Open sidebar"
              >
                <IconGrid size={16} />
              </button>
              <span className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                  <Logo size={15} />
                </span>
                MeshHub
              </span>
            </div>

            {/* Pill Search Capsule */}
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-[#141416] px-4 py-2 border border-white/10 md:max-w-2xl">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                <IconSearch size={14} className="stroke-[2.5]" />
              </div>

              {/* Input field */}
              <input
                type="text"
                value={localSearch}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-xs sm:text-sm font-medium text-white placeholder-[#6f6f6f] focus:outline-none"
              />

              {/* In: Filter tags embedded in search capsule */}
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-white/10 text-[11px] text-[#8e8e8e]">
                <span className="font-medium">In:</span>
                {(['Models', 'Blender', 'Versions', 'Teams'] as const).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onFilterChange && onFilterChange(tag)}
                    className={`chip-dashed cursor-pointer ${
                      activeFilter === tag
                        ? 'border-white bg-white text-black'
                        : ''
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Top Right Action Icons & Avatar */}
            <div className="flex items-center justify-end gap-2.5">
              {headerAction}

              <Link href="/profile" className="btn-icon-light" title="Account Profile">
                <IconUser size={16} />
              </Link>

              <button type="button" className="btn-icon-light relative" title="Notifications">
                <IconBell size={16} />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#ff6b81]" />
              </button>

              <Link href="/profile" className="btn-icon-light" title="Workspace Settings">
                <IconSettings size={16} />
              </Link>
            </div>
          </header>

          {/* MAIN PAGE INJECTED CONTENT */}
          <main className="flex-1 flex flex-col">{children}</main>
        </div>
      </div>
    </div>
  );
}
