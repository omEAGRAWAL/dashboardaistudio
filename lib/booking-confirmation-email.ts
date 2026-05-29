export async function sendBookingConfirmationEmail(
  orgId: string,
  bookingId: string,
  options?: { force?: boolean },
) {
  if (!orgId || !bookingId) {
    return { success: false, error: 'Missing orgId or bookingId' };
  }

  try {
    const res = await fetch('/api/send-booking-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, bookingId, force: options?.force ?? false }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.warn('Booking confirmation email failed:', data.error || res.statusText);
      return { success: false, error: data.error || res.statusText };
    }

    return { success: true, ...data };
  } catch (error) {
    console.warn('Booking confirmation email failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
