// Pricing rules for engagement orders.
//
// This is the single source of truth for what a cart costs. It lives outside
// the themes so every surface that quotes a price — the public calculator, the
// client area's buy screen, and any future theme — charges the same amount.

import { ServiceItem, ServicePackage } from '../types';

// Progressive bulk discount, applied only in the legacy slider mode. Services
// that define fixed-price packages sell at the package price instead.
export const DISCOUNT_TIERS: { minQuantity: number; percent: number }[] = [
  { minQuantity: 10000, percent: 30 },
  { minQuantity: 5000, percent: 20 },
  { minQuantity: 2000, percent: 10 }
];

export function bulkDiscountPercent(quantity: number): number {
  const tier = DISCOUNT_TIERS.find(t => quantity >= t.minQuantity);
  return tier ? tier.percent : 0;
}

export interface PriceBreakdown {
  discountPercent: number;
  basePrice: number;
  discountValue: number;
  finalPrice: number;
  pricePerUnit: number;
}

export interface PriceInput {
  service?: ServiceItem;
  quantity: number;
  // Packages already filtered/sorted by the caller. When non-empty the price is
  // fixed by the selected package (falling back to the first one).
  packages?: ServicePackage[];
  selectedPackage?: ServicePackage;
}

export function computePrice({ service, quantity, packages, selectedPackage }: PriceInput): PriceBreakdown {
  const list = packages || [];
  if (list.length > 0) {
    const chosen = selectedPackage || list[0];
    const price = chosen?.price || 0;
    const qty = chosen?.quantity || 0;
    return {
      discountPercent: 0,
      basePrice: price,
      discountValue: 0,
      finalPrice: price,
      pricePerUnit: qty > 0 ? price / qty : 0
    };
  }

  const discountPercent = bulkDiscountPercent(quantity);
  const basePrice = service ? quantity * service.pricePerItem : 0;
  const discountValue = basePrice * (discountPercent / 100);
  const finalPrice = basePrice - discountValue;

  return {
    discountPercent,
    basePrice,
    discountValue,
    finalPrice,
    pricePerUnit: quantity > 0 ? finalPrice / quantity : 0
  };
}

// Packages a service actually sells: positive quantity/price, cheapest first.
export function sellablePackages(service?: ServiceItem): ServicePackage[] {
  const list = (service?.packages || []).filter(p => p.quantity > 0 && p.price > 0);
  return [...list].sort((a, b) => a.quantity - b.quantity);
}

// Atalhos de quantidade para a calculadora: uma escada 1-2-5 entre o mínimo e
// o máximo que o serviço vende, sempre incluindo os dois extremos.
//
// Serve só para facilitar — a régua continua permitindo qualquer valor.
export function quantityPresets(min: number, max: number, count = 4): number[] {
  const lo = Math.max(1, Math.floor(min || 1));
  const hi = Math.floor(max || 0);
  if (!(hi > lo)) return [lo];

  const ladder: number[] = [];
  for (let exp = 0; exp <= 9; exp++) {
    for (const m of [1, 2, 5]) {
      const v = m * Math.pow(10, exp);
      if (v > lo && v < hi) ladder.push(v);
    }
  }

  const pool = Array.from(new Set([lo, ...ladder, hi])).sort((a, b) => a - b);
  if (pool.length <= count) return pool;

  // Distribui os índices, mantendo o primeiro e o último.
  const picked = new Set<number>();
  for (let i = 0; i < count; i++) {
    picked.add(pool[Math.round((i * (pool.length - 1)) / (count - 1))]);
  }
  return Array.from(picked).sort((a, b) => a - b);
}
