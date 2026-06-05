/**
 * Generic client-side Firestore CRUD for the admin panel.
 *
 * Writes are authorised by Firestore rules (caller's uid must be in /admins).
 * Kept intentionally small and untyped-at-the-edge; callers supply the shapes.
 */
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

/** List every doc in a collection as `{ ...data, id }` (doc id wins). */
export async function listAll<T>(coll: string): Promise<(T & { id: string })[]> {
  const snap = await getDocs(collection(db, coll));
  return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
}

/** Create a doc (auto id, or a supplied id). Returns the id. */
export async function createDoc(
  coll: string,
  data: Record<string, unknown>,
  id?: string,
): Promise<string> {
  if (id) {
    await setDoc(doc(db, coll, id), data);
    return id;
  }
  const ref = await addDoc(collection(db, coll), data);
  return ref.id;
}

/** Merge-update an existing doc. */
export async function updateDocFields(
  coll: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await setDoc(doc(db, coll, id), data, { merge: true });
}

/** Delete a doc. */
export async function removeDoc(coll: string, id: string): Promise<void> {
  await deleteDoc(doc(db, coll, id));
}
