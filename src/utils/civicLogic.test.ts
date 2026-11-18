import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateReferenceId,
  isValidReferenceId,
  getTrackingStepIndex,
  canTransitionStatus,
  filterComplaints,
  computeDashboardStats,
  computeCategoryBreakdown,
  computeDepartmentWorkload,
  validateComplaintInput,
  validateRegistrationInput,
} from './civicLogic';
import type { Complaint, Department } from '../types/civic';

const SAMPLE_DEPARTMENTS: Department[] = [
  {
    id: 'dept-road',
    name: 'Roads & Transportation',
    code: 'ROAD',
    description: 'Road maintenance',
    contactEmail: 'roads@civictrack.gov',
    contactPhone: '555-0100',
    headName: 'Marcus Vance',
    slaHours: 48,
    isActive: true,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'dept-water',
    name: 'Water & Storm Drainage',
    code: 'WATR',
    description: 'Drainage and water lines',
    contactEmail: 'water@civictrack.gov',
    contactPhone: '555-0101',
    headName: 'Priya Nair',
    slaHours: 24,
    isActive: true,
    createdAt: '2026-09-01T10:00:00Z',
  },
];

const SAMPLE_COMPLAINTS: Complaint[] = [
  {
    id: 'c-1',
    referenceId: 'CT-2026-1001',
    citizenId: 'u-1',
    citizenName: 'Jordan Lee',
    title: 'Deep pothole near Elm St crosswalk',
    description: 'Large pothole affecting westbound lane.',
    category: 'Road Damage & Potholes',
    severity: 'high',
    status: 'resolved',
    departmentId: 'dept-road',
    departmentName: 'Roads & Transportation',
    assignedTo: null,
    latitude: 45.5231,
    longitude: -122.6765,
    address: '412 Elm Street',
    ward: 'Ward 2',
    photoUrl: '',
    resolutionNotes: 'Asphalt patched and compacted.',
    resolvedAt: '2026-10-02T14:00:00Z',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-02T14:00:00Z',
  },
  {
    id: 'c-2',
    referenceId: 'CT-2026-1002',
    citizenId: 'u-1',
    citizenName: 'Jordan Lee',
    title: 'Blocked storm drain at Oak Ave',
    description: 'Standing water after rain due to clogged grate.',
    category: 'Blocked Drainage',
    severity: 'critical',
    status: 'in_progress',
    departmentId: 'dept-water',
    departmentName: 'Water & Storm Drainage',
    assignedTo: null,
    latitude: 45.525,
    longitude: -122.681,
    address: '88 Oak Avenue',
    ward: 'Ward 4',
    photoUrl: '',
    resolutionNotes: '',
    resolvedAt: null,
    createdAt: '2026-10-10T09:00:00Z',
    updatedAt: '2026-10-10T11:00:00Z',
  },
];

test('generateReferenceId formats sequential zero-padded IDs', () => {
  assert.equal(generateReferenceId(2026, 1), 'CT-2026-0001');
  assert.equal(generateReferenceId(2026, 1042), 'CT-2026-1042');
  assert.equal(isValidReferenceId('ct-2026-1042'), true);
  assert.equal(isValidReferenceId('INVALID-12'), false);
});

test('status workflow transitions and tracking step index behave deterministically', () => {
  assert.equal(getTrackingStepIndex('submitted'), 0);
  assert.equal(getTrackingStepIndex('under_review'), 1);
  assert.equal(getTrackingStepIndex('in_progress'), 2);
  assert.equal(getTrackingStepIndex('resolved'), 3);
  assert.equal(canTransitionStatus('submitted', 'under_review'), true);
  assert.equal(canTransitionStatus('in_progress', 'resolved'), true);
});

test('filterComplaints filters by status, category, and search query', () => {
  assert.equal(filterComplaints(SAMPLE_COMPLAINTS, { status: 'resolved' }).length, 1);
  assert.equal(
    filterComplaints(SAMPLE_COMPLAINTS, { search: 'pothole' })[0].referenceId,
    'CT-2026-1001',
  );
  assert.equal(
    filterComplaints(SAMPLE_COMPLAINTS, { departmentId: 'dept-water' })[0].referenceId,
    'CT-2026-1002',
  );
});

test('computeDashboardStats, category breakdown, and department workload aggregate accurately', () => {
  const stats = computeDashboardStats(SAMPLE_COMPLAINTS);
  assert.equal(stats.total, 2);
  assert.equal(stats.resolved, 1);
  assert.equal(stats.inProgress, 1);
  assert.equal(stats.resolutionRate, 50);
  assert.equal(stats.avgResolutionHours, 28);

  const categories = computeCategoryBreakdown(SAMPLE_COMPLAINTS);
  const roads = categories.find((c) => c.shortName === 'Roads');
  assert.equal(roads?.total, 1);
  assert.equal(roads?.resolved, 1);

  const workload = computeDepartmentWorkload(SAMPLE_COMPLAINTS, SAMPLE_DEPARTMENTS);
  assert.equal(workload[0].assigned, 1);
  assert.equal(workload[1].active, 1);
});

test('validateComplaintInput rejects invalid fields and accepts valid complaints', () => {
  const invalid = validateComplaintInput({
    title: 'Bad',
    description: 'Too short',
    category: 'Unknown',
    address: '',
    latitude: null,
    longitude: null,
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.title);
  assert.ok(invalid.errors.description);
  assert.ok(invalid.errors.category);
  assert.ok(invalid.errors.address);
  assert.ok(invalid.errors.location);

  const valid = validateComplaintInput({
    title: 'Broken streetlight on Pine Ave',
    description: 'The streetlight near number 45 has been completely out for three nights.',
    category: 'Broken Streetlights',
    address: '45 Pine Avenue',
    latitude: 45.52,
    longitude: -122.67,
  });
  assert.equal(valid.valid, true);
});

test('validateRegistrationInput checks email and password length', () => {
  const invalid = validateRegistrationInput({
    fullName: 'A',
    email: 'not-an-email',
    password: '123',
  });
  assert.equal(invalid.valid, false);
  assert.equal(
    validateRegistrationInput({
      fullName: 'Maya Chen',
      email: 'maya@example.com',
      password: 'Password123',
    }).valid,
    true,
  );
});
