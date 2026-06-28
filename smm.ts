// SMM panel integration (standard "PerfectPanel" API). The panel URL and key
// are configured in the admin Integrations tab. All calls are form-urlencoded
// POSTs to the same endpoint with an `action` parameter.

export function isSmmConfigured(url?: string, key?: string): boolean {
  return !!(url && url.trim() && key && key.trim());
}

async function smmCall(url: string, params: Record<string, string | number>): Promise<any> {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) body.append(k, String(v));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`SMM: resposta inválida (HTTP ${res.status})`); }
  if (!res.ok) throw new Error(data?.error || `SMM: erro HTTP ${res.status}`);
  if (data?.error) throw new Error(String(data.error));
  return data;
}

export interface SmmAddResult { order: string; }

// Create an order on the SMM panel. Returns the panel's order id.
export async function smmAddOrder(
  url: string,
  key: string,
  input: { service: string; link: string; quantity: number }
): Promise<SmmAddResult> {
  const data = await smmCall(url, {
    key,
    action: 'add',
    service: input.service,
    link: input.link,
    quantity: input.quantity
  });
  if (data?.order === undefined) throw new Error('SMM: pedido não retornou um id.');
  return { order: String(data.order) };
}

export interface SmmStatus {
  status: string; // Pending | In progress | Processing | Completed | Partial | Canceled
  startCount: string;
  remains: string;
  charge: string;
  currency: string;
}

export async function smmOrderStatus(url: string, key: string, orderId: string): Promise<SmmStatus> {
  const data = await smmCall(url, { key, action: 'status', order: orderId });
  return {
    status: String(data?.status || ''),
    startCount: String(data?.start_count ?? ''),
    remains: String(data?.remains ?? ''),
    charge: String(data?.charge ?? ''),
    currency: String(data?.currency ?? '')
  };
}

export async function smmBalance(url: string, key: string): Promise<{ balance: string; currency: string }> {
  const data = await smmCall(url, { key, action: 'balance' });
  return { balance: String(data?.balance ?? ''), currency: String(data?.currency ?? '') };
}

export async function smmServices(url: string, key: string): Promise<any[]> {
  const data = await smmCall(url, { key, action: 'services' });
  return Array.isArray(data) ? data : [];
}

// True when the SMM status means the order is fully delivered.
export function isSmmCompleted(status: string): boolean {
  return /complete/i.test(status);
}

// Build a best-effort target URL for the SMM panel from the platform + handle.
export function buildTargetLink(platform: string, handleOrUrl: string): string {
  const v = String(handleOrUrl || '').trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '');
  if (!handle) return v;
  switch (String(platform || '').toLowerCase()) {
    case 'instagram': return `https://instagram.com/${handle}`;
    case 'tiktok': return `https://tiktok.com/@${handle}`;
    case 'youtube': return `https://youtube.com/@${handle}`;
    case 'facebook': return `https://facebook.com/${handle}`;
    case 'twitter': return `https://twitter.com/${handle}`;
    case 'kwai': return `https://kwai.com/@${handle}`;
    default: return v;
  }
}
