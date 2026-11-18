import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/PortalLayout';
import { civicApi } from '../../lib/civicApi';
import {
  STATUS_LABELS,
  computeCategoryBreakdown,
  computeDashboardStats,
  computeDepartmentWorkload,
  computeMonthlyTrends,
} from '../../utils/civicLogic';
import type { Complaint, Department } from '../../types/civic';

const STATUS_COLORS: Record<string, string> = {
  submitted: '#163A5F',
  under_review: '#4338CA',
  in_progress: '#B45309',
  resolved: '#15803D',
  rejected: '#B91C1C',
};

export function AdminAnalyticsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([civicApi.listComplaints(), civicApi.listDepartments()])
      .then(([cList, dList]) => {
        setComplaints(cList);
        setDepartments(dList);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = computeDashboardStats(complaints);
  const categoryData = computeCategoryBreakdown(complaints);
  const deptWorkload = computeDepartmentWorkload(complaints, departments);
  const monthlyTrends = computeMonthlyTrends(complaints);

  const statusDistribution = [
    { key: 'submitted', name: STATUS_LABELS.submitted, value: stats.submitted },
    { key: 'under_review', name: STATUS_LABELS.under_review, value: stats.underReview },
    { key: 'in_progress', name: STATUS_LABELS.in_progress, value: stats.inProgress },
    { key: 'resolved', name: STATUS_LABELS.resolved, value: stats.resolved },
    { key: 'rejected', name: STATUS_LABELS.rejected, value: stats.rejected },
  ].filter((d) => d.value > 0);

  function handleExportCsv() {
    const header = [
      'Reference ID',
      'Title',
      'Category',
      'Severity',
      'Status',
      'Department',
      'Address',
      'Submitted At',
      'Resolved At',
    ];
    const rows = complaints.map((c) => [
      c.referenceId,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      c.severity,
      c.status,
      `"${c.departmentName || 'Unassigned'}"`,
      `"${c.address.replace(/"/g, '""')}"`,
      c.createdAt,
      c.resolvedAt || '',
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `civictrack-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV report downloaded.');
  }

  return (
    <PortalLayout
      portal="admin"
      title="Reports & Analytics"
      breadcrumb="Admin Portal / Reports & Analytics"
      headerAction={
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={complaints.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] disabled:opacity-60 transition-colors whitespace-nowrap"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>Download CSV</span>
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500">Total Reports</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {loading ? '—' : stats.total}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500">Resolution Rate</p>
            <p className="mt-1.5 text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {loading ? '—' : `${stats.resolutionRate}%`}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500">Average Turnaround</p>
            <p className="mt-1.5 text-2xl font-bold text-[#163A5F] font-mono tabular-nums">
              {loading ? '—' : `${stats.avgResolutionHours} hrs`}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <p className="text-xs font-medium text-slate-500">Active Departments</p>
            <p className="mt-1.5 text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {loading ? '—' : departments.filter((d) => d.isActive).length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Monthly Intake vs. Resolutions</h2>
            <p className="text-xs text-slate-500 mb-4">Complaint submission and closure volume over time</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#163A5F" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#15803D" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Status Distribution</h2>
            <p className="text-xs text-slate-500 mb-4">Current breakdown across workflow stages</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#163A5F'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Department Workload</h2>
            <p className="text-xs text-slate-500 mb-4">Active vs. resolved tickets by municipal department</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptWorkload} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="active" name="Active" fill="#B45309" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved" fill="#15803D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Category Performance Summary</h2>
            <p className="text-xs text-slate-500 mb-4">Volume and closure rate per public problem type</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 px-3 text-right">Total</th>
                    <th className="py-2 px-3 text-right">Open</th>
                    <th className="py-2 pl-3 text-right">Resolved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categoryData.map((row) => (
                    <tr key={row.category}>
                      <td className="py-2.5 pr-3 font-medium text-slate-900">{row.category}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        {row.total}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-700">
                        {row.open}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono tabular-nums text-emerald-700">
                        {row.resolved}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
