import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface Recipient { email: string; name: string; phone?: string }

function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

function concurrencyLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<PromiseSettledResult<T>[]> {
  return new Promise((resolve) => {
    const results: PromiseSettledResult<T>[] = new Array(tasks.length);
    let started = 0, finished = 0;
    const run = () => {
      while (started < tasks.length && started - finished < limit) {
        const idx = started++;
        tasks[idx]().then(
          (v) => { results[idx] = { status: 'fulfilled', value: v }; finished++; if (finished === tasks.length) resolve(results); else run(); },
          (e) => { results[idx] = { status: 'rejected', reason: e }; finished++; if (finished === tasks.length) resolve(results); else run(); },
        );
      }
    };
    run();
  });
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, campaignName, subject, htmlBody, recipients } =
      await req.json() as {
        orgId: string;
        campaignName: string;
        subject: string;
        htmlBody: string;
        recipients: Recipient[];
      };

    if (!orgId || !subject || !htmlBody || !recipients?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch org SMTP settings from Firestore
    const settingsSnap = await adminDb.doc(`email_settings/${orgId}`).get();
    const smtp = settingsSnap.exists ? settingsSnap.data()?.smtp : null;

    const host     = smtp?.host  || process.env.SMTP_HOST;
    const port     = Number(smtp?.port  || process.env.SMTP_PORT  || 587);
    const secure   = smtp?.secure != null ? smtp.secure : process.env.SMTP_SECURE === 'true';
    const user     = smtp?.user  || process.env.SMTP_USER;
    const pass     = smtp?.pass  || process.env.SMTP_PASS;
    const fromName = smtp?.fromName || 'Yatrik CRM';

    if (!host || !user || !pass) {
      return NextResponse.json({ error: 'SMTP not configured. Add SMTP settings in Email Marketing → Settings.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

    // Fetch org name for variable substitution
    const orgSnap = await adminDb.doc(`organizations/${orgId}`).get();
    const agencyName = orgSnap.data()?.name || fromName;

    const tasks = recipients.map((r) => () =>
      transporter.sendMail({
        from: `"${fromName}" <${user}>`,
        to: r.email,
        subject: substitute(subject, { name: r.name, email: r.email, phone: r.phone ?? '', agency: agencyName }),
        html: substitute(htmlBody, { name: r.name, email: r.email, phone: r.phone ?? '', agency: agencyName }),
      })
    );

    const results = await concurrencyLimit(tasks, 5);
    const sentCount   = results.filter((r) => r.status === 'fulfilled').length;
    const failedCount = results.filter((r) => r.status === 'rejected').length;

    // Save campaign record
    await adminDb.collection(`email_campaigns/${orgId}/items`).add({
      name: campaignName || subject,
      subject,
      recipientCount: recipients.length,
      sentCount,
      failedCount,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, sentCount, failedCount });
  } catch (err: unknown) {
    console.error('Email campaign send error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
