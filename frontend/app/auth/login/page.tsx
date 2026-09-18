"use client";

import { useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login(email, password);
      login(data.access_token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
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
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-[#8e8e8e]">Sign in to your MeshHub account</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-[#ff6b81]/30 bg-[#ff6b81]/10 p-4">
              <p className="text-sm font-medium text-[#ff6b81]">{error}</p>
            </div>
          )}

          <div className="space-y-4">
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
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-dark w-full !py-3"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-[#8e8e8e]">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-bold text-white hover:text-[#c8c8c8]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
