export interface AdvanceAmountConfig {
  advanceType?: 'percentage' | 'fixed';
  advancePercentage?: number;
  advanceFixedAmount?: number;
}

export function getTicketCountFromBreakdown(ticketBreakdown?: unknown) {
  if (!Array.isArray(ticketBreakdown)) return 0;

  return ticketBreakdown.reduce((sum, item: any) => sum + (Number(item?.quantity) || 0), 0);
}

export function getBookingTicketCount(booking: any) {
  const direct = Number(booking?.numberOfPersons);
  if (direct > 0) return direct;

  const fromBreakdown = getTicketCountFromBreakdown(booking?.ticketBreakdown);
  return fromBreakdown > 0 ? fromBreakdown : 1;
}

export function calculateAdvanceAmount(
  netTotal: number,
  config?: AdvanceAmountConfig | null,
  ticketCount = 1,
) {
  const safeTotal = Math.max(0, Number(netTotal) || 0);
  if (safeTotal <= 0) return 0;

  if (config?.advanceType === 'fixed' && Number(config.advanceFixedAmount) > 0) {
    const count = Math.max(1, Math.floor(Number(ticketCount) || 0));
    const perTicketAmount = Math.round(Number(config.advanceFixedAmount));
    return Math.round(Math.min(perTicketAmount * count, safeTotal));
  }

  const percentage = Number(config?.advancePercentage ?? 30);
  return Math.round((safeTotal * percentage) / 100);
}
