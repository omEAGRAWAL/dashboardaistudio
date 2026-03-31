import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const [orgsSnap, numbersSnap, convsSnap, leadsSnap] = await Promise.all([
      adminDb.collection('organizations').get(),
      adminDb.collection('whatsapp_numbers').get(),
      adminDb.collection('conversations').get(),
      adminDb.collection('leads').get(),
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

    const orgs = orgsSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      whatsapp: numbers[d.id] || null,
      conversationCount: convCounts[d.id] || 0,
      leadCount: leadCounts[d.id] || 0,
    }));

    return NextResponse.json({ orgs });
  } catch (err: any) {
    console.error('list-orgs error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
