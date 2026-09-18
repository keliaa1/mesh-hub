"use client";

import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.register(username, email, password);
      router.push('/auth/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="anim card w-full max-w-md space-y-8 rounded-3xl p-10">
        <div className="text-center">
          <Link
            href="/"
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.4)]"
          >
            <Logo size={30} />
          </Link>
          <h2
            className="text-3xl tracking-tight text-white"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            Create an account
          </h2>
          <p className="mt-2 text-sm text-[#8e8e8e]">Start versioning your 3D projects</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-[#ff6b81]/30 bg-[#ff6b81]/10 p-4">
              <p className="text-sm font-medium text-[#ff6b81]">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white">Username</label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g. modelmaster"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white">Email address</label>
              <input
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white">Password</label>
              <input
                type="password"
                required
                minLength={8}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-[#6f6f6f]">Must be at least 8 characters.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-dark w-full !py-3"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-sm text-[#8e8e8e]">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold text-white hover:text-[#c8c8c8]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
