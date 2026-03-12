import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Basic validation
    if (!data.name || !data.phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'leads'), {
      name: data.name,
      phone: data.phone,
      source: data.source || 'Webhook',
      sourceId: data.sourceId || null,
      pax: data.pax ? parseInt(data.pax, 10) : 1,
      travelDate: data.travelDate || null,
      status: 'New Enquiry',
      category: 'None',
      assigneeId: null,
      latestRemark: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
