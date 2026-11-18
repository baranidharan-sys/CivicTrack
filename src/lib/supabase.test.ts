import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidSupabaseKey, normalizeSupabaseUrl } from './supabase';

test('normalizeSupabaseUrl extracts project ref from Supabase Dashboard URLs', () => {
  assert.equal(
    normalizeSupabaseUrl('https://supabase.com/dashboard/project/gkdaaejnwowuuskttmlz/settings/api-keys'),
    'https://gkdaaejnwowuuskttmlz.supabase.co',
  );
  assert.equal(
    normalizeSupabaseUrl('https://app.supabase.com/project/abcdefghijklmnopqrst/editor'),
    'https://abcdefghijklmnopqrst.supabase.co',
  );
});

test('normalizeSupabaseUrl preserves valid project origins and strips extra paths', () => {
  assert.equal(
    normalizeSupabaseUrl('https://gkdaaejnwowuuskttmlz.supabase.co/'),
    'https://gkdaaejnwowuuskttmlz.supabase.co',
  );
  assert.equal(
    normalizeSupabaseUrl('https://gkdaaejnwowuuskttmlz.supabase.co/rest/v1'),
    'https://gkdaaejnwowuuskttmlz.supabase.co',
  );
});

test('normalizeSupabaseUrl rejects invalid or placeholder values', () => {
  assert.equal(normalizeSupabaseUrl(''), null);
  assert.equal(normalizeSupabaseUrl('https://supabase.com/dashboard'), null);
  assert.equal(normalizeSupabaseUrl('not-a-url'), null);
});

test('isValidSupabaseKey rejects empty strings and URLs', () => {
  assert.equal(isValidSupabaseKey(''), false);
  assert.equal(isValidSupabaseKey('https://supabase.com/dashboard/project/abc/settings/api-keys'), false);
  assert.equal(isValidSupabaseKey('sb_publishable_1234567890abcdef12345'), true);
});
