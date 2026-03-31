import { adminDb } from './firebase-admin';

/**
 * Returns the UID of the next active agent to assign a lead to using round-robin.
 * Only includes users where assignmentActive !== false and status !== 'suspended'.
 * Uses a Firestore transaction to atomically advance the round-robin index.
 */
export async function getNextAssignee(orgId: string): Promise<string | null> {
  const usersSnap = await adminDb
    .collection('users')
    .where('orgId', '==', orgId)
    .get();

  // Eligible: not suspended, not excluded from assignment, stable sort by uid
  const eligible = usersSnap.docs
    .filter(d => {
      const data = d.data();
      return data.status !== 'suspended' && data.assignmentActive !== false;
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  if (eligible.length === 0) return null;

  const orgRef = adminDb.doc(`organizations/${orgId}`);
  return adminDb.runTransaction(async (tx) => {
    const orgDoc = await tx.get(orgRef);
    const rawIndex: number = orgDoc.exists ? (orgDoc.data()?.rrIndex ?? 0) : 0;
    const nextIndex = rawIndex % eligible.length;
    const assigneeId = eligible[nextIndex].id;
    tx.update(orgRef, { rrIndex: nextIndex + 1 });
    return assigneeId;
  });
}
