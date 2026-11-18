import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, MapPin } from 'lucide-react';
import { PortalLayout } from '../../components/PortalLayout';
import { CivicMap, complaintToMarker } from '../../components/CivicMap';
import { StatusIndicator, SeverityIndicator } from '../../components/StatusBadge';
import { civicApi } from '../../lib/civicApi';
import {
  computeCategoryBreakdown,
  computeDashboardStats,
  formatRelativeDate,
} from '../../utils/civicLogic';
import type { Complaint } from '../../types/civic';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    civicApi
      .listComplaints()
      .then(setComplaints)
      .finally(() => setLoading(false));
  }, []);

  const stats = computeDashboardStats(complaints);
  const categoryData = computeCategoryBreakdown(complaints);
  const markers = complaints.map(complaintToMarker);
  const recent = complaints.slice(0, 6);

  return (
    <PortalLayout
      portal="admin"
      title="Municipal Operations Dashboard"
      breadcrumb="Admin Portal / Dashboard"
      headerAction={
        <Link
          to="/admin/management"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] transition-colors whitespace-nowrap"
        >
          <span>Triage Queue</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      }
    >
      <div className="space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500">Total Complaints</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {loading ? '—' : stats.total}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500">New / Submitted</p>
            <p className="mt-1.5 text-2xl font-bold text-[#163A5F] font-mono tabular-nums">
              {loading ? '—' : stats.submitted}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500">Under Review &amp; Active</p>
            <p className="mt-1.5 text-2xl font-bold text-amber-700 font-mono tabular-nums">
              {loading ? '—' : stats.underReview + stats.inProgress}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500">Resolved</p>
            <p className="mt-1.5 text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {loading ? '—' : stats.resolved}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5 col-span-2 lg:col-span-1">
            <p className="text-xs font-medium text-slate-500">Resolution Rate</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {loading ? '—' : `${stats.resolutionRate}%`}
            </p>
          </div>
        </div>

        {/* Chart + Live City Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Complaints by Category</h2>
                <p className="text-xs text-slate-500">Open vs. resolved breakdown across civic categories</p>
              </div>
              <Link
                to="/admin/analytics"
                className="text-xs font-semibold text-[#163A5F] hover:underline"
              >
                Full Analytics
              </Link>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="shortName" interval={0} tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="open" name="Open" stackId="a" fill="#163A5F" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#15803D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Citywide Incident Map</h2>
                <p className="text-xs text-slate-500">Select a pin to inspect complaint details</p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {markers.length} plotted
              </span>
            </div>
            <CivicMap
              latitude={45.5202}
              longitude={-122.6742}
              zoom={13}
              heightClass="h-72"
              markers={markers}
              onMarkerClick={(id) => navigate(`/admin/complaints/${id}`)}
            />
          </div>
        </div>

        {/* Recent Complaints Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Incoming Complaints</h2>
            <Link
              to="/admin/complaints"
              className="text-xs font-semibold text-[#163A5F] hover:underline"
            >
              View All Complaints
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Issue &amp; Reporter</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recent.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#163A5F] whitespace-nowrap">
                      {c.referenceId}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                      <p className="text-xs text-slate-500 inline-flex items-center gap-1 mt-0.5 truncate max-w-full">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {c.address} · {c.citizenName}
                        </span>
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                      {c.departmentName || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SeverityIndicator severity={c.severity} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusIndicator status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {formatRelativeDate(c.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/complaints/${c.id}`}
                        className="text-xs font-semibold text-[#163A5F] hover:underline"
                      >
                        Review &amp; Assign
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
