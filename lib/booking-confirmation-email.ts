export async function sendBookingConfirmationEmail(orgId: string, bookingId: string) {
  if (!orgId || !bookingId) return;

  try {
    const res = await fetch('/api/send-booking-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId, bookingId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('Booking confirmation email failed:', data.error || res.statusText);
    }
  } catch (error) {
    console.warn('Booking confirmation email failed:', error);
  }
}
