import {
  computeDashboardStats,
  generateReferenceId,
  validateComplaintInput,
  validateRegistrationInput,
} from '../utils/civicLogic';
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
  UserRole,
} from '../types/civic';

interface LocalStoredUser extends UserProfile {
  password: string;
}

interface LocalDatabase {
  users: LocalStoredUser[];
  departments: Department[];
  complaints: Complaint[];
  updates: ComplaintUpdate[];
  notifications: NotificationItem[];
  nextSequence: number;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const DB_KEY = 'civictrack_local_db_v1';
const LOCAL_TOKEN_PREFIX = 'local:';

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createSeedDatabase(): LocalDatabase {
  const now = new Date('2026-11-17T09:00:00Z');
  const iso = (daysAgo: number, hoursOffset = 0) =>
    new Date(now.getTime() - daysAgo * 86400000 + hoursOffset * 3600000).toISOString();

  const departments: Department[] = [
    {
      id: 'dept-road',
      name: 'Roads & Transportation',
      code: 'ROAD',
      description: 'Potholes, asphalt resurfacing, sidewalks, crosswalk markings, and traffic signage.',
      contactEmail: 'roads@civictrack.gov',
      contactPhone: '(555) 201-4100',
      headName: 'Marcus Vance, PE',
      slaHours: 48,
      isActive: true,
      createdAt: iso(120),
    },
    {
      id: 'dept-light',
      name: 'Street Lighting & Electrical',
      code: 'LGHT',
      description: 'Streetlight outages, electrical pole repairs, and pedestrian signal maintenance.',
      contactEmail: 'lighting@civictrack.gov',
      contactPhone: '(555) 201-4200',
      headName: 'Elena Rostova',
      slaHours: 36,
      isActive: true,
      createdAt: iso(120),
    },
    {
      id: 'dept-sani',
      name: 'Sanitation & Solid Waste',
      code: 'SANI',
      description: 'Public waste collection, overflowing bins, illegal dumping, and street sweeping.',
      contactEmail: 'sanitation@civictrack.gov',
      contactPhone: '(555) 201-4300',
      headName: 'David Okafor',
      slaHours: 24,
      isActive: true,
      createdAt: iso(120),
    },
    {
      id: 'dept-water',
      name: 'Water & Storm Drainage',
      code: 'WATR',
      description: 'Clogged storm grates, water main leaks, sewer backups, and street flooding.',
      contactEmail: 'water@civictrack.gov',
      contactPhone: '(555) 201-4400',
      headName: 'Priya Nair, PE',
      slaHours: 24,
      isActive: true,
      createdAt: iso(120),
    },
    {
      id: 'dept-park',
      name: 'Parks & Public Facilities',
      code: 'PARK',
      description: 'Public park structures, benches, playgrounds, and municipal buildings.',
      contactEmail: 'parks@civictrack.gov',
      contactPhone: '(555) 201-4500',
      headName: 'Hannah Lindqvist',
      slaHours: 72,
      isActive: true,
      createdAt: iso(120),
    },
  ];

  const users: LocalStoredUser[] = [
    {
      id: 'user-admin-1',
      fullName: 'Claire Sterling',
      email: 'admin@civictrack.gov',
      phone: '(555) 201-4001',
      address: '100 Civic Center Plaza, Suite 400',
      role: 'admin',
      departmentId: 'dept-road',
      avatarUrl: '/src/assets/images/civic_avatar_admin_1794926292559.jpg',
      isActive: true,
      createdAt: iso(120),
      updatedAt: iso(5),
      password: 'Admin@123',
    },
    {
      id: 'user-citizen-1',
      fullName: 'Jordan Miller',
      email: 'citizen@civictrack.gov',
      phone: '(555) 834-2190',
      address: '412 Elm Street, Apt 3B',
      role: 'citizen',
      departmentId: null,
      avatarUrl: '',
      isActive: true,
      createdAt: iso(60),
      updatedAt: iso(3),
      password: 'Citizen@123',
    },
    {
      id: 'user-citizen-2',
      fullName: 'Amara Patel',
      email: 'amara.patel@example.com',
      phone: '(555) 612-9044',
      address: '88 Oak Avenue',
      role: 'citizen',
      departmentId: null,
      avatarUrl: '',
      isActive: true,
      createdAt: iso(45),
      updatedAt: iso(2),
      password: 'Citizen@123',
    },
  ];

  const complaints: Complaint[] = [
    {
      id: 'cmp-1001',
      referenceId: 'CT-2026-1001',
      citizenId: 'user-citizen-1',
      citizenName: 'Jordan Miller',
      citizenEmail: 'citizen@civictrack.gov',
      title: 'Deep asphalt pothole adjacent to Alder St crosswalk',
      description:
        'A severe pothole roughly 2 feet wide has formed in the northbound lane just before the pedestrian crosswalk. Vehicles are swerving into the bike lane to avoid it.',
      category: 'Road Damage & Potholes',
      severity: 'high',
      status: 'resolved',
      departmentId: 'dept-road',
      departmentName: 'Roads & Transportation',
      assignedTo: 'user-admin-1',
      latitude: 45.5208,
      longitude: -122.6795,
      address: '412 SW Alder Street',
      ward: 'District 1 — Downtown',
      photoUrl: '/src/assets/images/civic_road_repair_1794926291237.jpg',
      resolutionNotes:
        'Hot-mix asphalt crew excavated loose aggregate, sealed edges, and compacted fresh surface patch. Crosswalk striping checked and intact.',
      resolvedAt: iso(11, 6),
      createdAt: iso(14),
      updatedAt: iso(11, 6),
    },
    {
      id: 'cmp-1002',
      referenceId: 'CT-2026-1002',
      citizenId: 'user-citizen-1',
      citizenName: 'Jordan Miller',
      citizenEmail: 'citizen@civictrack.gov',
      title: 'Clogged storm drain grate causing curb pooling',
      description:
        'Fallen leaves and silt have completely sealed the storm inlet grate at the corner curb, creating deep standing water across the pedestrian ramp during rainfall.',
      category: 'Blocked Drainage',
      severity: 'critical',
      status: 'in_progress',
      departmentId: 'dept-water',
      departmentName: 'Water & Storm Drainage',
      assignedTo: 'user-admin-1',
      latitude: 45.5245,
      longitude: -122.6842,
      address: '1120 NW Everett Street',
      ward: 'District 2 — Pearl',
      photoUrl: '/src/assets/images/civic_drainage_water_1794926291094.jpg',
      resolutionNotes:
        'Vacuum truck dispatched to clear catch basin and flush lateral line. Final inspection scheduled.',
      resolvedAt: null,
      createdAt: iso(4),
      updatedAt: iso(1, 3),
    },
    {
      id: 'cmp-1003',
      referenceId: 'CT-2026-1003',
      citizenId: 'user-citizen-2',
      citizenName: 'Amara Patel',
      citizenEmail: 'amara.patel@example.com',
      title: 'Unlit streetlight pole along Cedar St residential sidewalk',
      description:
        'Streetlight pole #4872 has been dark for five consecutive nights, leaving the mid-block sidewalk and intersection poorly illuminated after dusk.',
      category: 'Broken Streetlights',
      severity: 'medium',
      status: 'under_review',
      departmentId: 'dept-light',
      departmentName: 'Street Lighting & Electrical',
      assignedTo: null,
      latitude: 45.5172,
      longitude: -122.6684,
      address: '640 SE Hawthorne Blvd',
      ward: 'District 3 — Eastside',
      photoUrl: '/src/assets/images/civic_streetlight_infra_1794926291845.jpg',
      resolutionNotes:
        'Electrical diagnostics queued to inspect photocell relay and underground feeder circuit.',
      resolvedAt: null,
      createdAt: iso(3),
      updatedAt: iso(2),
    },
    {
      id: 'cmp-1004',
      referenceId: 'CT-2026-1004',
      citizenId: 'user-citizen-1',
      citizenName: 'Jordan Miller',
      citizenEmail: 'citizen@civictrack.gov',
      title: 'Overflowing public waste & recycling bins at Riverside Park',
      description:
        'Both recycling and landfill containers beside the park promenade are overflowing onto the curb and street gutter following the weekend event.',
      category: 'Garbage Accumulation',
      severity: 'high',
      status: 'submitted',
      departmentId: null,
      departmentName: undefined,
      assignedTo: null,
      latitude: 45.5141,
      longitude: -122.6749,
      address: '210 SW Naito Parkway (Riverside Park)',
      ward: 'District 1 — Waterfront',
      photoUrl: '/src/assets/images/civic_waste_sanitation_1794926291177.jpg',
      resolutionNotes: '',
      resolvedAt: null,
      createdAt: iso(1),
      updatedAt: iso(1),
    },
    {
      id: 'cmp-1005',
      referenceId: 'CT-2026-1005',
      citizenId: 'user-citizen-2',
      citizenName: 'Amara Patel',
      citizenEmail: 'amara.patel@example.com',
      title: 'Water valve box leak seeping across bike lane',
      description:
        'Clean water has been steadily bubbling from a municipal meter vault cover near the curb apron for 48 hours.',
      category: 'Water Leakage',
      severity: 'high',
      status: 'resolved',
      departmentId: 'dept-water',
      departmentName: 'Water & Storm Drainage',
      assignedTo: 'user-admin-1',
      latitude: 45.5282,
      longitude: -122.6712,
      address: '915 NE Broadway',
      ward: 'District 4 — Irvington',
      photoUrl: '/src/assets/images/civic_drainage_water_1794926291094.jpg',
      resolutionNotes:
        'Replaced corroded service gasket inside meter vault and pressure-tested supply line.',
      resolvedAt: iso(25, 10),
      createdAt: iso(27),
      updatedAt: iso(25, 10),
    },
    {
      id: 'cmp-1006',
      referenceId: 'CT-2026-1006',
      citizenId: 'user-citizen-2',
      citizenName: 'Amara Patel',
      citizenEmail: 'amara.patel@example.com',
      title: 'Damaged pedestrian guardrail at Morrison Bridge approach',
      description:
        'Two horizontal steel handrail sections near the east ramp stairs are bent outward from an impact.',
      category: 'Damaged Public Infrastructure',
      severity: 'medium',
      status: 'resolved',
      departmentId: 'dept-park',
      departmentName: 'Parks & Public Facilities',
      assignedTo: 'user-admin-1',
      latitude: 45.5189,
      longitude: -122.6625,
      address: '305 SE Water Avenue',
      ward: 'District 3 — Central East',
      photoUrl: '/src/assets/images/civic_road_repair_1794926291237.jpg',
      resolutionNotes:
        'Fabricated replacement steel rail brackets and bolted new anodized guardrail section.',
      resolvedAt: iso(41, 8),
      createdAt: iso(44),
      updatedAt: iso(41, 8),
    },
  ];

  const updates: ComplaintUpdate[] = [
    {
      id: 'upd-1',
      complaintId: 'cmp-1001',
      updatedBy: 'user-citizen-1',
      authorName: 'Jordan Miller',
      authorRole: 'citizen',
      previousStatus: null,
      newStatus: 'submitted',
      note: 'Complaint submitted with photographic evidence and GPS coordinates.',
      createdAt: iso(14),
    },
    {
      id: 'upd-4',
      complaintId: 'cmp-1001',
      updatedBy: 'user-admin-1',
      authorName: 'Claire Sterling',
      authorRole: 'admin',
      previousStatus: 'in_progress',
      newStatus: 'resolved',
      note: 'Hot-mix asphalt crew excavated loose aggregate, sealed edges, and compacted fresh surface patch.',
      createdAt: iso(11, 6),
    },
    {
      id: 'upd-6',
      complaintId: 'cmp-1002',
      updatedBy: 'user-admin-1',
      authorName: 'Claire Sterling',
      authorRole: 'admin',
      previousStatus: 'submitted',
      newStatus: 'in_progress',
      note: 'Assigned to Water & Storm Drainage. Vacuum truck dispatched to clear catch basin.',
      createdAt: iso(1, 3),
    },
    {
      id: 'upd-8',
      complaintId: 'cmp-1003',
      updatedBy: 'user-admin-1',
      authorName: 'Claire Sterling',
      authorRole: 'admin',
      previousStatus: 'submitted',
      newStatus: 'under_review',
      note: 'Assigned to Street Lighting & Electrical for photocell inspection.',
      createdAt: iso(2),
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      userId: 'user-citizen-1',
      complaintId: 'cmp-1002',
      referenceId: 'CT-2026-1002',
      title: 'Work Underway on CT-2026-1002',
      message: 'Water & Storm Drainage crew has been dispatched to clear the clogged storm grate.',
      type: 'status_change',
      isRead: false,
      createdAt: iso(1, 3),
    },
    {
      id: 'notif-2',
      userId: 'user-citizen-1',
      complaintId: 'cmp-1001',
      referenceId: 'CT-2026-1001',
      title: 'Complaint CT-2026-1001 Resolved',
      message: 'Roads & Transportation completed asphalt patching at 412 SW Alder Street.',
      type: 'resolved',
      isRead: true,
      createdAt: iso(11, 6),
    },
  ];

  return {
    users,
    departments,
    complaints,
    updates,
    notifications,
    nextSequence: 1007,
  };
}

function sanitize(user: LocalStoredUser): UserProfile {
  const { password: _password, ...profile } = user;
  return profile;
}

function enrich(complaint: Complaint, db: LocalDatabase): Complaint {
  const dept = db.departments.find((d) => d.id === complaint.departmentId);
  const citizen = db.users.find((u) => u.id === complaint.citizenId);
  const updates = db.updates
    .filter((u) => u.complaintId === complaint.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return {
    ...complaint,
    departmentName: dept?.name,
    citizenName: citizen?.fullName ?? complaint.citizenName,
    citizenEmail: citizen?.email ?? complaint.citizenEmail,
    updates,
  };
}

function getDefaultStorage(): KeyValueStorage {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  const memory = new Map<string, string>();
  return {
    getItem: (k) => memory.get(k) ?? null,
    setItem: (k, v) => {
      memory.set(k, v);
    },
    removeItem: (k) => {
      memory.delete(k);
    },
  };
}

export function isLocalToken(token: string | null): boolean {
  return Boolean(token && token.startsWith(LOCAL_TOKEN_PREFIX));
}

export function createLocalCivicStore(storage: KeyValueStorage = getDefaultStorage()) {
  function load(): LocalDatabase {
    try {
      const raw = storage.getItem(DB_KEY);
      if (raw) {
        return JSON.parse(raw) as LocalDatabase;
      }
    } catch {
      // ignore corrupted storage
    }
    const seed = createSeedDatabase();
    save(seed);
    return seed;
  }

  function save(db: LocalDatabase): void {
    try {
      storage.setItem(DB_KEY, JSON.stringify(db));
    } catch {
      // ignore storage quota errors
    }
  }

  function resolveUser(db: LocalDatabase, token: string | null): LocalStoredUser {
    if (!token || !token.startsWith(LOCAL_TOKEN_PREFIX)) {
      throw new Error('Authentication required.');
    }
    const userId = token.slice(LOCAL_TOKEN_PREFIX.length);
    const user = db.users.find((u) => u.id === userId);
    if (!user || !user.isActive) {
      throw new Error('Session expired or invalid. Please sign in again.');
    }
    return user;
  }

  return {
    getPublicStats(): PublicStats {
      const db = load();
      const stats = computeDashboardStats(db.complaints);
      const recentResolved = db.complaints
        .filter((c) => c.status === 'resolved')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3)
        .map((c) => enrich(c, db));

      return {
        totalComplaints: stats.total,
        resolvedComplaints: stats.resolved,
        inProgressComplaints: stats.inProgress + stats.underReview,
        resolutionRate: stats.resolutionRate,
        avgResolutionHours: stats.avgResolutionHours,
        recentResolved,
      };
    },

    trackComplaint(referenceId: string): Complaint {
      const db = load();
      const ref = referenceId.trim().toUpperCase();
      const found = db.complaints.find((c) => c.referenceId.toUpperCase() === ref);
      if (!found) {
        throw new Error(`No complaint found with reference ID ${ref}.`);
      }
      const { citizenEmail: _email, ...publicSafe } = enrich(found, db);
      return publicSafe;
    },

    register(input: {
      fullName: string;
      email: string;
      password: string;
      phone?: string;
      address?: string;
    }): { token: string; user: UserProfile } {
      const check = validateRegistrationInput(input);
      if (!check.valid) {
        throw new Error(Object.values(check.errors)[0] || 'Invalid registration details.');
      }

      const db = load();
      const normalizedEmail = input.email.trim().toLowerCase();
      if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        throw new Error('An account with this email already exists.');
      }

      const now = new Date().toISOString();
      const newUser: LocalStoredUser = {
        id: makeId('user'),
        fullName: input.fullName.trim(),
        email: normalizedEmail,
        phone: (input.phone ?? '').trim(),
        address: (input.address ?? '').trim(),
        role: 'citizen',
        departmentId: null,
        avatarUrl: '',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        password: input.password,
      };

      db.users.push(newUser);
      save(db);
      return { token: `${LOCAL_TOKEN_PREFIX}${newUser.id}`, user: sanitize(newUser) };
    },

    login(input: {
      email: string;
      password: string;
      portal?: 'citizen' | 'admin';
    }): { token: string; user: UserProfile } {
      const db = load();
      const normalizedEmail = input.email.trim().toLowerCase();
      const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!user || user.password !== input.password) {
        throw new Error('Invalid email or password.');
      }
      if (!user.isActive) {
        throw new Error('This account has been deactivated. Contact municipal support.');
      }
      if (input.portal === 'admin' && user.role !== 'admin') {
        throw new Error('Access denied. Administrator credentials required.');
      }
      return { token: `${LOCAL_TOKEN_PREFIX}${user.id}`, user: sanitize(user) };
    },

