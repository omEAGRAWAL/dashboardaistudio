import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get the FCM messaging instance (client-side only).
 * Returns null if messaging is not supported (e.g. SSR, unsupported browser).
 */
export async function getMessagingInstance() {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported();
  if (!supported) {
    console.warn('[FCM] Messaging is not supported in this browser');
    return null;
  }
  return getMessaging(getApp());
}

/**
 * Request notification permission, get FCM token, and save it to Firestore.
 * Returns the token string on success, or null on failure.
 */
export async function requestNotificationPermission(uid: string): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied');
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set');
      return null;
    }

    // Register the service worker and wait until it's fully activated
    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      // Save token to Firestore under the user's document
      // Using a subcollection so a user can have multiple devices
      await setDoc(doc(db, 'users', uid, 'fcmTokens', token), {
        token,
        createdAt: serverTimestamp(),
        userAgent: navigator.userAgent,
      });
      console.log('[FCM] Token saved for user:', uid);
      return token;
    }

    console.warn('[FCM] No token received');
    return null;
  } catch (err) {
    console.error('[FCM] Error requesting notification permission:', err);
    return null;
  }
}

/**
 * Silently register FCM token if permission was already granted.
 * Does not prompt the user — only saves the token if they already allowed notifications.
 */
export async function silentTokenRefresh(uid: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    await requestNotificationPermission(uid);
  } catch {
    // Silent — don't disrupt the user flow
  }
}

/**
 * Set up foreground message handler.
 * Shows an in-app toast/notification when a message arrives while the tab is focused.
 */
export function setupForegroundHandler(onNotification: (payload: { title: string; body: string; leadId?: string }) => void) {
  if (typeof window === 'undefined') return;

  getMessagingInstance().then((messaging) => {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message:', payload);
      const data = payload.data || {};
      const notification = payload.notification || {};

      onNotification({
        title: notification.title || data.title || '🔔 New Lead Assigned',
        body: notification.body || data.body || 'A new lead has been assigned to you.',
        leadId: data.leadId,
      });
    });
  });
}
