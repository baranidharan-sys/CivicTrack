import { CheckCircle2, Clock, Eye, Wrench, XCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { STATUS_LABELS, SEVERITY_LABELS } from '../utils/civicLogic';
import type { ComplaintSeverity, ComplaintStatus } from '../types/civic';

export function StatusIndicator({ status }: { status: ComplaintStatus }) {
  const config: Record<
    ComplaintStatus,
    { text: string; bg: string; border: string; Icon: typeof Clock }
  > = {
    submitted: {
      text: 'text-slate-800',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      Icon: Clock,
    },
    under_review: {
      text: 'text-indigo-800',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      Icon: Eye,
    },
    in_progress: {
      text: 'text-amber-800',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      Icon: Wrench,
    },
    resolved: {
      text: 'text-emerald-800',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      Icon: CheckCircle2,
    },
    rejected: {
      text: 'text-red-800',
      bg: 'bg-red-50',
      border: 'border-red-200',
      Icon: XCircle,
    },
  };

  const { text, bg, border, Icon } = config[status] ?? config.submitted;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border whitespace-nowrap shrink-0 ${bg} ${text} ${border}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
}

export function SeverityIndicator({ severity }: { severity: ComplaintSeverity }) {
  const styles: Record<ComplaintSeverity, { cls: string; Icon: typeof AlertCircle }> = {
    low: { cls: 'text-slate-600', Icon: AlertCircle },
    medium: { cls: 'text-sky-700', Icon: AlertCircle },
    high: { cls: 'text-amber-700', Icon: AlertTriangle },
    critical: { cls: 'text-red-700', Icon: AlertTriangle },
  };
  const { cls, Icon } = styles[severity] ?? styles.medium;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${cls}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{SEVERITY_LABELS[severity]}</span>
    </span>
  );
}
