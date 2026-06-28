// Mercado Pago PIX integration. Uses the account's access token (configured in
// the admin Integrations tab). Everything is gated: with no token, the caller
// falls back to manual payment confirmation.

const MP_BASE = 'https://api.mercadopago.com';

export function isMercadoPagoConfigured(token?: string): boolean {
  return !!(token && token.trim());
}

export interface PixPayment {
  id: string;
  status: string; // pending | approved | rejected | cancelled | in_process
  qrCode: string; // copia-e-cola
  qrCodeBase64: string; // PNG base64 (without data: prefix)
  ticketUrl: string;
  expiresAt: string;
}

export interface CreatePixInput {
  amount: number;
  description: string;
  email: string;
  firstName?: string;
  orderId: string;
  notificationUrl?: string;
}

function splitName(name?: string): { first: string; last: string } {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: 'Cliente', last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

// Create a PIX charge and return the QR code data.
export async function createPixPayment(accessToken: string, input: CreatePixInput): Promise<PixPayment> {
  const { first, last } = splitName(input.firstName);
  const body: any = {
    transaction_amount: Number(Number(input.amount).toFixed(2)),
    description: input.description,
    payment_method_id: 'pix',
    payer: {
      email: input.email && /\S+@\S+\.\S+/.test(input.email) ? input.email : 'comprador@example.com',
      first_name: first,
      last_name: last || first
    },
    external_reference: input.orderId
  };
  if (input.notificationUrl) body.notification_url = input.notificationUrl;

  const res = await fetch(`${MP_BASE}/v1/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `${input.orderId}-${Date.now()}`
    },
    body: JSON.stringify(body)
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Mercado Pago: falha ao criar PIX (HTTP ${res.status})`);
  }
  const tx = data?.point_of_interaction?.transaction_data || {};
  return {
    id: String(data.id),
    status: String(data.status || 'pending'),
    qrCode: tx.qr_code || '',
    qrCodeBase64: tx.qr_code_base64 || '',
    ticketUrl: tx.ticket_url || '',
    expiresAt: data.date_of_expiration || ''
  };
}

export interface PaymentStatus {
  id: string;
  status: string;
  externalReference: string;
}

// Query a payment's current status (and the linked order via external_reference).
export async function getPaymentStatus(accessToken: string, paymentId: string): Promise<PaymentStatus> {
  const res = await fetch(`${MP_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Mercado Pago: falha ao consultar pagamento (HTTP ${res.status})`);
  }
  return {
    id: String(data.id),
    status: String(data.status || ''),
    externalReference: String(data.external_reference || '')
  };
}
