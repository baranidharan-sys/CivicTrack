import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { PublicNavbar } from '../../components/PublicNavbar';
import { useAuth } from '../../context/AuthContext';

export function CitizenLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo =
    (location.state as { from?: string } | null)?.from || '/citizen/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login({ email, password, portal: 'citizen' });
      toast.success(`Welcome back, ${user.fullName}`);
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(redirectTo.startsWith('/admin') ? '/citizen/dashboard' : redirectTo, {
          replace: true,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-8">
          <div>
            <p className="text-xs font-semibold text-[#163A5F]">Citizen Portal</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Sign In to CivicTrack</h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Report public issues, attach site photos, and monitor municipal resolution updates.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-800"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="citizen-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="citizen-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
              />
            </div>

            <div>
              <label htmlFor="citizen-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="citizen-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 p-3.5 rounded-md bg-[#F2F6FA] border border-slate-200 text-xs text-slate-700">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">Sample Citizen Account</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('citizen@civictrack.gov');
                  setPassword('Citizen@123');
                }}
                className="font-semibold text-[#163A5F] hover:underline"
              >
                Use Credentials
              </button>
            </div>
            <p className="mt-1 font-mono text-[11px] text-slate-600">
              citizen@civictrack.gov / Citizen@123
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              New resident?{' '}
              <Link to="/register" className="font-semibold text-[#163A5F] hover:underline">
                Register account
              </Link>
            </span>
            <Link to="/admin/login" className="font-medium text-slate-500 hover:text-slate-900">
              Admin Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
