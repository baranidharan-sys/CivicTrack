import {
  COMPLAINT_CATEGORIES,
  type Complaint,
  type ComplaintCategory,
  type ComplaintSeverity,
  type ComplaintStatus,
  type DashboardStats,
  type Department,
} from '../types/civic';

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Closed / Rejected',
};

export const SEVERITY_LABELS: Record<ComplaintSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const TRACKING_STEPS: { key: ComplaintStatus; label: string; description: string }[] = [
  {
    key: 'submitted',
    label: 'Submitted',
    description: 'Complaint logged and reference ID issued.',
  },
  {
    key: 'under_review',
    label: 'Under Review',
    description: 'Verified by municipal dispatch and routed to department.',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    description: 'Field crew assigned and remediation underway.',
  },
  {
    key: 'resolved',
    label: 'Resolved',
    description: 'Issue fixed and verified with resolution summary.',
  },
];

export function generateReferenceId(year: number, sequenceNumber: number): string {
  const padded = String(Math.max(1, sequenceNumber)).padStart(4, '0');
  return `CT-${year}-${padded}`;
}

export function isValidReferenceId(value: string): boolean {
  return /^CT-\d{4}-\d{4,}$/.test(value.trim().toUpperCase());
}

export function getTrackingStepIndex(status: ComplaintStatus): number {
  if (status === 'rejected') return 1;
  const idx = TRACKING_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export function canTransitionStatus(
  fromStatus: ComplaintStatus,
  toStatus: ComplaintStatus,
): boolean {
  if (fromStatus === toStatus) return true;
  const allowedTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
    submitted: ['under_review', 'in_progress', 'resolved', 'rejected'],
    under_review: ['in_progress', 'resolved', 'rejected', 'submitted'],
    in_progress: ['resolved', 'under_review', 'rejected'],
    resolved: ['in_progress', 'under_review'],
    rejected: ['under_review', 'submitted'],
  };
  return allowedTransitions[fromStatus]?.includes(toStatus) ?? false;
}

export interface ComplaintFilterOptions {
  search?: string;
  status?: ComplaintStatus | 'all';
  category?: ComplaintCategory | 'all';
  severity?: ComplaintSeverity | 'all';
  departmentId?: string | 'all';
}

export function filterComplaints(
  complaints: Complaint[],
  filters: ComplaintFilterOptions,
): Complaint[] {
  const query = (filters.search ?? '').trim().toLowerCase();

  return complaints
    .filter((item) => {
      if (filters.status && filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      if (filters.category && filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }
      if (filters.severity && filters.severity !== 'all' && item.severity !== filters.severity) {
        return false;
      }
      if (
        filters.departmentId &&
        filters.departmentId !== 'all' &&
        item.departmentId !== filters.departmentId
      ) {
        return false;
      }
      if (query) {
        const haystack = [
          item.referenceId,
          item.title,
          item.description,
          item.address,
          item.ward,
          item.category,
          item.citizenName ?? '',
          item.departmentName ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function computeDashboardStats(complaints: Complaint[]): DashboardStats {
  const total = complaints.length;
  const submitted = complaints.filter((c) => c.status === 'submitted').length;
  const underReview = complaints.filter((c) => c.status === 'under_review').length;
  const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
  const resolvedList = complaints.filter((c) => c.status === 'resolved');
  const resolved = resolvedList.length;
  const rejected = complaints.filter((c) => c.status === 'rejected').length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  let avgResolutionHours = 0;
  const resolvedWithDuration = resolvedList.filter((c) => c.resolvedAt);
  if (resolvedWithDuration.length > 0) {
    const totalHours = resolvedWithDuration.reduce((sum, item) => {
      const start = new Date(item.createdAt).getTime();
      const end = new Date(item.resolvedAt!).getTime();
      const hours = Math.max(1, (end - start) / (1000 * 60 * 60));
      return sum + hours;
    }, 0);
    avgResolutionHours = Math.round(totalHours / resolvedWithDuration.length);
  }

  return {
    total,
    submitted,
    underReview,
    inProgress,
    resolved,
    rejected,
    resolutionRate,
    avgResolutionHours,
  };
}

export interface CategoryBreakdownItem {
  category: string;
  shortName: string;
  total: number;
  resolved: number;
  open: number;
}

const SHORT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  'Road Damage & Potholes': 'Roads',
  'Broken Streetlights': 'Lights',
  'Garbage Accumulation': 'Waste',
  'Blocked Drainage': 'Drains',
  'Water Leakage': 'Water',
  'Damaged Public Infrastructure': 'Infra',
  'Environmental & Civic': 'Civic',
};

export function computeCategoryBreakdown(complaints: Complaint[]): CategoryBreakdownItem[] {
  return COMPLAINT_CATEGORIES.map((category) => {
    const matching = complaints.filter((c) => c.category === category);
    const resolved = matching.filter((c) => c.status === 'resolved').length;
    return {
      category,
      shortName: SHORT_CATEGORY_LABELS[category],
      total: matching.length,
      resolved,
      open: matching.length - resolved,
    };
  });
}

export interface DepartmentWorkloadItem {
  departmentId: string;
  name: string;
  code: string;
  assigned: number;
  resolved: number;
  active: number;
}

export function computeDepartmentWorkload(
  complaints: Complaint[],
  departments: Department[],
): DepartmentWorkloadItem[] {
  return departments.map((dept) => {
    const deptComplaints = complaints.filter((c) => c.departmentId === dept.id);
    const resolved = deptComplaints.filter((c) => c.status === 'resolved').length;
    const active = deptComplaints.filter(
      (c) => c.status === 'submitted' || c.status === 'under_review' || c.status === 'in_progress',
    ).length;
    return {
      departmentId: dept.id,
      name: dept.name,
      code: dept.code,
      assigned: deptComplaints.length,
      resolved,
      active,
    };
  });
}

export interface MonthlyTrendItem {
  month: string;
  submitted: number;
  resolved: number;
}

export function computeMonthlyTrends(complaints: Complaint[]): MonthlyTrendItem[] {
  const buckets = new Map<string, { label: string; sortKey: string; submitted: number; resolved: number }>();

  for (const c of complaints) {
    const d = new Date(c.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
    const entry = buckets.get(key) ?? { label, sortKey: key, submitted: 0, resolved: 0 };
    entry.submitted += 1;
    if (c.status === 'resolved') {
      entry.resolved += 1;
    }
    buckets.set(key, entry);
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ label, submitted, resolved }) => ({ month: label, submitted, resolved }));
}

export interface ComplaintFormValidationInput {
  title: string;
  description: string;
  category: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export function validateComplaintInput(
  input: ComplaintFormValidationInput,
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.title || input.title.trim().length < 5) {
    errors.title = 'Enter a descriptive title of at least 5 characters.';
  }
  if (!input.description || input.description.trim().length < 15) {
    errors.description = 'Provide at least 15 characters describing the issue.';
  }
  if (!COMPLAINT_CATEGORIES.includes(input.category as ComplaintCategory)) {
    errors.category = 'Select a valid problem category.';
  }
  if (!input.address || input.address.trim().length < 4) {
    errors.address = 'Enter a street address or nearest landmark.';
  }
  if (
    input.latitude === null ||
    input.longitude === null ||
    Number.isNaN(input.latitude) ||
    Number.isNaN(input.longitude) ||
    input.latitude < -90 ||
    input.latitude > 90 ||
    input.longitude < -180 ||
    input.longitude > 180
  ) {
    errors.location = 'Select a valid location pin on the map or use GPS.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRegistrationInput(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!input.password || input.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
