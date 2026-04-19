import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Recursively convert Firestore Timestamps → ISO strings so NextResponse.json() doesn't choke
function serialize(val: any): any {
  if (val === null || val === undefined) return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (Array.isArray(val)) return val.map(serialize);
  if (typeof val === 'object' && typeof val.toDate === 'function') {
    // duck-type Timestamp
    return val.toDate().toISOString();
  }
  if (typeof val === 'object') {
    return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, serialize(v)]));
  }
  return val;
}

export async function GET() {
  try {
    const [orgsSnap, numbersSnap, convsSnap, leadsSnap, usersSnap] = await Promise.all([
      adminDb.collection('organizations').get(),
      adminDb.collection('whatsapp_numbers').get(),
      adminDb.collection('conversations').get(),
      adminDb.collection('leads').get(),
      adminDb.collection('users').get(),
    ]);

    // Build lookup maps
    const numbers: Record<string, any> = {};
    numbersSnap.forEach((d) => { numbers[d.id] = d.data(); });

    const convCounts: Record<string, number> = {};
    convsSnap.forEach((d) => {
      const { orgId } = d.data();
      if (orgId) convCounts[orgId] = (convCounts[orgId] || 0) + 1;
    });

    const leadCounts: Record<string, number> = {};
    leadsSnap.forEach((d) => {
      const { orgId } = d.data();
      if (orgId) leadCounts[orgId] = (leadCounts[orgId] || 0) + 1;
    });

    const userMap: Record<string, { email: string; displayName: string }> = {};
    usersSnap.forEach((d) => {
      const data = d.data();
      userMap[d.id] = { email: data.email || '', displayName: data.displayName || '' };
    });

    const orgs = orgsSnap.docs.map((d) => {
      const data = d.data();
      const owner = userMap[data.ownerId] || null;
      return serialize({
        id: d.id,
        name: data.name,
        ownerId: data.ownerId,
        ownerEmail: owner?.email || '',
        ownerName: owner?.displayName || '',
        ownerPhone: data.ownerPhone || '',
        createdAt: data.createdAt,
        subscription: data.subscription || null,
        features: data.features || null,
        referral: data.referral || null,
        metadata: data.metadata || null,
        whatsapp: numbers[d.id] || null,
        conversationCount: convCounts[d.id] || 0,
        leadCount: leadCounts[d.id] || 0,
      });
    });

    return NextResponse.json({ orgs });
  } catch (err: any) {
    console.error('[list-orgs] ERROR:', err?.message, err?.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
