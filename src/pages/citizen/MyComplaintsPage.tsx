import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, MapPin, Search } from 'lucide-react';
import { PortalLayout } from '../../components/PortalLayout';
import { StatusIndicator, SeverityIndicator } from '../../components/StatusBadge';
import { civicApi } from '../../lib/civicApi';
import { filterComplaints, formatRelativeDate } from '../../utils/civicLogic';
import {
  COMPLAINT_CATEGORIES,
  type Complaint,
  type ComplaintCategory,
  type ComplaintStatus,
} from '../../types/civic';

export function MyComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ComplaintStatus | 'all'>('all');
  const [category, setCategory] = useState<ComplaintCategory | 'all'>('all');

  useEffect(() => {
    civicApi
      .listComplaints()
      .then(setComplaints)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterComplaints(complaints, { search, status, category });

  return (
    <PortalLayout
      portal="citizen"
      title="My Complaints"
      breadcrumb="Citizen Portal / My Complaints"
      headerAction={
        <Link
          to="/citizen/report"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] transition-colors whitespace-nowrap"
        >
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          <span>New Report</span>
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search
              className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <label htmlFor="my-complaints-search" className="sr-only">
              Search complaints
            </label>
            <input
              id="my-complaints-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference ID, title, or address..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="my-complaints-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="my-complaints-status"
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
            <label htmlFor="my-complaints-category" className="sr-only">
              Filter by category
            </label>
            <select
              id="my-complaints-category"
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
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              <div className="h-12 bg-slate-100 rounded animate-pulse" />
              <div className="h-12 bg-slate-100 rounded animate-pulse" />
              <div className="h-12 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-slate-900">No matching complaints found</p>
              <p className="mt-1 text-xs text-slate-500">
                Try clearing your filters or submit a new public problem report.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Reference ID</th>
                    <th className="py-3 px-4">Issue &amp; Location</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Details</th>
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
                        {c.category}
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
                          to={`/citizen/complaints/${c.id}`}
                          className="text-xs font-semibold text-[#163A5F] hover:underline"
                        >
                          Inspect
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
