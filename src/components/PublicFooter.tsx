import { Link } from 'react-router-dom';

export function PublicFooter() {
  return (
    <footer className="bg-[#0B1F35] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          <div className="md:col-span-2">
            <span className="text-lg font-bold text-white tracking-tight">CivicTrack</span>
            <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
              Report It. Track It. Resolve It. Centralized public infrastructure reporting connecting residents directly with municipal operations departments.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Citizen Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/citizen/report" className="hover:text-white transition-colors">
                  Report a Problem
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">
                  Track Reference ID
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Citizen Registration
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Citizen Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Municipal Operations</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/admin/login" className="hover:text-white transition-colors">
                  Administrator Login
                </Link>
              </li>
              <li>
                <span className="text-slate-400">311 Dispatch Desk: (555) 201-4000</span>
              </li>
              <li>
                <span className="text-slate-400">support@civictrack.gov</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} CivicTrack Municipal Services Platform. All rights reserved.</p>
          <p>OpenStreetMap &amp; Municipal GIS Integrated</p>
        </div>
      </div>
    </footer>
  );
}
