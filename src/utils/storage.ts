import { ServiceItem, PlanItem } from '../types';
import { setAdminToken, setCachedUser } from './authFetch';

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
  status: string;
  // Optional fields present on account-linked orders.
  accountId?: string;
  serviceType?: string;
  postUrl?: string;
  couponCode?: string;
  couponDiscountPercent?: number;
  // Mercado Pago PIX fields.
  mpPaymentId?: string;
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  pixTicketUrl?: string;
  paymentStatus?: string;
  pixError?: string;
  // SMM delivery fields.
  smmOrderId?: string;
  smmStatus?: string;
  smmStartCount?: string;
  smmRemains?: string;
}

export async function fetchSmmBalance(): Promise<{ balance?: string; currency?: string; error?: string }> {
  try {
    const res = await fetch('/api/smm/balance');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || 'Falha ao consultar saldo.' };
    return data;
  } catch {
    return { error: 'Erro de conexão.' };
  }
}

export async function fetchSmmServices(): Promise<{ services: any[]; error?: string }> {
  try {
    const res = await fetch('/api/smm/services');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { services: [], error: data.error || 'Falha ao listar serviços.' };
    return { services: Array.isArray(data) ? data : [] };
  } catch {
    return { services: [], error: 'Erro de conexão.' };
  }
}

export interface PaymentStatusResult {
  status: string;
  paid: boolean;
  pix: { qrCode: string; qrCodeBase64: string; ticketUrl: string };
  pixError?: string;
}

