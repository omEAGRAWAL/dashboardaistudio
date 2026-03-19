import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

type NotificationType = 'invited' | 'role_changed' | 'removed';

function buildEmailHtml(params: {
  targetName: string;
  orgName: string;
  type: NotificationType;
  newRole?: string;
  changedByName: string;
  appUrl: string;
  inviteRole?: string;
}): { subject: string; html: string } {
  const { targetName, orgName, type, newRole, changedByName, appUrl, inviteRole } = params;

  const roleLabel = (r?: string) => (r === 'org_admin' ? 'Admin' : 'Agent');

  const configs: Record<NotificationType, { subject: string; headline: string; body: string; ctaLabel: string; accentColor: string }> = {
    invited: {
      subject: `You've been invited to join ${orgName}`,
      headline: `You're invited to ${orgName}`,
      body: `<strong>${changedByName}</strong> has invited you to join <strong>${orgName}</strong> as a <strong>${roleLabel(inviteRole)}</strong>. Sign in with your Google account to accept the invite and access the CRM.`,
      ctaLabel: 'Accept Invite & Sign In →',
      accentColor: '#10b981',
    },
    role_changed: {
      subject: `Your role in ${orgName} has been updated`,
      headline: 'Your role has been updated',
      body: `<strong>${changedByName}</strong> has changed your role in <strong>${orgName}</strong> to <strong>${roleLabel(newRole)}</strong>. This change is effective immediately — please refresh the app if you're currently logged in.`,
      ctaLabel: 'Open CRM Dashboard →',
      accentColor: '#6366f1',
    },
    removed: {
      subject: `Your access to ${orgName} has been revoked`,
      headline: 'Access Revoked',
      body: `<strong>${changedByName}</strong> has removed you from <strong>${orgName}</strong>. You no longer have access to the CRM. If you believe this was a mistake, please contact your administrator.`,
      ctaLabel: 'Contact Support →',
      accentColor: '#ef4444',
    },
  };

  const { subject, headline, body, ctaLabel, accentColor } = configs[type];

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background:#f9fafb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${accentColor}; border-radius:16px 16px 0 0; padding:32px 32px 28px;">
              <div style="font-size:22px; font-weight:700; color:#fff;">${orgName}</div>
              <div style="font-size:13px; color:rgba(255,255,255,0.75); margin-top:4px;">CRM Notification</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff; padding:32px; border-left:1px solid #e5e7eb; border-right:1px solid #e5e7eb;">
              <div style="font-size:22px; font-weight:700; color:#111827; margin-bottom:12px;">${headline}</div>
              <div style="font-size:14px; color:#6b7280; line-height:1.7; margin-bottom:28px;">
                Hi <strong style="color:#374151;">${targetName}</strong>,<br/><br/>
                ${body}
              </div>
              <div style="text-align:center;">
                <a href="${appUrl}" style="display:inline-block; background:${accentColor}; color:#fff; text-decoration:none; padding:12px 28px; border-radius:10px; font-size:14px; font-weight:600;">
                  ${ctaLabel}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 16px 16px; padding:20px 32px; text-align:center;">
              <div style="font-size:12px; color:#9ca3af; line-height:1.6;">
                This is an automated notification from <strong>${orgName}</strong> CRM.<br/>
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

  return { subject, html };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      targetEmail,
      targetName,
      orgName,
      type,
      newRole,
      inviteRole,
      changedByName,
    }: {
      targetEmail: string;
      targetName: string;
      orgName: string;
      type: NotificationType;
      newRole?: string;
      inviteRole?: string;
      changedByName: string;
    } = body;

    if (!targetEmail || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://travelycrm.reviu.store';
    const { subject, html } = buildEmailHtml({
      targetName: targetName || targetEmail.split('@')[0],
      orgName: orgName || 'Travlyy CRM',
      type,
      newRole,
      inviteRole,
      changedByName: changedByName || 'Your administrator',
      appUrl,
    });

    const transporter = createTransport();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${orgName || 'Travlyy CRM'}" <${process.env.SMTP_USER}>`,
      to: targetEmail,
      subject,
      html,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error('Role notification email error:', err);
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 });
  }
}
