import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getNextAssignee } from '@/lib/round-robin';
import {
  getMetaCreds,
  sendText,
  sendChoiceQuestion,
  markRead,
  extractMetaMessage,
  type MetaCreds,
} from '@/lib/meta-whatsapp';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Question = {
  id: string;
  order: number;
  text: string;
  type: 'text' | 'choice';
  choices?: string[];
  fieldMapping: 'name' | 'phone' | 'destination' | 'pax' | 'travelDate' | 'custom';
  customKey?: string;
};

// ─────────────────────────────────────────────────────────────
// GET — Meta webhook verification
// ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// ─────────────────────────────────────────────────────────────
// POST — route to Meta or Twilio handler based on Content-Type
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    return handleMetaWebhook(req);
  }
  return handleTwilioWebhook(req);
}

// ─────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────

function getResponseKey(question: Question, step: number): string {
  if (question.fieldMapping === 'custom') return question.customKey || `extra_${step}`;
  return question.fieldMapping;
}

async function logMessage(
  orgId: string,
  conversationId: string,
  direction: 'inbound' | 'outbound',
  body: string,
  customerPhone: string,
  extra?: Record<string, string>,
) {
  await adminDb.collection('whatsapp_messages').add({
    orgId,
    conversationId,
    direction,
    body,
    customerPhone,
    sentAt: FieldValue.serverTimestamp(),
    ...extra,
  });
}

async function createLead(
  orgId: string,
  responses: Record<string, string>,
  customerPhone: string,
) {
  const assigneeId = await getNextAssignee(orgId);
  const leadData: Record<string, any> = {
    orgId,
    name: responses.name || `Customer ${customerPhone}`,
    phone: responses.phone || customerPhone,
    source: 'WhatsApp Bot',
    status: 'New Enquiry',
    category: 'None',
    pax: responses.pax ? Number(responses.pax) : 1,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (assigneeId) leadData.assigneeId = assigneeId;
  if (responses.travelDate) leadData.travelDate = responses.travelDate;

  const remarkParts: string[] = [];
  if (responses.destination) remarkParts.push(`Destination: ${responses.destination}`);
  const customKeys = Object.keys(responses).filter(
    (k) => !['name', 'phone', 'pax', 'travelDate', 'destination'].includes(k),
  );
  customKeys.forEach((k) => remarkParts.push(`${k}: ${responses[k]}`));
  if (remarkParts.length > 0) leadData.latestRemark = remarkParts.join(' | ');

  const ref = await adminDb.collection('leads').add(leadData);
  return ref.id;
}

// ─────────────────────────────────────────────────────────────
// META HANDLER
// ─────────────────────────────────────────────────────────────

async function handleMetaWebhook(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new NextResponse('', { status: 200 });
  }

  // Meta sends status updates (delivery receipts) — ignore them
  const change = payload?.entry?.[0]?.changes?.[0];
  if (!change || change.field !== 'messages') return new NextResponse('', { status: 200 });

  const value = change.value;
  const messages: any[] = value?.messages ?? [];
  if (messages.length === 0) return new NextResponse('', { status: 200 });

  const message = messages[0];
  const phoneNumberId: string = value?.metadata?.phone_number_id ?? '';
  const customerPhone: string = message.from ?? '';

  if (!phoneNumberId || !customerPhone) return new NextResponse('', { status: 200 });

  // Look up org by Meta phoneNumberId
  const numbersSnap = await adminDb
    .collection('whatsapp_numbers')
    .where('phoneNumberId', '==', phoneNumberId)
    .limit(1)
    .get();

  if (numbersSnap.empty) {
    console.error('[Meta WA] No org found for phoneNumberId:', phoneNumberId);
    return new NextResponse('', { status: 200 });
  }

  const orgId = numbersSnap.docs[0].id;
  const conversationId = `${orgId}_${customerPhone.replace('+', '')}`;

  // Resolve Meta credentials for sending
  const creds = await getMetaCreds(orgId);
  if (!creds) {
    console.error('[Meta WA] No Meta credentials for org:', orgId);
    return new NextResponse('', { status: 200 });
  }

  // Mark message as read (blue ticks)
  markRead(creds, message.id).catch(() => {});

  // Extract text body + choice index from any message type
  const { body, choiceIndex } = extractMetaMessage(message);

  // Ignore non-actionable message types (image, video, audio sent by customer etc.)
  if (!body && choiceIndex === null) return new NextResponse('', { status: 200 });

  await logMessage(orgId, conversationId, 'inbound', body || `[interactive: idx_${choiceIndex}]`, customerPhone);

  await runChatbotFlow({
    orgId,
    conversationId,
    customerPhone,
    body,
    choiceIndex,
    send: {
      text: (text: string) => sendAndLog(creds, orgId, customerPhone, text, conversationId),
      question: (q: Question) => sendQuestionAndLog(creds, orgId, customerPhone, q, conversationId),
      invalidChoice: (choices: string[]) =>
        sendAndLog(
          creds, orgId, customerPhone,
          choices.length <= 3
            ? 'Please tap one of the options above.'
            : 'Please select a valid option from the list.',
          conversationId,
        ),
    },
  });

  return new NextResponse('', { status: 200 });
}

