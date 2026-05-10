/**
 * HeartMirror Push Notification Infrastructure
 * Phase 6: Proactive check-in nudges via Web Push Protocol
 *
 * Graceful degradation: if permission denied or PWA unavailable, silently skip.
 * Never sends between 10PM-8AM local time.
 */

const PUSH_CACHE_KEY = 'heartmirror-nudge-sent';
const NUDGE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours between nudges

export interface NudgePayload {
  title: string;
  body: string;
  icon?: string;
  tag: string;
}

/**
 * Request push notification permission from user.
 * Returns: 'granted' | 'denied' | 'default'
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}

/**
 * Check if push notifications are supported and permitted
 */
export function canSendPush(): boolean {
  return (
    'Notification' in window &&
    Notification.permission === 'granted' &&
    'serviceWorker' in navigator
  );
}

/**
 * Send a push notification.
 * Falls back gracefully if PWA / SW not available.
 */
export async function sendNudge(payload: NudgePayload): Promise<void> {
  if (!canSendPush()) return;

  // Check cooldown
  try {
    const lastSent = localStorage.getItem(PUSH_CACHE_KEY);
    if (lastSent && Date.now() - parseInt(lastSent, 10) < NUDGE_COOLDOWN) {
      return; // Still in cooldown period
    }
  } catch { /* ignore */ }

  // Time gate: never 10PM-8AM
  const hour = new Date().getHours();
  if (hour < 8 || hour >= 22) return;

  try {
    // Use Service Worker to show notification
    const registration = await navigator.serviceWorker.ready;
    if ('showNotification' in registration) {
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        tag: payload.tag,
        requireInteraction: false,
      });
      localStorage.setItem(PUSH_CACHE_KEY, Date.now().toString());
    }
  } catch {
    // Graceful degradation — skip if SW not available
  }
}

/**
 * Reset nudge cooldown (for testing)
 */
export function resetNudgeCooldown(): void {
  localStorage.removeItem(PUSH_CACHE_KEY);
}