import { ServiceItem, PlanItem } from '../types';

export interface AdminOrder {
  id: string;
  username: string;
  platform: string;
  serviceLabel: string;
  quantity: number;
  price: number;
  paymentMethod: 'PIX' | 'Card';
  email: string;
  phone: string;
  date: string;
  status: 'Pendente' | 'Processando' | 'Aprovado' | 'Entregue' | 'Cancelado';
}

// REST Backend API calls
export async function fetchServices(): Promise<ServiceItem[]> {
  try {
    const res = await fetch('/api/services');
    if (!res.ok) throw new Error('Failed to fetch services');
    return await res.json();
  } catch (error) {
    console.error('Error fetching services API:', error);
    return [];
  }
}

export async function saveServicesToServer(services: ServiceItem[]): Promise<void> {
  const res = await fetch('/api/services', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(services)
  });
  if (!res.ok) throw new Error('Failed to save services to server');
}

export async function fetchPlans(): Promise<PlanItem[]> {
  try {
    const res = await fetch('/api/plans');
    if (!res.ok) throw new Error('Failed to fetch plans');
    return await res.json();
  } catch (error) {
    console.error('Error fetching plans API:', error);
    return [];
  }
}

export async function savePlansToServer(plans: PlanItem[]): Promise<void> {
  const res = await fetch('/api/plans', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plans)
  });
  if (!res.ok) throw new Error('Failed to save plans to server');
}

export async function fetchOrders(): Promise<AdminOrder[]> {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  } catch (error) {
    console.error('Error fetching orders API:', error);
    return [];
  }
}

export async function saveOrdersToServer(orders: AdminOrder[]): Promise<void> {
  const res = await fetch('/api/orders', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orders)
  });
  if (!res.ok) throw new Error('Failed to update orders status on server');
}

export async function addOrderToServer(order: Omit<AdminOrder, 'id' | 'date'>): Promise<AdminOrder> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  if (!res.ok) throw new Error('Failed to create order on server');
  const data = await res.json();
  return data.order;
}

export async function resetServerDatabase(): Promise<{ services: ServiceItem[], plans: PlanItem[], orders: AdminOrder[], users: any[], homeContent: any }> {
  const res = await fetch('/api/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset server database');
  return await res.json();
}

export interface UserItem {
  id: string;
  username: string;
  email: string;
  phone: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  status: 'Ativo' | 'Bloqueado';
}

export interface HomeContent {
  heroTitle: string;
  heroSubtitle: string;
  alertBannerText: string;
  companyWhatsApp: string;
  companyEmail: string;
}

export async function fetchUsers(): Promise<UserItem[]> {
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return await res.json();
  } catch (error) {
    console.error('Error fetching users API:', error);
    return [];
  }
}

export async function saveUsersToServer(users: UserItem[]): Promise<void> {
  const res = await fetch('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(users)
  });
  if (!res.ok) throw new Error('Failed to save users on server');
}

export async function fetchHomeContent(): Promise<HomeContent> {
  try {
    const res = await fetch('/api/home');
    if (!res.ok) throw new Error('Failed to fetch home content');
    return await res.json();
  } catch (error) {
    console.error('Error fetching home content API:', error);
    return {
      heroTitle: "Impulsione Suas Redes Sociais com Seguidores Reais",
      heroSubtitle: "Aumente sua autoridade, alcance orgânico e vendas com nossa entrega natural e segura. Resultados garantidos em minutos.",
      alertBannerText: "OFERTA RELÂMPAGO DE INVERNO: 20% OFF EXTRA NO PIX",
      companyWhatsApp: "5511999999999",
      companyEmail: "suporte@impulsionegram.com"
    };
  }
}

export async function saveHomeContentToServer(content: HomeContent): Promise<void> {
  const res = await fetch('/api/home', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content)
  });
  if (!res.ok) throw new Error('Failed to save home content on server');
}

export interface GeneralSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  seoTitle: string;
  seoDescription: string;
  timezone: string;
  theme: string;
}

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  siteName: 'ImpulsioneGram',
  logoUrl: '',
  faviconUrl: '',
  seoTitle: 'ImpulsioneGram | Impulsione suas Redes Sociais',
  seoDescription:
    'Plataforma premium para impulsionar suas redes sociais com seguidores, curtidas e visualizações reais e brasileiros.',
  timezone: 'America/Recife',
  theme: 'default'
};

export async function fetchGeneralSettings(): Promise<GeneralSettings> {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  } catch (error) {
    console.error('Error fetching general settings API:', error);
    return { ...DEFAULT_GENERAL_SETTINGS };
  }
}

export async function saveGeneralSettingsToServer(settings: GeneralSettings): Promise<void> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to save settings on server');
}

/** Upload a file to Cloudflare R2 (via the backend) and return its public URL. */
export async function uploadAsset(file: File, folder: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha no upload do arquivo');
  }
  return data.url;
}

export interface IntegrationSettings {
  mercadoPagoAccessToken: string;
  mercadoPagoPublicKey: string;
  smmApiUrl: string;
  smmApiKey: string;
}

export async function fetchIntegrations(): Promise<IntegrationSettings> {
  try {
    const res = await fetch('/api/integrations');
    if (!res.ok) throw new Error('Failed to fetch integrations');
    return await res.json();
  } catch (error) {
    console.error('Error fetching integrations API:', error);
    return {
      mercadoPagoAccessToken: '',
      mercadoPagoPublicKey: '',
      smmApiUrl: '',
      smmApiKey: ''
    };
  }
}

export async function saveIntegrationsToServer(integrations: IntegrationSettings): Promise<void> {
  const res = await fetch('/api/integrations', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(integrations)
  });
  if (!res.ok) throw new Error('Failed to save integrations on server');
}

export async function loginAdminToServer(credentials: { username: string; password: string }): Promise<{ success: boolean; token?: string; error?: string }> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  if (res.status === 401) {
    return { success: false, error: 'Usuário ou senha incorretos' };
  }
  if (!res.ok) {
    return { success: false, error: 'Erro de comunicação com o servidor' };
  }
  return await res.json();
}
