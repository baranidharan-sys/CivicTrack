import React, { useState } from 'react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/PortalLayout';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { useAuth } from '../../context/AuthContext';
import { civicApi } from '../../lib/civicApi';
import { formatRelativeDate } from '../../utils/civicLogic';

export function AdminProfilePage() {
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
      toast.success('Administrator profile updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalLayout
      portal="admin"
      title="Administrator Profile"
      breadcrumb="Admin Portal / Profile"
    >
      <div className="max-w-2xl bg-white border border-slate-200 rounded-lg p-6 sm:p-8">
        <div className="pb-6 border-b border-slate-200 flex items-center gap-4">
          <div className="h-16 w-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
            <ImageWithFallback
              src={user?.avatarUrl || '/src/assets/images/civic_avatar_admin_1794926292559.jpg'}
              alt={user?.fullName || 'Municipal Administrator'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900 truncate">{user?.fullName}</h2>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            <p className="mt-0.5 text-xs font-medium text-[#163A5F]">
              Municipal Administrator · Active since{' '}
              {user ? formatRelativeDate(user.createdAt) : '—'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-prof-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              id="admin-prof-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
            />
          </div>

          <div>
            <label htmlFor="admin-prof-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Direct Office Phone
            </label>
            <input
              id="admin-prof-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
            />
          </div>

          <div>
            <label htmlFor="admin-prof-addr" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Municipal Office Location
            </label>
            <input
              id="admin-prof-addr"
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
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}
