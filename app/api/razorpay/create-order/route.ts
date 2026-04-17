import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, orgId, paymentType } = body as {
      bookingId: string;
      orgId: string;
      paymentType: 'advance' | 'full';
    };

    if (!bookingId || !orgId || !paymentType) {
      return NextResponse.json({ error: 'bookingId, orgId, paymentType are required' }, { status: 400 });
    }

    // 1. Fetch booking and verify it belongs to this org
    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    const booking = bookingSnap.data()!;
    if (booking.orgId !== orgId) {
      return NextResponse.json({ error: 'Booking does not belong to this org' }, { status: 403 });
    }

    // 2. Prevent double-payment
    if (booking.paymentStatus === 'payment_done') {
      return NextResponse.json({ error: 'Booking is already fully paid' }, { status: 409 });
    }

    // 3. Fetch Razorpay config for this org (server-side only)
    const configSnap = await adminDb.collection('razorpay_config').doc(orgId).get();
    if (!configSnap.exists) {
      return NextResponse.json({ error: 'Razorpay not configured for this agency' }, { status: 400 });
    }
    const config = configSnap.data()!;

    // 4. Calculate amount server-side — client cannot tamper this
    const netTotal = (booking.totalPrice || 0) - (booking.discountAmount || 0);
    let amountInPaise: number;
    if (paymentType === 'advance') {
      const pct = config.advancePercentage ?? 30;
      amountInPaise = Math.round((netTotal * pct) / 100) * 100; // round to nearest rupee
    } else {
      amountInPaise = Math.round(netTotal) * 100;
    }

    if (amountInPaise < 100) {
      return NextResponse.json({ error: 'Amount too small (minimum ₹1)' }, { status: 400 });
    }

    // 5. Create Razorpay order
    const razorpay = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: config.currency || 'INR',
      receipt: `bkng_${bookingId.slice(0, 20)}`,
      notes: {
        bookingId,
        orgId,
        paymentType,
        customerName: booking.customerName || '',
        packageTitle: booking.packageTitle || '',
      },
    });

    // 6. Store orderId AND advance amount on booking atomically
    // advanceAmount is stored in rupees so invoice and balance calculations are always accurate
    const advanceAmountInRupees = amountInPaise / 100;
    await bookingRef.update({
      razorpayOrderId: order.id,
      paymentType,
      paymentStatus: 'payment_pending',
      paymentMethod: 'razorpay',
      advanceAmount: advanceAmountInRupees,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 7. Return order details — keySecret is NEVER returned
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.keyId,
    });
  } catch (err: any) {
    console.error('[create-order]', err);
    return NextResponse.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
