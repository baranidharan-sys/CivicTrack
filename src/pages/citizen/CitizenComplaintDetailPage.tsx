import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, MapPin } from 'lucide-react';
import { PortalLayout } from '../../components/PortalLayout';
import { CivicMap } from '../../components/CivicMap';
import { StatusIndicator, SeverityIndicator } from '../../components/StatusBadge';
import { TrackingStepper, ComplaintTimeline } from '../../components/ComplaintTimeline';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { civicApi } from '../../lib/civicApi';
import { formatDateTime } from '../../utils/civicLogic';
import type { Complaint } from '../../types/civic';

export function CitizenComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    civicApi
      .getComplaint(id)
      .then((data) => {
        setComplaint(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load complaint.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <PortalLayout
      portal="citizen"
      title={complaint ? `Complaint ${complaint.referenceId}` : 'Complaint Details'}
      breadcrumb="Citizen Portal / My Complaints / Details"
      headerAction={
        <Link
          to="/citizen/complaints"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to List</span>
        </Link>
      }
    >
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 space-y-4">
          <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
          <div className="h-24 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : error || !complaint ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-sm text-red-800">
          {error || 'Complaint not found.'}
        </div>
      ) : (
        <div className="space-y-6">
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

            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
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
                  <p className="mt-0.5">
                    {complaint.departmentName || 'Pending Municipal Assignment'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-slate-900">Timestamps</p>
                  <p className="mt-0.5 tabular-nums">Submitted {formatDateTime(complaint.createdAt)}</p>
                  <p className="text-slate-500 tabular-nums">
                    Updated {formatDateTime(complaint.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {complaint.resolutionNotes && (
              <div className="mt-5 p-4 rounded-md bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-900">Resolution Notes</p>
                <p className="mt-1 text-sm text-emerald-800">{complaint.resolutionNotes}</p>
              </div>
            )}
          </div>

          <TrackingStepper status={complaint.status} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Photographic Evidence</h3>
              <div className="h-72 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                <ImageWithFallback
                  src={complaint.photoUrl}
                  alt={complaint.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Location Pin</h3>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}
                </span>
              </div>
              <CivicMap
                latitude={complaint.latitude}
                longitude={complaint.longitude}
                zoom={15}
                heightClass="h-72"
              />
            </div>
          </div>

          <ComplaintTimeline updates={complaint.updates} />
        </div>
      )}
    </PortalLayout>
  );
}
