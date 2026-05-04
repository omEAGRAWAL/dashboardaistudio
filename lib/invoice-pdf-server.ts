// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfmakeInstance = require('pdfmake') as {
  virtualfs: { writeFileSync(name: string, data: Buffer): void };
  addFonts(fonts: Record<string, unknown>): void;
  setUrlAccessPolicy(fn: () => boolean): void;
  createPdf(doc: unknown): { getBuffer(): Promise<Buffer> };
};
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import type { InvoiceBooking, BusinessProfile } from './invoice-template';

let _fontsLoaded = false;

function ensureFonts() {
  if (_fontsLoaded) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vfsData = require('pdfmake/build/vfs_fonts');
  const vfs: Record<string, string> = vfsData.pdfMake?.vfs ?? vfsData;
  pdfmakeInstance.virtualfs.writeFileSync('Roboto-Regular.ttf',      Buffer.from(vfs['Roboto-Regular.ttf'],      'base64'));
  pdfmakeInstance.virtualfs.writeFileSync('Roboto-Medium.ttf',       Buffer.from(vfs['Roboto-Medium.ttf'],       'base64'));
  pdfmakeInstance.virtualfs.writeFileSync('Roboto-Italic.ttf',       Buffer.from(vfs['Roboto-Italic.ttf'],       'base64'));
  pdfmakeInstance.virtualfs.writeFileSync('Roboto-MediumItalic.ttf', Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64'));
  pdfmakeInstance.addFonts({ Roboto: { normal: 'Roboto-Regular.ttf', bold: 'Roboto-Medium.ttf', italics: 'Roboto-Italic.ttf', bolditalics: 'Roboto-MediumItalic.ttf' } });
  pdfmakeInstance.setUrlAccessPolicy(() => false); // block external URL fetching
  _fontsLoaded = true;
}

const fmt = (n: number) => n.toLocaleString('en-IN');

export async function generateInvoicePdfBuffer(
  booking: InvoiceBooking,
  profile: BusinessProfile,
  invoiceNumber: number,
): Promise<Buffer> {
  const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Financials (same logic as invoice-template.ts)
  const subtotal      = booking.totalPrice;
  const discount      = booking.discount ?? 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const gstRate       = profile.gstRate || 0;
  const gstAmount     = Math.round(afterDiscount * gstRate) / 100;
  const isIGST        = profile.gstType === 'igst';
  const igst          = isIGST ? gstAmount : 0;
  const sgst          = isIGST ? 0 : Math.round(gstAmount / 2 * 100) / 100;
  const cgst          = isIGST ? 0 : Math.round(gstAmount / 2 * 100) / 100;
  const grandTotal    = Math.round((afterDiscount + gstAmount) * 100) / 100;
  const amountPaid    = booking.amountPaid ?? 0;
  const balance       = Math.round((grandTotal - amountPaid) * 100) / 100;

  // Fetch logo as base64
  let logoImage: string | null = null;
  if (profile.logoUrl) {
    try {
      const src = profile.logoUrl.startsWith('data:') ? profile.logoUrl : null;
      if (src) {
        logoImage = src;
      } else {
        const res = await fetch(profile.logoUrl);
        const mime = res.headers.get('content-type') || 'image/png';
        const buf  = await res.arrayBuffer();
        logoImage  = `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
      }
    } catch { /* skip logo if unreachable */ }
  }

  // ── Items table ──────────────────────────────────────────────
  const gstCols = isIGST ? 1 : 2;
  const totalCols = 4 + gstCols + 1; // ticket + desc + total + discount + gst + amount

  const headerRow: TableCell[] = [
    { text: 'Ticket',       style: 'th', alignment: 'left' },
    { text: 'Description',  style: 'th' },
    { text: 'Total (INR)',  style: 'th' },
    { text: 'Discount',     style: 'th' },
    ...(isIGST
      ? [{ text: 'IGST',       style: 'th' } as TableCell]
      : [{ text: 'SGST (INR)', style: 'th' } as TableCell, { text: 'CGST (INR)', style: 'th' } as TableCell]),
    { text: 'Amount (INR)', style: 'th' },
  ];

  const bodyRows: TableCell[][] = [];

  if (booking.ticketBreakdown && booking.ticketBreakdown.length > 0) {
    for (const t of booking.ticketBreakdown) {
      const itemTotal = t.pricePerPerson * t.quantity;
      const itemGst   = Math.round(itemTotal * gstRate) / 100;
      const iSgst     = isIGST ? 0 : Math.round(itemGst / 2 * 100) / 100;
      const iCgst     = iSgst;
      const iIgst     = isIGST ? itemGst : 0;
      bodyRows.push([
        { text: `${t.label} — INR ${fmt(t.pricePerPerson)} x ${t.quantity}`, bold: true },
        { text: `Tickets: ${t.quantity}\nAdd Ons: 0`, alignment: 'center' },
        { text: fmt(itemTotal), alignment: 'right' },
        { text: '0', alignment: 'center' },
        ...(isIGST
          ? [{ text: fmt(iIgst), alignment: 'right' as const }]
          : [{ text: fmt(iSgst), alignment: 'right' as const }, { text: fmt(iCgst), alignment: 'right' as const }]),
        { text: fmt(itemTotal), alignment: 'right', bold: true },
      ]);
    }
  } else {
    const rows = [
      { label: 'Dual Occupancy',   price: booking.priceDouble || 0, sel: booking.sharingType === 'double' },
      { label: 'Triple Occupancy', price: booking.priceTriple || 0, sel: booking.sharingType === 'triple' },
      { label: 'Quad Occupancy',   price: booking.priceQuad   || 0, sel: booking.sharingType === 'quad' },
    ];
    const empty = () => Array.from({ length: totalCols - 1 }, () => ({ text: '' } as TableCell));
    for (const r of rows) {
      if (r.sel) {
        bodyRows.push([
          { text: `${r.label} — INR ${fmt(r.price)} x ${booking.numberOfPersons}`, bold: true },
          { text: `Tickets: ${booking.numberOfPersons}\nAdd Ons: 0`, alignment: 'center' },
          { text: fmt(subtotal), alignment: 'right' },
          { text: '0', alignment: 'center' },
          ...(isIGST
            ? [{ text: fmt(igst), alignment: 'right' as const }]
            : [{ text: fmt(sgst), alignment: 'right' as const }, { text: fmt(cgst), alignment: 'right' as const }]),
          { text: fmt(subtotal), alignment: 'right', bold: true },
        ]);
      } else {
        bodyRows.push([{ text: `${r.label} — INR ${fmt(r.price)} x 0` }, ...empty()]);
      }
    }
  }

  const tableWidths = isIGST
    ? (['*', 72, 58, 50, 52, 62] as (string | number)[])
    : (['*', 72, 58, 46, 48, 48, 58] as (string | number)[]);

  // ── Summary right column ──────────────────────────────────────
  const hr: Content = { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 240, y2: 0, lineWidth: 0.5, lineColor: '#ccc' }], margin: [0, 4, 0, 4] };

  const summaryRows: Content[] = [
    { columns: [{ text: 'Ticket Total', style: 'sl' }, { text: `${fmt(subtotal)} INR`, style: 'sv', alignment: 'right' }] },
    {
      columns: [
        { text: 'Discount', style: 'sl' },
        { text: `- ${fmt(discount)} INR`, style: 'sv', alignment: 'right', color: discount > 0 ? '#22863a' : '#111' },
      ],
    },
    ...(discount > 0
      ? [{ columns: [{ text: 'After Discount', style: 'sl' }, { text: `${fmt(afterDiscount)} INR`, style: 'sv', alignment: 'right' }] } as Content]
      : []),
    ...(isIGST
      ? [{ columns: [{ text: `IGST (${gstRate}%)`, style: 'sl' }, { text: `${fmt(igst)} INR`, style: 'sv', alignment: 'right' }] } as Content]
      : [
          { columns: [{ text: `SGST (${gstRate / 2}%)`, style: 'sl' }, { text: `${fmt(sgst)} INR`, style: 'sv', alignment: 'right' }] } as Content,
          { columns: [{ text: `CGST (${gstRate / 2}%)`, style: 'sl' }, { text: `${fmt(cgst)} INR`, style: 'sv', alignment: 'right' }] } as Content,
        ]),
    { columns: [{ text: 'Total After Tax', style: 'sl' }, { text: `${fmt(grandTotal)} INR`, style: 'sv', alignment: 'right' }] },
    hr,
    { columns: [{ text: 'Grand Total', bold: true, fontSize: 11 }, { text: `${fmt(grandTotal)} INR`, bold: true, fontSize: 11, alignment: 'right' }] },
    { columns: [{ text: 'Amount Paid', style: 'sl', color: '#22863a' }, { text: `${fmt(amountPaid)} INR`, style: 'sv', alignment: 'right', color: '#22863a' }] },
    hr,
    {
      columns: [
        { text: 'Balance Due', bold: true, fontSize: 11, color: balance > 0 ? '#c53030' : '#22863a' },
        { text: `${fmt(balance)} INR`, bold: true, fontSize: 11, alignment: 'right', color: balance > 0 ? '#c53030' : '#22863a' },
      ],
    },
  ];

  // ── Agency header left ────────────────────────────────────────
  const agencyStack: Content[] = [{ text: profile.agencyName || 'Travel Agency', style: 'agencyName' }];
  const details: [string, string | undefined][] = [
    ['Reg. Name',   profile.registeredName],
    ['Address',     profile.address],
    ['State',       profile.state],
    ['State Code',  profile.stateCode],
    ['Contact',     profile.contactPhone],
    ['GSTIN',       profile.gstNumber],
  ];
  for (const [label, val] of details) {
    if (val) agencyStack.push({ text: `${label}: ${val}`, style: 'agencyDetail' });
  }

  // ── Document definition ───────────────────────────────────────
  const doc: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [32, 32, 32, 44],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: '#333' },
    styles: {
      agencyName:  { fontSize: 16, bold: true, color: '#111', margin: [0, 0, 0, 3] },
      agencyDetail:{ fontSize: 9,  color: '#555', lineHeight: 1.5 },
      invoiceBadge:{ fontSize: 20, bold: true, color: '#333' },
      ml:          { bold: true, color: '#333', fontSize: 10 },   // meta label
      mv:          { color: '#111', fontSize: 10 },               // meta value
      th:          { bold: true, fontSize: 9, color: '#444', alignment: 'center' },
      sl:          { color: '#555', fontSize: 10 },               // summary label
      sv:          { color: '#111', fontSize: 10 },               // summary value
      secTitle:    { fontSize: 9, bold: true, color: '#888', margin: [0, 0, 0, 4] },
    },
    content: [
      // ── Header ──────────────────────────────────────────────
      {
        columns: [
          { stack: agencyStack, width: '*' },
          {
            width: 'auto',
            stack: [
              { text: 'INVOICE', style: 'invoiceBadge', alignment: 'right' },
              ...(logoImage
                ? [{ image: logoImage, width: 75, alignment: 'right' as const, margin: [0, 6, 0, 0] as [number, number, number, number] }]
                : []),
            ],
          },
        ],
        margin: [0, 0, 0, 8],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 531, y2: 0, lineWidth: 2, lineColor: '#333' }], margin: [0, 0, 0, 10] },

      // ── Customer / Invoice meta ──────────────────────────────
      {
        columns: [
          {
            width: '50%',
            stack: [
              ['Name',         booking.customerName],
              ['Email ID',     booking.customerEmail || 'N/A'],
              ['Booking ID',   booking.id.substring(0, 8).toUpperCase()],
              ['Booking Date', booking.bookingDate],
              ['Event Name',   booking.packageTitle],
            ].map(([l, v]) => ({
              columns: [
                { text: l,      style: 'ml', width: 88 },
                { text: `: ${v}`, style: 'mv' },
              ],
              margin: [0, 0, 0, 4],
            })) as Content[],
          },
          {
            width: '50%',
            stack: [
              ['Invoice No.',   String(invoiceNumber)],
              ['Mobile No.',    booking.customerPhone || 'N/A'],
              ['Activity Date', booking.travelDate || 'TBD'],
              ['Invoice Date',  invoiceDate],
            ].map(([l, v]) => ({
              columns: [
                { text: l,      style: 'ml', width: 88 },
                { text: `: ${v}`, style: 'mv' },
              ],
              margin: [0, 0, 0, 4],
            })) as Content[],
          },
        ],
        margin: [0, 0, 0, 10],
      },

      // ── Items table ──────────────────────────────────────────
      {
        table: {
          headerRows: 1,
          widths: tableWidths,
          body: [headerRow, ...bodyRows],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#ddd',
          vLineColor: () => '#ddd',
          fillColor: (i: number) => (i === 0 ? '#f0f0f0' : null),
          paddingLeft:   () => 6,
          paddingRight:  () => 6,
          paddingTop:    () => 5,
          paddingBottom: () => 5,
        },
        margin: [0, 0, 0, 0],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 531, y2: 0, lineWidth: 0.5, lineColor: '#ddd' }], margin: [0, 0, 0, 10] },

      // ── Summary ──────────────────────────────────────────────
      {
        columns: [
          {
            width: '50%',
            margin: [0, 0, 12, 0],
            stack: [
              { text: 'PARTICIPANTS', style: 'secTitle' },
              booking.participants && booking.participants.length > 0
                ? ({ ul: booking.participants, fontSize: 10 } as Content)
                : ({ text: 'Not specified', italics: true, color: '#999', fontSize: 10 } as Content),
              { text: '', margin: [0, 10, 0, 0] },
              {
                columns: [
                  {
                    width: '50%',
                    stack: [
                      { text: 'REMARKS', style: 'secTitle' },
                      { text: booking.remarks || '—', fontSize: 10 },
                    ],
                  },
                  {
                    width: '50%',
                    stack: [
                      { text: 'PAYMENT STATUS', style: 'secTitle' },
                      { text: `Balance: INR ${fmt(balance)}`, fontSize: 10, margin: [0, 0, 0, 4] },
                      {
                        table: {
                          body: [[{
                            text: balance <= 0 ? 'PAID' : 'PENDING',
                            fontSize: 9,
                            bold: true,
                            fillColor: balance <= 0 ? '#d4edda' : '#fff3cd',
                            color:     balance <= 0 ? '#155724' : '#856404',
                            alignment: 'center',
                            margin: [6, 3, 6, 3],
                          }]],
                        },
                        layout: 'noBorders',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          { width: '50%', stack: summaryRows },
        ],
      },
    ],

    footer: () => ({
      text: [
        'This is a computer-generated invoice.',
        profile.agencyName     ? `  |  ${profile.agencyName}`     : '',
        profile.contactEmail   ? `  |  ${profile.contactEmail}`   : '',
        profile.contactPhone   ? `  |  ${profile.contactPhone}`   : '',
      ].join(''),
      fontSize: 9,
      color: '#999',
      alignment: 'center',
      margin: [32, 8, 32, 0],
    }),
  };

  ensureFonts();
  return pdfmakeInstance.createPdf(doc).getBuffer();
}
