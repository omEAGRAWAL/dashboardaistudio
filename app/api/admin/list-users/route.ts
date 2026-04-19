import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

async function verifySuperadmin(req: NextRequest): Promise<boolean> {
  const uid = req.headers.get('x-uid');
  if (!uid) return false;
  const snap = await adminDb.doc(`users/${uid}`).get();
  return snap.exists && snap.data()?.role === 'superadmin';
}

export async function GET(req: NextRequest) {
  try {
    if (!await verifySuperadmin(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const filterOrgId = searchParams.get('orgId') || '';

    const [usersSnap, orgsSnap] = await Promise.all([
      adminDb.collection('users').orderBy('createdAt', 'desc').get(),
      adminDb.collection('organizations').get(),
    ]);

    // orgId → name map
    const orgMap: Record<string, string> = {};
    orgsSnap.forEach((d) => { orgMap[d.id] = d.data().name || d.id; });

    let users = usersSnap.docs.map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        email: data.email || '',
        displayName: data.displayName || '',
        photoURL: data.photoURL || '',
        role: data.role || 'agent',
        orgId: data.orgId || null,
        orgName: data.orgId ? (orgMap[data.orgId] || data.orgId) : null,
        status: data.status || 'active',
        createdAt: data.createdAt,
      };
    });

    if (filterOrgId) users = users.filter((u) => u.orgId === filterOrgId);
    if (search) {
      users = users.filter((u) =>
        u.email.toLowerCase().includes(search) ||
        u.displayName.toLowerCase().includes(search) ||
        (u.orgName || '').toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ users, total: users.length });
  } catch (err: any) {
    console.error('list-users error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
