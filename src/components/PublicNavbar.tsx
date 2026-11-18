import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function PublicNavbar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const ctaHref = user
    ? user.role === 'admin'
      ? '/admin/dashboard'
      : '/citizen/report'
    : '/citizen/report';

  const ctaLabel = user?.role === 'admin' ? 'Admin Console' : 'Report a Problem';
  const portalHref = user
    ? user.role === 'admin'
      ? '/admin/dashboard'
      : '/citizen/dashboard'
    : '/login';
  const portalLabel = user ? 'My Portal' : 'Citizen Login';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-[#163A5F] whitespace-nowrap shrink-0 font-[var(--font-display)]"
        >
          CivicTrack
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600" aria-label="Primary navigation">
          <Link
            to="/track"
            className="hover:text-[#163A5F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Track Complaint
          </Link>
          <a
            href="/#categories"
            className="hover:text-[#163A5F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Issue Categories
          </a>
          <Link
            to={portalHref}
            className="hover:text-[#163A5F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {portalLabel}
          </Link>
          <Link
            to="/admin/login"
            className="hover:text-[#163A5F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Admin Portal
          </Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={ctaHref}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] transition-colors whitespace-nowrap shrink-0"
          >
            {ctaLabel}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-md border border-slate-200"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1"
          aria-label="Mobile navigation"
        >
          <Link
            to="/track"
            onClick={() => setMobileOpen(false)}
            className="block py-2 px-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md"
          >
            Track Complaint
          </Link>
          <a
            href="/#categories"
            onClick={() => setMobileOpen(false)}
            className="block py-2 px-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md"
          >
            Issue Categories
          </a>
          <Link
            to={portalHref}
            onClick={() => setMobileOpen(false)}
            className="block py-2 px-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md"
          >
            {portalLabel}
          </Link>
          <Link
            to="/admin/login"
            onClick={() => setMobileOpen(false)}
            className="block py-2 px-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-md"
          >
            Admin Portal
          </Link>
        </nav>
      )}
    </header>
  );
}
