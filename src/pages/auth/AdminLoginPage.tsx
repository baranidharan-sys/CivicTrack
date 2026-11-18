import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PublicNavbar } from '../../components/PublicNavbar';
import { useAuth } from '../../context/AuthContext';

export function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login({ email, password, portal: 'admin' });
      toast.success(`Authenticated as ${user.fullName}`);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Administrator sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-[#0B1F35] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#163A5F]">Municipal Operations</p>
              <h1 className="text-xl font-bold text-slate-900">Administrator Sign In</h1>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            Authorized city staff portal for triaging citizen complaints, assigning departments, and recording field resolutions.
          </p>

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
              <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Municipal Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@civictrack.gov"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter administrator password"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0B1F35] rounded-md hover:bg-[#163A5F] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Verifying Credentials...' : 'Access Admin Portal'}
            </button>
          </form>

          <div className="mt-5 p-3.5 rounded-md bg-[#F2F6FA] border border-slate-200 text-xs text-slate-700">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">Sample Administrator Account</span>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@civictrack.gov');
                  setPassword('Admin@123');
                }}
                className="font-semibold text-[#163A5F] hover:underline"
              >
                Use Credentials
              </button>
            </div>
            <p className="mt-1 font-mono text-[11px] text-slate-600">
              admin@civictrack.gov / Admin@123
            </p>
          </div>

          <p className="mt-6 pt-5 border-t border-slate-200 text-xs text-slate-600 text-center">
            Looking to report a public issue?{' '}
            <Link to="/login" className="font-semibold text-[#163A5F] hover:underline">
              Go to Citizen Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
