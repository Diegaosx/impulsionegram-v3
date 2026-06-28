// Canonical order statuses used across the app (new orders) plus a normalizer
// that maps legacy/Portuguese status strings to a consistent label + style.

export type OrderStatus =
  | 'aguardando_pagamento'
  | 'processando'
  | 'pago'
  | 'entregue'
  | 'cancelado';

export interface OrderStatusInfo {
  key: string;
  label: string;
  // Tailwind classes for a badge.
  badge: string;
  // Accent color (for dots / metric cards).
  dot: string;
}

const MAP: Record<string, OrderStatusInfo> = {
  aguardando_pagamento: { key: 'aguardando_pagamento', label: 'Aguardando pagamento', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  pendente:             { key: 'aguardando_pagamento', label: 'Aguardando pagamento', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  aguardando:           { key: 'aguardando_pagamento', label: 'Aguardando pagamento', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  processando:          { key: 'processando', label: 'Processando', badge: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  pago:                 { key: 'pago', label: 'Pagamento aprovado', badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  aprovado:             { key: 'pago', label: 'Pagamento aprovado', badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  pagamento_aprovado:   { key: 'pago', label: 'Pagamento aprovado', badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  entregue:             { key: 'entregue', label: 'Entregue', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  cancelado:            { key: 'cancelado', label: 'Cancelado', badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' }
};

function normalizeKey(status: string): string {
  return String(status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

export function orderStatusInfo(status: string): OrderStatusInfo {
  const key = normalizeKey(status);
  return MAP[key] || {
    key,
    label: status || 'Indefinido',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400'
  };
}
