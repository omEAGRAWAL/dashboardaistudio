import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, bookingId, orgId } = body as {
      razorpayPaymentId: string;
      razorpayOrderId: string;
      razorpaySignature: string;
      bookingId: string;
      orgId: string;
    };

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !bookingId || !orgId) {
      return NextResponse.json({ error: 'All payment fields are required' }, { status: 400 });
    }

    // 1. Fetch booking
    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    const booking = bookingSnap.data()!;

    // 2. Cross-org check
    if (booking.orgId !== orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Verify orderId matches what we stored
    if (booking.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json({ error: 'Order ID mismatch' }, { status: 400 });
    }

    // 4. Idempotency — already fully paid
    if (booking.paymentStatus === 'payment_done') {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    // 5. Fetch keySecret server-side
    const configSnap = await adminDb.collection('razorpay_config').doc(orgId).get();
    if (!configSnap.exists) {
      return NextResponse.json({ error: 'Razorpay not configured' }, { status: 400 });
    }
    const keySecret: string = configSnap.data()!.keySecret;

    // 6. Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      console.warn('[verify-payment] Signature mismatch for booking', bookingId);
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // 7. Calculate amountPaid from what we stored on the order
    const netTotal = (booking.totalPrice || 0) - (booking.discountAmount || 0);
    const pct = configSnap.data()!.advancePercentage ?? 30;
    const amountPaid = booking.paymentType === 'advance'
      ? Math.round((netTotal * pct) / 100)
      : Math.round(netTotal);

    const newPaymentStatus = booking.paymentType === 'advance' ? 'advance_payment_done' : 'payment_done';

    // 8. Firestore transaction for atomic update
    await adminDb.runTransaction(async (tx) => {
      const fresh = await tx.get(bookingRef);
      if (fresh.data()?.paymentStatus === 'payment_done') return; // idempotency inside tx
      tx.update(bookingRef, {
        paymentStatus: newPaymentStatus,
        razorpayPaymentId,
        amountPaid,
        paymentVerifiedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ success: true, paymentStatus: newPaymentStatus });
  } catch (err: any) {
    console.error('[verify-payment]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
