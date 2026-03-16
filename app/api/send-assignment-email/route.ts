import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',   // true for port 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface LeadInfo {
  name: string;
  phone: string;
  status: string;
  travelDate?: string;
  pax?: number;
  category?: string;
  source?: string;
}

const STATUS_COLORS: Record<string, string> = {
  "New Enquiry": "#3b82f6", "Call Not Picked": "#94a3b8", "Call me later": "#f59e0b",
  "Contacted": "#0ea5e9", "Qualified": "#22c55e", "Negotiating": "#f97316",
  "Awaiting Payment": "#8b5cf6", "Booked": "#10b981", "Lost & Closed": "#ef4444",
  "Future Prospect": "#6366f1", "Just Checking": "#f472b6",
};

function buildEmailHtml(params: {
  assigneeName: string;
  assignedByName: string;
  orgName: string;
  leads: LeadInfo[];
  appUrl: string;
}): string {
  const { assigneeName, assignedByName, orgName, leads, appUrl } = params;
  const count = leads.length;
  const isMultiple = count > 1;

  const leadsHtml = leads.map(lead => {
    const statusColor = STATUS_COLORS[lead.status] ?? '#6b7280';
    return `
      <tr>
        <td style="padding:12px 16px; border-bottom:1px solid #f3f4f6;">
          <div style="font-weight:600; font-size:14px; color:#111827; margin-bottom:2px;">${lead.name}</div>
          <div style="font-size:12px; color:#6b7280;">${lead.phone}</div>
        </td>
        <td style="padding:12px 16px; border-bottom:1px solid #f3f4f6; text-align:center;">
          <span style="display:inline-block; background:${statusColor}22; color:${statusColor}; border:1px solid ${statusColor}44; border-radius:20px; padding:3px 10px; font-size:11px; font-weight:700; white-space:nowrap;">
            ${lead.status}
          </span>
        </td>
        <td style="padding:12px 16px; border-bottom:1px solid #f3f4f6; font-size:12px; color:#6b7280; text-align:center;">
          ${lead.travelDate || '—'}
        </td>
        <td style="padding:12px 16px; border-bottom:1px solid #f3f4f6; font-size:12px; color:#6b7280; text-align:center;">
          ${lead.pax ?? 1} pax
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Lead${isMultiple ? 's' : ''} Assigned</title>
</head>
<body style="margin:0; padding:0; background:#f9fafb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed); border-radius:16px 16px 0 0; padding:32px 32px 28px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:40px; height:40px; background:rgba(255,255,255,0.2); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px;">🧳</div>
                <div>
                  <div style="font-size:22px; font-weight:700; color:#fff;">${orgName}</div>
                  <div style="font-size:13px; color:rgba(255,255,255,0.7); margin-top:2px;">CRM Notification</div>
                </div>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff; padding:32px; border-left:1px solid #e5e7eb; border-right:1px solid #e5e7eb;">

              <div style="font-size:24px; font-weight:700; color:#111827; margin-bottom:8px;">
                ${count} Lead${isMultiple ? 's' : ''} Assigned to You
              </div>
              <div style="font-size:14px; color:#6b7280; margin-bottom:28px; line-height:1.6;">
                Hi <strong style="color:#374151;">${assigneeName}</strong>,
                <strong style="color:#374151;">${assignedByName}</strong> has assigned
                ${isMultiple ? `<strong style="color:#4f46e5;">${count} leads</strong>` : 'a new lead'} to you in ${orgName}.
                ${isMultiple ? 'Please review them and follow up promptly.' : 'Please follow up as soon as possible.'}
              </div>

              <!-- Leads table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
                <thead>
                  <tr style="background:#f9fafb;">
                    <th style="padding:10px 16px; text-align:left; font-size:11px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em;">Lead</th>
                    <th style="padding:10px 16px; text-align:center; font-size:11px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em;">Status</th>
                    <th style="padding:10px 16px; text-align:center; font-size:11px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em;">Travel Date</th>
                    <th style="padding:10px 16px; text-align:center; font-size:11px; font-weight:600; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em;">Group</th>
                  </tr>
                </thead>
                <tbody>${leadsHtml}</tbody>
              </table>

              <!-- CTA -->
              <div style="margin-top:28px; text-align:center;">
                <a href="${appUrl}" style="display:inline-block; background:#4f46e5; color:#fff; text-decoration:none; padding:12px 28px; border-radius:10px; font-size:14px; font-weight:600; letter-spacing:0.01em;">
                  Open CRM Dashboard →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 16px 16px; padding:20px 32px; text-align:center;">
              <div style="font-size:12px; color:#9ca3af; line-height:1.6;">
                You're receiving this because you were assigned lead${isMultiple ? 's' : ''} in <strong>${orgName}</strong> CRM.<br/>
                Powered by <strong style="color:#4f46e5;">Travlyy</strong>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      assigneeEmail,
      assigneeName,
      assignedByName,
      orgName,
      leads,
    }: {
      assigneeEmail: string;
      assigneeName: string;
      assignedByName: string;
      orgName: string;
      leads: LeadInfo[];
    } = body;

    if (!assigneeEmail || !leads?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ error: 'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env.local' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://yourapp.com';
    const count = leads.length;
    const subject = count === 1
      ? `New lead assigned to you: ${leads[0].name}`
      : `${count} leads assigned to you — ${orgName}`;

    const html = buildEmailHtml({
      assigneeName: assigneeName || assigneeEmail.split('@')[0],
      assignedByName: assignedByName || 'Your manager',
      orgName: orgName || 'Travlyy CRM',
      leads,
      appUrl,
    });

    const transporter = createTransport();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${orgName || 'Travlyy CRM'}" <${process.env.SMTP_USER}>`,
      to: assigneeEmail,
      subject,
      html,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error('Email send error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
