import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Calendar, MapPin, Search } from 'lucide-react';
import { PublicNavbar } from '../../components/PublicNavbar';
import { PublicFooter } from '../../components/PublicFooter';
import { CivicMap } from '../../components/CivicMap';
import { StatusIndicator, SeverityIndicator } from '../../components/StatusBadge';
import { TrackingStepper, ComplaintTimeline } from '../../components/ComplaintTimeline';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { civicApi } from '../../lib/civicApi';
import { formatDateTime } from '../../utils/civicLogic';
import type { Complaint } from '../../types/civic';

const SAMPLE_REFS = ['CT-2026-1001', 'CT-2026-1002', 'CT-2026-1003', 'CT-2026-1004'];

export function TrackComplaintContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const [query, setQuery] = useState(initialRef);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookupReference(refId: string) {
    const cleaned = refId.trim().toUpperCase();
    if (!cleaned) return;
    setLoading(true);
    setError(null);
    try {
      const result = await civicApi.trackComplaint(cleaned);
      setComplaint(result);
    } catch (err) {
      setComplaint(null);
      setError(err instanceof Error ? err.message : 'Unable to locate complaint.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialRef) {
      setQuery(initialRef);
      void lookupReference(initialRef);
    }
  }, [initialRef]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = query.trim().toUpperCase();
    if (!cleaned) {
      setError('Enter a complaint reference ID such as CT-2026-1001.');
      return;
    }
    setSearchParams({ ref: cleaned });
    void lookupReference(cleaned);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-slate-900">Track Complaint Progress</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter your CivicTrack reference ID to inspect current workflow stage, assigned department, field notes, and location pin.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <label htmlFor="track-ref-input" className="sr-only">
              Complaint Reference ID
            </label>
            <input
              id="track-ref-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. CT-2026-1001"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#163A5F]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#163A5F] rounded-md hover:bg-[#0B1F35] disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Track Complaint'}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Quick lookup:</span>
          {SAMPLE_REFS.map((ref) => (
            <button
              key={ref}
              type="button"
              onClick={() => {
                setQuery(ref);
                setSearchParams({ ref });
                void lookupReference(ref);
              }}
              className="font-mono text-[#163A5F] hover:underline px-1.5 py-0.5 bg-[#F2F6FA] rounded"
            >
              {ref}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {complaint && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-[#163A5F] text-sm">
                    {complaint.referenceId}
                  </span>
                  <span>{complaint.category}</span>
                  <SeverityIndicator severity={complaint.severity} />
                </div>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{complaint.title}</h3>
              </div>
              <StatusIndicator status={complaint.status} />
            </div>

            <p className="mt-4 text-sm text-slate-700 leading-relaxed">{complaint.description}</p>

            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-slate-900">Reported Location</p>
                  <p className="mt-0.5">{complaint.address}</p>
                  {complaint.ward && <p className="text-slate-500">{complaint.ward}</p>}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-slate-900">Assigned Department</p>
                  <p className="mt-0.5">
                    {complaint.departmentName || 'Pending Municipal Triage'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-slate-900">Submitted &amp; Updated</p>
                  <p className="mt-0.5 tabular-nums">{formatDateTime(complaint.createdAt)}</p>
                  <p className="text-slate-500 tabular-nums">
                    Updated {formatDateTime(complaint.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {complaint.resolutionNotes && (
              <div className="mt-5 p-4 rounded-md bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-900">Official Resolution Notes</p>
                <p className="mt-1 text-sm text-emerald-800 leading-relaxed">
                  {complaint.resolutionNotes}
                </p>
              </div>
            )}
          </div>

          <TrackingStepper status={complaint.status} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Submitted Photograph</h4>
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
                <h4 className="text-sm font-semibold text-slate-900">Location Pin</h4>
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
    </div>
  );
}

export function TrackComplaintPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <PublicNavbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <TrackComplaintContent />
      </main>
      <PublicFooter />
    </div>
  );
}
