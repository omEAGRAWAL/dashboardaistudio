import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function buildReminderEmail(params: {
  recipientName: string;
  title: string;
  note: string;
  leadName: string;
  leadPhone: string;
  scheduledAt: Date;
  appUrl: string;
  leadId: string;
}): string {
  const { recipientName, title, note, leadName, leadPhone, scheduledAt, appUrl, leadId } = params;
  const formattedTime = scheduledAt.toLocaleString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:28px 32px;">
            <div style="font-size:28px;margin-bottom:8px;">🔔</div>
            <div style="font-size:20px;font-weight:700;color:#fff;">Reminder</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:2px;">Yatrik CRM</div>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
            <p style="font-size:15px;color:#374151;margin:0 0 24px;">Hi <strong>${recipientName}</strong>, you have a scheduled reminder:</p>
            <div style="background:#f5f3ff;border-left:4px solid #7c3aed;border-radius:4px;padding:16px 20px;margin-bottom:24px;">
              <div style="font-size:17px;font-weight:700;color:#1f2937;margin-bottom:6px;">${title}</div>
              ${note ? `<div style="font-size:13px;color:#6b7280;line-height:1.6;">${note}</div>` : ''}
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:28px;">
              <tr style="background:#f9fafb;">
                <td style="padding:10px 16px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e7eb;">Lead</td>
                <td style="padding:10px 16px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e5e7eb;">Scheduled Time</td>
              </tr>
              <tr>
                <td style="padding:14px 16px;">
                  <div style="font-weight:600;font-size:14px;color:#111827;">${leadName}</div>
                  <div style="font-size:12px;color:#6b7280;margin-top:2px;">${leadPhone}</div>
                </td>
                <td style="padding:14px 16px;font-size:13px;color:#374151;font-weight:500;">${formattedTime}</td>
              </tr>
            </table>
            <div style="text-align:center;">
              <a href="${appUrl}/home?leadId=${leadId}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;">
                View Lead →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
            <div style="font-size:12px;color:#9ca3af;">Powered by <strong style="color:#4f46e5;">Yatrik CRM</strong></div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

async function sendPushToUser(uid: string, title: string, body: string, leadId: string) {
  try {
    const tokensSnap = await adminDb.collection('users').doc(uid).collection('fcmTokens').get();
    if (tokensSnap.empty) return;

    const tokens = tokensSnap.docs.map(d => d.data().token as string).filter(Boolean);
    if (!tokens.length) return;

    const messaging = getMessaging();
    const results = await Promise.allSettled(
      tokens.map(token =>
        messaging.send({
          token,
          notification: { title, body },
          data: { title, body, leadId, url: '/home' },
          webpush: {
            headers: { Urgency: 'high' },
            notification: { title, body, icon: '/favicon.ico', badge: '/favicon.ico', tag: `reminder-${leadId}` },
            fcmOptions: { link: '/home' },
          },
        })
      )
    );

    // Clean up stale tokens
    const staleTokens: string[] = [];
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const code = result.reason?.code || result.reason?.errorInfo?.code || '';
        if (['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument'].includes(code)) {
          staleTokens.push(tokens[i]);
        }
      }
    });
    if (staleTokens.length) {
      const batch = adminDb.batch();
      for (const token of staleTokens) {
        batch.delete(adminDb.collection('users').doc(uid).collection('fcmTokens').doc(token));
      }
      await batch.commit();
    }
  } catch (err) {
    console.error(`[reminder-push] Error for user ${uid}:`, err);
  }
}

export async function POST(req: NextRequest) {
  // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const now = Timestamp.now();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com';

  // Fetch all pending reminders due now
  const snap = await adminDb
    .collection('reminders')
    .where('status', '==', 'pending')
    .where('scheduledAt', '<=', now)
    .limit(50)
    .get();

  if (snap.empty) return NextResponse.json({ processed: 0 });

  let processed = 0;

  for (const reminderDoc of snap.docs) {
    const reminder = reminderDoc.data();

    try {
      // Resolve recipients: empty array means all active agents in the org
      let recipientIds: string[] = reminder.recipientIds ?? [];

      if (recipientIds.length === 0) {
        const usersSnap = await adminDb
          .collection('users')
          .where('orgId', '==', reminder.orgId)
          .where('status', '!=', 'suspended')
          .get();
        recipientIds = usersSnap.docs
          .map(d => d.id)
          .filter(id => {
            const data = usersSnap.docs.find(d => d.id === id)?.data();
            return data?.role !== 'superadmin';
          });
      }

      if (!recipientIds.length) {
        await reminderDoc.ref.update({ status: 'sent', sentAt: FieldValue.serverTimestamp() });
        processed++;
        continue;
      }

      // Fetch recipient user docs
      const userDocs = await Promise.all(recipientIds.map(id => adminDb.doc(`users/${id}`).get()));
      const recipients = userDocs
        .filter(d => d.exists)
        .map(d => ({ uid: d.id, ...d.data() as any }));

      const channels: string[] = reminder.channels ?? ['email', 'push'];
      const scheduledDate: Date = reminder.scheduledAt?.toDate?.() ?? new Date();
      const pushTitle = `🔔 Reminder: ${reminder.title}`;
      const pushBody = `${reminder.leadName} (${reminder.leadPhone})`;

      await Promise.allSettled(
        recipients.map(async (recipient) => {
          // Email
          if (channels.includes('email') && recipient.email && process.env.SMTP_HOST) {
            try {
              const transporter = createTransport();
              await transporter.sendMail({
                from: `"Yatrik CRM" <${process.env.SMTP_USER}>`,
                to: recipient.email,
                subject: `🔔 Reminder: ${reminder.title}`,
                html: buildReminderEmail({
                  recipientName: recipient.displayName || recipient.email.split('@')[0],
                  title: reminder.title,
                  note: reminder.note || '',
                  leadName: reminder.leadName,
                  leadPhone: reminder.leadPhone,
                  scheduledAt: scheduledDate,
                  appUrl,
                  leadId: reminder.leadId,
                }),
              });
            } catch (emailErr) {
              console.error(`[reminder-email] Failed for ${recipient.email}:`, emailErr);
            }
          }

          // Push notification
          if (channels.includes('push')) {
            await sendPushToUser(recipient.uid, pushTitle, pushBody, reminder.leadId);
          }
        })
      );

      await reminderDoc.ref.update({ status: 'sent', sentAt: FieldValue.serverTimestamp() });
      processed++;
    } catch (err) {
      console.error(`[reminder-process] Error for reminder ${reminderDoc.id}:`, err);
    }
  }

  return NextResponse.json({ processed });
}
