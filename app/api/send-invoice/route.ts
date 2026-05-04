import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { generateInvoicePdfBuffer } from '@/lib/invoice-pdf-server';
import type { InvoiceBooking, BusinessProfile } from '@/lib/invoice-template';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      booking,
      profile,
      invoiceNumber,
    }: { booking: InvoiceBooking; profile: BusinessProfile; invoiceNumber: number } = body;

    if (!booking?.customerEmail) {
      return NextResponse.json({ error: 'Missing booking.customerEmail' }, { status: 400 });
    }
    if (!booking || !profile || !invoiceNumber) {
      return NextResponse.json({ error: 'Missing booking, profile, or invoiceNumber' }, { status: 400 });
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in environment variables.' },
        { status: 500 },
      );
    }

    const agencyName   = profile.agencyName || 'Travel Agency';
    const packageTitle = booking.packageTitle || 'Booking';
    const subject      = `Invoice #${invoiceNumber} — ${packageTitle} | ${agencyName}`;

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:32px;">
          <div style="font-size:22px;font-weight:700;color:#fff;">${agencyName}</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">Invoice Notification</div>
        </td></tr>
        <tr><td style="background:#fff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
          <div style="font-size:20px;font-weight:700;color:#111827;margin-bottom:8px;">Invoice #${invoiceNumber}</div>
          <div style="font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:24px;">
            Hi <strong style="color:#374151;">${booking.customerName || 'Customer'}</strong>,<br/>
            Please find your invoice for <strong style="color:#4f46e5;">${packageTitle}</strong> attached as a PDF.
          </div>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:24px;">
            <div style="font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;margin-bottom:8px;">Invoice Details</div>
            <div style="font-size:14px;color:#374151;margin-bottom:4px;">Invoice #${invoiceNumber}</div>
            <div style="font-size:14px;color:#374151;margin-bottom:4px;">${packageTitle}</div>
            <div style="font-size:14px;color:#374151;">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
          <div style="font-size:13px;color:#9ca3af;">The full invoice is attached as a PDF file to this email.</div>
        </td></tr>
        <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
          <div style="font-size:12px;color:#9ca3af;">Sent by <strong style="color:#4f46e5;">${agencyName}</strong></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

    const pdfBuffer = await generateInvoicePdfBuffer(booking, profile, invoiceNumber);

    const transporter = createTransport();
    const info = await transporter.sendMail({
      from: `"${agencyName}" <${process.env.SMTP_USER}>`,
      to: booking.customerEmail,
      subject,
      html: emailHtml,
      attachments: [
        {
          filename: `Invoice-${invoiceNumber}-${packageTitle.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Invoice email send error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