export async function fetchOrderPayment(orderId: string): Promise<PaymentStatusResult | null> {
  try {
    const res = await fetch(`/api/my/orders/${encodeURIComponent(orderId)}/payment`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface GeneratePixResult {
  ok: boolean;
  pix?: { qrCode: string; qrCodeBase64: string; ticketUrl: string };
  error?: string;
}

// Generate (or regenerate) the PIX charge for a pending order.
export async function generateOrderPix(orderId: string, regenerate = false): Promise<GeneratePixResult> {
  try {
    const res = await fetch(`/api/my/orders/${encodeURIComponent(orderId)}/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regenerate })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Falha ao gerar o PIX.' };
    return { ok: true, pix: data.pix };
  } catch {
    return { ok: false, error: 'Erro de conexão.' };
  }
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

// Orders belonging to the logged-in client.
export async function fetchMyOrders(): Promise<AdminOrder[]> {
  try {
    const res = await fetch('/api/my/orders');
    if (!res.ok) throw new Error('Failed to fetch my orders');
    return await res.json();
  } catch (error) {
    console.error('Error fetching my orders:', error);
    return [];
  }
}

export interface NewOrderInput {
  platform: string;
  serviceType: string;
  serviceLabel: string;
  quantity: number;
  price: number;
  paymentMethod: 'PIX' | 'Card';
  targetProfile: string;
  postUrl?: string;
  couponCode?: string;
}

// --- Flash offer / promo bar coupon ---
export interface OfferConfig {
  active: boolean;
  text: string;
  discountPercent: number;
  couponCode: string;
  endsAt: string;
}

export interface OfferSettings {
  enabled: boolean;
  text: string;
  discountPercent: number;
  couponCode: string;
  endsAt: string;
}

// Public offer config (drives the promo bar + checkout coupon).
export async function fetchOffer(): Promise<OfferConfig | null> {
  try {
    const res = await fetch('/api/offer');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Admin: full offer settings.
export async function fetchOfferAdmin(): Promise<OfferSettings | null> {
  try {
    const res = await fetch('/api/offer/admin');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveOffer(data: OfferSettings): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/offer', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const out = await res.json().catch(() => ({}));
  return res.ok ? { ok: true } : { ok: false, error: out.error || 'Falha ao salvar a oferta.' };
}

// --- Editable site pages (privacy / terms / warranty) ---
export type PageSlug = 'privacy' | 'terms' | 'warranty';

export interface SitePage {
  slug: PageSlug;
  title: string;
  html: string;
  updatedAt: string;
}

export async function fetchPage(slug: PageSlug): Promise<SitePage | null> {
  try {
    const res = await fetch(`/api/pages/${slug}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function savePageContent(slug: PageSlug, data: { title: string; html: string }): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/pages/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const out = await res.json().catch(() => ({}));
  return res.ok ? { ok: true } : { ok: false, error: out.error || 'Falha ao salvar a página.' };
}

// --- Floating widgets / Sofia chatbot ---
export interface ChatbotQA { question: string; answer: string; }
export interface ChatbotConfig {
  chatEnabled: boolean;
  whatsappEnabled: boolean;
  name: string;
  role: string;
  greeting: string;
  fallback: string;
  qa: ChatbotQA[];
}

export async function fetchChatbot(): Promise<ChatbotConfig | null> {
  try {
    const res = await fetch('/api/chatbot');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveChatbot(data: ChatbotConfig): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/chatbot', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const out = await res.json().catch(() => ({}));
  return res.ok ? { ok: true } : { ok: false, error: out.error || 'Falha ao salvar o assistente.' };
}

// Create an order for the logged-in client (status starts awaiting payment).
export async function createMyOrder(input: NewOrderInput): Promise<{ ok: boolean; order?: AdminOrder; error?: string }> {
  try {
    const res = await fetch('/api/my/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Falha ao criar o pedido.' };
    return { ok: true, order: data.order };
  } catch {
    return { ok: false, error: 'Falha de conexão ao criar o pedido.' };
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

// --- Admin account management (real registered accounts) ---
export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'cliente';
  avatar: string;
  blocked: boolean;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
}

export async function fetchAdminAccounts(): Promise<AdminAccount[]> {
  const res = await fetch('/api/accounts');
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return await res.json();
}

export interface AccountInput {
  name: string;
  email: string;
  phone?: string;
  role?: 'admin' | 'cliente';
  password?: string;
  blocked?: boolean;
}

export async function createAdminAccount(input: AccountInput): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { ok: true } : { ok: false, error: data.error || 'Falha ao criar a conta.' };
}

export async function updateAdminAccount(id: string, input: Partial<AccountInput>): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/accounts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { ok: true } : { ok: false, error: data.error || 'Falha ao atualizar a conta.' };
}

export async function resetAdminAccountPassword(id: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/accounts/${encodeURIComponent(id)}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { ok: true } : { ok: false, error: data.error || 'Falha ao redefinir a senha.' };
}

export async function deleteAdminAccount(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/accounts/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  return res.ok ? { ok: true } : { ok: false, error: data.error || 'Falha ao excluir a conta.' };
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
  plansEnabled?: boolean;
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

export interface CompanySettings {
  footerDescription: string;
  copyrightText: string;
  footerDisclaimer: string;
  contactEmail: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  address: string;
  socialInstagram: string;
  socialYoutube: string;
  socialTiktok: string;
  socialFacebook: string;
  socialTwitter: string;
  socialKwai: string;
}

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  footerDescription:
    'Especialistas em marketing de alta performance de redes sociais desde 2018. Líderes nacionais no provimento de engajamento acelerado estável com contas reais brasileiras.',
  copyrightText: 'ImpulsioneGram. Todos os direitos reservados. CNPJ: 00.322.155/0001-99.',
  footerDisclaimer:
    'Isenção de responsabilidade: ImpulsioneGram é uma assessoria privada independente de engajamento social. Não possuímos representação oficial, patrocínio ou vínculo com as marcas registradas Instagram, TikTok, Facebook, YouTube, Twitter/X ou parentes correlatos. Todas as marcas nominadas servem meramente como caráter descritivo técnico informacional.',
  contactEmail: 'contato@impulsionegram.com.br',
  whatsappNumber: '5511999999999',
  whatsappDisplay: '(11) 99999-9999',
  address: 'Av. Paulista, 1000 - Bela Vista - São Paulo / SP',
  socialInstagram: 'https://instagram.com',
  socialYoutube: 'https://youtube.com',
  socialTiktok: 'https://tiktok.com',
  socialFacebook: '',
  socialTwitter: '',
  socialKwai: ''
};

export async function fetchCompanySettings(): Promise<CompanySettings> {
  try {
    const res = await fetch('/api/company');
    if (!res.ok) throw new Error('Failed to fetch company settings');
    return await res.json();
  } catch (error) {
    console.error('Error fetching company settings API:', error);
    return { ...DEFAULT_COMPANY_SETTINGS };
  }
}

export async function saveCompanySettingsToServer(company: CompanySettings): Promise<void> {
  const res = await fetch('/api/company', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(company)
  });
  if (!res.ok) throw new Error('Failed to save company settings on server');
}

// --- Blog ---
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string; // HTML
  categories: string[];
  image: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
  publishedAt?: string;
}

export async function fetchBlogCategories(): Promise<string[]> {
  try {
    const res = await fetch('/api/blog/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return [];
  }
}

export async function addBlogCategoryToServer(name: string): Promise<void> {
  const res = await fetch('/api/blog/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to add category');
}

export async function deleteBlogCategoryFromServer(name: string): Promise<void> {
  const res = await fetch(`/api/blog/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
}

export async function fetchBlogTags(): Promise<string[]> {
  try {
    const res = await fetch('/api/blog/tags');
    if (!res.ok) throw new Error('Failed to fetch tags');
    return await res.json();
  } catch (error) {
    console.error('Error fetching blog tags:', error);
    return [];
  }
}

export async function deleteBlogTagFromServer(name: string): Promise<void> {
  const res = await fetch(`/api/blog/tags/${encodeURIComponent(name)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete tag');
}

export interface BlogComment {
  id: string;
  postSlug: string;
  author: string;
  email: string;
  content: string;
  status: 'approved' | 'pending' | 'hidden';
  createdAt: string;
}

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch('/api/blog/posts');
    if (!res.ok) throw new Error('Failed to fetch blog posts');
    return await res.json();
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function saveBlogPostToServer(post: BlogPost): Promise<void> {
  const res = await fetch('/api/blog/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save blog post');
  }
}

export async function deleteBlogPostFromServer(slug: string): Promise<void> {
  const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete blog post');
}

export async function fetchPostComments(slug: string): Promise<BlogComment[]> {
  try {
    const res = await fetch(`/api/blog/comments?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return await res.json();
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function fetchAllComments(): Promise<BlogComment[]> {
  try {
    const res = await fetch('/api/blog/comments?all=1');
    if (!res.ok) throw new Error('Failed to fetch comments');
    return await res.json();
  } catch (error) {
    console.error('Error fetching all comments:', error);
    return [];
  }
}

export async function postComment(
  postSlug: string,
  author: string,
  email: string,
  content: string,
  recaptchaToken?: string | null
): Promise<{ ok: boolean; pending?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/blog/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postSlug, author, email, content, recaptchaToken })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Não foi possível enviar o comentário.' };
    return { ok: true, pending: data.pending !== false };
  } catch (error) {
    console.error('Error posting comment:', error);
    return { ok: false, error: 'Não foi possível enviar o comentário. Verifique sua conexão e tente novamente.' };
  }
}

export async function setCommentStatus(id: string, status: 'approved' | 'hidden'): Promise<void> {
  const res = await fetch(`/api/blog/comments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update comment');
}

export async function deleteCommentFromServer(id: string): Promise<void> {
  const res = await fetch(`/api/blog/comments/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete comment');
}

// --- Testimonials (home reviews) ---
export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  platformUsed: string;
  verified: boolean;
  date: string;
  status: 'approved' | 'pending' | 'hidden';
  createdAt: string;
}

export async function fetchTestimonials(): Promise<TestimonialItem[]> {
  try {
    const res = await fetch('/api/testimonials');
    if (!res.ok) throw new Error('Failed to fetch testimonials');
    return await res.json();
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

export async function fetchAllTestimonials(): Promise<TestimonialItem[]> {
  try {
    const res = await fetch('/api/testimonials?all=1');
    if (!res.ok) throw new Error('Failed to fetch testimonials');
    return await res.json();
  } catch (error) {
    console.error('Error fetching all testimonials:', error);
    return [];
  }
}

export async function submitTestimonial(
  payload: { name: string; role: string; rating: number; text: string; platformUsed: string },
  recaptchaToken?: string | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, recaptchaToken })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Falha ao enviar depoimento.' };
    return { ok: true };
  } catch (error) {
    console.error('Error submitting testimonial:', error);
    return { ok: false, error: 'Erro de conexão ao enviar depoimento.' };
  }
}

export async function saveTestimonialToServer(payload: Partial<TestimonialItem>): Promise<TestimonialItem | null> {
  const res = await fetch('/api/testimonials/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save testimonial');
  }
  return (await res.json()).testimonial;
}

export async function setTestimonialStatus(id: string, status: 'approved' | 'hidden' | 'pending'): Promise<void> {
  const res = await fetch(`/api/testimonials/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update testimonial');
}

export async function deleteTestimonialFromServer(id: string): Promise<void> {
  const res = await fetch(`/api/testimonials/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete testimonial');
}

// --- Blocked IPs (antispam) ---
export interface BlockedIpRecord {
  ip: string;
  reason: string;
  createdAt: string;
}

export async function fetchBlockedIps(): Promise<BlockedIpRecord[]> {
  try {
    const res = await fetch('/api/blocked-ips');
    if (!res.ok) throw new Error('Failed to fetch blocked IPs');
    return await res.json();
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    return [];
  }
}

export async function unblockIpFromServer(ip: string): Promise<void> {
  const res = await fetch(`/api/blocked-ips/${encodeURIComponent(ip)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to unblock IP');
}

// --- Contact messages ---
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
}

export async function submitContactMessage(
  payload: { name: string; email: string; subject: string; message: string },
  recaptchaToken?: string | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, recaptchaToken })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Falha ao enviar a mensagem.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Erro de conexão ao enviar a mensagem.' };
  }
}

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  try {
    const res = await fetch('/api/contact');
    if (!res.ok) throw new Error('Failed to fetch contact messages');
    return await res.json();
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return [];
  }
}

export async function setContactMessageStatus(id: string, status: 'read' | 'unread'): Promise<void> {
  const res = await fetch(`/api/contact/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update message');
}

export async function deleteContactMessage(id: string): Promise<void> {
  const res = await fetch(`/api/contact/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete message');
}

export interface CookieChoices {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentRecord {
  id: string;
  choices: CookieChoices;
  userAgent: string;
  createdAt: string;
}

export async function recordCookieConsent(id: string, choices: CookieChoices): Promise<void> {
  try {
    await fetch('/api/cookie-consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, choices })
    });
  } catch (error) {
    console.error('Error recording cookie consent:', error);
  }
}

export async function fetchCookieConsents(): Promise<CookieConsentRecord[]> {
  try {
    const res = await fetch('/api/cookie-consents');
    if (!res.ok) throw new Error('Failed to fetch cookie consents');
    return await res.json();
  } catch (error) {
    console.error('Error fetching cookie consents:', error);
    return [];
  }
}

export interface IntegrationSettings {
  mercadoPagoAccessToken: string;
  mercadoPagoPublicKey: string;
  smmApiUrl: string;
  smmApiKey: string;
  emailProvider: 'smtp' | 'resend';
  resendApiKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFromName: string;
  smtpFromEmail: string;
  smtpSecure: boolean;
  recaptchaSiteKey: string;
  recaptchaSecretKey: string;
  recaptchaMinScore: string;
}

export async function fetchPublicConfig(): Promise<{ recaptchaSiteKey: string }> {
  try {
    const res = await fetch('/api/public-config');
    if (!res.ok) throw new Error('failed');
    return await res.json();
  } catch (error) {
    return { recaptchaSiteKey: '' };
  }
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
      smmApiKey: '',
      emailProvider: 'smtp',
      resendApiKey: '',
      smtpHost: '',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
      smtpFromName: '',
      smtpFromEmail: '',
      smtpSecure: false,
      recaptchaSiteKey: '',
      recaptchaSecretKey: '',
      recaptchaMinScore: '0.5'
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

// --- Custom JS / Analytics code injection ---
export interface AnalyticsSettings {
  siteHeadCode: string;
  siteBodyCode: string;
  siteFooterCode: string;
  articleHeadCode: string;
  articleBodyCode: string;
  articleFooterCode: string;
}

export const EMPTY_ANALYTICS_SETTINGS: AnalyticsSettings = {
  siteHeadCode: '',
  siteBodyCode: '',
  siteFooterCode: '',
  articleHeadCode: '',
  articleBodyCode: '',
  articleFooterCode: ''
};

export async function fetchAnalyticsSettings(): Promise<AnalyticsSettings> {
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics settings');
    return { ...EMPTY_ANALYTICS_SETTINGS, ...(await res.json()) };
  } catch (error) {
    console.error('Error fetching analytics API:', error);
    return { ...EMPTY_ANALYTICS_SETTINGS };
  }
}

export async function saveAnalyticsSettingsToServer(settings: AnalyticsSettings): Promise<void> {
  const res = await fetch('/api/analytics', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to save analytics settings on server');
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
  const data = await res.json();
  // Persist the signed admin token so subsequent API calls are authorized.
  if (data?.token) setAdminToken(data.token);
  return data;
}

// --- Accounts / authenticated user ---
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'cliente';
  avatar: string;
  createdAt: string;
}

// Universal login (accepts e-mail or the admin username).
export async function loginUser(identifier: string, password: string): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identifier, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.token) return { ok: false, error: data.error || 'E-mail ou senha incorretos.' };
    setAdminToken(data.token);
    const user = await fetchMe();
    if (user) setCachedUser(user);
    return { ok: true, user: user || undefined };
  } catch {
    return { ok: false, error: 'Falha de conexão com o servidor.' };
  }
}

export async function registerAccount(input: { name: string; email: string; phone?: string; password: string }): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.token) return { ok: false, error: data.error || 'Não foi possível criar a conta.' };
    setAdminToken(data.token);
    setCachedUser(data.user);
    return { ok: true, user: data.user };
  } catch {
    return { ok: false, error: 'Falha de conexão com o servidor.' };
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function updateProfile(input: { name?: string; email?: string; phone?: string; avatar?: string }): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Falha ao salvar o perfil.' };
    if (data?.token) setAdminToken(data.token);
    if (data?.user) setCachedUser(data.user);
    return { ok: true, user: data.user };
  } catch {
    return { ok: false, error: 'Falha de conexão com o servidor.' };
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Falha ao trocar a senha.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Falha de conexão com o servidor.' };
  }
}

// Check whether an e-mail/phone already has an account (used at checkout).
export async function checkAccountExists(email: string, phone: string): Promise<{ exists: boolean; emailExists: boolean; phoneExists: boolean }> {
  try {
    const res = await fetch('/api/auth/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone })
    });
    if (!res.ok) return { exists: false, emailExists: false, phoneExists: false };
    return await res.json();
  } catch {
    return { exists: false, emailExists: false, phoneExists: false };
  }
}
