import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/civic';

interface ProtectedRouteProps {
  allowedRole: UserRole;
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRole, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-[#163A5F] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Verifying portal credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const loginPath = allowedRole === 'admin' ? '/admin/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  if (allowedRole === 'admin' && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-lg p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-700">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Administrator Access Required</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your current account is registered as a citizen. Administrator pages require municipal staff authorization.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a
              href="/citizen/dashboard"
              className="px-4 py-2 text-sm font-medium text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] transition-colors"
            >
              Return to Citizen Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (allowedRole === 'citizen' && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
