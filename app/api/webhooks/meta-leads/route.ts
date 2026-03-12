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

    // Build the lead data object
    const leadData: any = {
      name: String(data.name).trim(),
      phone: String(data.phone).trim(),
      source: data.source ? String(data.source).trim() : 'Webhook',
      pax: data.pax ? Number(data.pax) : 1,
      status: 'New Enquiry',
      category: 'None',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add optional fields if they exist and are not null/empty
    if (data.sourceId) leadData.sourceId = String(data.sourceId).trim();
    if (data.travelDate) leadData.travelDate = String(data.travelDate).trim();
    if (data.latestRemark) leadData.latestRemark = String(data.latestRemark).trim();

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'leads'), leadData);

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
