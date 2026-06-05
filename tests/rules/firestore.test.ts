import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'freshmart-rules-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // Seed catalogue + an order owned by alice, with rules bypassed.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'products', 'p1'), { name: 'Milk', price: 33 });
    await setDoc(doc(db, 'categories', 'dairy'), { name: 'Dairy & Eggs' });
    await setDoc(doc(db, 'orders', 'o1'), { uid: 'alice', totals: { grand: 100 } });
    await setDoc(doc(db, 'supportTickets', 't1'), { uid: 'alice', message: 'hi' });
    await setDoc(doc(db, 'coupons', 'SAVE10'), { type: 'percent', value: 10 });
  });
});

const alice = () => testEnv.authenticatedContext('alice').firestore();
const bob = () => testEnv.authenticatedContext('bob').firestore();
const guest = () => testEnv.unauthenticatedContext().firestore();

describe('catalogue', () => {
  it('is publicly readable', async () => {
    await assertSucceeds(getDoc(doc(guest(), 'products', 'p1')));
    await assertSucceeds(getDoc(doc(guest(), 'categories', 'dairy')));
  });
  it('is not client-writable', async () => {
    await assertFails(setDoc(doc(alice(), 'products', 'p2'), { name: 'hack' }));
    await assertFails(setDoc(doc(alice(), 'categories', 'c2'), { name: 'hack' }));
  });
});

describe('users', () => {
  it('lets the owner read and write their doc', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'users', 'alice'), { name: 'Alice' }));
    await assertSucceeds(getDoc(doc(alice(), 'users', 'alice')));
  });
  it('forbids reading or writing another user doc', async () => {
    await assertFails(getDoc(doc(bob(), 'users', 'alice')));
    await assertFails(setDoc(doc(bob(), 'users', 'alice'), { name: 'hack' }));
  });
});

describe('orders', () => {
  it('lets a user read only their own order', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'orders', 'o1')));
    await assertFails(getDoc(doc(bob(), 'orders', 'o1')));
  });
  it('forbids any client create/update', async () => {
    await assertFails(setDoc(doc(alice(), 'orders', 'o2'), { uid: 'alice' }));
    await assertFails(setDoc(doc(alice(), 'orders', 'o1'), { uid: 'alice', hacked: true }));
  });
});

describe('support tickets', () => {
  it('lets a signed-in user create their own ticket', async () => {
    await assertSucceeds(
      addDoc(collection(alice(), 'supportTickets'), { uid: 'alice', message: 'help' }),
    );
  });
  it('forbids creating a ticket as someone else', async () => {
    await assertFails(
      addDoc(collection(alice(), 'supportTickets'), { uid: 'bob', message: 'spoof' }),
    );
  });
  it('allows a guest ticket with no uid', async () => {
    await assertSucceeds(
      addDoc(collection(guest(), 'supportTickets'), { uid: null, message: 'guest' }),
    );
  });
  it('lets a user read only their own ticket', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'supportTickets', 't1')));
    await assertFails(getDoc(doc(bob(), 'supportTickets', 't1')));
  });
});

describe('coupons', () => {
  it('are not client-readable', async () => {
    await assertFails(getDoc(doc(guest(), 'coupons', 'SAVE10')));
    await assertFails(getDoc(doc(alice(), 'coupons', 'SAVE10')));
  });
});
