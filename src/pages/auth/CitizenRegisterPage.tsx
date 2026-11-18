import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PublicNavbar } from '../../components/PublicNavbar';
import { useAuth } from '../../context/AuthContext';
import { validateRegistrationInput } from '../../utils/civicLogic';

export function CitizenRegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const check = validateRegistrationInput({ fullName, email, password, phone });
    if (!check.valid) {
      setError(Object.values(check.errors)[0]);
      return;
    }

    setSubmitting(true);
    try {
      await register({ fullName, email, password, phone, address });
      toast.success('Citizen account created successfully.');
      navigate('/citizen/dashboard', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to complete registration.';
      if (message.startsWith('EMAIL_CONFIRMATION_REQUIRED:')) {
        const clean = message.replace('EMAIL_CONFIRMATION_REQUIRED:', '').trim();
        setNotice(clean);
        toast.success('Account created — please verify your email.');
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg p-8">
          <div>
            <p className="text-xs font-semibold text-[#163A5F]">Citizen Registration</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Create Your Citizen Account</h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Register to submit municipal problem reports, upload photos, and receive live resolution notifications.
            </p>
          </div>

          {notice && (
            <div
              role="status"
              className="mt-4 p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900"
            >
              <p>{notice}</p>
              <Link
                to="/login"
                className="mt-2 inline-block font-semibold text-[#163A5F] hover:underline"
              >
                Continue to Citizen Login
              </Link>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs font-medium text-red-800"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Maya Chen"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>

              <div>
                <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 234-5678"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya.chen@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
              />
            </div>

            <div>
              <label htmlFor="reg-address" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Neighborhood / Street Address
              </label>
              <input
                id="reg-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="742 Oakwood Avenue"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password (min. 6 characters)
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a secure password"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Creating Account...' : 'Create Citizen Account'}
            </button>
          </form>

          <p className="mt-6 pt-5 border-t border-slate-200 text-xs text-slate-600 text-center">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-[#163A5F] hover:underline">
              Sign in to Citizen Portal
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
