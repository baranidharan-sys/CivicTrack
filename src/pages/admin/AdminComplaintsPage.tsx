import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { PortalLayout } from '../../components/PortalLayout';
import { StatusIndicator, SeverityIndicator } from '../../components/StatusBadge';
import { civicApi } from '../../lib/civicApi';
import { filterComplaints, formatRelativeDate } from '../../utils/civicLogic';
import {
  COMPLAINT_CATEGORIES,
  type Complaint,
  type ComplaintCategory,
  type ComplaintStatus,
  type Department,
} from '../../types/civic';

export function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ComplaintStatus | 'all'>('all');
  const [category, setCategory] = useState<ComplaintCategory | 'all'>('all');
  const [departmentId, setDepartmentId] = useState<string>('all');

  useEffect(() => {
    Promise.all([civicApi.listComplaints(), civicApi.listDepartments()])
      .then(([cList, dList]) => {
        setComplaints(cList);
        setDepartments(dList);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterComplaints(complaints, { search, status, category, departmentId });

  return (
    <PortalLayout
      portal="admin"
      title="All Citizen Complaints"
      breadcrumb="Admin Portal / All Complaints"
    >
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search
              className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <label htmlFor="admin-complaints-search" className="sr-only">
              Search complaints
            </label>
            <input
              id="admin-complaints-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference ID, title, citizen, address..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="admin-complaints-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="admin-complaints-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ComplaintStatus | 'all')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Closed / Rejected</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="admin-complaints-category" className="sr-only">
              Filter by category
            </label>
            <select
              id="admin-complaints-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory | 'all')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
            >
              <option value="all">All Categories</option>
              {COMPLAINT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="admin-complaints-dept" className="sr-only">
              Filter by department
            </label>
            <select
              id="admin-complaints-dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              <div className="h-12 bg-slate-100 rounded animate-pulse" />
              <div className="h-12 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-slate-900">No complaints match current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Reference ID</th>
                    <th className="py-3 px-4">Issue &amp; Location</th>
                    <th className="py-3 px-4">Citizen</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Logged</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#163A5F] whitespace-nowrap">
                        {c.referenceId}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                        <p className="text-xs text-slate-500 inline-flex items-center gap-1 mt-0.5 truncate max-w-full">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">{c.address}</span>
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                        {c.citizenName || 'Resident'}
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
                          Manage
                        </Link>
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
