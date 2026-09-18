"use client";

import { useState } from 'react';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiFetch } from '@/lib/api/client';
import AppShell from '@/components/AppShell';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    try {
      const res = await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save profile');
      }
      const updated = await res.json();
      const token = localStorage.getItem('token');
      if (token) login(token, updated);
      setProfileMsg('Profile updated successfully!');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err: any) {
      setProfileMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg('Password must be at least 8 characters');
      return;
    }
    setChangingPw(true);
    setPwMsg('');
    try {
      const res = await apiFetch('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to change password');
      }
      setPwMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (err: any) {
      setPwMsg('Error: ' + err.message);
    } finally {
      setChangingPw(false);
    }
  };

  const msgTone = (msg: string) =>
    msg.startsWith('Error') ? 'text-[#ff6b81]' : 'text-[#4ade80]';

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
              Account Settings
            </h1>
          </div>

          {/* Avatar & Username */}
          <section className="card mb-6 rounded-3xl p-7">
            <h2 className="mb-5 text-lg font-bold text-white">Profile</h2>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-bold text-black">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-white">{user?.username}</div>
                <div className="text-sm text-[#8e8e8e]">{user?.email}</div>
              </div>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input cursor-not-allowed bg-white/5 text-[#6f6f6f]"
                />
                <p className="mt-1 text-xs text-[#6f6f6f]">Email cannot be changed.</p>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn-dark">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                {profileMsg && <span className={`text-sm font-semibold ${msgTone(profileMsg)}`}>{profileMsg}</span>}
              </div>
            </form>
          </section>

          {/* Change Password */}
          <section className="card rounded-3xl p-7">
            <h2 className="mb-5 text-lg font-bold text-white">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={changingPw} className="btn-dark">
                  {changingPw ? 'Changing...' : 'Change Password'}
                </button>
                {pwMsg && <span className={`text-sm font-semibold ${msgTone(pwMsg)}`}>{pwMsg}</span>}
              </div>
            </form>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
