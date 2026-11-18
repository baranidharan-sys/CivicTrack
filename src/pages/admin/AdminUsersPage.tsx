import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/PortalLayout';
import { useAuth } from '../../context/AuthContext';
import { civicApi } from '../../lib/civicApi';
import { formatRelativeDate } from '../../utils/civicLogic';
import type { UserProfile, UserRole } from '../../types/civic';

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  useEffect(() => {
    civicApi
      .listUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(target: UserProfile, role: UserRole) {
    if (target.id === currentUser?.id && role !== 'admin') {
      toast.error('You cannot remove your own administrator role.');
      return;
    }
    try {
      const updated = await civicApi.updateUserAdmin(target.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
      toast.success(`${updated.fullName} role updated to ${role}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to update role.');
    }
  }

  async function handleToggleActive(target: UserProfile) {
    if (target.id === currentUser?.id) {
      toast.error('You cannot deactivate your own active session.');
      return;
    }
    try {
      const updated = await civicApi.updateUserAdmin(target.id, { isActive: !target.isActive });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
      toast.success(`${updated.fullName} ${updated.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to update user status.');
    }
  }

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <PortalLayout
      portal="admin"
      title="User Management"
      breadcrumb="Admin Portal / Users"
    >
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <label htmlFor="admin-users-search" className="sr-only">
              Search users
            </label>
            <input
              id="admin-users-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or address..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
            {(['all', 'citizen', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded capitalize transition-colors ${
                  roleFilter === r
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'all' ? 'All Users' : `${r}s`}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              <div className="h-12 bg-slate-100 rounded animate-pulse" />
              <div className="h-12 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Name &amp; Email</th>
                    <th className="py-3 px-4">Phone &amp; Address</th>
                    <th className="py-3 px-4">Portal Role</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{u.fullName}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <p>{u.phone || '—'}</p>
                        <p className="text-slate-500 truncate max-w-[220px]">{u.address || '—'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          aria-label={`Role for ${u.fullName}`}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                        >
                          <option value="citizen">Citizen</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {formatRelativeDate(u.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          className="text-xs font-semibold text-[#163A5F] hover:underline"
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
