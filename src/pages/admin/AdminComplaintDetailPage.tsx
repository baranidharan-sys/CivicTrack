import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/PortalLayout';
import { CivicMap } from '../../components/CivicMap';
import { StatusIndicator, SeverityIndicator } from '../../components/StatusBadge';
import { TrackingStepper, ComplaintTimeline } from '../../components/ComplaintTimeline';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { civicApi } from '../../lib/civicApi';
import { formatDateTime } from '../../utils/civicLogic';
import type { Complaint, ComplaintStatus, Department } from '../../types/civic';

export function AdminComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<ComplaintStatus>('submitted');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updateNote, setUpdateNote] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([civicApi.getComplaint(id), civicApi.listDepartments()])
      .then(([cmp, depts]) => {
        setComplaint(cmp);
        setDepartments(depts);
        setStatus(cmp.status);
        setDepartmentId(cmp.departmentId || '');
        setResolutionNotes(cmp.resolutionNotes || '');
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Unable to load complaint.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSaveUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!complaint) return;
    setSaving(true);
    try {
      const updated = await civicApi.updateComplaintAdmin(complaint.id, {
        status,
        departmentId,
        resolutionNotes,
        updateNote,
      });
      setComplaint(updated);
      setUpdateNote('');
      toast.success(`Updated ${updated.referenceId} and notified citizen.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to save update.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PortalLayout
      portal="admin"
      title={complaint ? `Manage ${complaint.referenceId}` : 'Complaint Review'}
      breadcrumb="Admin Portal / All Complaints / Review & Dispatch"
      headerAction={
        <Link
          to="/admin/complaints"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to All Complaints</span>
        </Link>
      }
    >
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 space-y-4">
          <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
          <div className="h-28 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : !complaint ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-sm text-red-800">
          Complaint not found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Evidence & Timeline */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-bold text-[#163A5F] text-sm">
                      {complaint.referenceId}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{complaint.category}</span>
                    <span aria-hidden="true">·</span>
                    <SeverityIndicator severity={complaint.severity} />
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">{complaint.title}</h2>
                </div>
                <StatusIndicator status={complaint.status} />
              </div>

              <p className="mt-4 text-sm text-slate-700 leading-relaxed">{complaint.description}</p>

              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-slate-900">Submitted By</p>
                    <p className="mt-0.5">{complaint.citizenName}</p>
                    {complaint.citizenEmail && (
                      <p className="text-slate-500">{complaint.citizenEmail}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-slate-900">Address &amp; Zone</p>
                    <p className="mt-0.5">{complaint.address}</p>
                    <p className="text-slate-500">{complaint.ward}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-slate-900">Assigned Department</p>
                    <p className="mt-0.5">{complaint.departmentName || 'Unassigned'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-slate-900">Logged Date</p>
                    <p className="mt-0.5 tabular-nums">{formatDateTime(complaint.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <TrackingStepper status={complaint.status} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Site Photograph</h3>
                <div className="h-64 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                  <ImageWithFallback
                    src={complaint.photoUrl}
                    alt={complaint.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-900">Geolocation</h3>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
                  </span>
                </div>
                <CivicMap
                  latitude={complaint.latitude}
                  longitude={complaint.longitude}
                  zoom={15}
                  heightClass="h-64"
                />
              </div>
            </div>

            <ComplaintTimeline updates={complaint.updates} />
          </div>

          {/* Right Column: Official Resolution & Dispatch Controls */}
          <div className="lg:col-span-4">
            <form
              onSubmit={handleSaveUpdate}
              className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 sticky top-24"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900">Dispatch &amp; Resolution</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Assign a department, update status, and notify the citizen immediately.
                </p>
              </div>

              <div>
                <label
                  htmlFor="admin-detail-dept"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Assigned Department
                </label>
                <select
                  id="admin-detail-dept"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="admin-detail-status"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Workflow Status
                </label>
                <select
                  id="admin-detail-status"
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
                <label
                  htmlFor="admin-detail-resnotes"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Official Resolution Summary
                </label>
                <textarea
                  id="admin-detail-resnotes"
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Summary of repair or inspection findings visible on tracking page..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-detail-updatenote"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Timeline Activity Note (Optional)
                </label>
                <input
                  id="admin-detail-updatenote"
                  type="text"
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="e.g. Crew #4 dispatched with resurfacing equipment"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] disabled:opacity-60 transition-colors"
              >
                {saving ? 'Saving Update...' : 'Save & Notify Citizen'}
              </button>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
