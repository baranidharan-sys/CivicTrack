import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  Search,
  Settings2,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

interface PortalLayoutProps {
  portal: 'citizen' | 'admin';
  title: string;
  breadcrumb: string;
  unreadNotifications?: number;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export function PortalLayout({
  portal,
  title,
  breadcrumb,
  unreadNotifications = 0,
  headerAction,
  children,
}: PortalLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const citizenNav: NavItem[] = [
    { to: '/citizen/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/citizen/report', label: 'Report a Problem', icon: FilePlus2 },
    { to: '/citizen/complaints', label: 'My Complaints', icon: ClipboardList },
    { to: '/citizen/track', label: 'Track Complaint', icon: Search },
    {
      to: '/citizen/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifications,
    },
    { to: '/citizen/profile', label: 'Profile', icon: User },
  ];

  const adminNav: NavItem[] = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/complaints', label: 'All Complaints', icon: ClipboardList },
    { to: '/admin/management', label: 'Complaint Management', icon: Settings2 },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/analytics', label: 'Reports & Analytics', icon: PieChart },
    { to: '/admin/profile', label: 'Admin Profile', icon: User },
  ];

  const navItems = portal === 'admin' ? adminNav : citizenNav;

  async function handleLogout() {
    await logout();
    navigate(portal === 'admin' ? '/admin/login' : '/login');
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0B1F35] text-slate-200">
      <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 shrink-0">
        <Link to="/" className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
          CivicTrack
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-300 hover:text-white rounded"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-6 py-4 border-b border-white/10">
        <p className="text-xs font-medium text-slate-400">
          {portal === 'admin' ? 'Administrator Portal' : 'Citizen Portal'}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-white truncate">{user?.fullName}</p>
        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Portal navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#163A5F] text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="text-xs font-mono tabular-nums px-1.5 py-0.5 rounded bg-white/15 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 border-r border-slate-200 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">{breadcrumb}</p>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {headerAction}
            {portal === 'citizen' && (
              <Link
                to="/citizen/notifications"
                className="relative p-2 text-slate-600 hover:text-[#163A5F] rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="sr-only">{unreadNotifications} unread notifications</span>
                )}
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1320px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
