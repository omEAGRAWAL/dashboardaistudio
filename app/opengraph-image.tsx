import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Yatrik travel CRM software for Indian travel agencies';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f8faf7',
          color: '#111827',
          display: 'flex',
          padding: 64,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid #d1d5db',
            borderRadius: 24,
            background: '#ffffff',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '56%',
              padding: 56,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: '#111827',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                Y
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>Yatrik</div>
            </div>
            <div style={{ fontSize: 58, lineHeight: 1.05, fontWeight: 800 }}>
              Travel CRM software for Indian agencies
            </div>
            <div style={{ marginTop: 28, fontSize: 25, lineHeight: 1.35, color: '#4b5563' }}>
              Capture Google, Meta Ads, WhatsApp, and website leads. Manage packages,
              bookings, follow-ups, and revenue in one CRM.
            </div>
          </div>
          <div
            style={{
              width: '44%',
              background: '#ecfdf5',
              borderLeft: '1px solid #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 44,
            }}
          >
            <div
              style={{
                width: '100%',
                borderRadius: 20,
                background: '#ffffff',
                border: '1px solid #d1d5db',
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              {['Google search lead', 'WhatsApp follow-up', 'Package proposal', 'Booking confirmed'].map(
                (item, index) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: index === 3 ? '0' : '1px solid #e5e7eb',
                      paddingBottom: index === 3 ? 0 : 18,
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{item}</div>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        background: '#059669',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        fontWeight: 800,
                      }}
                    >
                      {index + 1}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
