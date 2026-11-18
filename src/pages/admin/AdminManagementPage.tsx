import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/PortalLayout';
import { StatusIndicator, SeverityIndicator } from '../../components/StatusBadge';
import { civicApi } from '../../lib/civicApi';
import { formatRelativeDate } from '../../utils/civicLogic';
import type { Complaint, ComplaintStatus, Department } from '../../types/civic';

export function AdminManagementPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<ComplaintStatus>('under_review');
  const [departmentId, setDepartmentId] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterMode, setFilterMode] = useState<'active' | 'all'>('active');

  useEffect(() => {
    Promise.all([civicApi.listComplaints(), civicApi.listDepartments()]).then(([cList, dList]) => {
      setComplaints(cList);
      setDepartments(dList);
      const firstOpen = cList.find((c) => c.status !== 'resolved' && c.status !== 'rejected') || cList[0];
      if (firstOpen) {
        selectComplaint(firstOpen);
      }
    });
  }, []);

  function selectComplaint(c: Complaint) {
    setSelectedId(c.id);
    setStatus(c.status);
    setDepartmentId(c.departmentId || '');
    setResolutionNotes(c.resolutionNotes || '');
    setUpdateNote('');
  }

  const visibleQueue =
    filterMode === 'active'
      ? complaints.filter((c) => c.status !== 'resolved' && c.status !== 'rejected')
      : complaints;

  const selected = complaints.find((c) => c.id === selectedId) || null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await civicApi.updateComplaintAdmin(selected.id, {
        status,
        departmentId,
        resolutionNotes,
        updateNote,
      });
      setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setUpdateNote('');
      toast.success(`Updated ${updated.referenceId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalLayout
      portal="admin"
      title="Complaint Management Queue"
      breadcrumb="Admin Portal / Complaint Management"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <h2 className="text-sm font-bold text-slate-900">Dispatch Queue</h2>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
              <button
                type="button"
                onClick={() => setFilterMode('active')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  filterMode === 'active'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Open Queue
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Reports
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {visibleQueue.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No complaints in the selected queue.
              </div>
            ) : (
              visibleQueue.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectComplaint(c)}
                  className={`w-full text-left px-5 py-4 flex items-start justify-between gap-4 transition-colors ${
                    selectedId === c.id ? 'bg-[#F2F6FA]' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-[#163A5F]">
                        {c.referenceId}
                      </span>
                      <span aria-hidden="true">·</span>
                      <SeverityIndicator severity={c.severity} />
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatRelativeDate(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500 truncate">
                      {c.departmentName || 'Unassigned'} · {c.address}
                    </p>
                  </div>
                  <StatusIndicator status={c.status} />
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          {selected ? (
            <form
              onSubmit={handleSave}
              className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-mono font-bold text-[#163A5F]">
                    {selected.referenceId}
                  </span>
                  <h3 className="mt-1 text-base font-bold text-slate-900">{selected.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {selected.citizenName} · {selected.address}
                  </p>
                </div>
                <Link
                  to={`/admin/complaints/${selected.id}`}
                  className="text-xs font-semibold text-[#163A5F] hover:underline whitespace-nowrap"
                >
                  Full View
                </Link>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{selected.description}</p>

              <div>
                <label htmlFor="mgmt-dept" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assign Department
                </label>
                <select
                  id="mgmt-dept"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="mgmt-status" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status
                </label>
                <select
                  id="mgmt-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Closed / Rejected</option>
                </select>
              </div>

              <div>
                <label htmlFor="mgmt-notes" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Resolution Notes
                </label>
                <textarea
                  id="mgmt-notes"
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter official work order or resolution summary..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>

              <div>
                <label htmlFor="mgmt-activity" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Timeline Update Note
                </label>
                <input
                  id="mgmt-activity"
                  type="text"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="Optional status message for citizen..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] disabled:opacity-60 transition-colors"
              >
                {saving ? 'Updating...' : 'Apply Dispatch Update'}
              </button>
            </form>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-500">
              Select a complaint from the dispatch queue to manage it.
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
