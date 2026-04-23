import { adminDb } from '@/lib/firebase-admin';

const META_VER = 'v19.0';
const META_BASE = `https://graph.facebook.com/${META_VER}`;

export interface MetaCreds {
  phoneNumberId: string;
  accessToken: string;
}

/** Resolve Meta Cloud API credentials for an org */
export async function getMetaCreds(orgId: string): Promise<MetaCreds | null> {
  const numDoc = await adminDb.doc(`whatsapp_numbers/${orgId}`).get();
  if (!numDoc.exists) return null;
  const { source, phoneNumberId } = numDoc.data()!;

  if (source === 'meta') {
    const token = process.env.META_WHATSAPP_TOKEN;
    if (!token || !phoneNumberId) return null;
    return { phoneNumberId, accessToken: token };
  }

  if (source === 'meta_agency') {
    const credDoc = await adminDb.doc(`whatsapp_credentials/${orgId}`).get();
    if (!credDoc.exists) return null;
    const { accessToken, phoneNumberId: credPnId } = credDoc.data()!;
    return { phoneNumberId: credPnId ?? phoneNumberId, accessToken };
  }

  return null;
}

async function metaPost(phoneNumberId: string, token: string, payload: object) {
  const res = await fetch(`${META_BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message ?? `Meta API ${res.status}`);
  }
  return data;
}

export function sendText(creds: MetaCreds, to: string, text: string) {
  return metaPost(creds.phoneNumberId, creds.accessToken, {
    to,
    type: 'text',
    text: { body: text, preview_url: false },
  });
}

/** 3 or fewer choices → tap-to-reply buttons */
export function sendButtons(
  creds: MetaCreds,
  to: string,
  bodyText: string,
  choices: string[],
) {
  return metaPost(creds.phoneNumberId, creds.accessToken, {
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText },
      action: {
        buttons: choices.slice(0, 3).map((c, i) => ({
          type: 'reply',
          reply: {
            id: `idx_${i}`,
            title: c.slice(0, 20),
          },
        })),
      },
    },
  });
}

/** 4–10 choices → scrollable list picker */
export function sendList(
  creds: MetaCreds,
  to: string,
  bodyText: string,
  choices: string[],
  buttonLabel = 'Select option',
) {
  return metaPost(creds.phoneNumberId, creds.accessToken, {
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonLabel.slice(0, 20),
        sections: [
          {
            title: 'Options',
            rows: choices.slice(0, 10).map((c, i) => ({
              id: `idx_${i}`,
              title: c.slice(0, 24),
            })),
          },
        ],
      },
    },
  });
}

/**
 * Smart dispatcher:
 *   ≤3 choices  → interactive buttons (tap to reply)
 *   4-10 choices → list message (scrollable picker)
 *   >10 choices  → plain text numbered list (fallback)
 *   text question → plain text
 */
export function sendChoiceQuestion(
  creds: MetaCreds,
  to: string,
  question: { text: string; type: string; choices?: string[] },
) {
  const choices = question.choices ?? [];

  if (question.type !== 'choice' || choices.length === 0) {
    return sendText(creds, to, question.text);
  }
  if (choices.length <= 3) {
    return sendButtons(creds, to, question.text, choices);
  }
  if (choices.length <= 10) {
    return sendList(creds, to, question.text, choices);
  }
  // >10: plain numbered list fallback
  const numbered = choices.map((c, i) => `${i + 1}. ${c}`).join('\n');
  return sendText(creds, to, `${question.text}\n\n${numbered}\n\n_(Reply with number or text)_`);
}

export function sendImage(
  creds: MetaCreds,
  to: string,
  imageUrl: string,
  caption?: string,
) {
  return metaPost(creds.phoneNumberId, creds.accessToken, {
    to,
    type: 'image',
    image: { link: imageUrl, ...(caption ? { caption } : {}) },
  });
}

export function sendDocument(
  creds: MetaCreds,
  to: string,
  docUrl: string,
  filename: string,
  caption?: string,
) {
  return metaPost(creds.phoneNumberId, creds.accessToken, {
    to,
    type: 'document',
    document: { link: docUrl, filename, ...(caption ? { caption } : {}) },
  });
}

/** Mark an incoming message as read (shows blue ticks to customer) */
export function markRead(creds: MetaCreds, messageId: string) {
  return metaPost(creds.phoneNumberId, creds.accessToken, {
    status: 'read',
    message_id: messageId,
  });
}

/**
 * Resolve the text body from any Meta message object.
 * Handles: text, interactive button_reply, interactive list_reply.
 * Returns { body, choiceIndex } — choiceIndex is set for interactive replies.
 */
export function extractMetaMessage(message: any): {
  body: string;
  choiceIndex: number | null;
  messageId: string;
} {
  const messageId: string = message.id ?? '';

  if (message.type === 'text') {
    return { body: (message.text?.body ?? '').trim(), choiceIndex: null, messageId };
  }

  if (message.type === 'interactive') {
    const replyId: string =
      message.interactive?.button_reply?.id ??
      message.interactive?.list_reply?.id ??
      '';
    const replyTitle: string =
      message.interactive?.button_reply?.title ??
      message.interactive?.list_reply?.title ??
      '';

    // IDs are set as "idx_0", "idx_1", etc.
    const choiceIndex = replyId.startsWith('idx_')
      ? parseInt(replyId.replace('idx_', ''), 10)
      : null;

    return { body: replyTitle.trim(), choiceIndex, messageId };
  }

  return { body: '', choiceIndex: null, messageId };
}
