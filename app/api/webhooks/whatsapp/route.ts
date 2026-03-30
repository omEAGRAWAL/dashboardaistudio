import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/firebase';
import {
  doc, getDoc, setDoc, addDoc, collection,
  query, where, getDocs, serverTimestamp,
} from 'firebase/firestore';

type Question = {
  id: string;
  order: number;
  text: string;
  type: 'text' | 'choice';
  choices?: string[];
  fieldMapping: 'name' | 'phone' | 'destination' | 'pax' | 'travelDate' | 'custom';
  customKey?: string;
};

async function sendMessage(orgId: string, customerPhone: string, body: string, conversationId: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const client = twilio(accountSid, authToken);

  const numDoc = await getDoc(doc(db, 'whatsapp_numbers', orgId));
  if (!numDoc.exists()) return;
  const { phoneNumber } = numDoc.data();

  const message = await client.messages.create({
    from: `whatsapp:${phoneNumber}`,
    to: `whatsapp:${customerPhone}`,
    body,
  });

  await addDoc(collection(db, 'whatsapp_messages'), {
    orgId,
    conversationId,
    direction: 'outbound',
    body,
    customerPhone,
    sentAt: serverTimestamp(),
    twilioSid: message.sid,
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
    // Twilio sends form-encoded body
    const formData = await req.formData();
    const from = formData.get('From') as string; // whatsapp:+91xxxxxxxxxx
    const to = formData.get('To') as string;     // whatsapp:+91xxxxxxxxxx (agency number)
    const body = ((formData.get('Body') as string) || '').trim();

    if (!from || !to) {
      return new NextResponse('', { status: 200 });
    }

    const customerPhone = from.replace('whatsapp:', '');
    const agencyPhone = to.replace('whatsapp:', '');

    // Find orgId by agency phone number
    const q = query(collection(db, 'whatsapp_numbers'), where('phoneNumber', '==', agencyPhone));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.error('[WA Webhook] No org found for phone:', agencyPhone);
      return new NextResponse('', { status: 200 });
    }
    const orgId = snap.docs[0].id;

    const conversationId = `${orgId}_${customerPhone.replace('+', '')}`;

    // Log inbound message
    await addDoc(collection(db, 'whatsapp_messages'), {
      orgId,
      conversationId,
      direction: 'inbound',
      body,
      customerPhone,
      sentAt: serverTimestamp(),
    });

    // Load chatbot flow
    const flowDoc = await getDoc(doc(db, 'chatbot_flows', orgId));
    if (!flowDoc.exists()) {
      // No flow configured — messages visible in inbox for manual replies
      return new NextResponse('', { status: 200 });
    }
    const flow = flowDoc.data();
    const questions: Question[] = (flow.questions || []).sort(
      (a: Question, b: Question) => a.order - b.order
    );

    // Load or create conversation
    const convRef = doc(db, 'conversations', conversationId);
    const convDoc = await getDoc(convRef);
    const existingConv = convDoc.exists() ? convDoc.data() : null;

    // Start fresh if no conversation or previous one is completed
    if (!existingConv || existingConv.status === 'completed') {
      const orgDoc = await getDoc(doc(db, 'organizations', orgId));
      const orgName = orgDoc.exists() ? orgDoc.data().name : 'us';
      const greeting = (flow.greetingMessage || `Hi! Welcome to ${orgName}. I have a few quick questions to help you better.`)
        .replace('{orgName}', orgName);

      await setDoc(convRef, {
        orgId,
        customerPhone,
        currentStep: 0,
        responses: {},
        status: 'active',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
        // No questions — mark completed immediately
        await setDoc(convRef, { status: 'completed', updatedAt: serverTimestamp() }, { merge: true });
      }
      return new NextResponse('', { status: 200 });
    }

    if (existingConv.status !== 'active') {
      return new NextResponse('', { status: 200 });
    }

    const currentStep: number = existingConv.currentStep ?? 0;
    if (currentStep >= questions.length) {
      return new NextResponse('', { status: 200 });
    }

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
      // All questions done — create lead
      const leadData: Record<string, any> = {
        orgId,
        name: responses.name || `Customer ${customerPhone}`,
        phone: responses.phone || customerPhone,
        source: 'WhatsApp Bot',
        status: 'New Enquiry',
        category: 'None',
        pax: responses.pax ? Number(responses.pax) : 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (responses.travelDate) leadData.travelDate = responses.travelDate;

      // Build remark from destination + any custom fields
      const remarkParts: string[] = [];
      if (responses.destination) remarkParts.push(`Destination: ${responses.destination}`);
      const customKeys = Object.keys(responses).filter(
        (k) => !['name', 'phone', 'pax', 'travelDate', 'destination'].includes(k)
      );
      customKeys.forEach((k) => remarkParts.push(`${k}: ${responses[k]}`));
      if (remarkParts.length > 0) leadData.latestRemark = remarkParts.join(' | ');

      const leadRef = await addDoc(collection(db, 'leads'), leadData);

      const completionMsg = flow.completionMessage || 'Thank you! Our team will reach out to you shortly.';
      await sendMessage(orgId, customerPhone, completionMsg, conversationId);

      await setDoc(convRef, {
        ...existingConv,
        currentStep: nextStep,
        responses,
        status: 'completed',
        leadId: leadRef.id,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Send next question
      const nextQuestion = questions[nextStep];
      await sendMessage(
        orgId, customerPhone,
        nextQuestion.type === 'choice' ? buildChoiceMessage(nextQuestion) : nextQuestion.text,
        conversationId
      );

      await setDoc(convRef, {
        ...existingConv,
        currentStep: nextStep,
        responses,
        updatedAt: serverTimestamp(),
      });
    }

    return new NextResponse('', { status: 200 });
  } catch (err: any) {
    console.error('[WA Webhook] Error:', err);
    // Always return 200 to Twilio so it doesn't retry
    return new NextResponse('', { status: 200 });
  }
}
