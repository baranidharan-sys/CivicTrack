import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  Complaint,
  ComplaintUpdate,
  Department,
  NotificationItem,
  UserProfile,
} from '../src/types/civic';

export interface StoredUser extends UserProfile {
  passwordHash: string;
}

export interface CivicDatabase {
  users: StoredUser[];
  departments: Department[];
  complaints: Complaint[];
  updates: ComplaintUpdate[];
  notifications: NotificationItem[];
  nextSequence: number;
}

const DATA_DIR = path.resolve(process.cwd(), '.civictrack-data');
const DB_FILE = path.join(DATA_DIR, 'store.json');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function createInitialSeed(): CivicDatabase {
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

  const users: StoredUser[] = [
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
      passwordHash: hashPassword('Admin@123'),
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
      passwordHash: hashPassword('Citizen@123'),
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
      passwordHash: hashPassword('Citizen@123'),
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
      title: 'Clogged storm drain grate causing curb pooling',
      citizenEmail: 'citizen@civictrack.gov',
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
      id: 'upd-2',
      complaintId: 'cmp-1001',
      updatedBy: 'user-admin-1',
      authorName: 'Claire Sterling',
      authorRole: 'admin',
      previousStatus: 'submitted',
      newStatus: 'under_review',
      note: 'Verified location and routed to Roads & Transportation.',
      createdAt: iso(13, 4),
    },
    {
      id: 'upd-3',
      complaintId: 'cmp-1001',
      updatedBy: 'user-admin-1',
      authorName: 'Claire Sterling',
      authorRole: 'admin',
      previousStatus: 'under_review',
      newStatus: 'in_progress',
      note: 'Paving crew #4 scheduled with hot-mix asphalt trailer.',
      createdAt: iso(12, 2),
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
      id: 'upd-5',
      complaintId: 'cmp-1002',
      updatedBy: 'user-citizen-1',
      authorName: 'Jordan Miller',
      authorRole: 'citizen',
      previousStatus: null,
      newStatus: 'submitted',
      note: 'Reported severe storm grate blockage at NW Everett St.',
      createdAt: iso(4),
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
      id: 'upd-7',
      complaintId: 'cmp-1003',
      updatedBy: 'user-citizen-2',
      authorName: 'Amara Patel',
      authorRole: 'citizen',
      previousStatus: null,
      newStatus: 'submitted',
      note: 'Reported streetlight outage at SE Hawthorne Blvd.',
      createdAt: iso(3),
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
    {
      id: 'upd-9',
      complaintId: 'cmp-1004',
      updatedBy: 'user-citizen-1',
      authorName: 'Jordan Miller',
      authorRole: 'citizen',
      previousStatus: null,
      newStatus: 'submitted',
      note: 'Complaint logged for overflowing public waste containers at Riverside Park.',
      createdAt: iso(1),
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
    {
      id: 'notif-3',
      userId: 'user-admin-1',
      complaintId: 'cmp-1004',
      referenceId: 'CT-2026-1004',
      title: 'New Citizen Report: CT-2026-1004',
      message: 'Jordan Miller submitted a High severity Garbage Accumulation report.',
      type: 'info',
      isRead: false,
      createdAt: iso(1),
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

export function ensureStorageDirectories(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function loadDatabase(): CivicDatabase {
  ensureStorageDirectories();
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw) as CivicDatabase;
  } catch {
    const fallback = createInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

export function saveDatabase(db: CivicDatabase): void {
  ensureStorageDirectories();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

export function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash: _passwordHash, ...profile } = user;
  return profile;
}
