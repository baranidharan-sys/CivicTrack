import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, FilePlus2, MapPin, Search } from 'lucide-react';
import { PortalLayout } from '../../components/PortalLayout';
import { StatusIndicator, SeverityIndicator } from '../../components/StatusBadge';
import { civicApi } from '../../lib/civicApi';
import { computeDashboardStats, formatRelativeDate } from '../../utils/civicLogic';
import type { Complaint, NotificationItem } from '../../types/civic';

export function CitizenDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([civicApi.listComplaints(), civicApi.listNotifications()])
      .then(([cList, nList]) => {
        setComplaints(cList);
        setNotifications(nList);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = computeDashboardStats(complaints);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const recent = complaints.slice(0, 5);

  return (
    <PortalLayout
      portal="citizen"
      title="Citizen Dashboard"
      breadcrumb="Citizen Portal / Overview"
      unreadNotifications={unreadCount}
      headerAction={
        <Link
          to="/citizen/report"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] transition-colors whitespace-nowrap"
        >
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          <span>Report a Problem</span>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500">My Submitted Reports</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {loading ? '—' : stats.total}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500">Awaiting Review</p>
            <p className="mt-1.5 text-2xl font-bold text-[#163A5F] font-mono tabular-nums">
              {loading ? '—' : stats.submitted + stats.underReview}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500">In Progress</p>
            <p className="mt-1.5 text-2xl font-bold text-amber-700 font-mono tabular-nums">
              {loading ? '—' : stats.inProgress}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500">Resolved</p>
            <p className="mt-1.5 text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {loading ? '—' : stats.resolved}
            </p>
          </div>
        </div>

        {/* Two-column summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Recent Complaints</h2>
              <Link
                to="/citizen/complaints"
                className="text-xs font-semibold text-[#163A5F] hover:underline"
              >
                View All
              </Link>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                <div className="h-12 bg-slate-100 rounded animate-pulse" />
                <div className="h-12 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : recent.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-slate-900">No complaints submitted yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Report a pothole, streetlight outage, or sanitation issue to begin tracking.
                </p>
                <Link
                  to="/citizen/report"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35]"
                >
                  Submit First Report
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recent.map((c) => (
                  <Link
                    key={c.id}
                    to={`/citizen/complaints/${c.id}`}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-[#163A5F]">
                          {c.referenceId}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{c.category}</span>
                        <span aria-hidden="true">·</span>
                        <SeverityIndicator severity={c.severity} />
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>{c.address}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatRelativeDate(c.createdAt)}</span>
                      </p>
                    </div>
                    <div className="shrink-0">
                      <StatusIndicator status={c.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
              </div>
              <div className="space-y-2.5">
                <Link
                  to="/citizen/report"
                  className="flex items-center justify-between p-3 rounded-md border border-slate-200 hover:border-[#163A5F] hover:bg-[#F2F6FA] transition-colors"
                >
                  <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
                    <FilePlus2 className="h-4 w-4 text-[#163A5F]" aria-hidden="true" />
                    <span>Report a Public Issue</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </Link>
                <Link
                  to="/citizen/track"
                  className="flex items-center justify-between p-3 rounded-md border border-slate-200 hover:border-[#163A5F] hover:bg-[#F2F6FA] transition-colors"
                >
                  <span className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
                    <Search className="h-4 w-4 text-[#163A5F]" aria-hidden="true" />
                    <span>Track by Reference ID</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#163A5F]" aria-hidden="true" />
                  <span>Recent Updates</span>
                </h2>
                <Link
                  to="/citizen/notifications"
                  className="text-xs font-semibold text-[#163A5F] hover:underline"
                >
                  All
                </Link>
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500">No updates yet.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-md border ${
                        n.isRead ? 'bg-white border-slate-100' : 'bg-[#F2F6FA] border-[#163A5F]/20'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
