import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

// Must read raw body for signature verification
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get('orgId');
    if (!orgId) {
      return NextResponse.json({ error: 'orgId required in query' }, { status: 400 });
    }

    // 1. Read raw body (needed for HMAC verification)
    const rawBody = await req.text();

    // 2. Get signature from header
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature header' }, { status: 400 });
    }

    // 3. Fetch webhook secret for this org
    const configSnap = await adminDb.collection('razorpay_config').doc(orgId).get();
    if (!configSnap.exists) {
      // Return 200 to stop Razorpay retries for unconfigured orgs
      return NextResponse.json({ received: true }, { status: 200 });
    }
    const webhookSecret: string = configSnap.data()!.webhookSecret || '';
    if (!webhookSecret) {
      // No webhook secret configured — silently accept but don't process
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 4. Verify HMAC-SHA256
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');
    if (expectedSig !== signature) {
      console.warn('[razorpay-webhook] Signature mismatch for org', orgId);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 5. Parse event
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // 6. Replay attack mitigation — reject if event created_at > 5 min ago
    const eventCreatedAt: number = event.created_at || 0;
    const nowSecs = Math.floor(Date.now() / 1000);
    if (eventCreatedAt && Math.abs(nowSecs - eventCreatedAt) > 300) {
      console.warn('[razorpay-webhook] Stale event (>5 min old), ignoring');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const eventType: string = event.event;
    const paymentEntity = event.payload?.payment?.entity;
    const orderId: string = paymentEntity?.order_id || event.payload?.order?.entity?.id || '';

    // 7. Find booking by orderId
    if (!orderId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const bookingsSnap = await adminDb.collection('bookings')
      .where('razorpayOrderId', '==', orderId)
      .where('orgId', '==', orgId)
      .limit(1)
      .get();

    if (bookingsSnap.empty) {
      // No matching booking — acknowledge silently
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const bookingRef = bookingsSnap.docs[0].ref;
    const booking = bookingsSnap.docs[0].data();

    // 8. Handle events with idempotency
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (booking.paymentStatus === 'payment_done') {
        return NextResponse.json({ received: true }, { status: 200 }); // already processed
      }

      const newStatus = booking.paymentType === 'advance' ? 'advance_payment_done' : 'payment_done';
      const amountPaid = Math.round((paymentEntity?.amount || 0) / 100); // paise → rupees

      await bookingRef.update({
        paymentStatus: newStatus,
        razorpayPaymentId: paymentEntity?.id || '',
        amountPaid,
        webhookProcessedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (eventType === 'payment.failed') {
      // Only mark failed if not already succeeded
      if (!['payment_done', 'advance_payment_done'].includes(booking.paymentStatus)) {
        await bookingRef.update({
          paymentStatus: 'payment_failed',
          paymentFailureReason: paymentEntity?.error_description || 'Payment failed',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // 9. Always return 200 — Razorpay retries on non-200
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error('[razorpay-webhook]', err);
    // Return 200 anyway to prevent Razorpay from retrying server errors
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
