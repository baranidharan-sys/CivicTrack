import { isSupabaseConfigured, supabase } from './supabase';
import { isLocalToken, localCivicStore } from './localCivicStore';
import { computeDashboardStats, generateReferenceId } from '../utils/civicLogic';
import type {
  Complaint,
  ComplaintCategory,
  ComplaintSeverity,
  ComplaintStatus,
  ComplaintUpdate,
  Department,
  NotificationItem,
  PublicStats,
  UserProfile,
} from '../types/civic';

const TOKEN_STORAGE_KEY = 'civictrack_auth_token';
const SUPABASE_BYPASS_KEY = 'civictrack_supabase_bypass';

class BackendUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

function isSupabaseBypassed(): boolean {
  try {
    return sessionStorage.getItem(SUPABASE_BYPASS_KEY) === '1';
  } catch {
    return false;
  }
}

function markSupabaseBypassed(): void {
  try {
    sessionStorage.setItem(SUPABASE_BYPASS_KEY, '1');
  } catch {
    // ignore
  }
}

function shouldUseSupabase(): boolean {
  return Boolean(isSupabaseConfigured && supabase && !isSupabaseBypassed() && !getStoredToken());
}

/**
 * Distinguishes Supabase infrastructure / unmigrated schema / invalid API key errors
 * from genuine end-user auth/validation errors (e.g., duplicate email, wrong password).
 */