    getCurrentUser(token: string | null): UserProfile | null {
      try {
        const db = load();
        return sanitize(resolveUser(db, token));
      } catch {
        return null;
      }
    },

    updateProfile(
      token: string | null,
      patch: { fullName?: string; phone?: string; address?: string; avatarUrl?: string },
    ): UserProfile {
      const db = load();
      const user = resolveUser(db, token);
      if (typeof patch.fullName === 'string' && patch.fullName.trim().length >= 2) {
        user.fullName = patch.fullName.trim();
      }
      if (typeof patch.phone === 'string') user.phone = patch.phone.trim();
      if (typeof patch.address === 'string') user.address = patch.address.trim();
      if (typeof patch.avatarUrl === 'string') user.avatarUrl = patch.avatarUrl.trim();
      user.updatedAt = new Date().toISOString();
      save(db);
      return sanitize(user);
    },

    listComplaints(token: string | null): Complaint[] {
      const db = load();
      const user = resolveUser(db, token);
      const rows =
        user.role === 'admin'
          ? db.complaints
          : db.complaints.filter((c) => c.citizenId === user.id);
      return rows
        .map((c) => enrich(c, db))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    getComplaint(token: string | null, idOrRef: string): Complaint {
      const db = load();
      const user = resolveUser(db, token);
      const found = db.complaints.find(
        (c) => c.id === idOrRef || c.referenceId.toUpperCase() === idOrRef.toUpperCase(),
      );
      if (!found) throw new Error('Complaint not found.');
      if (user.role !== 'admin' && found.citizenId !== user.id) {
        throw new Error('You do not have permission to view this complaint.');
      }
      return enrich(found, db);
    },

    createComplaint(
      token: string | null,
      input: {
        title: string;
        description: string;
        category: ComplaintCategory;
        severity: ComplaintSeverity;
        address: string;
        ward: string;
        latitude: number;
        longitude: number;
        photoUrl: string;
      },
    ): Complaint {
      const db = load();
      const user = resolveUser(db, token);
      const validation = validateComplaintInput(input);
      if (!validation.valid) {
        throw new Error(Object.values(validation.errors)[0] || 'Please fix form errors.');
      }

      const seq = db.nextSequence || 1007;
      db.nextSequence = seq + 1;
      const referenceId = generateReferenceId(new Date().getFullYear(), seq);
      const now = new Date().toISOString();

      const complaint: Complaint = {
        id: makeId('cmp'),
        referenceId,
        citizenId: user.id,
        citizenName: user.fullName,
        citizenEmail: user.email,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        severity: input.severity,
        status: 'submitted',
        departmentId: null,
        assignedTo: null,
        latitude: Number(input.latitude),
        longitude: Number(input.longitude),
        address: input.address.trim(),
        ward: input.ward.trim() || 'Municipal Zone',
        photoUrl: input.photoUrl || '',
        resolutionNotes: '',
        resolvedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      db.complaints.unshift(complaint);
      db.updates.push({
        id: makeId('upd'),
        complaintId: complaint.id,
        updatedBy: user.id,
        authorName: user.fullName,
        authorRole: user.role,
        previousStatus: null,
        newStatus: 'submitted',
        note: 'Report submitted by citizen with location coordinates.',
        createdAt: now,
      });

      for (const admin of db.users.filter((u) => u.role === 'admin' && u.isActive)) {
        db.notifications.unshift({
          id: makeId('notif'),
          userId: admin.id,
          complaintId: complaint.id,
          referenceId,
          title: `New Issue Reported: ${referenceId}`,
          message: `${user.fullName} reported "${complaint.title}" (${complaint.category}).`,
          type: 'info',
          isRead: false,
          createdAt: now,
        });
      }

      save(db);
      return enrich(complaint, db);
    },

    updateComplaintAdmin(
      token: string | null,
      id: string,
      patch: {
        status?: ComplaintStatus;
        departmentId?: string;
        resolutionNotes?: string;
        updateNote?: string;
      },
    ): Complaint {
      const db = load();
      const admin = resolveUser(db, token);
      if (admin.role !== 'admin') {
        throw new Error('Administrator privileges are required for this action.');
      }
      const complaint = db.complaints.find((c) => c.id === id);
      if (!complaint) throw new Error('Complaint not found.');

      const prevStatus = complaint.status;
      const now = new Date().toISOString();

      if (typeof patch.departmentId === 'string') {
        if (patch.departmentId === '') {
          complaint.departmentId = null;
          complaint.departmentName = undefined;
        } else {
          const dept = db.departments.find((d) => d.id === patch.departmentId);
          if (!dept) throw new Error('Selected department does not exist.');
          complaint.departmentId = dept.id;
          complaint.departmentName = dept.name;
        }
      }

      if (patch.status) {
        complaint.status = patch.status;
        complaint.resolvedAt = patch.status === 'resolved' ? complaint.resolvedAt || now : null;
      }

      if (typeof patch.resolutionNotes === 'string') {
        complaint.resolutionNotes = patch.resolutionNotes.trim();
      }

      complaint.assignedTo = admin.id;
      complaint.updatedAt = now;

      const noteText =
        patch.updateNote && patch.updateNote.trim().length > 0
          ? patch.updateNote.trim()
          : complaint.resolutionNotes ||
            `Updated status to ${complaint.status.replace('_', ' ')}${
              complaint.departmentName ? ` · Assigned to ${complaint.departmentName}` : ''
            }.`;

      db.updates.push({
        id: makeId('upd'),
        complaintId: complaint.id,
        updatedBy: admin.id,
        authorName: admin.fullName,
        authorRole: 'admin',
        previousStatus: prevStatus,
        newStatus: complaint.status,
        note: noteText,
        createdAt: now,
      });

      db.notifications.unshift({
        id: makeId('notif'),
        userId: complaint.citizenId,
        complaintId: complaint.id,
        referenceId: complaint.referenceId,
        title:
          complaint.status === 'resolved'
            ? `Resolved: ${complaint.referenceId}`
            : `Update on ${complaint.referenceId}`,
        message: noteText,
        type: complaint.status === 'resolved' ? 'resolved' : 'status_change',
        isRead: false,
        createdAt: now,
      });

      save(db);
      return enrich(complaint, db);
    },

    listDepartments(): Department[] {
      return load().departments;
    },

    createDepartment(
      token: string | null,
      input: {
        name: string;
        code: string;
        description: string;
        contactEmail: string;
        contactPhone: string;
        headName: string;
        slaHours: number;
      },
    ): Department {
      const db = load();
      const admin = resolveUser(db, token);
      if (admin.role !== 'admin') throw new Error('Administrator privileges required.');
      const upperCode = input.code.trim().toUpperCase();
      if (
        db.departments.some(
          (d) =>
            d.code.toUpperCase() === upperCode ||
            d.name.toLowerCase() === input.name.trim().toLowerCase(),
        )
      ) {
        throw new Error('A department with this name or code already exists.');
      }

      const dept: Department = {
        id: makeId('dept'),
        name: input.name.trim(),
        code: upperCode,
        description: input.description.trim(),
        contactEmail: input.contactEmail.trim(),
        contactPhone: input.contactPhone.trim(),
        headName: input.headName.trim(),
        slaHours: Number(input.slaHours) || 48,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      db.departments.push(dept);
      save(db);
      return dept;
    },

    updateDepartment(
      token: string | null,
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
    ): Department {
      const db = load();
      const admin = resolveUser(db, token);
      if (admin.role !== 'admin') throw new Error('Administrator privileges required.');
      const dept = db.departments.find((d) => d.id === id);
      if (!dept) throw new Error('Department not found.');
      if (typeof patch.name === 'string' && patch.name.trim()) dept.name = patch.name.trim();
      if (typeof patch.description === 'string') dept.description = patch.description.trim();
      if (typeof patch.contactEmail === 'string' && patch.contactEmail.trim()) {
        dept.contactEmail = patch.contactEmail.trim();
      }
      if (typeof patch.contactPhone === 'string') dept.contactPhone = patch.contactPhone.trim();
      if (typeof patch.headName === 'string') dept.headName = patch.headName.trim();
      if (typeof patch.slaHours === 'number' && patch.slaHours > 0) dept.slaHours = patch.slaHours;
      if (typeof patch.isActive === 'boolean') dept.isActive = patch.isActive;
      save(db);
      return dept;
    },

    listUsers(token: string | null): UserProfile[] {
      const db = load();
      const admin = resolveUser(db, token);
      if (admin.role !== 'admin') throw new Error('Administrator privileges required.');
      return db.users.map(sanitize);
    },

    updateUserAdmin(
      token: string | null,
      id: string,
      patch: { role?: UserRole; isActive?: boolean; departmentId?: string | null },
    ): UserProfile {
      const db = load();
      const admin = resolveUser(db, token);
      if (admin.role !== 'admin') throw new Error('Administrator privileges required.');
      const target = db.users.find((u) => u.id === id);
      if (!target) throw new Error('User not found.');
      if (patch.role === 'citizen' || patch.role === 'admin') target.role = patch.role;
      if (typeof patch.isActive === 'boolean') target.isActive = patch.isActive;
      if (patch.departmentId !== undefined) target.departmentId = patch.departmentId || null;
      target.updatedAt = new Date().toISOString();
      save(db);
      return sanitize(target);
    },

    listNotifications(token: string | null): NotificationItem[] {
      const db = load();
      const user = resolveUser(db, token);
      return db.notifications
        .filter((n) => n.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    markNotificationRead(token: string | null, id: string): void {
      const db = load();
      const user = resolveUser(db, token);
      const found = db.notifications.find((n) => n.id === id && n.userId === user.id);
      if (found) {
        found.isRead = true;
        save(db);
      }
    },

    markAllNotificationsRead(token: string | null): void {
      const db = load();
      const user = resolveUser(db, token);
      for (const n of db.notifications) {
        if (n.userId === user.id) n.isRead = true;
      }
      save(db);
    },
  };
}

export const localCivicStore = createLocalCivicStore();
