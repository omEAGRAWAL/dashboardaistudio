import { getMessaging } from 'firebase-admin/messaging';
import { adminDb } from './firebase-admin';

interface LeadData {
  name: string;
  phone: string;
  source?: string;
  category?: string;
  pax?: number;
  travelDate?: string;
}

/**
 * Send a push notification to the assigned agent when a new lead is created.
 * Looks up all FCM tokens for the assignee and sends to each one.
 * Automatically cleans up stale/invalid tokens.
 */
export async function sendLeadNotification(
  assigneeId: string,
  leadData: LeadData,
  leadId: string
): Promise<void> {
  if (!assigneeId) return;

  try {
    // Get all FCM tokens for this user
    const tokensSnap = await adminDb
      .collection('users')
      .doc(assigneeId)
      .collection('fcmTokens')
      .get();

    if (tokensSnap.empty) {
      console.log('[push] No FCM tokens for user:', assigneeId);
      return;
    }

    const tokens = tokensSnap.docs.map((d) => d.data().token as string).filter(Boolean);
    if (tokens.length === 0) return;

    const messaging = getMessaging();

    const title = `🔔 New Lead: ${leadData.name}`;
    const body = `📱 ${leadData.phone}${leadData.source ? ` · Source: ${leadData.source}` : ''}${leadData.pax ? ` · ${leadData.pax} pax` : ''}`;

    // Send to each token individually so we can handle failures per-token
    const results = await Promise.allSettled(
      tokens.map((token) =>
        messaging.send({
          token,
          notification: {
            title,
            body,
          },
          data: {
            title,
            body,
            leadId,
            url: '/',
          },
          webpush: {
            headers: {
              Urgency: 'high',
            },
            notification: {
              title,
              body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: `lead-${leadId}`,
            },
            fcmOptions: {
              link: '/',
            },
          },
        })
      )
    );

    // Clean up invalid tokens
    const staleTokens: string[] = [];
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const err = result.reason;
        const errorCode = err?.code || err?.errorInfo?.code || '';
        // These error codes indicate the token is no longer valid
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/invalid-argument'
        ) {
          staleTokens.push(tokens[i]);
        } else {
          console.error(`[push] Error sending to token ${i}:`, err?.message || err);
        }
      }
    });

    // Remove stale tokens from Firestore
    if (staleTokens.length > 0) {
      const batch = adminDb.batch();
      for (const token of staleTokens) {
        batch.delete(
          adminDb.collection('users').doc(assigneeId).collection('fcmTokens').doc(token)
        );
      }
      await batch.commit();
      console.log(`[push] Removed ${staleTokens.length} stale token(s) for user:`, assigneeId);
    }

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    console.log(`[push] Sent ${successCount}/${tokens.length} notification(s) to user:`, assigneeId);
  } catch (err) {
    console.error('[push] Fatal error sending notification:', err);
  }
}
