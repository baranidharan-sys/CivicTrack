import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import {
  loadDatabase,
  saveDatabase,
  sanitizeUser,
  hashPassword,
  verifyPassword,
  UPLOADS_DIR,
  ensureStorageDirectories,
  type StoredUser,
} from './server/store';
import {
  generateReferenceId,
  validateComplaintInput,
  validateRegistrationInput,
  computeDashboardStats,
} from './src/utils/civicLogic';
import type { Complaint, ComplaintStatus, Department, UserRole } from './src/types/civic';

const PORT = 3000;
const TOKEN_SECRET = process.env.CIVICTRACK_TOKEN_SECRET || 'civictrack-local-session-secret-2026';

interface SessionPayload {
  userId: string;
  role: UserRole;
  exp: number;
}

function signToken(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

interface AuthedRequest extends Request {
  currentUser?: StoredUser;
}

function extractAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  const db = loadDatabase();
  const user = db.users.find((u) => u.id === payload.userId);
  if (!user || !user.isActive) {
    res.status(401).json({ error: 'Account not found or inactive.' });
    return;
  }
  req.currentUser = user;
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges are required for this action.' });
    return;
  }
  next();
}

function enrichComplaint(complaint: Complaint, db: ReturnType<typeof loadDatabase>): Complaint {
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

async function startServer() {
  ensureStorageDirectories();
  const app = express();

  app.use(express.json({ limit: '15mb' }));
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'civictrack-api' });
  });

  // Public overview stats for Landing Page
  app.get('/api/public/stats', (_req, res) => {
    const db = loadDatabase();
    const stats = computeDashboardStats(db.complaints);
    const recentResolved = db.complaints
      .filter((c) => c.status === 'resolved')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)
      .map((c) => enrichComplaint(c, db));

    res.json({
      totalComplaints: stats.total,
      resolvedComplaints: stats.resolved,
      inProgressComplaints: stats.inProgress + stats.underReview,
      resolutionRate: stats.resolutionRate,
      avgResolutionHours: stats.avgResolutionHours,
      recentResolved,
    });
  });

  // Public & Citizen complaint tracking by Reference ID
  app.get('/api/public/track/:referenceId', (req, res) => {
    const db = loadDatabase();
    const ref = req.params.referenceId.trim().toUpperCase();
    const complaint = db.complaints.find((c) => c.referenceId.toUpperCase() === ref);
    if (!complaint) {
      res.status(404).json({ error: `No complaint found with reference ID ${ref}.` });
      return;
    }
    const enriched = enrichComplaint(complaint, db);
    // Strip private citizen email on public lookup
    const { citizenEmail: _email, ...publicSafe } = enriched;
    res.json({ complaint: publicSafe });
  });

  // Auth: Register Citizen
  app.post('/api/auth/register', (req, res) => {
    const { fullName, email, password, phone = '', address = '' } = req.body ?? {};
    const validation = validateRegistrationInput({ fullName, email, password, phone });
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0] || 'Invalid registration data.';
      res.status(400).json({ error: firstError, errors: validation.errors });
      return;
    }

    const db = loadDatabase();
    const normalizedEmail = String(email).trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const now = new Date().toISOString();
    const newUser: StoredUser = {
      id: `user-${crypto.randomUUID()}`,
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      address: String(address).trim(),
      role: 'citizen',
      departmentId: null,
      avatarUrl: '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
      passwordHash: hashPassword(String(password)),
    };

    db.users.push(newUser);
    saveDatabase(db);

    const token = signToken({
      userId: newUser.id,
      role: newUser.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  // Auth: Login (optionally validates expected portal role)
  app.post('/api/auth/login', (req, res) => {
    const { email, password, portal } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const db = loadDatabase();
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ error: 'This account has been deactivated. Contact municipal support.' });
      return;
    }
    if (portal === 'admin' && user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied. Administrator credentials required.' });
      return;
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ token, user: sanitizeUser(user) });
  });

  app.get('/api/auth/me', extractAuth, (req: AuthedRequest, res) => {
    res.json({ user: sanitizeUser(req.currentUser!) });
  });

  app.patch('/api/profile', extractAuth, (req: AuthedRequest, res) => {
    const db = loadDatabase();
    const user = db.users.find((u) => u.id === req.currentUser!.id);
    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    const { fullName, phone, address, avatarUrl } = req.body ?? {};
    if (typeof fullName === 'string' && fullName.trim().length >= 2) {
      user.fullName = fullName.trim();
    }
    if (typeof phone === 'string') {
      user.phone = phone.trim();
    }
    if (typeof address === 'string') {
      user.address = address.trim();
    }
    if (typeof avatarUrl === 'string') {
      user.avatarUrl = avatarUrl.trim();
    }
    user.updatedAt = new Date().toISOString();

    saveDatabase(db);
    res.json({ user: sanitizeUser(user) });
  });

  // Image Upload endpoint (mirrors Supabase Storage bucket behavior)
  app.post('/api/upload', extractAuth, (req: AuthedRequest, res) => {
    const { fileName, dataUrl } = req.body ?? {};
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      res.status(400).json({ error: 'Valid image data URL is required.' });
      return;
    }

    const matches = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
    if (!matches) {
      res.status(400).json({ error: 'Unsupported image format. Use PNG, JPEG, or WebP.' });
      return;
    }

    const ext = matches[1].toLowerCase() === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
    const buffer = Buffer.from(matches[2], 'base64');
    if (buffer.byteLength > 8 * 1024 * 1024) {
      res.status(400).json({ error: 'Image must be smaller than 8 MB.' });
      return;
    }

    const safeBase = String(fileName || 'evidence')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 32);
    const outName = `${Date.now()}_${safeBase}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, outName), buffer);

    res.status(201).json({ url: `/uploads/${outName}` });
  });

  // List complaints (Citizens get own complaints; Admins get all)
  app.get('/api/complaints', extractAuth, (req: AuthedRequest, res) => {
    const db = loadDatabase();
    const list =
      req.currentUser!.role === 'admin'
        ? db.complaints
        : db.complaints.filter((c) => c.citizenId === req.currentUser!.id);

    const enriched = list
      .map((c) => enrichComplaint(c, db))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ complaints: enriched });
  });

  // Get single complaint detail
  app.get('/api/complaints/:id', extractAuth, (req: AuthedRequest, res) => {
    const db = loadDatabase();
    const complaint = db.complaints.find(
      (c) => c.id === req.params.id || c.referenceId.toUpperCase() === req.params.id.toUpperCase(),
    );
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }
    if (req.currentUser!.role !== 'admin' && complaint.citizenId !== req.currentUser!.id) {
      res.status(403).json({ error: 'You do not have permission to view this complaint.' });
      return;
    }
    res.json({ complaint: enrichComplaint(complaint, db) });
  });

  // Create complaint
  app.post('/api/complaints', extractAuth, (req: AuthedRequest, res) => {
    const {
      title,
      description,
      category,
      severity = 'medium',
      address,
      ward = '',
      latitude,
      longitude,
      photoUrl = '',
    } = req.body ?? {};

    const validation = validateComplaintInput({
      title: String(title || ''),
      description: String(description || ''),
      category: String(category || ''),
      address: String(address || ''),
      latitude: typeof latitude === 'number' ? latitude : Number(latitude),
      longitude: typeof longitude === 'number' ? longitude : Number(longitude),
    });

    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0] || 'Please fix form errors.';
      res.status(400).json({ error: firstError, errors: validation.errors });
      return;
    }

    const db = loadDatabase();
    const year = new Date().getFullYear();
    const sequence = db.nextSequence || 1007;
    db.nextSequence = sequence + 1;
    const referenceId = generateReferenceId(year, sequence);
    const now = new Date().toISOString();

    const newComplaint: Complaint = {
      id: `cmp-${crypto.randomUUID()}`,
      referenceId,
      citizenId: req.currentUser!.id,
      citizenName: req.currentUser!.fullName,
      citizenEmail: req.currentUser!.email,
      title: String(title).trim(),
      description: String(description).trim(),
      category,
      severity,
      status: 'submitted',
      departmentId: null,
      assignedTo: null,
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: String(address).trim(),
      ward: String(ward).trim() || 'Municipal Zone',
      photoUrl: String(photoUrl || ''),
      resolutionNotes: '',
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    db.complaints.unshift(newComplaint);

    db.updates.push({
      id: `upd-${crypto.randomUUID()}`,
      complaintId: newComplaint.id,
      updatedBy: req.currentUser!.id,
      authorName: req.currentUser!.fullName,
      authorRole: req.currentUser!.role,
      previousStatus: null,
      newStatus: 'submitted',
      note: 'Report submitted by citizen with location coordinates.',
      createdAt: now,
    });

    // Notify admins
    const admins = db.users.filter((u) => u.role === 'admin' && u.isActive);
    for (const admin of admins) {
      db.notifications.unshift({
        id: `notif-${crypto.randomUUID()}`,
        userId: admin.id,
        complaintId: newComplaint.id,
        referenceId,
        title: `New Issue Reported: ${referenceId}`,
        message: `${req.currentUser!.fullName} reported "${newComplaint.title}" (${newComplaint.category}).`,
        type: 'info',
        isRead: false,
        createdAt: now,
      });
    }

    saveDatabase(db);
    res.status(201).json({ complaint: enrichComplaint(newComplaint, db) });
  });

  // Admin: Update complaint (assign department, update status, add resolution notes)
  app.patch('/api/complaints/:id', extractAuth, requireAdmin, (req: AuthedRequest, res) => {
    const db = loadDatabase();
    const complaint = db.complaints.find((c) => c.id === req.params.id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    const { status, departmentId, resolutionNotes, updateNote } = req.body ?? {};
    const prevStatus = complaint.status;
    const prevDept = complaint.departmentId;
    const now = new Date().toISOString();

    if (typeof departmentId === 'string') {
      if (departmentId === '') {
        complaint.departmentId = null;
        complaint.departmentName = undefined;
      } else {
        const dept = db.departments.find((d) => d.id === departmentId);
        if (!dept) {
          res.status(400).json({ error: 'Selected department does not exist.' });
          return;
        }
        complaint.departmentId = dept.id;
        complaint.departmentName = dept.name;
      }
    }

    if (typeof status === 'string') {
      const validStatuses: ComplaintStatus[] = [
        'submitted',
        'under_review',
        'in_progress',
        'resolved',
        'rejected',
      ];
      if (!validStatuses.includes(status as ComplaintStatus)) {
        res.status(400).json({ error: 'Invalid complaint status.' });
        return;
      }
      complaint.status = status as ComplaintStatus;
      if (complaint.status === 'resolved' && !complaint.resolvedAt) {
        complaint.resolvedAt = now;
      } else if (complaint.status !== 'resolved') {
        complaint.resolvedAt = null;
      }
    }

    if (typeof resolutionNotes === 'string') {
      complaint.resolutionNotes = resolutionNotes.trim();
    }

    complaint.assignedTo = req.currentUser!.id;
    complaint.updatedAt = now;

    const noteText =
      typeof updateNote === 'string' && updateNote.trim().length > 0
        ? updateNote.trim()
        : complaint.resolutionNotes ||
          `Updated status to ${complaint.status.replace('_', ' ')}${
            complaint.departmentName ? ` · Assigned to ${complaint.departmentName}` : ''
          }.`;

    db.updates.push({
      id: `upd-${crypto.randomUUID()}`,
      complaintId: complaint.id,
      updatedBy: req.currentUser!.id,
      authorName: req.currentUser!.fullName,
      authorRole: 'admin',
      previousStatus: prevStatus,
      newStatus: complaint.status,
      note: noteText,
      createdAt: now,
    });

    // Notify citizen if status or department changed
    if (prevStatus !== complaint.status || prevDept !== complaint.departmentId || updateNote) {
      db.notifications.unshift({
        id: `notif-${crypto.randomUUID()}`,
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
    }

    saveDatabase(db);
    res.json({ complaint: enrichComplaint(complaint, db) });
  });

  // Departments endpoints
  app.get('/api/departments', (_req, res) => {
    const db = loadDatabase();
    res.json({ departments: db.departments });
  });

  app.post('/api/departments', extractAuth, requireAdmin, (req: AuthedRequest, res) => {
    const { name, code, description = '', contactEmail, contactPhone = '', headName = '', slaHours = 48 } =
      req.body ?? {};
    if (!name || !code || !contactEmail) {
      res.status(400).json({ error: 'Department name, code, and contact email are required.' });
      return;
    }

    const db = loadDatabase();
    const upperCode = String(code).trim().toUpperCase();
    if (
      db.departments.some(
        (d) =>
          d.code.toUpperCase() === upperCode ||
          d.name.toLowerCase() === String(name).trim().toLowerCase(),
      )
    ) {
      res.status(409).json({ error: 'A department with this name or code already exists.' });
      return;
    }

    const newDept: Department = {
      id: `dept-${crypto.randomUUID().slice(0, 8)}`,
      name: String(name).trim(),
      code: upperCode,
      description: String(description).trim(),
      contactEmail: String(contactEmail).trim(),
      contactPhone: String(contactPhone).trim(),
      headName: String(headName).trim(),
      slaHours: Number(slaHours) || 48,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    db.departments.push(newDept);
    saveDatabase(db);
    res.status(201).json({ department: newDept });
  });

  app.patch('/api/departments/:id', extractAuth, requireAdmin, (req: AuthedRequest, res) => {
    const db = loadDatabase();
    const dept = db.departments.find((d) => d.id === req.params.id);
    if (!dept) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }

    const { name, description, contactEmail, contactPhone, headName, slaHours, isActive } =
      req.body ?? {};
    if (typeof name === 'string' && name.trim()) dept.name = name.trim();
    if (typeof description === 'string') dept.description = description.trim();
    if (typeof contactEmail === 'string' && contactEmail.trim()) dept.contactEmail = contactEmail.trim();
    if (typeof contactPhone === 'string') dept.contactPhone = contactPhone.trim();
    if (typeof headName === 'string') dept.headName = headName.trim();
    if (typeof slaHours === 'number' && slaHours > 0) dept.slaHours = slaHours;
    if (typeof isActive === 'boolean') dept.isActive = isActive;

    saveDatabase(db);
    res.json({ department: dept });
  });

  // Users management (Admin only)
  app.get('/api/users', extractAuth, requireAdmin, (_req: AuthedRequest, res) => {
    const db = loadDatabase();
    res.json({ users: db.users.map(sanitizeUser) });
  });

  app.patch('/api/users/:id', extractAuth, requireAdmin, (req: AuthedRequest, res) => {
    const db = loadDatabase();
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const { role, isActive, departmentId } = req.body ?? {};
    if (role === 'citizen' || role === 'admin') {
      target.role = role;
    }
    if (typeof isActive === 'boolean') {
      target.isActive = isActive;
    }
    if (departmentId !== undefined) {
      target.departmentId = departmentId || null;
    }
    target.updatedAt = new Date().toISOString();

    saveDatabase(db);
    res.json({ user: sanitizeUser(target) });
  });

  // Notifications
  app.get('/api/notifications', extractAuth, (req: AuthedRequest, res) => {
    const db = loadDatabase();
    const items = db.notifications
      .filter((n) => n.userId === req.currentUser!.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ notifications: items });
  });

  app.patch('/api/notifications/:id/read', extractAuth, (req: AuthedRequest, res) => {
    const db = loadDatabase();
    const notif = db.notifications.find(
      (n) => n.id === req.params.id && n.userId === req.currentUser!.id,
    );
    if (!notif) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }
    notif.isRead = true;
    saveDatabase(db);
    res.json({ notification: notif });
  });

  app.post('/api/notifications/read-all', extractAuth, (req: AuthedRequest, res) => {
    const db = loadDatabase();
    for (const notif of db.notifications) {
      if (notif.userId === req.currentUser!.id) {
        notif.isRead = true;
      }
    }
    saveDatabase(db);
    res.json({ ok: true });
  });

  // Vite dev middleware vs static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicTrack server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CivicTrack server:', err);
  process.exit(1);
});
