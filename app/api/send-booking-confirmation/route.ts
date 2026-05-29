import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

function cleanEmail(value?: string | null) {
  const email = value?.trim();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTravelDate(value: any) {
  if (!value) return 'To be decided';

  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? 'To be decided' : date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getPax(booking: any) {
  const direct = Number(booking.numberOfPersons);
  if (direct > 0) return direct;

  if (Array.isArray(booking.ticketBreakdown)) {
    return booking.ticketBreakdown.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
  }

  return 0;
}

function formatAmount(value: number) {
  return `INR ${Math.max(0, Math.round(value)).toLocaleString('en-IN')}`;
}

function buildRows(rows: [string, string][]) {
  return rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 0;color:#6b7280;font-size:13px;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${escapeHtml(value)}</td>
    </tr>
  `).join('');
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { orgId, bookingId, force } = body as { orgId?: string; bookingId?: string; force?: boolean };

  if (!orgId || !bookingId) {
    return NextResponse.json({ error: 'orgId and bookingId are required' }, { status: 400 });
  }

  const bookingRef = adminDb.collection('bookings').doc(bookingId);

  try {
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingSnap.data()!;
    if (booking.orgId !== orgId) {
      return NextResponse.json({ error: 'Booking does not belong to this org' }, { status: 403 });
    }

    if (booking.confirmationEmail?.status === 'sent' && !force) {
      return NextResponse.json({ success: true, skipped: true, reason: 'already_sent' });
    }

    const customerEmail = cleanEmail(booking.customerEmail);
    if (!customerEmail) {
      await bookingRef.update({
        confirmationEmail: {
          status: 'skipped',
          reason: 'missing_customer_email',
          updatedAt: FieldValue.serverTimestamp(),
        },
      });
      return NextResponse.json({ success: true, skipped: true, reason: 'missing_customer_email' });
    }

    const [profileSnap, orgSnap, emailSettingsSnap] = await Promise.all([
      adminDb.collection('business_profiles').doc(orgId).get(),
      adminDb.collection('organizations').doc(orgId).get(),
      adminDb.doc(`email_settings/${orgId}`).get(),
    ]);

    const profile = profileSnap.exists ? profileSnap.data()! : {};
    const org = orgSnap.exists ? orgSnap.data()! : {};
    const smtp = emailSettingsSnap.exists ? emailSettingsSnap.data()?.smtp : null;

    const agencyName = profile.agencyName || org.name || 'Travel Agency';
    const host = smtp?.host || process.env.SMTP_HOST;
    const port = Number(smtp?.port || process.env.SMTP_PORT || 587);
    const secure = smtp?.secure != null ? smtp.secure : process.env.SMTP_SECURE === 'true';
    const user = smtp?.user || process.env.SMTP_USER;
    const pass = smtp?.pass || process.env.SMTP_PASS;
    const fromName = smtp?.fromName || agencyName;
    const replyToEmail = cleanEmail(profile.contactEmail) || cleanEmail(profile.invoiceReplyToEmail);

    if (!host || !user || !pass) {
      await bookingRef.update({
        confirmationEmail: {
          status: 'failed',
          reason: 'smtp_not_configured',
          updatedAt: FieldValue.serverTimestamp(),
        },
      });
      return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 });
    }

    const pax = getPax(booking);
    const netTotal = (Number(booking.totalPrice) || 0) - (Number(booking.discountAmount) || 0);
    const packageTitle = booking.packageTitle || 'your trip';
    const shortBookingId = bookingId.slice(0, 8).toUpperCase();
    const rows = buildRows([
      ['Booking ID', shortBookingId],
      ['Package', packageTitle],
      ['Travel Date', formatTravelDate(booking.travelDate)],
      ['Pax', pax > 0 ? `${pax} ${pax === 1 ? 'person' : 'people'}` : 'To be confirmed'],
      ['Amount', formatAmount(netTotal)],
      ['Status', booking.status || 'Pending'],
    ]);

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#111827;border-radius:16px 16px 0 0;padding:28px 32px;">
          <div style="font-size:22px;font-weight:700;color:#fff;">${escapeHtml(agencyName)}</div>
          <div style="font-size:13px;color:#c7d2fe;margin-top:6px;">Booking confirmation</div>
        </td></tr>
        <tr><td style="background:#fff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
          <div style="font-size:20px;font-weight:700;color:#111827;margin-bottom:10px;">We received your booking</div>
          <div style="font-size:14px;color:#4b5563;line-height:1.7;margin-bottom:24px;">
            Hi <strong>${escapeHtml(booking.customerName || 'there')}</strong>,<br/>
            your booking request for <strong>${escapeHtml(packageTitle)}</strong> has been created. Our team will contact you if any more details are needed.
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;margin-bottom:22px;">
            ${rows}
          </table>
          <div style="font-size:13px;color:#6b7280;line-height:1.6;">
            Please keep this email for your records. If you need to update passenger or travel details, reply to this email or contact the agency directly.
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:18px 32px;text-align:center;">
          <div style="font-size:12px;color:#9ca3af;">Sent by <strong style="color:#4f46e5;">${escapeHtml(agencyName)}</strong></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    const info = await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: customerEmail,
      ...(replyToEmail ? { replyTo: replyToEmail } : {}),
      subject: `Booking received: ${packageTitle} | ${agencyName}`,
      html: emailHtml,
      text: [
        `Hi ${booking.customerName || 'there'},`,
        '',
        `Your booking request for ${packageTitle} has been created.`,
        `Booking ID: ${shortBookingId}`,
        `Travel Date: ${formatTravelDate(booking.travelDate)}`,
        `Pax: ${pax > 0 ? pax : 'To be confirmed'}`,
        `Amount: ${formatAmount(netTotal)}`,
        '',
        `${agencyName}`,
      ].join('\n'),
    });

    await bookingRef.update({
      confirmationEmail: {
        status: 'sent',
        sentAt: FieldValue.serverTimestamp(),
        messageId: info.messageId || null,
        to: customerEmail,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted || [],
      rejected: info.rejected || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Booking confirmation email error:', error);

    try {
      await bookingRef.update({
        confirmationEmail: {
          status: 'failed',
          reason: message,
          updatedAt: FieldValue.serverTimestamp(),
        },
      });
    } catch {
      // Ignore logging update failures.
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
