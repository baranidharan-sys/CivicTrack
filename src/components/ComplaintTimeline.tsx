import { Check } from 'lucide-react';
import {
  TRACKING_STEPS,
  STATUS_LABELS,
  getTrackingStepIndex,
  formatDateTime,
} from '../utils/civicLogic';
import type { ComplaintStatus, ComplaintUpdate } from '../types/civic';

export function TrackingStepper({ status }: { status: ComplaintStatus }) {
  const activeIdx = getTrackingStepIndex(status);
  const isRejected = status === 'rejected';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-sm font-semibold text-slate-900">Resolution Progress</h2>
        <span className="text-xs font-medium text-slate-500">
          Current Stage: <strong className="text-slate-900">{STATUS_LABELS[status]}</strong>
        </span>
      </div>

      {isRejected ? (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-sm text-red-900">
          This complaint was closed or rejected by municipal review. Check the official resolution notes below for details.
        </div>
      ) : (
        <ol className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {TRACKING_STEPS.map((step, idx) => {
            const completed = idx < activeIdx || status === 'resolved';
            const current = idx === activeIdx && status !== 'resolved';
            return (
              <li key={step.key} className="relative flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-7 w-7 rounded-md flex items-center justify-center text-xs font-mono font-semibold shrink-0 border ${
                      completed
                        ? 'bg-[#163A5F] border-[#163A5F] text-white'
                        : current
                          ? 'bg-[#E6EEF6] border-[#163A5F] text-[#163A5F]'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {completed ? <Check className="h-4 w-4" /> : idx + 1}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      completed || current ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pl-9 sm:pl-0">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function ComplaintTimeline({ updates }: { updates?: ComplaintUpdate[] }) {
  if (!updates || updates.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">Activity &amp; Status History</h2>
        <p className="text-sm text-slate-500">No timeline entries recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">Activity &amp; Status History</h2>
      <div className="space-y-4">
        {updates.map((upd, idx) => (
          <div
            key={upd.id}
            className={`pb-4 ${idx < updates.length - 1 ? 'border-b border-slate-100' : ''}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">{upd.authorName}</span>
                <span aria-hidden="true">·</span>
                <span>{upd.authorRole === 'admin' ? 'Municipal Staff' : 'Citizen'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[#163A5F]">{STATUS_LABELS[upd.newStatus]}</span>
              </div>
              <time className="text-xs font-mono tabular-nums text-slate-500">
                {formatDateTime(upd.createdAt)}
              </time>
            </div>
            <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{upd.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
