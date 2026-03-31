import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getNextAssignee } from '@/lib/round-robin';

type Question = {
  id: string;
  order: number;
  text: string;
  type: 'text' | 'choice';
  choices?: string[];
  fieldMapping: 'name' | 'phone' | 'destination' | 'pax' | 'travelDate' | 'custom';
  customKey?: string;
};

/** Get Twilio client + from number for an org (supports om and agency modes) */
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

async function sendMessage(orgId: string, customerPhone: string, body: string, conversationId: string) {
  const resolved = await getTwilioClient(orgId);
  if (!resolved) return;
  const { client, from } = resolved;

  const msg = await client.messages.create({
    from: `whatsapp:${from}`,
    to: `whatsapp:${customerPhone}`,
    body,
  });

  await adminDb.collection('whatsapp_messages').add({
    orgId,
    conversationId,
    direction: 'outbound',
    body,
    customerPhone,
    sentAt: FieldValue.serverTimestamp(),
    twilioSid: msg.sid,
  });
}

function buildChoiceMessage(question: Question): string {
  const lines = (question.choices || []).map((c, i) => `${i + 1}. ${c}`).join('\n');
  return `${question.text}\n\n${lines}\n\n(Reply with the number or text of your choice)`;
}

function getResponseKey(question: Question, step: number): string {
  if (question.fieldMapping === 'custom') return question.customKey || `extra_${step}`;
  return question.fieldMapping;
}

export async function GET() {
  return NextResponse.json({ status: 'WhatsApp webhook active' });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = ((formData.get('Body') as string) || '').trim();

    if (!from || !to) return new NextResponse('', { status: 200 });

    const customerPhone = from.replace('whatsapp:', '');
    const agencyPhone = to.replace('whatsapp:', '');

    // Find orgId by agency phone number
    const numbersSnap = await adminDb
      .collection('whatsapp_numbers')
      .where('phoneNumber', '==', agencyPhone)
      .limit(1)
      .get();

    if (numbersSnap.empty) {
      console.error('[WA Webhook] No org found for phone:', agencyPhone);
      return new NextResponse('', { status: 200 });
    }
    const orgId = numbersSnap.docs[0].id;
    const conversationId = `${orgId}_${customerPhone.replace('+', '')}`;

    // Log inbound message
    await adminDb.collection('whatsapp_messages').add({
      orgId,
      conversationId,
      direction: 'inbound',
      body,
      customerPhone,
      sentAt: FieldValue.serverTimestamp(),
    });

    // Load chatbot flow
    const flowDoc = await adminDb.doc(`chatbot_flows/${orgId}`).get();
    if (!flowDoc.exists) return new NextResponse('', { status: 200 });

    const flow = flowDoc.data()!;
    const questions: Question[] = (flow.questions || []).sort(
      (a: Question, b: Question) => a.order - b.order
    );

    // Load or create conversation
    const convRef = adminDb.doc(`conversations/${conversationId}`);
    const convDoc = await convRef.get();
    const existingConv = convDoc.exists ? convDoc.data()! : null;

    if (!existingConv || existingConv.status === 'completed') {
      // Start fresh conversation
      const orgDoc = await adminDb.doc(`organizations/${orgId}`).get();
      const orgName = orgDoc.exists ? orgDoc.data()!.name : 'us';
      const greeting = (flow.greetingMessage || `Hi! Welcome to ${orgName}. I have a few quick questions to help you better.`)
        .replace('{orgName}', orgName);

      await convRef.set({
        orgId,
        customerPhone,
        currentStep: 0,
        responses: {},
        status: 'active',
        startedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      await sendMessage(orgId, customerPhone, greeting, conversationId);

      if (questions.length > 0) {
        const firstQ = questions[0];
        await sendMessage(
          orgId, customerPhone,
          firstQ.type === 'choice' ? buildChoiceMessage(firstQ) : firstQ.text,
          conversationId
        );
      } else {
        await convRef.update({ status: 'completed', updatedAt: FieldValue.serverTimestamp() });
      }
      return new NextResponse('', { status: 200 });
    }

    if (existingConv.status !== 'active') return new NextResponse('', { status: 200 });

    const currentStep: number = existingConv.currentStep ?? 0;
    if (currentStep >= questions.length) return new NextResponse('', { status: 200 });

    const currentQuestion = questions[currentStep];
    const responses: Record<string, string> = { ...(existingConv.responses || {}) };

    // Validate and store answer
    if (currentQuestion.type === 'choice') {
      const choices = currentQuestion.choices || [];
      const numAnswer = parseInt(body, 10);
      let matched = '';
      if (!isNaN(numAnswer) && numAnswer >= 1 && numAnswer <= choices.length) {
        matched = choices[numAnswer - 1];
      } else {
        matched = choices.find((c) => c.toLowerCase() === body.toLowerCase()) || '';
      }
      if (!matched) {
        await sendMessage(
          orgId, customerPhone,
          `Please choose a valid option:\n\n${choices.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
          conversationId
        );
        return new NextResponse('', { status: 200 });
      }
      responses[getResponseKey(currentQuestion, currentStep)] = matched;
    } else {
      responses[getResponseKey(currentQuestion, currentStep)] = body;
    }

    const nextStep = currentStep + 1;

    if (nextStep >= questions.length) {
      // All done — create lead
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
        (k) => !['name', 'phone', 'pax', 'travelDate', 'destination'].includes(k)
      );
      customKeys.forEach((k) => remarkParts.push(`${k}: ${responses[k]}`));
      if (remarkParts.length > 0) leadData.latestRemark = remarkParts.join(' | ');

      const leadRef = await adminDb.collection('leads').add(leadData);

      const completionMsg = flow.completionMessage || 'Thank you! Our team will reach out to you shortly.';
      await sendMessage(orgId, customerPhone, completionMsg, conversationId);

      await convRef.update({
        currentStep: nextStep,
        responses,
        status: 'completed',
        leadId: leadRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      const nextQuestion = questions[nextStep];
      await sendMessage(
        orgId, customerPhone,
        nextQuestion.type === 'choice' ? buildChoiceMessage(nextQuestion) : nextQuestion.text,
        conversationId
      );
      await convRef.update({
        currentStep: nextStep,
        responses,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return new NextResponse('', { status: 200 });
  } catch (err: any) {
    console.error('[WA Webhook] Error:', err);
    return new NextResponse('', { status: 200 });
  }
}
