import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Razorpay from 'razorpay';

// Creates a shareable Razorpay Payment Link (for agents to send to customers)
export async function POST(req: NextRequest) {
  try {
    // Verify agent is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, orgId, paymentType, agentAdvanceAmount } = body as {
      bookingId: string;
      orgId: string;
      paymentType: 'advance' | 'full';
      agentAdvanceAmount?: number; // agent can override advance amount
    };

    if (!bookingId || !orgId || !paymentType) {
      return NextResponse.json({ error: 'bookingId, orgId, paymentType are required' }, { status: 400 });
    }

    // Verify user belongs to this org
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists || (userDoc.data()!.orgId !== orgId && userDoc.data()!.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch booking and verify
    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    const booking = bookingSnap.data()!;
    if (booking.orgId !== orgId) {
      return NextResponse.json({ error: 'Booking does not belong to this org' }, { status: 403 });
    }
    if (booking.paymentStatus === 'payment_done') {
      return NextResponse.json({ error: 'Booking is already fully paid' }, { status: 409 });
    }

    // Fetch Razorpay config
    const configSnap = await adminDb.collection('razorpay_config').doc(orgId).get();
    if (!configSnap.exists) {
      return NextResponse.json({ error: 'Razorpay not configured for this agency' }, { status: 400 });
    }
    const config = configSnap.data()!;

    // Calculate amount server-side
    const netTotal = (booking.totalPrice || 0) - (booking.discountAmount || 0);
    let amountInRupees: number;
    if (paymentType === 'advance') {
      if (agentAdvanceAmount && agentAdvanceAmount > 0 && agentAdvanceAmount <= netTotal) {
        // Agent explicitly set advance amount — use it (still validated server-side against total)
        amountInRupees = Math.round(agentAdvanceAmount);
      } else {
        const pct = config.advancePercentage ?? 30;
        amountInRupees = Math.round((netTotal * pct) / 100);
      }
    } else {
      amountInRupees = Math.round(netTotal);
    }

    if (amountInRupees < 1) {
      return NextResponse.json({ error: 'Amount too small' }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: config.keyId, key_secret: config.keySecret });

    // Create Razorpay Payment Link
    const paymentLinkPayload: any = {
      amount: amountInRupees * 100, // paise
      currency: config.currency || 'INR',
      accept_partial: false,
      description: `${booking.packageTitle} — ${paymentType === 'advance' ? 'Advance Payment' : 'Full Payment'}`,
      customer: {
        name: booking.customerName || '',
        contact: booking.customerPhone || '',
        email: booking.customerEmail || '',
      },
      notify: {
        sms: !!booking.customerPhone,
        email: !!booking.customerEmail,
      },
      reminder_enable: true,
      notes: {
        bookingId,
        orgId,
        paymentType,
        packageTitle: booking.packageTitle || '',
      },
      callback_url: '', // optional: add a thank-you page URL
      callback_method: 'get',
    };

    const paymentLink = await (razorpay.paymentLink as any).create(paymentLinkPayload);

    // Store link on booking
    await bookingRef.update({
      razorpayPaymentLinkId: paymentLink.id,
      razorpayPaymentLinkUrl: paymentLink.short_url,
      paymentType,
      paymentStatus: 'payment_pending',
      paymentMethod: 'razorpay',
      advanceAmount: amountInRupees,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      paymentLinkId: paymentLink.id,
      paymentLinkUrl: paymentLink.short_url,
      amount: amountInRupees,
      currency: config.currency || 'INR',
    });
  } catch (err: any) {
    console.error('[create-payment-link]', err);
    return NextResponse.json({ error: err.error?.description || err.message || 'Failed to create payment link' }, { status: 500 });
  }
}