export function isSupabaseInfrastructureError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('fetch failed') ||
    msg.includes('invalid api key') ||
    msg.includes('no api key found') ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('email rate limit exceeded') ||
    msg.includes('error sending confirmation email')
  );
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage quota errors
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token && !isLocalToken(token)) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      credentials: 'same-origin',
      headers,
    });
  } catch {
    await new Promise((r) => setTimeout(r, 350));
    try {
      res = await fetch(url, {
        ...options,
        credentials: 'same-origin',
        headers,
      });
    } catch {
      throw new BackendUnavailableError('Network request to API server could not complete.');
    }
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new BackendUnavailableError(`Unexpected non-JSON API response (${res.status}).`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

async function withBackendFallback<T>(
  remoteCall: () => Promise<T>,
  localCall: () => T | Promise<T>,
): Promise<T> {
  if (isLocalToken(getStoredToken())) {
    return await localCall();
  }
  try {
    return await remoteCall();
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      return await localCall();
    }
    throw err;
  }
}

async function withSupabaseOrBackend<T>(
  supabaseCall: () => Promise<T>,
  backendCall: () => Promise<T>,
): Promise<T> {
  if (shouldUseSupabase()) {
    try {
      return await supabaseCall();
    } catch (err) {
      if (isSupabaseInfrastructureError(err)) {
        markSupabaseBypassed();
        return await backendCall();
      }
      throw err;
    }
  }
  return await backendCall();
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

function mapSupabaseProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    address: String(row.address ?? ''),
    role: row.role === 'admin' ? 'admin' : 'citizen',
    departmentId: row.department_id ? String(row.department_id) : null,
    avatarUrl: String(row.avatar_url ?? ''),
    isActive: Boolean(row.is_active ?? true),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function mapSupabaseDepartment(row: Record<string, unknown>): Department {
  return {
    id: String(row.id),
    name: String(row.name),
    code: String(row.code),
    description: String(row.description ?? ''),
    contactEmail: String(row.contact_email ?? ''),
    contactPhone: String(row.contact_phone ?? ''),
    headName: String(row.head_name ?? ''),
    slaHours: Number(row.sla_hours ?? 48),
    isActive: Boolean(row.is_active ?? true),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapSupabaseUpdate(row: Record<string, unknown>): ComplaintUpdate {
  return {
    id: String(row.id),
    complaintId: String(row.complaint_id),
    updatedBy: row.updated_by ? String(row.updated_by) : null,
    authorName: String(row.author_name ?? 'Municipal Staff'),
    authorRole: row.author_role === 'admin' ? 'admin' : 'citizen',
    previousStatus: row.previous_status ? (String(row.previous_status) as ComplaintStatus) : null,
    newStatus: String(row.new_status) as ComplaintStatus,
    note: String(row.note ?? ''),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapSupabaseComplaint(row: Record<string, unknown>): Complaint {
  const deptObj = row.departments as Record<string, unknown> | null | undefined;
  const profileObj = row.profiles as Record<string, unknown> | null | undefined;
  const updatesRaw = row.complaint_updates as Record<string, unknown>[] | null | undefined;

  return {
    id: String(row.id),
    referenceId: String(row.reference_id),
    citizenId: String(row.citizen_id),
    citizenName: profileObj ? String(profileObj.full_name ?? '') : undefined,
    citizenEmail: profileObj ? String(profileObj.email ?? '') : undefined,
    title: String(row.title),
    description: String(row.description),
    category: String(row.category) as ComplaintCategory,
    severity: String(row.severity) as ComplaintSeverity,
    status: String(row.status) as ComplaintStatus,
    departmentId: row.department_id ? String(row.department_id) : null,
    departmentName: deptObj ? String(deptObj.name ?? '') : undefined,
    assignedTo: row.assigned_to ? String(row.assigned_to) : null,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    address: String(row.address),
    ward: String(row.ward ?? ''),
    photoUrl: String(row.photo_url ?? ''),
    resolutionNotes: String(row.resolution_notes ?? ''),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    updates: updatesRaw
      ? updatesRaw
          .map(mapSupabaseUpdate)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      : undefined,
  };
}

export const civicApi = {
  async getPublicStats(): Promise<PublicStats> {
    return withSupabaseOrBackend(
      async () => {
        const { data, error } = await supabase!
          .from('complaints')
          .select('*, departments(name)')
          .order('updated_at', { ascending: false });
        if (error) throw new Error(error.message);
        const list = (data ?? []).map((r) => mapSupabaseComplaint(r as Record<string, unknown>));
        const stats = computeDashboardStats(list);
        return {
          totalComplaints: stats.total,
          resolvedComplaints: stats.resolved,
          inProgressComplaints: stats.inProgress + stats.underReview,
          resolutionRate: stats.resolutionRate,
          avgResolutionHours: stats.avgResolutionHours,
          recentResolved: list.filter((c) => c.status === 'resolved').slice(0, 3),
        };
      },
      () =>
        withBackendFallback(
          () => apiFetch<PublicStats>('/api/public/stats'),
          () => localCivicStore.getPublicStats(),
        ),
    );
  },

  async trackComplaint(referenceId: string): Promise<Complaint> {
    return withSupabaseOrBackend(
      async () => {
        const { data, error } = await supabase!
          .from('complaints')
          .select('*, departments(name), complaint_updates(*)')
          .ilike('reference_id', referenceId.trim())
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) throw new Error(`No complaint found with reference ID ${referenceId.toUpperCase()}.`);
        return mapSupabaseComplaint(data as Record<string, unknown>);
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ complaint: Complaint }>(
              `/api/public/track/${encodeURIComponent(referenceId.trim())}`,
            );
            return res.complaint;
          },
          () => localCivicStore.trackComplaint(referenceId),
        ),
    );
  },

  async register(input: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }): Promise<UserProfile> {
    return withSupabaseOrBackend(
      async () => {
        // Verify CivicTrack schema has been applied to Supabase before creating auth users
        const { error: schemaCheckError } = await supabase!
          .from('profiles')
          .select('id')
          .limit(1);
        if (schemaCheckError) {
          throw new Error(schemaCheckError.message);
        }

        const { data, error } = await supabase!.auth.signUp({
          email: input.email.trim(),
          password: input.password,
          options: {
            data: {
              full_name: input.fullName.trim(),
              phone: input.phone?.trim() ?? '',
              address: input.address?.trim() ?? '',
            },
          },
        });
        if (error) throw new Error(error.message);
        if (!data.user) throw new Error('Registration failed. Please check your details and try again.');

        const { data: profileRow, error: profileError } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) {
          throw new Error(profileError.message);
        }

        if (!data.session) {
          throw new Error(
            'EMAIL_CONFIRMATION_REQUIRED: Account created! Please check your email inbox and click the confirmation link before signing in.',
          );
        }

        if (profileRow) return mapSupabaseProfile(profileRow as Record<string, unknown>);
        return {
          id: data.user.id,
          fullName: input.fullName.trim(),
          email: input.email.trim(),
          phone: input.phone?.trim() ?? '',
          address: input.address?.trim() ?? '',
          role: 'citizen',
          departmentId: null,
          avatarUrl: '',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },
      async () => {
        try {
          const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(input),
          });
          setStoredToken(res.token);
          return res.user;
        } catch (err) {
          if (err instanceof BackendUnavailableError) {
            const res = localCivicStore.register(input);
            setStoredToken(res.token);
            return res.user;
          }
          throw err;
        }
      },
    );
  },

  async login(input: {
    email: string;
    password: string;
    portal?: 'citizen' | 'admin';
  }): Promise<UserProfile> {
    return withSupabaseOrBackend(
      async () => {
        const { data, error } = await supabase!.auth.signInWithPassword({
          email: input.email.trim(),
          password: input.password,
        });
        if (error) throw new Error(error.message);
        const { data: profileRow, error: profileError } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        if (profileError) throw new Error(profileError.message);
        const profile = mapSupabaseProfile(profileRow as Record<string, unknown>);
        if (!profile.isActive) {
          await supabase!.auth.signOut();
          throw new Error('This account has been deactivated.');
        }
        if (input.portal === 'admin' && profile.role !== 'admin') {
          await supabase!.auth.signOut();
          throw new Error('Access denied. Administrator credentials required.');
        }
        return profile;
      },
      async () => {
        try {
          const res = await apiFetch<{ token: string; user: UserProfile }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(input),
          });
          setStoredToken(res.token);
          return res.user;
        } catch (err) {
          if (err instanceof BackendUnavailableError) {
            const res = localCivicStore.login(input);
            setStoredToken(res.token);
            return res.user;
          }
          throw err;
        }
      },
    );
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase && !isSupabaseBypassed()) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore network sign-out error
      }
    }
    setStoredToken(null);
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const token = getStoredToken();
    if (token) {
      if (isLocalToken(token)) {
        return localCivicStore.getCurrentUser(token);
      }
      try {
        const res = await apiFetch<{ user: UserProfile }>('/api/auth/me');
        return res.user;
      } catch (err) {
        if (err instanceof BackendUnavailableError) {
          return null;
        }
        setStoredToken(null);
        return null;
      }
    }

    if (shouldUseSupabase()) {
      try {
        const { data } = await supabase!.auth.getSession();
        if (!data.session?.user) return null;
        const { data: profileRow, error } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .maybeSingle();
        if (error) {
          if (isSupabaseInfrastructureError(error)) markSupabaseBypassed();
          return null;
        }
        return profileRow ? mapSupabaseProfile(profileRow as Record<string, unknown>) : null;
      } catch (err) {
        if (isSupabaseInfrastructureError(err)) markSupabaseBypassed();
        return null;
      }
    }

    return null;
  },

  async updateProfile(patch: {
    fullName?: string;
    phone?: string;
    address?: string;
    avatarUrl?: string;
  }): Promise<UserProfile> {
    return withSupabaseOrBackend(
      async () => {
        const { data: sessionData } = await supabase!.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (!userId) throw new Error('Not authenticated.');
        const { data, error } = await supabase!
          .from('profiles')
          .update({
            full_name: patch.fullName,
            phone: patch.phone,
            address: patch.address,
            avatar_url: patch.avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select('*')
          .single();
        if (error) throw new Error(error.message);
        return mapSupabaseProfile(data as Record<string, unknown>);
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ user: UserProfile }>('/api/profile', {
              method: 'PATCH',
              body: JSON.stringify(patch),
            });
            return res.user;
          },
          () => localCivicStore.updateProfile(getStoredToken(), patch),
        ),
    );
  },

  async uploadPhoto(file: File): Promise<string> {
    const dataUrl = await readFileAsDataUrl(file);
    return withSupabaseOrBackend(
      async () => {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase!.storage.from('complaint-photos').upload(path, file);
        if (error) throw new Error(error.message);
        const { data } = supabase!.storage.from('complaint-photos').getPublicUrl(path);
        return data.publicUrl;
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ url: string }>('/api/upload', {
              method: 'POST',
              body: JSON.stringify({ fileName: file.name, dataUrl }),
            });
            return res.url;
          },
          () => dataUrl,
        ),
    );
  },

  async listComplaints(user?: UserProfile | null): Promise<Complaint[]> {
    return withSupabaseOrBackend(
      async () => {
        let query = supabase!
          .from('complaints')
          .select(
            '*, departments(name), profiles!complaints_citizen_id_fkey(full_name, email), complaint_updates(*)',
          )
          .order('created_at', { ascending: false });
        if (user && user.role !== 'admin') {
          query = query.eq('citizen_id', user.id);
        }
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return (data ?? []).map((r) => mapSupabaseComplaint(r as Record<string, unknown>));
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ complaints: Complaint[] }>('/api/complaints');
            return res.complaints;
          },
          () => localCivicStore.listComplaints(getStoredToken()),
        ),
    );
  },

  async getComplaint(idOrRef: string): Promise<Complaint> {
    return withSupabaseOrBackend(
      async () => {
        const { data, error } = await supabase!
          .from('complaints')
          .select(
            '*, departments(name), profiles!complaints_citizen_id_fkey(full_name, email), complaint_updates(*)',
          )
          .or(`id.eq.${idOrRef},reference_id.eq.${idOrRef.toUpperCase()}`)
          .single();
        if (error) throw new Error(error.message);
        return mapSupabaseComplaint(data as Record<string, unknown>);
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ complaint: Complaint }>(
              `/api/complaints/${encodeURIComponent(idOrRef)}`,
            );
            return res.complaint;
          },
          () => localCivicStore.getComplaint(getStoredToken(), idOrRef),
        ),
    );
  },

  async createComplaint(input: {
    title: string;
    description: string;
    category: ComplaintCategory;
    severity: ComplaintSeverity;
    address: string;
    ward: string;
    latitude: number;
    longitude: number;
    photoUrl: string;
  }): Promise<Complaint> {
    return withSupabaseOrBackend(
      async () => {
        const { data: sessionData } = await supabase!.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (!userId) throw new Error('Authentication required.');
        const seq = Math.floor(1000 + Math.random() * 8999);
        const referenceId = generateReferenceId(new Date().getFullYear(), seq);
        const { data, error } = await supabase!
          .from('complaints')
          .insert({
            reference_id: referenceId,
            citizen_id: userId,
            title: input.title,
            description: input.description,
            category: input.category,
            severity: input.severity,
            address: input.address,
            ward: input.ward,
            latitude: input.latitude,
            longitude: input.longitude,
            photo_url: input.photoUrl,
            status: 'submitted',
          })
          .select('*, departments(name), complaint_updates(*)')
          .single();
        if (error) throw new Error(error.message);
        return mapSupabaseComplaint(data as Record<string, unknown>);
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ complaint: Complaint }>('/api/complaints', {
              method: 'POST',
              body: JSON.stringify(input),
            });
            return res.complaint;
          },
          () => localCivicStore.createComplaint(getStoredToken(), input),
        ),
    );
  },

  async updateComplaintAdmin(
    id: string,
    patch: {
      status?: ComplaintStatus;
      departmentId?: string;
      resolutionNotes?: string;
      updateNote?: string;
    },
  ): Promise<Complaint> {
    return withSupabaseOrBackend(
      async () => {
        const { data: sessionData } = await supabase!.auth.getSession();
        const adminId = sessionData.session?.user.id;
        const updateBody: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
          assigned_to: adminId,
        };
        if (patch.status) {
          updateBody.status = patch.status;
          updateBody.resolved_at = patch.status === 'resolved' ? new Date().toISOString() : null;
        }
        if (patch.departmentId !== undefined) {
          updateBody.department_id = patch.departmentId || null;
        }
        if (patch.resolutionNotes !== undefined) {
          updateBody.resolution_notes = patch.resolutionNotes;
        }
        const { data, error } = await supabase!
          .from('complaints')
          .update(updateBody)
          .eq('id', id)
          .select('*, departments(name), complaint_updates(*)')
          .single();
        if (error) throw new Error(error.message);
        return mapSupabaseComplaint(data as Record<string, unknown>);
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ complaint: Complaint }>(
              `/api/complaints/${encodeURIComponent(id)}`,
              {
                method: 'PATCH',
                body: JSON.stringify(patch),
              },
            );
            return res.complaint;
          },
          () => localCivicStore.updateComplaintAdmin(getStoredToken(), id, patch),
        ),
    );
  },

  async listDepartments(): Promise<Department[]> {
    return withSupabaseOrBackend(
      async () => {
        const { data, error } = await supabase!.from('departments').select('*').order('name');
        if (error) throw new Error(error.message);
        return (data ?? []).map((r) => mapSupabaseDepartment(r as Record<string, unknown>));
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ departments: Department[] }>('/api/departments');
            return res.departments;
          },
          () => localCivicStore.listDepartments(),
        ),
    );
  },

  async createDepartment(input: {
    name: string;
    code: string;
    description: string;
    contactEmail: string;
    contactPhone: string;
    headName: string;
    slaHours: number;
  }): Promise<Department> {
    return withSupabaseOrBackend(
      async () => {
        const { data, error } = await supabase!
          .from('departments')
          .insert({
            name: input.name,
            code: input.code.toUpperCase(),
            description: input.description,
            contact_email: input.contactEmail,
            contact_phone: input.contactPhone,
            head_name: input.headName,
            sla_hours: input.slaHours,
          })
          .select('*')
          .single();
        if (error) throw new Error(error.message);
        return mapSupabaseDepartment(data as Record<string, unknown>);
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ department: Department }>('/api/departments', {
              method: 'POST',
              body: JSON.stringify(input),
            });
            return res.department;
          },
          () => localCivicStore.createDepartment(getStoredToken(), input),
        ),
    );
  },

  async updateDepartment(
    id: string,
    patch: Partial<{
      name: string;
      description: string;
      contactEmail: string;
      contactPhone: string;
      headName: string;
      slaHours: number;
      isActive: boolean;
    }>,
  ): Promise<Department> {
    return withSupabaseOrBackend(
      async () => {
        const { data, error } = await supabase!
          .from('departments')
          .update({
            name: patch.name,
            description: patch.description,
            contact_email: patch.contactEmail,
            contact_phone: patch.contactPhone,
            head_name: patch.headName,
            sla_hours: patch.slaHours,
            is_active: patch.isActive,
          })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw new Error(error.message);
        return mapSupabaseDepartment(data as Record<string, unknown>);
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ department: Department }>(
              `/api/departments/${encodeURIComponent(id)}`,
              {
                method: 'PATCH',
                body: JSON.stringify(patch),
              },
            );
            return res.department;
          },
          () => localCivicStore.updateDepartment(getStoredToken(), id, patch),
        ),
    );
  },

  async listUsers(): Promise<UserProfile[]> {
    return withSupabaseOrBackend(
      async () => {
        const { data, error } = await supabase!
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((r) => mapSupabaseProfile(r as Record<string, unknown>));
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ users: UserProfile[] }>('/api/users');
            return res.users;
          },
          () => localCivicStore.listUsers(getStoredToken()),
        ),
    );
  },

  async updateUserAdmin(
    id: string,
    patch: { role?: 'citizen' | 'admin'; isActive?: boolean; departmentId?: string | null },
  ): Promise<UserProfile> {
    return withSupabaseOrBackend(
      async () => {
        const { data, error } = await supabase!
          .from('profiles')
          .update({
            role: patch.role,
            is_active: patch.isActive,
            department_id: patch.departmentId,
          })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw new Error(error.message);
        return mapSupabaseProfile(data as Record<string, unknown>);
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ user: UserProfile }>(
              `/api/users/${encodeURIComponent(id)}`,
              {
                method: 'PATCH',
                body: JSON.stringify(patch),
              },
            );
            return res.user;
          },
          () => localCivicStore.updateUserAdmin(getStoredToken(), id, patch),
        ),
    );
  },

  async listNotifications(): Promise<NotificationItem[]> {
    return withSupabaseOrBackend(
      async () => {
        const { data, error } = await supabase!
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map((r) => ({
          id: String(r.id),
          userId: String(r.user_id),
          complaintId: r.complaint_id ? String(r.complaint_id) : null,
          referenceId: String(r.reference_id ?? ''),
          title: String(r.title),
          message: String(r.message),
          type: String(r.type ?? 'info') as NotificationItem['type'],
          isRead: Boolean(r.is_read),
          createdAt: String(r.created_at),
        }));
      },
      () =>
        withBackendFallback(
          async () => {
            const res = await apiFetch<{ notifications: NotificationItem[] }>('/api/notifications');
            return res.notifications;
          },
          () => localCivicStore.listNotifications(getStoredToken()),
        ),
    );
  },

  async markNotificationRead(id: string): Promise<void> {
    await withSupabaseOrBackend(
      async () => {
        const { error } = await supabase!.from('notifications').update({ is_read: true }).eq('id', id);
        if (error) throw new Error(error.message);
      },
      () =>
        withBackendFallback(
          () => apiFetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
          () => localCivicStore.markNotificationRead(getStoredToken(), id),
        ),
    );
  },

  async markAllNotificationsRead(): Promise<void> {
    await withSupabaseOrBackend(
      async () => {
        const { data: sessionData } = await supabase!.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (!userId) return;
        const { error } = await supabase!
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId);
        if (error) throw new Error(error.message);
      },
      () =>
        withBackendFallback(
          () => apiFetch('/api/notifications/read-all', { method: 'POST' }),
          () => localCivicStore.markAllNotificationsRead(getStoredToken()),
        ),
    );
  },
};