async function sendAndLog(
  creds: MetaCreds,
  orgId: string,
  customerPhone: string,
  text: string,
  conversationId: string,
) {
  const res = await sendText(creds, customerPhone, text);
  await logMessage(orgId, conversationId, 'outbound', text, customerPhone, {
    metaMessageId: res?.messages?.[0]?.id ?? '',
  });
}

async function sendQuestionAndLog(
  creds: MetaCreds,
  orgId: string,
  customerPhone: string,
  question: Question,
  conversationId: string,
) {
  const res = await sendChoiceQuestion(creds, customerPhone, question);
  const displayText =
    question.type === 'choice'
      ? `${question.text} [choices: ${(question.choices ?? []).join(', ')}]`
      : question.text;
  await logMessage(orgId, conversationId, 'outbound', displayText, customerPhone, {
    metaMessageId: res?.messages?.[0]?.id ?? '',
  });
}

// ─────────────────────────────────────────────────────────────
// TWILIO HANDLER (legacy — unchanged logic, supports 'om' + 'agency' sources)
// ─────────────────────────────────────────────────────────────

async function handleTwilioWebhook(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = ((formData.get('Body') as string) || '').trim();

    if (!from || !to) return new NextResponse('', { status: 200 });

    const customerPhone = from.replace('whatsapp:', '');
    const agencyPhone = to.replace('whatsapp:', '');

    const numbersSnap = await adminDb
      .collection('whatsapp_numbers')
      .where('phoneNumber', '==', agencyPhone)
      .limit(1)
      .get();

    if (numbersSnap.empty) return new NextResponse('', { status: 200 });

    const orgId = numbersSnap.docs[0].id;
    const conversationId = `${orgId}_${customerPhone.replace('+', '')}`;

    await logMessage(orgId, conversationId, 'inbound', body, customerPhone);

    const twilioClient = await getTwilioClient(orgId);
    if (!twilioClient) return new NextResponse('', { status: 200 });

    await runChatbotFlow({
      orgId,
      conversationId,
      customerPhone,
      body,
      choiceIndex: null,
      send: {
        text: async (text: string) => {
          const msg = await twilioClient.client.messages.create({
            from: `whatsapp:${twilioClient.from}`,
            to: `whatsapp:${customerPhone}`,
            body: text,
          });
          await logMessage(orgId, conversationId, 'outbound', text, customerPhone, {
            twilioSid: msg.sid,
          });
        },
        question: async (q: Question) => {
          const text =
            q.type === 'choice'
              ? buildTwilioChoiceMessage(q)
              : q.text;
          const msg = await twilioClient.client.messages.create({
            from: `whatsapp:${twilioClient.from}`,
            to: `whatsapp:${customerPhone}`,
            body: text,
          });
          await logMessage(orgId, conversationId, 'outbound', text, customerPhone, {
            twilioSid: msg.sid,
          });
        },
        invalidChoice: async (choices: string[]) => {
          const text = `Please choose a valid option:\n\n${choices.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
          const msg = await twilioClient.client.messages.create({
            from: `whatsapp:${twilioClient.from}`,
            to: `whatsapp:${customerPhone}`,
            body: text,
          });
          await logMessage(orgId, conversationId, 'outbound', text, customerPhone, {
            twilioSid: msg.sid,
          });
        },
      },
    });

    return new NextResponse('', { status: 200 });
  } catch (err: any) {
    console.error('[Twilio WA Webhook]', err);
    return new NextResponse('', { status: 200 });
  }
}

function buildTwilioChoiceMessage(question: Question): string {
  const lines = (question.choices || []).map((c, i) => `${i + 1}. ${c}`).join('\n');
  return `${question.text}\n\n${lines}\n\n(Reply with the number or text of your choice)`;
}

async function getTwilioClient(orgId: string) {
  const numDoc = await adminDb.doc(`whatsapp_numbers/${orgId}`).get();
  if (!numDoc.exists) return null;
  const { phoneNumber, source } = numDoc.data()!;

  if (source === 'agency') {
    const credDoc = await adminDb.doc(`whatsapp_credentials/${orgId}`).get();
    if (!credDoc.exists) return null;
    const { accountSid, authToken } = credDoc.data()!;
    return { client: twilio(accountSid, authToken), from: phoneNumber };
  }

  return {
    client: twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!),
    from: phoneNumber,
  };
}

// ─────────────────────────────────────────────────────────────
// SHARED CHATBOT FLOW ENGINE
// ─────────────────────────────────────────────────────────────

interface SendAdapter {
  text: (text: string) => Promise<void>;
  question: (q: Question) => Promise<void>;
  invalidChoice: (choices: string[]) => Promise<void>;
}

async function runChatbotFlow({
  orgId,
  conversationId,
  customerPhone,
  body,
  choiceIndex,
  send,
}: {
  orgId: string;
  conversationId: string;
  customerPhone: string;
  body: string;
  choiceIndex: number | null;
  send: SendAdapter;
}) {
  const flowDoc = await adminDb.doc(`chatbot_flows/${orgId}`).get();
  if (!flowDoc.exists) return;

  const flow = flowDoc.data()!;
  const questions: Question[] = (flow.questions || []).sort(
    (a: Question, b: Question) => a.order - b.order,
  );

  const convRef = adminDb.doc(`conversations/${conversationId}`);
  const convDoc = await convRef.get();
  const existingConv = convDoc.exists ? convDoc.data()! : null;

  // ── New or completed → start fresh ──
  if (!existingConv || existingConv.status === 'completed') {
    const orgDoc = await adminDb.doc(`organizations/${orgId}`).get();
    const orgName = orgDoc.exists ? orgDoc.data()!.name : 'us';
    const greeting = (
      flow.greetingMessage ||
      `Hi! Welcome to ${orgName}. I have a few quick questions to help you better.`
    ).replace('{orgName}', orgName);

    await convRef.set({
      orgId,
      customerPhone,
      currentStep: 0,
      responses: {},
      status: 'active',
      startedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await send.text(greeting);

    if (questions.length > 0) {
      await send.question(questions[0]);
    } else {
      await convRef.update({ status: 'completed', updatedAt: FieldValue.serverTimestamp() });
    }
    return;
  }

  if (existingConv.status !== 'active') return;

  const currentStep: number = existingConv.currentStep ?? 0;
  if (currentStep >= questions.length) return;

  const currentQuestion = questions[currentStep];
  const responses: Record<string, string> = { ...(existingConv.responses || {}) };

  // ── Validate and store answer ──
  if (currentQuestion.type === 'choice') {
    const choices = currentQuestion.choices ?? [];
    let matched = '';

    if (choiceIndex !== null && choiceIndex >= 0 && choiceIndex < choices.length) {
      // Interactive reply — index is reliable
      matched = choices[choiceIndex];
    } else {
      // Text fallback — try number then text match
      const numAnswer = parseInt(body, 10);
      if (!isNaN(numAnswer) && numAnswer >= 1 && numAnswer <= choices.length) {
        matched = choices[numAnswer - 1];
      } else {
        matched = choices.find((c) => c.toLowerCase() === body.toLowerCase()) || '';
      }
    }

    if (!matched) {
      await send.invalidChoice(choices);
      return;
    }

    responses[getResponseKey(currentQuestion, currentStep)] = matched;
  } else {
    if (!body) return; // ignore empty text messages for open questions
    responses[getResponseKey(currentQuestion, currentStep)] = body;
  }

  const nextStep = currentStep + 1;

  if (nextStep >= questions.length) {
    // ── All questions answered → create lead ──
    const leadId = await createLead(orgId, responses, customerPhone);
    const completionMsg =
      flow.completionMessage || 'Thank you! Our team will reach out to you shortly. ✅';
    await send.text(completionMsg);
    await convRef.update({
      currentStep: nextStep,
      responses,
      status: 'completed',
      leadId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    // ── Send next question ──
    await send.question(questions[nextStep]);
    await convRef.update({
      currentStep: nextStep,
      responses,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}
