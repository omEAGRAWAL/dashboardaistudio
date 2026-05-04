import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { smtp, testEmail } = await req.json();

    if (!testEmail) return NextResponse.json({ error: 'testEmail is required' }, { status: 400 });

    const host  = smtp?.host  || process.env.SMTP_HOST;
    const port  = Number(smtp?.port  || process.env.SMTP_PORT  || 587);
    const secure = smtp?.secure != null ? smtp.secure : process.env.SMTP_SECURE === 'true';
    const user  = smtp?.user  || process.env.SMTP_USER;
    const pass  = smtp?.pass  || process.env.SMTP_PASS;
    const fromName = smtp?.fromName || 'Yatrik CRM';

    if (!host || !user || !pass) {
      return NextResponse.json({ error: 'SMTP credentials not configured' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    await transporter.verify();
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: testEmail,
      subject: 'SMTP Test — Yatrik CRM',
      html: `<p>Your SMTP connection is working correctly. You can now send email campaigns from Yatrik CRM.</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
