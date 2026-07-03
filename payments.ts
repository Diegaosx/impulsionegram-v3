// Payment-provider dispatcher. The active PIX provider (Mercado Pago or Woovi)
// is chosen in the admin Integrations tab. The server calls these helpers
// instead of a specific provider so switching providers is a config change.

import { IntegrationSettings } from './db';
import {
  PixPayment,
  CreatePixInput,
  PaymentStatus,
  isMercadoPagoConfigured,
  createPixPayment as mpCreatePix,
  getPaymentStatus as mpGetStatus
} from './mercadopago';
import {
  isWooviConfigured,
  createPixPayment as wooviCreatePix,
  getPaymentStatus as wooviGetStatus
} from './woovi';

export type PaymentProvider = 'mercadopago' | 'woovi';

export function getActiveProvider(integ: IntegrationSettings): PaymentProvider {
  return integ.paymentProvider === 'woovi' ? 'woovi' : 'mercadopago';
}

// True when the currently selected provider has its credentials configured.
export function isPixConfigured(integ: IntegrationSettings): boolean {
  return getActiveProvider(integ) === 'woovi'
    ? isWooviConfigured(integ.wooviAppId)
    : isMercadoPagoConfigured(integ.mercadoPagoAccessToken);
}

// Create a PIX charge with the active provider.
export async function createPix(integ: IntegrationSettings, input: CreatePixInput): Promise<PixPayment> {
  return getActiveProvider(integ) === 'woovi'
    ? wooviCreatePix(integ.wooviAppId, input)
    : mpCreatePix(integ.mercadoPagoAccessToken, input);
}

// Query a charge's status with the active provider. `chargeId` is whatever was
// stored on the order at creation time (MP payment id, or Woovi correlationID).
export async function getPixStatus(integ: IntegrationSettings, chargeId: string): Promise<PaymentStatus> {
  return getActiveProvider(integ) === 'woovi'
    ? wooviGetStatus(integ.wooviAppId, chargeId)
    : mpGetStatus(integ.mercadoPagoAccessToken, chargeId);
}
