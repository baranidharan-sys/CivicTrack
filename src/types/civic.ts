export type UserRole = 'citizen' | 'admin';

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type ComplaintSeverity = 'low' | 'medium' | 'high' | 'critical';

export const COMPLAINT_CATEGORIES = [
  'Road Damage & Potholes',
  'Broken Streetlights',
  'Garbage Accumulation',
  'Blocked Drainage',
  'Water Leakage',
  'Damaged Public Infrastructure',
  'Environmental & Civic',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  departmentId: string | null;
  avatarUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  headName: string;
  slaHours: number;
  isActive: boolean;
  createdAt: string;
}

export interface ComplaintUpdate {
  id: string;
  complaintId: string;
  updatedBy: string | null;
  authorName: string;
  authorRole: UserRole;
  previousStatus: ComplaintStatus | null;
  newStatus: ComplaintStatus;
  note: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  referenceId: string;
  citizenId: string;
  citizenName?: string;
  citizenEmail?: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  departmentId: string | null;
  departmentName?: string;
  assignedTo: string | null;
  latitude: number;
  longitude: number;
  address: string;
  ward: string;
  photoUrl: string;
  resolutionNotes: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  updates?: ComplaintUpdate[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  complaintId: string | null;
  referenceId: string;
  title: string;
  message: string;
  type: 'info' | 'status_change' | 'assignment' | 'resolved';
  isRead: boolean;
  createdAt: string;
}

export interface PublicStats {
  totalComplaints: number;
  resolvedComplaints: number;
  inProgressComplaints: number;
  resolutionRate: number;
  avgResolutionHours: number;
  recentResolved: Complaint[];
}

export interface DashboardStats {
  total: number;
  submitted: number;
  underReview: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  resolutionRate: number;
  avgResolutionHours: number;
}
