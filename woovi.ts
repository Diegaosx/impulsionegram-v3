// Woovi (ex-OpenPix) PIX integration. Uses the account's App ID (configured in
// the admin Integrations tab) as the Authorization header. Everything is gated:
// with no App ID, the caller falls back to manual payment confirmation.
//
// Reuses the same PixPayment / CreatePixInput / PaymentStatus shapes as the
// Mercado Pago module so the server can treat both providers uniformly.

import { PixPayment, CreatePixInput, PaymentStatus } from './mercadopago';

const WOOVI_BASE = 'https://api.woovi.com';

export function isWooviConfigured(appId?: string): boolean {
  return !!(appId && appId.trim());
}

// Normalize Woovi charge statuses to the same vocabulary the server already
// uses for Mercado Pago ("approved" means paid).
function normalizeStatus(s?: string): string {
  const v = String(s || '').toUpperCase();
  if (v === 'COMPLETED' || v === 'CONFIRMED' || v === 'PAID') return 'approved';
  if (v === 'EXPIRED') return 'cancelled';
  return 'pending'; // ACTIVE and anything else
}

// Woovi returns the QR as a hosted image URL (qrCodeImage) plus the copy-paste
// brCode. To reuse the existing base64 <img> rendering, fetch that image and
// encode it. Best-effort: on failure the copy-paste code still works.
async function fetchQrBase64(imageUrl: string): Promise<string> {
  if (!imageUrl) return '';
  try {
    const url = imageUrl.includes('?') ? imageUrl : `${imageUrl}?size=512`;
    const res = await fetch(url);
    if (!res.ok) return '';
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return '';
    return Buffer.from(await res.arrayBuffer()).toString('base64');
  } catch {
    return '';
  }
}

// Create a PIX charge and return the QR code data.
export async function createPixPayment(appId: string, input: CreatePixInput): Promise<PixPayment> {
  const body: any = {
    correlationID: input.orderId,
    value: Math.round(Number(input.amount) * 100), // Woovi expects centavos
    comment: String(input.description || '').slice(0, 140)
  };
  const email = input.email && /\S+@\S+\.\S+/.test(input.email) ? input.email : '';
  if (input.firstName || email) {
    body.customer = {
      name: input.firstName || 'Cliente',
      ...(email ? { email } : {})
    };
  }

  const res = await fetch(`${WOOVI_BASE}/api/v1/charge?return_existing=true`, {
    method: 'POST',
    headers: { Authorization: appId, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Woovi: falha ao criar PIX (HTTP ${res.status})`);
  }
  const charge = data?.charge || data || {};
  const qrCodeBase64 = await fetchQrBase64(charge.qrCodeImage || '');
  return {
    id: String(charge.correlationID || input.orderId),
    status: normalizeStatus(charge.status),
    qrCode: charge.brCode || '',
    qrCodeBase64,
    ticketUrl: charge.paymentLinkUrl || '',
    expiresAt: charge.expiresDate || ''
  };
}

// Query a charge's current status. Woovi accepts the correlationID (= orderId)
// as the charge identifier.
export async function getPaymentStatus(appId: string, chargeId: string): Promise<PaymentStatus> {
  const res = await fetch(`${WOOVI_BASE}/api/v1/charge/${encodeURIComponent(chargeId)}`, {
    headers: { Authorization: appId }
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Woovi: falha ao consultar cobrança (HTTP ${res.status})`);
  }
  const charge = data?.charge || data || {};
  const correlationID = String(charge.correlationID || chargeId);
  return {
    id: correlationID,
    status: normalizeStatus(charge.status),
    externalReference: correlationID
  };
}
