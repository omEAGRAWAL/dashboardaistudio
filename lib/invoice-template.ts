export interface BusinessProfile {
  agencyName: string;
  registeredName: string;
  address: string;
  state: string;
  stateCode: string;
  contactPhone: string;
  contactEmail: string;
  logoUrl: string;
  gstNumber: string;
  gstRate: number; // e.g. 5 for 5%
  gstType: 'igst' | 'sgst_cgst'; // IGST for inter-state, SGST+CGST for intra-state
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
}

export interface InvoiceBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageTitle: string;
  sharingType: string;
  numberOfPersons: number;
  totalPrice: number;
  status: string;
  travelDate?: string;
  bookingDate: string; // formatted
  participants?: string[];
  remarks?: string;
  amountPaid?: number;
  ticketBreakdown?: { type: string; label: string; quantity: number; pricePerPerson: number }[];
  priceDouble?: number;
  priceTriple?: number;
  priceQuad?: number;
}

export function generateInvoiceHTML(
  booking: InvoiceBooking,
  profile: BusinessProfile,
  invoiceNumber: number
): string {
  const today = new Date();
  const invoiceDate = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Calculate GST
  const subtotal = booking.totalPrice;
  const gstRate = profile.gstRate || 0;
  const gstAmount = Math.round((subtotal * gstRate) / 100 * 100) / 100;
  const isIGST = profile.gstType === 'igst';
  const sgst = isIGST ? 0 : Math.round(gstAmount / 2 * 100) / 100;
  const cgst = isIGST ? 0 : Math.round(gstAmount / 2 * 100) / 100;
  const igst = isIGST ? gstAmount : 0;
  const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100;
  const amountPaid = booking.amountPaid ?? 0;
  const balance = Math.round((grandTotal - amountPaid) * 100) / 100;

  // Sharing type label
  const sharingLabel = booking.sharingType === 'double' ? 'Dual Occupancy' :
    booking.sharingType === 'triple' ? 'Triple Occupancy' :
    booking.sharingType === 'quad' ? 'Quad Occupancy' : booking.sharingType;

  // Per-person price
  const perPerson = booking.numberOfPersons > 0
    ? Math.round(booking.totalPrice / booking.numberOfPersons)
    : booking.totalPrice;

  // Build occupancy rows
  const occupancyRows = [
    { type: 'Dual Occupancy', price: booking.priceDouble || 0, selected: booking.sharingType === 'double' },
    { type: 'Triple Occupancy', price: booking.priceTriple || 0, selected: booking.sharingType === 'triple' },
    { type: 'Quad Occupancy', price: booking.priceQuad || 0, selected: booking.sharingType === 'quad' },
  ];

  const selectedRow = occupancyRows.find(r => r.selected);

  const participantsHtml = booking.participants && booking.participants.length > 0
    ? `<ul style="margin:0;padding-left:20px;">${booking.participants.map(p => `<li>${p}</li>`).join('')}</ul>`
    : `<em style="color:#999;">Not specified</em>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Invoice #${invoiceNumber}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      .invoice-container { box-shadow: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; color: #333; }
    .invoice-container { max-width: 800px; margin: 20px auto; background: #fff; border: 1px solid #ddd; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    
    /* Header */
    .invoice-header { padding: 24px 28px; border-bottom: 2px solid #333; display: flex; justify-content: space-between; align-items: flex-start; }
    .agency-info { flex: 1; }
    .agency-name { font-size: 22px; font-weight: 700; color: #111; margin-bottom: 2px; }
    .agency-detail { font-size: 12px; color: #555; line-height: 1.7; }
    .logo-section { text-align: right; }
    .logo-section img { max-height: 60px; max-width: 120px; object-fit: contain; border-radius: 4px; }
    .invoice-badge { display: inline-block; margin-top: 8px; font-size: 20px; font-weight: 700; color: #333; letter-spacing: 2px; }

    /* Customer & Invoice meta */
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #ddd; }
    .meta-left, .meta-right { padding: 16px 28px; }
    .meta-right { border-left: 1px solid #ddd; }
    .meta-row { display: flex; gap: 8px; margin-bottom: 6px; font-size: 13px; }
    .meta-label { font-weight: 600; color: #333; min-width: 110px; }
    .meta-value { color: #111; font-weight: 500; }

    /* Table */
    .items-table { width: 100%; border-collapse: collapse; }
    .items-table th { background: #f0f0f0; padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #444; border: 1px solid #ddd; text-align: center; }
    .items-table td { padding: 10px 14px; font-size: 13px; border: 1px solid #ddd; vertical-align: middle; }
    .items-table .text-right { text-align: right; }
    .items-table .text-center { text-align: center; }

    /* Summary area */
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #ddd; }
    .summary-left { padding: 16px 28px; border-right: 1px solid #ddd; }
    .summary-right { padding: 16px 28px; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
    .summary-row.bold { font-weight: 700; font-size: 14px; color: #111; border-top: 1px solid #ccc; padding-top: 6px; margin-top: 6px; }
    .summary-label { color: #555; }
    .summary-value { color: #111; font-weight: 500; }
    .pending-badge { display: inline-block; background: #fff3cd; color: #856404; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 10px; }
    .paid-badge { display: inline-block; background: #d4edda; color: #155724; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 10px; }

    /* Footer */
    .invoice-footer { padding: 16px 28px; border-top: 2px solid #333; text-align: center; font-size: 11px; color: #999; }
    .section-title { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="agency-info">
        <div class="agency-name">${profile.agencyName || 'Your Travel Agency'}</div>
        <div class="agency-detail">
          ${profile.registeredName ? `Reg. Name : ${profile.registeredName}<br/>` : ''}
          ${profile.address ? `Address : ${profile.address}<br/>` : ''}
          ${profile.state ? `State : ${profile.state}<br/>` : ''}
          ${profile.stateCode ? `State Code : ${profile.stateCode}<br/>` : ''}
          ${profile.contactPhone ? `Contact : ${profile.contactPhone}<br/>` : ''}
          ${profile.gstNumber ? `GSTIN : ${profile.gstNumber}` : ''}
        </div>
      </div>
      <div class="logo-section">
        ${profile.logoUrl ? `<img src="${profile.logoUrl}" alt="Logo"/>` : '<div style="width:80px;height:80px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:32px;">🧳</div>'}
        <div class="invoice-badge">Invoice</div>
      </div>
    </div>

    <!-- Customer & Invoice Meta -->
    <div class="meta-grid">
      <div class="meta-left">
        <div class="meta-row"><span class="meta-label">Name</span><span class="meta-value">: ${booking.customerName}</span></div>
        <div class="meta-row"><span class="meta-label">Email ID</span><span class="meta-value">: ${booking.customerEmail || 'N/A'}</span></div>
        <div class="meta-row"><span class="meta-label">Booking ID</span><span class="meta-value">: ${booking.id.substring(0, 8).toUpperCase()}</span></div>
        <div class="meta-row"><span class="meta-label">Booking Date</span><span class="meta-value">: ${booking.bookingDate}</span></div>
        <div class="meta-row"><span class="meta-label">Event Name</span><span class="meta-value">: ${booking.packageTitle}</span></div>
      </div>
      <div class="meta-right">
        <div class="meta-row"><span class="meta-label">Invoice No.</span><span class="meta-value">: ${invoiceNumber}</span></div>
        <div class="meta-row"><span class="meta-label">Mobile No.</span><span class="meta-value">: ${booking.customerPhone || 'N/A'}</span></div>
        <div class="meta-row"><span class="meta-label">Activity Date</span><span class="meta-value">: ${booking.travelDate || 'TBD'}</span></div>
        <div class="meta-row"><span class="meta-label">Invoice Date</span><span class="meta-value">: ${invoiceDate}</span></div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align:left">Ticket</th>
          <th>Description</th>
          <th>Ticket/Package<br/>Total (INR)</th>
          <th>Discounts<br/>(INR)</th>
          <th colspan="${isIGST ? '1' : '2'}">GST${isIGST ? ' — IGST' : ''}</th>
          ${!isIGST ? '' : ''}
          <th>Amount<br/>(INR)</th>
        </tr>
        ${!isIGST ? `<tr>
          <th></th><th></th><th></th><th></th>
          <th>SGST (INR)</th><th>CGST (INR)</th>
          <th></th>
        </tr>` : ''}
      </thead>
      <tbody>
        ${booking.ticketBreakdown && booking.ticketBreakdown.length > 0 ? booking.ticketBreakdown.map(t => {
          const itemSubtotal = t.pricePerPerson * t.quantity;
          const itemGst = Math.round((itemSubtotal * gstRate) / 100 * 100) / 100;
          const itemIgst = isIGST ? itemGst : 0;
          const itemSgst = isIGST ? 0 : Math.round(itemGst / 2 * 100) / 100;
          const itemCgst = isIGST ? 0 : Math.round(itemGst / 2 * 100) / 100;

          return `
            <tr style="background:#fafafa;">
              <td style="text-align:left;font-weight:600;">${t.label} &mdash; INR ${t.pricePerPerson.toLocaleString('en-IN')}.0 x ${t.quantity}</td>
              <td class="text-center">Ticket(s)- ${t.quantity}<br/>Add On(s)- 0</td>
              <td class="text-right">${itemSubtotal.toLocaleString('en-IN')}.0</td>
              <td class="text-center">0.0</td>
              ${isIGST
                ? `<td class="text-right">${itemIgst.toLocaleString('en-IN')}</td>`
                : `<td class="text-right">${itemSgst.toLocaleString('en-IN')}</td><td class="text-right">${itemCgst.toLocaleString('en-IN')}</td>`
              }
              <td class="text-right" style="font-weight:600;">${itemSubtotal.toLocaleString('en-IN')}.0</td>
            </tr>
          `;
        }).join('') : occupancyRows.map(row => `
        <tr style="${row.selected ? 'background:#fafafa;' : ''}">
          <td style="text-align:left;${row.selected ? 'font-weight:600;' : ''}">${row.type} &mdash; INR ${row.price.toLocaleString('en-IN')}.0 x ${row.selected ? booking.numberOfPersons : 0}</td>
          ${row.selected ? `
            <td class="text-center">Ticket(s)- ${booking.numberOfPersons}<br/>Add On(s)- 0</td>
            <td class="text-right">${subtotal.toLocaleString('en-IN')}.0</td>
            <td class="text-center">0.0</td>
            ${isIGST
              ? `<td class="text-right">${igst.toLocaleString('en-IN')}</td>`
              : `<td class="text-right">${sgst.toLocaleString('en-IN')}</td><td class="text-right">${cgst.toLocaleString('en-IN')}</td>`
            }
            <td class="text-right" style="font-weight:600;">${subtotal.toLocaleString('en-IN')}.0</td>
          ` : `
            <td></td><td></td><td></td>
            ${isIGST ? '<td></td>' : '<td></td><td></td>'}
            <td></td>
          `}
        </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Summary Grid -->
    <div class="summary-grid">
      <div class="summary-left">
        <!-- Participants -->
        <div style="margin-bottom:16px;">
          <div class="section-title">Participants</div>
          ${participantsHtml}
        </div>

        <!-- Remarks & Payment Status -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <div class="section-title">Remarks</div>
            <div style="font-size:13px;color:#555;">${booking.remarks || '—'}</div>
          </div>
          <div>
            <div class="section-title">Payment Status</div>
            <div style="font-size:13px;margin-bottom:4px;">Balance Amount: <strong>INR ${balance.toLocaleString('en-IN')}</strong></div>
            <div style="font-size:13px;margin-bottom:4px;">Status: ${balance <= 0
              ? '<span class="paid-badge">Paid</span>'
              : '<span class="pending-badge">Pending</span>'
            }</div>
          </div>
        </div>
      </div>

      <div class="summary-right">
        <div class="summary-row">
          <span class="summary-label">Ticket Total</span>
          <span class="summary-value">${subtotal.toLocaleString('en-IN')} INR</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Discounts</span>
          <span class="summary-value">- 0.0 INR</span>
        </div>
        ${isIGST ? `
        <div class="summary-row">
          <span class="summary-label">IGST (${gstRate}%)</span>
          <span class="summary-value">${igst.toLocaleString('en-IN')} INR</span>
        </div>
        ` : `
        <div class="summary-row">
          <span class="summary-label">SGST (${gstRate / 2}%)</span>
          <span class="summary-value">${sgst.toLocaleString('en-IN')} INR</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">CGST (${gstRate / 2}%)</span>
          <span class="summary-value">${cgst.toLocaleString('en-IN')} INR</span>
        </div>
        `}
        <div class="summary-row">
          <span class="summary-label">Total After Tax</span>
          <span class="summary-value">${grandTotal.toLocaleString('en-IN')} INR</span>
        </div>
        <div class="summary-row bold">
          <span>Grand Total</span>
          <span>${grandTotal.toLocaleString('en-IN')} INR</span>
        </div>
        <div class="summary-row" style="color:#22863a;">
          <span class="summary-label">Amount Paid</span>
          <span class="summary-value">${amountPaid.toLocaleString('en-IN')} INR</span>
        </div>
        <div class="summary-row bold" style="${balance > 0 ? 'color:#c53030;' : 'color:#22863a;'}">
          <span>Balance Due</span>
          <span>${balance.toLocaleString('en-IN')} INR</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      This is a computer-generated invoice. | ${profile.agencyName || 'Your Travel Agency'}${profile.contactEmail ? ` | ${profile.contactEmail}` : ''}${profile.contactPhone ? ` | ${profile.contactPhone}` : ''}
    </div>
  </div>
</body>
</html>`;
}
