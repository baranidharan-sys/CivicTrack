import React, { useState } from 'react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { civicApi } from '../../lib/civicApi';
import { formatRelativeDate } from '../../utils/civicLogic';

export function CitizenProfilePage() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      toast.error('Full name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      const updated = await civicApi.updateProfile({ fullName, phone, address });
      setUser(updated);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalLayout
      portal="citizen"
      title="Citizen Profile"
      breadcrumb="Citizen Portal / Profile"
    >
      <div className="max-w-2xl bg-white border border-slate-200 rounded-lg p-6 sm:p-8">
        <div className="pb-6 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.fullName}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Citizen Account</p>
            <p className="tabular-nums">
              Member since {user ? formatRelativeDate(user.createdAt) : '—'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <label htmlFor="profile-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
            />
          </div>

          <div>
            <label htmlFor="profile-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Phone Number
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
            />
          </div>

          <div>
            <label htmlFor="profile-address" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Residential Address
            </label>
            <input
              id="profile-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}
