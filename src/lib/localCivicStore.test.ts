import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalCivicStore, type KeyValueStorage } from './localCivicStore';

function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

test('localCivicStore registers new citizen, blocks duplicates, and authenticates', () => {
  const store = createLocalCivicStore(createMemoryStorage());

  const { token, user } = store.register({
    fullName: 'barani',
    email: 'dsbarani0@gmail.com',
    password: 'password123',
    phone: '7092889940',
    address: 'trichengode',
  });

  assert.equal(user.fullName, 'barani');
  assert.equal(user.role, 'citizen');
  assert.equal(store.getCurrentUser(token)?.email, 'dsbarani0@gmail.com');

  assert.throws(() => {
    store.register({
      fullName: 'barani',
      email: 'dsbarani0@gmail.com',
      password: 'password123',
    });
  }, /already exists/);

  assert.throws(() => {
    store.login({ email: 'dsbarani0@gmail.com', password: 'password123', portal: 'admin' });
  }, /Administrator credentials required/);
});

test('localCivicStore connects citizen submission to admin triage and citizen notification', () => {
  const store = createLocalCivicStore(createMemoryStorage());

  const { token: citizenToken } = store.register({
    fullName: 'barani',
    email: 'barani@example.com',
    password: 'password123',
  });

  const created = store.createComplaint(citizenToken, {
    title: 'Broken streetlight on Main Road',
    description: 'The municipal streetlight near the bus stop has been completely dark for two nights.',
    category: 'Broken Streetlights',
    severity: 'high',
    address: 'Main Road, Trichengode',
    ward: 'Ward 3',
    latitude: 11.3802,
    longitude: 77.8944,
    photoUrl: '',
  });

  assert.match(created.referenceId, /^CT-\d{4}-\d{4}$/);

  const { token: adminToken } = store.login({
    email: 'admin@civictrack.gov',
    password: 'Admin@123',
    portal: 'admin',
  });

  const updated = store.updateComplaintAdmin(adminToken, created.id, {
    departmentId: 'dept-light',
    status: 'in_progress',
    resolutionNotes: 'Electrical crew dispatched.',
  });

  assert.equal(updated.status, 'in_progress');
  assert.equal(updated.departmentName, 'Street Lighting & Electrical');

  const tracked = store.trackComplaint(created.referenceId);
  assert.equal(tracked.status, 'in_progress');

  const citizenNotifs = store.listNotifications(citizenToken);
  assert.equal(citizenNotifs.length, 1);
  assert.equal(citizenNotifs[0].referenceId, created.referenceId);
});
