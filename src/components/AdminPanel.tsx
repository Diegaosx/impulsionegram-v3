import React, { useState, useMemo, useEffect } from 'react';
import { ServiceItem, PlanItem, SocialPlatform, ServicePackage, ServiceFaq } from '../types';
import {
  AdminOrder, HomeContent, FaqEntry, FaqCategory, IntegrationSettings, fetchIntegrations, saveIntegrationsToServer, fetchPublicConfig,
  GeneralSettings, fetchGeneralSettings, saveGeneralSettingsToServer, uploadAsset,
  CompanySettings, fetchCompanySettings, saveCompanySettingsToServer,
  CookieConsentRecord, fetchCookieConsents,
  AnalyticsSettings, EMPTY_ANALYTICS_SETTINGS, fetchAnalyticsSettings, saveAnalyticsSettingsToServer,
  fetchSmmBalance, fetchSmmServices, runSmmSync, fetchOrders, reportOrderIssue, sendTestEmail,
  AdminAccount, fetchAdminAccounts, createAdminAccount, updateAdminAccount,
  resetAdminAccountPassword, deleteAdminAccount,
  OfferSettings, fetchOfferAdmin, saveOffer,
  PageSlug, fetchPage, savePageContent,
  ChatbotConfig, fetchChatbot, saveChatbot,
  slugify, serviceSlug
} from '../utils/storage';
import RichTextEditor from './RichTextEditor';
import KeywordsField from './KeywordsField';
import { normalizeKeywords } from '../utils/keywords';
import { setAppTimezone, formatDateTime } from '../utils/datetime';
import { orderStatusInfo } from '../utils/orderStatus';
import BlogAdmin from './BlogAdmin';
import TestimonialsAdmin from './TestimonialsAdmin';
import ServiceReviewsAdmin from './ServiceReviewsAdmin';
import TicketsAdmin from './TicketsAdmin';
import {
  X, Plus, Pencil, Trash2, RotateCcw, LayoutDashboard, ShoppingBag, Star, Package,
  BarChart3, Settings, ShieldCheck, HelpCircle, Save, Check, Copy, AlertCircle,
  TrendingUp, CircleDollarSign, Compass, Layers, Globe, Filter, MessageCircle,
  User, Lock, Users, Ban, UserCheck, CreditCard, KeyRound, Eye, EyeOff, Plug, Flame, ArrowLeftCircle, Bot,
  Image as ImageIcon, Upload, Clock, Palette, Type, SlidersHorizontal,
  Mail, Phone, MapPin, Share2, PanelBottom, Cookie, Newspaper, Code2, Quote, Inbox, Search,
  ArrowUp, ArrowDown
} from 'lucide-react';
import {
  Catalog, SocialPlatformItem, ServiceTypeItem, DEFAULT_CATALOG,
  fetchCatalog, fetchCatalogInUse, saveCatalog as saveCatalogToServer, primeCatalog
} from '../utils/catalog';
import PlatformGlyph, { PLATFORM_ICON_NAMES } from './PlatformGlyph';
import AdminPagination, { clampPage, pageSlice } from './AdminPagination';
import UserOrdersModal, { ordersOfUser } from './UserOrdersModal';
import { listThemes } from '../themes';
import { DEFAULT_HOME_ORDER, HOME_SECTIONS, normalizeHomeOrder } from '../site/homeSections';

interface AdminPanelProps {
  services: ServiceItem[];
  plans: PlanItem[];
  orders: AdminOrder[];
  homeContent: HomeContent | null;
  onUpdateServices: (services: ServiceItem[]) => void;
  onUpdatePlans: (plans: PlanItem[]) => void;
  onUpdateOrders: (orders: AdminOrder[]) => void;
  onUpdateHomeContent: (content: HomeContent) => void;
  onLogout: () => void;
  onExit: () => void;
}

export default function AdminPanel({
  services,
  plans,
  orders,
  homeContent,
  onUpdateServices,
  onUpdatePlans,
  onUpdateOrders,
  onUpdateHomeContent,
  onLogout,
  onExit
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'plans' | 'orders' | 'users' | 'home' | 'offer' | 'chatbot' | 'blog' | 'testimonials' | 'messages' | 'general' | 'contact' | 'integrations' | 'analytics' | 'cookies'>('dashboard');

  // Sofia assistant / floating widgets settings
  const [chatbotForm, setChatbotForm] = useState<ChatbotConfig>({
    chatEnabled: true, whatsappEnabled: true, name: 'Sofia IA', role: 'Especialista', greeting: '', fallback: '', qa: []
  });
  const [chatbotLoading, setChatbotLoading] = useState(false);
  const [chatbotSaving, setChatbotSaving] = useState(false);

  // Plans section visibility (mirrors general settings: plansEnabled)
  const [plansSectionEnabled, setPlansSectionEnabled] = useState(true);
  useEffect(() => {
    fetchGeneralSettings().then((g) => setPlansSectionEnabled(g?.plansEnabled !== false)).catch(() => {});
  }, []);

  // Flash offer (top promo bar + coupon) settings
  const [offerForm, setOfferForm] = useState<OfferSettings>({
    enabled: false, text: '', discountPercent: 0, couponCode: '', endsAt: ''
  });
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerSaving, setOfferSaving] = useState(false);

  // "Conteúdo Principal" hub: which area is open + the legal-page editor state.
  const [contentView, setContentView] = useState<'menu' | 'home' | PageSlug>('menu');
  const [pageEditor, setPageEditor] = useState<{ slug: PageSlug; title: string; html: string }>({ slug: 'privacy', title: '', html: '' });
  const [pageLoading, setPageLoading] = useState(false);
  const [pageSaving, setPageSaving] = useState(false);

  // Users management states (real registered accounts)
  const [users, setUsers] = useState<AdminAccount[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchText, setUserSearchText] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'todos' | 'admin' | 'cliente'>('todos');
  const [userStatusFilter, setUserStatusFilter] = useState<'todos' | 'ativos' | 'bloqueados'>('todos');
  const [userBuyerFilter, setUserBuyerFilter] = useState<'todos' | 'com' | 'sem'>('todos');
  const [userPage, setUserPage] = useState(1);
  const [userPerPage, setUserPerPage] = useState(25);
  // Pedidos do usuário, abertos pela coluna "Compras".
  const [ordersOfUserModal, setOrdersOfUserModal] = useState<AdminAccount | null>(null);

  // Filtros e paginação da aba de pedidos.
  const [orderSearchText, setOrderSearchText] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('todos');
  const [orderPlatformFilter, setOrderPlatformFilter] = useState('todos');
  const [orderPeriodFilter, setOrderPeriodFilter] = useState<'todos' | 'hoje' | '7' | '30'>('todos');
  const [orderPage, setOrderPage] = useState(1);
  const [orderPerPage, setOrderPerPage] = useState(25);
  // Account create/edit modal
  const emptyAccountForm = { id: '', name: '', email: '', phone: '', role: 'cliente' as 'admin' | 'cliente', password: '', blocked: false };
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalMode, setAccountModalMode] = useState<'create' | 'edit'>('create');
  const [accountSaving, setAccountSaving] = useState(false);
  // Reset-password modal
  const [pwdResetAccount, setPwdResetAccount] = useState<AdminAccount | null>(null);
  const [pwdResetValue, setPwdResetValue] = useState('');
  // Order edit modal
  const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);

  // Home Content Editor Form
  const [homeForm, setHomeForm] = useState<{
    heroTitle: string;
    heroSubtitle: string;
    alertBannerText: string;
    companyWhatsApp: string;
    companyEmail: string;
    faqs: FaqEntry[];
  }>({
    heroTitle: '',
    heroSubtitle: '',
    alertBannerText: '',
    companyWhatsApp: '',
    companyEmail: '',
    faqs: []
  });

  // Sync state for homeForm when homeContent loads
  useEffect(() => {
    if (homeContent) {
      setHomeForm({
        heroTitle: homeContent.heroTitle || '',
        heroSubtitle: homeContent.heroSubtitle || '',
        alertBannerText: homeContent.alertBannerText || '',
        companyWhatsApp: homeContent.companyWhatsApp || '',
        companyEmail: homeContent.companyEmail || '',
        faqs: Array.isArray(homeContent.faqs) ? homeContent.faqs.map(f => ({ ...f })) : []
      });
    }
  }, [homeContent]);

  // Integration settings (payment gateway + SMM delivery panel)
  const [integrationsForm, setIntegrationsForm] = useState<IntegrationSettings>({
    paymentProvider: 'mercadopago',
    mercadoPagoAccessToken: '',
    mercadoPagoPublicKey: '',
    wooviAppId: '',
    smmApiUrl: '',
    smmApiKey: '',
    smmSyncHours: '6',
    orderExpireHours: '6',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    smtpFromName: '',
    smtpFromEmail: '',
    smtpSecure: false,
    recaptchaSiteKey: '',
    recaptchaSecretKey: '',
    recaptchaMinScore: '0.5',
    rapidApiKey: '',
    rapidApiHost: 'social-api4.p.rapidapi.com'
  });
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [isSavingIntegrations, setIsSavingIntegrations] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // SMM panel helpers (balance + services lookup)
  const [smmInfo, setSmmInfo] = useState<{ balance?: string; currency?: string; error?: string } | null>(null);
  const [smmServicesList, setSmmServicesList] = useState<any[]>([]);
  const [smmLoading, setSmmLoading] = useState(false);

  const handleSmmBalance = async () => {
    setSmmLoading(true);
    setSmmInfo(await fetchSmmBalance());
    setSmmLoading(false);
  };
  const handleSmmServices = async () => {
    setSmmLoading(true);
    const r = await fetchSmmServices();
    if (r.error) triggerError(r.error);
    setSmmServicesList(r.services.slice(0, 200));
    setSmmLoading(false);
  };

  // Teste da configuração de e-mail.
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTestEmail = async () => {
    setTestEmailSending(true);
    setTestEmailResult(null);
    const r = await sendTestEmail(testEmailTo.trim() || undefined);
    setTestEmailResult(r.ok
      ? { ok: true, message: `E-mail de teste enviado para ${r.to}. Confira a caixa de entrada (e o spam).` }
      : { ok: false, message: r.error || 'Falha ao enviar.' });
    setTestEmailSending(false);
  };

  // Varredura manual dos pedidos em aberto (a automática roda sozinha).
  const [smmSyncing, setSmmSyncing] = useState(false);
  const [smmSyncResult, setSmmSyncResult] = useState<string>('');

  const handleSmmSync = async () => {
    setSmmSyncing(true);
    setSmmSyncResult('');
    const r = await runSmmSync();
    if (r.error) {
      triggerError(r.error);
    } else if (r.report) {
      const { checked, delivered, canceled, expired } = r.report;
      setSmmSyncResult(
        `${checked} pedido(s) consultado(s) no painel · ${delivered} entregue(s) · ` +
        `${canceled} cancelado(s) pelo painel · ${expired} expirado(s) sem pagamento.`
      );
      // A varredura mexeu nos pedidos no servidor; recarrega a lista da aba
      // "Pedidos" para não deixar status velho na tela.
      if (checked || canceled || expired) onUpdateOrders(await fetchOrders());
    }
    setSmmSyncing(false);
  };

  // Load integration settings when the dashboard mounts
  useEffect(() => {
    async function loadIntegrations() {
      try {
        setIntegrationsLoading(true);
        const data = await fetchIntegrations();
        setIntegrationsForm(data);
        const cfg = await fetchPublicConfig();
        setPublicUrl(cfg.publicUrl || (typeof window !== 'undefined' ? window.location.origin : ''));
      } catch (e) {
        console.error('Error loading integrations:', e);
      } finally {
        setIntegrationsLoading(false);
      }
    }
    loadIntegrations();
  }, []);

  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingIntegrations(true);
    try {
      await saveIntegrationsToServer(integrationsForm);
      triggerSuccess('Configurações de integração salvas com sucesso!');
    } catch (err) {
      triggerError('Falha ao salvar as configurações de integração.');
    } finally {
      setIsSavingIntegrations(false);
    }
  };

  // Custom JS / Analytics code snippets (site + article head/body/footer)
  const [analyticsForm, setAnalyticsForm] = useState<AnalyticsSettings>({ ...EMPTY_ANALYTICS_SETTINGS });
  const [isSavingAnalytics, setIsSavingAnalytics] = useState(false);

  useEffect(() => {
    fetchAnalyticsSettings()
      .then(setAnalyticsForm)
      .catch((e) => console.error('Error loading analytics settings:', e));
  }, []);

  const handleSaveAnalytics = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAnalytics(true);
    try {
      await saveAnalyticsSettingsToServer(analyticsForm);
      triggerSuccess('Códigos de JS/Analytics salvos! Recarregue o site para aplicar.');
    } catch (err) {
      triggerError('Falha ao salvar os códigos de JS/Analytics.');
    } finally {
      setIsSavingAnalytics(false);
    }
  };

  // General site settings (branding, SEO, timezone, theme)
  const [generalForm, setGeneralForm] = useState<GeneralSettings>({
    siteName: '',
    logoUrl: '',
    faviconUrl: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    timezone: 'America/Recife',
    theme: 'default',
    homeSections: DEFAULT_HOME_ORDER
  });
  const [generalLoading, setGeneralLoading] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    async function loadGeneral() {
      try {
        setGeneralLoading(true);
        const data = await fetchGeneralSettings();
        // Saneia a ordem antes de editar: um registro antigo não pode esconder
        // uma seção que passou a existir depois da última gravação.
        setGeneralForm({ ...data, homeSections: normalizeHomeOrder(data?.homeSections) });
      } catch (e) {
        console.error('Error loading general settings:', e);
      } finally {
        setGeneralLoading(false);
      }
    }
    loadGeneral();
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGeneral(true);
    try {
      await saveGeneralSettingsToServer(generalForm);
      setAppTimezone(generalForm.timezone);
      triggerSuccess('Configurações gerais salvas! Recarregue o site para ver as alterações de marca/SEO.');
    } catch (err) {
      triggerError('Falha ao salvar as configurações gerais.');
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleUploadAsset = async (
    file: File | undefined,
    folder: string,
    field: 'logoUrl' | 'faviconUrl',
    setUploading: (v: boolean) => void
  ) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAsset(file, folder);
      setGeneralForm(prev => ({ ...prev, [field]: url }));
      triggerSuccess('Upload concluído! Clique em "Salvar Configurações" para aplicar.');
    } catch (err: any) {
      triggerError(err?.message || 'Falha no upload do arquivo.');
    } finally {
      setUploading(false);
    }
  };

  // Company / contact / footer settings
  const [companyForm, setCompanyForm] = useState<CompanySettings>({
    footerDescription: '',
    copyrightText: '',
    footerDisclaimer: '',
    contactEmail: '',
    whatsappNumber: '',
    whatsappDisplay: '',
    address: '',
    socialInstagram: '',
    socialYoutube: '',
    socialTiktok: '',
    socialFacebook: '',
    socialTwitter: '',
    socialKwai: ''
  });
  const [companyLoading, setCompanyLoading] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  useEffect(() => {
    async function loadCompany() {
      try {
        setCompanyLoading(true);
        const data = await fetchCompanySettings();
        setCompanyForm(data);
      } catch (e) {
        console.error('Error loading company settings:', e);
      } finally {
        setCompanyLoading(false);
      }
    }
    loadCompany();
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompany(true);
    try {
      await saveCompanySettingsToServer(companyForm);
      triggerSuccess('Dados de contato/rodapé salvos! Recarregue o site para ver as alterações.');
    } catch (err) {
      triggerError('Falha ao salvar os dados de contato.');
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Cookie consent (LGPD) records
  const [cookieConsents, setCookieConsents] = useState<CookieConsentRecord[]>([]);
  const [cookieConsentsLoading, setCookieConsentsLoading] = useState(false);

  const loadCookieConsents = async () => {
    try {
      setCookieConsentsLoading(true);
      const data = await fetchCookieConsents();
      setCookieConsents(data);
    } catch (e) {
      console.error('Error loading cookie consents:', e);
    } finally {
      setCookieConsentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'cookies') loadCookieConsents();
  }, [activeTab]);

  // Load registered accounts from the backend when the dashboard mounts.
  const loadUsersData = async () => {
    try {
      setUsersLoading(true);
      const data = await fetchAdminAccounts();
      setUsers(data);
    } catch (e) {
      console.error('Error loading accounts:', e);
      triggerError('Erro ao carregar as contas.');
    } finally {
      setUsersLoading(false);
    }
  };
  useEffect(() => { loadUsersData(); }, []);

  // Load the flash-offer settings.
  useEffect(() => {
    setOfferLoading(true);
    fetchOfferAdmin()
      .then((o) => { if (o) setOfferForm(o); })
      .finally(() => setOfferLoading(false));
  }, []);

  // datetime-local <-> ISO helpers (local time).
  const isoToLocalInput = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const localInputToIso = (val: string) => {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  };

  const handleSaveOffer = async () => {
    setOfferSaving(true);
    const res = await saveOffer(offerForm);
    setOfferSaving(false);
    if (res.ok) triggerSuccess('Oferta atualizada com sucesso!');
    else triggerError(res.error || 'Falha ao salvar a oferta.');
  };

  // Load the Sofia assistant config.
  useEffect(() => {
    setChatbotLoading(true);
    fetchChatbot()
      .then((c) => { if (c) setChatbotForm(c); })
      .finally(() => setChatbotLoading(false));
  }, []);

  const handleSaveChatbot = async () => {
    if (!chatbotForm.name.trim()) { triggerError('Informe o nome do assistente.'); return; }
    setChatbotSaving(true);
    const res = await saveChatbot({ ...chatbotForm, qa: chatbotForm.qa.filter(q => q.question.trim() && q.answer.trim()) });
    setChatbotSaving(false);
    if (res.ok) triggerSuccess('Assistente atualizado com sucesso!');
    else triggerError(res.error || 'Falha ao salvar o assistente.');
  };

  // Open a legal/policy page in the rich editor.
  const openPageEditor = (slug: PageSlug) => {
    setContentView(slug);
    setPageLoading(true);
    setPageEditor({ slug, title: '', html: '' });
    fetchPage(slug)
      .then((p) => { if (p) setPageEditor({ slug, title: p.title, html: p.html }); })
      .finally(() => setPageLoading(false));
  };

  const handleSavePage = async () => {
    if (!pageEditor.title.trim()) { triggerError('Informe o título da página.'); return; }
    setPageSaving(true);
    const res = await savePageContent(pageEditor.slug, { title: pageEditor.title, html: pageEditor.html });
    setPageSaving(false);
    if (res.ok) triggerSuccess('Página salva com sucesso!');
    else triggerError(res.error || 'Falha ao salvar a página.');
  };

  const openCreateAccount = () => {
    setAccountForm(emptyAccountForm);
    setAccountModalMode('create');
    setIsAccountModalOpen(true);
  };

  const openEditAccount = (acc: AdminAccount) => {
    setAccountForm({ id: acc.id, name: acc.name, email: acc.email, phone: acc.phone, role: acc.role, password: '', blocked: acc.blocked });
    setAccountModalMode('edit');
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!accountForm.name.trim() || !accountForm.email.trim()) {
      triggerError('Nome e e-mail são obrigatórios.');
      return;
    }
    if (accountModalMode === 'create' && accountForm.password.length < 6) {
      triggerError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    setAccountSaving(true);
    const res = accountModalMode === 'create'
      ? await createAdminAccount({
          name: accountForm.name, email: accountForm.email, phone: accountForm.phone,
          role: accountForm.role, password: accountForm.password
        })
      : await updateAdminAccount(accountForm.id, {
          name: accountForm.name, email: accountForm.email, phone: accountForm.phone,
          role: accountForm.role, blocked: accountForm.blocked
        });
    setAccountSaving(false);
    if (res.ok) {
      triggerSuccess(accountModalMode === 'create' ? 'Conta criada com sucesso!' : 'Conta atualizada com sucesso!');
      setIsAccountModalOpen(false);
      loadUsersData();
    } else {
      triggerError(res.error || 'Falha ao salvar a conta.');
    }
  };

  const handleToggleUserStatus = async (user: AdminAccount) => {
    const res = await updateAdminAccount(user.id, { blocked: !user.blocked });
    if (res.ok) {
      triggerSuccess(`Usuário ${user.blocked ? 'desbloqueado' : 'bloqueado'} com sucesso!`);
      loadUsersData();
    } else {
      triggerError(res.error || 'Erro ao atualizar o status do usuário.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta conta permanentemente?')) return;
    const res = await deleteAdminAccount(userId);
    if (res.ok) {
      triggerSuccess('Conta removida com sucesso!');
      loadUsersData();
    } else {
      triggerError(res.error || 'Erro ao excluir a conta.');
    }
  };

  const handleResetPassword = async () => {
    if (!pwdResetAccount) return;
    if (pwdResetValue.length < 6) {
      triggerError('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    const res = await resetAdminAccountPassword(pwdResetAccount.id, pwdResetValue);
    if (res.ok) {
      triggerSuccess('Senha redefinida com sucesso!');
      setPwdResetAccount(null);
      setPwdResetValue('');
    } else {
      triggerError(res.error || 'Falha ao redefinir a senha.');
    }
  };

  const handleSaveHomeContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Drop blank FAQ rows before saving.
      const cleanFaqs = homeForm.faqs
        .map(f => ({ ...f, question: f.question.trim(), answer: f.answer.trim() }))
        .filter(f => f.question || f.answer);
      await onUpdateHomeContent({ ...homeForm, faqs: cleanFaqs });
      triggerSuccess('Conteúdo da página inicial atualizado com sucesso no servidor!');
    } catch (err) {
      triggerError('Falha ao atualizar conteúdo da Home.');
    }
  };

  // --- FAQ (Perguntas Frequentes) CRUD helpers ---
  const addFaq = () => setHomeForm(prev => ({
    ...prev,
    faqs: [...prev.faqs, { id: `faq-${Date.now()}`, question: '', answer: '', category: 'geral' }]
  }));
  const updateFaq = (idx: number, patch: Partial<FaqEntry>) => setHomeForm(prev => ({
    ...prev,
    faqs: prev.faqs.map((f, i) => (i === idx ? { ...f, ...patch } : f))
  }));
  const removeFaq = (idx: number) => setHomeForm(prev => ({
    ...prev,
    faqs: prev.faqs.filter((_, i) => i !== idx)
  }));
  const moveFaq = (idx: number, dir: -1 | 1) => setHomeForm(prev => {
    const arr = [...prev.faqs];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return prev;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    return { ...prev, faqs: arr };
  });
  
  // Platform filter for services
  const [servicesPlatformFilter, setServicesPlatformFilter] = useState<SocialPlatform | 'todos'>('todos');
  
  // Modals / Form editing states
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);

  // Dedicated "Página & SEO" modal (per service).
  const [pageEditingService, setPageEditingService] = useState<ServiceItem | null>(null);
  const [pageForm, setPageForm] = useState<{
    pageTitle: string; pageSubtitle: string; slug: string; pageImageUrl: string;
    pageMetaDescription: string; pageKeywords: string[]; pageDescriptionHtml: string;
  }>({
    pageTitle: '', pageSubtitle: '', slug: '', pageImageUrl: '',
    pageMetaDescription: '', pageKeywords: [], pageDescriptionHtml: ''
  });
  const [pageImageUploading, setPageImageUploading] = useState(false);

  // Dedicated per-service FAQ modal.
  const [faqEditingService, setFaqEditingService] = useState<ServiceItem | null>(null);
  const [faqForm, setFaqForm] = useState<{ faqTitle: string; faqSubtitle: string; faqs: ServiceFaq[] }>({
    faqTitle: '', faqSubtitle: '', faqs: []
  });
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);

  // New/Edit Service Form States
  const [serviceForm, setServiceForm] = useState<Omit<ServiceItem, 'id'>>({
    platform: 'instagram',
    type: 'followers',
    label: '',
    pricePerItem: 0.015,
    minQuantity: 100,
    maxQuantity: 10000,
    deliverySpeed: 'Início imediato, entrega natural',
    benefits: ['Perfis reais', 'Recarga garantida', 'Sem precisar de senha'],
    smmServiceId: '',
    smmLinkFormat: 'url' as 'url' | 'username',
    packages: [],
    slug: '',
    pageTitle: '',
    pageSubtitle: '',
    pageDescriptionHtml: ''
  });

  // New Benefit helper text
  const [newBenefitText, setNewBenefitText] = useState('');

  // Status message hooks
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 3500);
  };

  // --- STATS CALCULATIONS ---
  const stats = useMemo(() => {
    if (!Array.isArray(orders)) {
      return { totalOrders: 0, totalRevenue: 0, averageOrderPrice: 0, platformRevenue: {} };
    }
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, current) => acc + (Number(current?.price) || 0), 0);
    const averageOrderPrice = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Revenue by platform
    const platformRevenue: Record<string, number> = {};
    orders.forEach(o => {
      if (o && o.platform) {
        platformRevenue[o.platform] = (platformRevenue[o.platform] || 0) + (Number(o.price) || 0);
      }
    });

    return {
      totalOrders,
      totalRevenue,
      averageOrderPrice,
      platformRevenue
    };
  }, [orders]);

  // --- SERVICE OPERATIONS ---
  const handleEditServiceInit = (service: ServiceItem) => {
    setEditingService(service);
    setServiceForm({
      platform: service.platform,
      type: service.type,
      label: service.label,
      pricePerItem: service.pricePerItem,
      minQuantity: service.minQuantity,
      maxQuantity: service.maxQuantity,
      deliverySpeed: service.deliverySpeed,
      benefits: [...service.benefits],
      smmServiceId: service.smmServiceId || '',
      smmLinkFormat: service.smmLinkFormat || 'url',
      packages: Array.isArray(service.packages) ? service.packages.map(p => ({ ...p })) : [],
      slug: service.slug || '',
      // Existing services without a page title default to the card name.
      pageTitle: service.pageTitle || service.label || '',
      pageSubtitle: service.pageSubtitle || '',
      pageDescriptionHtml: service.pageDescriptionHtml || ''
    });
    setIsAddingService(false);
  };

  const handleAddServiceInit = () => {
    setEditingService(null);
    setServiceForm({
      platform: 'instagram',
      type: 'followers',
      label: '',
      pricePerItem: 0.015,
      minQuantity: 100,
      maxQuantity: 50000,
      deliverySpeed: 'Entrega rápida (5-15 min)',
      benefits: ['Perfis de alta qualidade', 'Prevenção contra quedas', 'Totalmente seguro'],
      smmServiceId: '',
      smmLinkFormat: 'url',
      packages: [],
      slug: '',
      pageTitle: '',
      pageSubtitle: '',
      pageDescriptionHtml: ''
    });
    setIsAddingService(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.label) {
      setErrorMessage('O nome do serviço é obrigatório.');
      return;
    }

    // Keep only valid packages (positive quantity + price), sorted by quantity.
    const cleanPackages: ServicePackage[] = (serviceForm.packages || [])
      .map(p => ({
        id: p.id || `pkg-${Date.now()}-${Math.round(p.quantity || 0)}`,
        quantity: Math.max(0, Math.round(Number(p.quantity) || 0)),
        price: Math.max(0, Number(p.price) || 0),
        label: (p.label || '').trim(),
        isPopular: !!p.isPopular
      }))
      .filter(p => p.quantity > 0 && p.price > 0)
      .sort((a, b) => a.quantity - b.quantity);

    // The core modal only owns the core fields — page content & FAQ are edited
    // in their own modals, so we never overwrite them here.
    const corePayload = {
      platform: serviceForm.platform,
      type: serviceForm.type,
      label: serviceForm.label,
      pricePerItem: serviceForm.pricePerItem,
      minQuantity: serviceForm.minQuantity,
      maxQuantity: serviceForm.maxQuantity,
      deliverySpeed: serviceForm.deliverySpeed,
      benefits: serviceForm.benefits,
      smmServiceId: serviceForm.smmServiceId,
      smmLinkFormat: serviceForm.smmLinkFormat || 'url',
      packages: cleanPackages
    };

    if (isAddingService) {
      const newService: ServiceItem = {
        ...corePayload,
        id: `custom-svc-${Date.now()}`
      };
      onUpdateServices([...services, newService]);
      triggerSuccess('Novo serviço criado e ativado com sucesso!');
      setIsAddingService(false);
    } else if (editingService) {
      const updated = services.map(s => s.id === editingService.id ? { ...s, ...corePayload } : s);
      onUpdateServices(updated);
      triggerSuccess('Serviço atualizado com sucesso!');
      setEditingService(null);
    }
  };

  // --- SERVICE PAGE (content & SEO) modal ---
  const openServicePageModal = (service: ServiceItem) => {
    setPageEditingService(service);
    setPageForm({
      pageTitle: service.pageTitle || service.label || '',
      pageSubtitle: service.pageSubtitle || '',
      slug: service.slug || '',
      pageImageUrl: service.pageImageUrl || '',
      pageMetaDescription: service.pageMetaDescription || '',
      pageKeywords: service.pageKeywords || [],
      pageDescriptionHtml: service.pageDescriptionHtml || ''
    });
  };

  const handlePageImageUpload = async (file?: File | null) => {
    if (!file) return;
    setPageImageUploading(true);
    try {
      const url = await uploadAsset(file, 'services');
      setPageForm(prev => ({ ...prev, pageImageUrl: url }));
      triggerSuccess('Imagem enviada!');
    } catch (err: any) {
      triggerError(err?.message || 'Falha no upload da imagem.');
    } finally {
      setPageImageUploading(false);
    }
  };

  const handleSaveServicePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageEditingService) return;
    if (!pageForm.pageTitle.trim()) {
      setErrorMessage('O título da página é obrigatório.');
      return;
    }
    const pageTitle = pageForm.pageTitle.trim();
    const slug = slugify(pageForm.slug) || slugify(pageTitle);
    const patch = {
      pageTitle,
      pageSubtitle: pageForm.pageSubtitle.trim(),
      slug,
      pageImageUrl: pageForm.pageImageUrl.trim(),
      pageMetaDescription: pageForm.pageMetaDescription.trim(),
      pageKeywords: normalizeKeywords(pageForm.pageKeywords),
      pageDescriptionHtml: pageForm.pageDescriptionHtml
    };
    onUpdateServices(services.map(s => s.id === pageEditingService.id ? { ...s, ...patch } : s));
    triggerSuccess('Conteúdo e SEO da página do serviço salvos!');
    setPageEditingService(null);
  };

  // --- SERVICE FAQ modal ---
  const openServiceFaqModal = (service: ServiceItem) => {
    setFaqEditingService(service);
    setFaqForm({
      faqTitle: service.faqTitle || 'Perguntas Frequentes',
      faqSubtitle: service.faqSubtitle || '',
      faqs: Array.isArray(service.faqs) ? service.faqs.map(f => ({ ...f })) : []
    });
  };

  const addServiceFaq = () => setFaqForm(prev => ({
    ...prev,
    faqs: [...prev.faqs, { id: `sfaq-${Date.now()}`, question: '', answer: '' }]
  }));
  const updateServiceFaq = (idx: number, patch: Partial<ServiceFaq>) => setFaqForm(prev => ({
    ...prev,
    faqs: prev.faqs.map((f, i) => (i === idx ? { ...f, ...patch } : f))
  }));
  const removeServiceFaq = (idx: number) => setFaqForm(prev => ({
    ...prev,
    faqs: prev.faqs.filter((_, i) => i !== idx)
  }));
  const moveServiceFaq = (idx: number, dir: -1 | 1) => setFaqForm(prev => {
    const arr = [...prev.faqs];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return prev;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    return { ...prev, faqs: arr };
  });

  const handleSaveServiceFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqEditingService) return;
    const cleanFaqs: ServiceFaq[] = faqForm.faqs
      .map(f => ({ id: f.id, question: f.question.trim(), answer: f.answer.trim() }))
      .filter(f => f.question || f.answer);
    const patch = {
      faqTitle: faqForm.faqTitle.trim() || 'Perguntas Frequentes',
      faqSubtitle: faqForm.faqSubtitle.trim(),
      faqs: cleanFaqs
    };
    onUpdateServices(services.map(s => s.id === faqEditingService.id ? { ...s, ...patch } : s));
    triggerSuccess('Perguntas frequentes do serviço salvas!');
    setFaqEditingService(null);
  };

  const handleDeleteService = (id: string) => {
    if (confirm('Tem certeza de que deseja excluir este serviço? Ele não aparecerá mais no catálogo e na calculadora.')) {
      onUpdateServices(services.filter(s => s.id !== id));
      triggerSuccess('Serviço removido do catálogo.');
    }
  };

  const handleAddBenefit = () => {
    if (newBenefitText.trim()) {
      setServiceForm(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefitText.trim()]
      }));
      setNewBenefitText('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setServiceForm(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, idx) => idx !== index)
    }));
  };

  // --- SERVICE PACKAGE (fixed-price) OPERATIONS ---
  const handleAddPackage = () => {
    setServiceForm(prev => ({
      ...prev,
      packages: [
        ...(prev.packages || []),
        { id: `pkg-${Date.now()}-${(prev.packages || []).length}`, quantity: 1000, price: 0, label: '', isPopular: false }
      ]
    }));
  };

  const handleUpdatePackage = (index: number, patch: Partial<ServicePackage>) => {
    setServiceForm(prev => ({
      ...prev,
      packages: (prev.packages || []).map((p, idx) => (idx === index ? { ...p, ...patch } : p))
    }));
  };

  const handleRemovePackage = (index: number) => {
    setServiceForm(prev => ({
      ...prev,
      packages: (prev.packages || []).filter((_, idx) => idx !== index)
    }));
  };

  // Only one package can be flagged as "popular" (the highlighted card).
  const handleTogglePackagePopular = (index: number) => {
    setServiceForm(prev => ({
      ...prev,
      packages: (prev.packages || []).map((p, idx) => ({ ...p, isPopular: idx === index ? !p.isPopular : false }))
    }));
  };

  // --- PLAN OPERATIONS ---
  const handleEditPlanInit = (plan: PlanItem) => {
    setEditingPlan(plan);
  };

  const handleAddPlanInit = () => {
    setEditingPlan({
      id: `plan-${Math.floor(100000 + Math.random() * 900000)}`,
      name: 'Novo Plano',
      price: 49.9,
      quantity: 1000,
      platform: 'instagram',
      type: 'followers',
      features: ['Perfis reais', 'Entrega gradual', 'Garantia de reposição'],
      isPopular: false,
      savingsPercent: 0
    });
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    const exists = plans.some(p => p.id === editingPlan.id);
    const updated = exists
      ? plans.map(p => p.id === editingPlan.id ? editingPlan : p)
      : [...plans, editingPlan];
    onUpdatePlans(updated);
    triggerSuccess(`Plano "${editingPlan.name}" ${exists ? 'atualizado' : 'criado'} com sucesso!`);
    setEditingPlan(null);
  };

  const handleDeletePlan = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano?')) return;
    onUpdatePlans(plans.filter(p => p.id !== id));
    triggerSuccess('Plano removido com sucesso!');
  };

  // Plans-section visibility (general settings: plansEnabled).
  const handleTogglePlansSection = async (enabled: boolean) => {
    setPlansSectionEnabled(enabled);
    // O formulário de configurações gerais salva o objeto inteiro; sem espelhar
    // aqui, salvar as gerais depois desfaria a troca feita nesta aba.
    setGeneralForm(prev => ({ ...prev, plansEnabled: enabled }));
    try {
      const current = await fetchGeneralSettings();
      await saveGeneralSettingsToServer({ ...current, plansEnabled: enabled });
      triggerSuccess(`Seção de planos ${enabled ? 'ativada' : 'desativada'}.`);
    } catch {
      triggerError('Falha ao atualizar a visibilidade da seção de planos.');
    }
  };

  // Aviso de pedidos novos no menu.
  //
  // Antes o selo trazia o total de pedidos, então ele nunca zerava e virava
  // paisagem. Agora ele conta só o que chegou depois da última visita à aba: um
  // carimbo de tempo no navegador, atualizado enquanto a aba está aberta.
  //
  // Sem carimbo (primeiro acesso neste navegador) o momento atual é gravado, e
  // não a data zero — senão a primeira sessão mostraria o total de novo.
  const ORDERS_SEEN_KEY = 'admin_orders_seen_at';
  const [ordersSeenAt, setOrdersSeenAt] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_SEEN_KEY);
      if (saved) return saved;
      const now = new Date().toISOString();
      localStorage.setItem(ORDERS_SEEN_KEY, now);
      return now;
    } catch {
      return new Date().toISOString();
    }
  });

  const newOrdersCount = useMemo(
    () => orders.filter(o => String(o.date || '') > ordersSeenAt).length,
    [orders, ordersSeenAt]
  );

  // Enquanto a aba está aberta, o que chega já está sendo visto.
  //
  // O carimbo é o maior entre o agora e a data do pedido mais recente: um
  // pedido gravado com a hora do banco alguns segundos à frente do navegador
  // ficaria "sempre novo" e o selo nunca zeraria.
  useEffect(() => {
    if (activeTab !== 'orders') return;
    const maisNovo = orders.reduce((max, o) => (String(o.date || '') > max ? String(o.date) : max), '');
    const marca = [new Date().toISOString(), maisNovo].sort().pop() as string;
    setOrdersSeenAt(prev => (marca > prev ? marca : prev));
    try { localStorage.setItem(ORDERS_SEEN_KEY, marca); } catch { /* sessão anônima */ }
  }, [activeTab, orders]);

  // Pedidos depois dos filtros da aba. O status é comparado pela chave
  // canônica: registros antigos gravaram "Pendente", "aprovado" e afins, e o
  // filtro tem de alcançá-los.
  const filteredOrders = useMemo<AdminOrder[]>(() => {
    const termo = orderSearchText.trim().toLowerCase();
    const agora = Date.now();
    const janela = orderPeriodFilter === 'hoje' ? 1 : orderPeriodFilter === '7' ? 7 : orderPeriodFilter === '30' ? 30 : 0;

    return orders.filter(order => {
      if (termo) {
        const alvo = [
          order.id, order.username, order.email, order.phone,
          order.serviceLabel, order.platform, order.smmOrderId
        ].map(v => String(v || '').toLowerCase()).join(' ');
        if (!alvo.includes(termo)) return false;
      }
      if (orderStatusFilter !== 'todos' && orderStatusInfo(order.status).key !== orderStatusFilter) return false;
      if (orderPlatformFilter !== 'todos' && order.platform !== orderPlatformFilter) return false;
      if (janela) {
        const quando = Date.parse(order.date || '');
        if (!Number.isFinite(quando)) return false;
        if (agora - quando > janela * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [orders, orderSearchText, orderStatusFilter, orderPlatformFilter, orderPeriodFilter]);

  // Um filtro novo pode deixar a página atual além do fim da lista.
  useEffect(() => { setOrderPage(1); }, [orderSearchText, orderStatusFilter, orderPlatformFilter, orderPeriodFilter]);
  useEffect(() => { setUserPage(1); }, [userSearchText, userRoleFilter, userStatusFilter, userBuyerFilter]);

  const orderFiltersOn = orderSearchText.trim() !== '' || orderStatusFilter !== 'todos' ||
    orderPlatformFilter !== 'todos' || orderPeriodFilter !== 'todos';

  // Filtros e paginação dos consentimentos de cookies. A tabela cresce a cada
  // visitante do site, então é a que mais rápido fica impossível de ler inteira.
  const [cookieSearch, setCookieSearch] = useState('');
  const [cookieAnalytics, setCookieAnalytics] = useState<'todos' | 'sim' | 'nao'>('todos');
  const [cookieMarketing, setCookieMarketing] = useState<'todos' | 'sim' | 'nao'>('todos');
  const [cookiePeriod, setCookiePeriod] = useState<'todos' | 'hoje' | '7' | '30'>('todos');
  const [cookiePage, setCookiePage] = useState(1);
  const [cookiePerPage, setCookiePerPage] = useState(25);

  const filteredConsents = useMemo(() => {
    const termo = cookieSearch.trim().toLowerCase();
    const agora = Date.now();
    const janela = cookiePeriod === 'hoje' ? 1 : cookiePeriod === '7' ? 7 : cookiePeriod === '30' ? 30 : 0;
    const casa = (escolha: string, valor: boolean) =>
      escolha === 'todos' || (escolha === 'sim' ? valor : !valor);

    return cookieConsents.filter(rec => {
      if (termo) {
        const alvo = `${rec.id} ${rec.userAgent || ''}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      if (!casa(cookieAnalytics, !!rec.choices?.analytics)) return false;
      if (!casa(cookieMarketing, !!rec.choices?.marketing)) return false;
      if (janela) {
        const quando = Date.parse(rec.createdAt || '');
        if (!Number.isFinite(quando)) return false;
        if (agora - quando > janela * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [cookieConsents, cookieSearch, cookieAnalytics, cookieMarketing, cookiePeriod]);

  useEffect(() => { setCookiePage(1); }, [cookieSearch, cookieAnalytics, cookieMarketing, cookiePeriod]);

  const cookieFiltersOn = cookieSearch.trim() !== '' || cookieAnalytics !== 'todos' ||
    cookieMarketing !== 'todos' || cookiePeriod !== 'todos';

  // --- ORDER OPERATIONS ---
  // Canonical statuses (matching the client-facing orderStatus util).
  const ORDER_STATUSES: { value: string; label: string }[] = [
    { value: 'aguardando_pagamento', label: 'Aguardando pagamento' },
    { value: 'processando', label: 'Processando' },
    { value: 'pago', label: 'Pagamento aprovado' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: 'outro', label: 'Outro' }
  ];

  // Catálogo de redes e tipos de entrega, cadastrado nos modais abaixo.
  const [catalog, setCatalog] = useState<Catalog>(DEFAULT_CATALOG);
  const [catalogInUse, setCatalogInUse] = useState<{ platforms: string[]; types: string[] }>({ platforms: [], types: [] });

  // Modal de gerenciamento do catálogo (redes ou tipos).
  const [catalogModal, setCatalogModal] = useState<'platforms' | 'types' | null>(null);
  // Qual lista a aba de depoimentos está mostrando.
  const [reviewsView, setReviewsView] = useState<'testimonials' | 'services'>('testimonials');

  const [catalogDraft, setCatalogDraft] = useState<Catalog>(DEFAULT_CATALOG);
  const [catalogSaving, setCatalogSaving] = useState(false);

  const openCatalogModal = async (which: 'platforms' | 'types') => {
    await reloadCatalog();
    setCatalogDraft(await fetchCatalog());
    setCatalogModal(which);
  };

  // O id é o que os serviços gravam; mudar depois órfãozaria todos eles. Por
  // isso ele nasce do nome e fica travado a partir daí.
  const makeId = (name: string) =>
    name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

  const addPlatform = () => setCatalogDraft(prev => ({
    ...prev,
    platforms: [...prev.platforms, { id: '', name: '', color: 'from-slate-700 to-slate-900', icon: 'Layers' }]
  }));
  const addServiceType = () => setCatalogDraft(prev => ({
    ...prev,
    serviceTypes: [...prev.serviceTypes, { id: '', label: '', target: 'profile' }]
  }));

  const patchPlatform = (index: number, patch: Partial<SocialPlatformItem>) =>
    setCatalogDraft(prev => ({
      ...prev,
      platforms: prev.platforms.map((p, i) => (i === index ? { ...p, ...patch } : p))
    }));
  const patchServiceType = (index: number, patch: Partial<ServiceTypeItem>) =>
    setCatalogDraft(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.map((t, i) => (i === index ? { ...t, ...patch } : t))
    }));

  const removeCatalogItem = (index: number) => setCatalogDraft(prev => (
    catalogModal === 'platforms'
      ? { ...prev, platforms: prev.platforms.filter((_, i) => i !== index) }
      : { ...prev, serviceTypes: prev.serviceTypes.filter((_, i) => i !== index) }
  ));

  const moveCatalogItem = (index: number, dir: -1 | 1) => setCatalogDraft(prev => {
    const key = catalogModal === 'platforms' ? 'platforms' : 'serviceTypes';
    const list = [...(prev as any)[key]];
    const target = index + dir;
    if (target < 0 || target >= list.length) return prev;
    [list[index], list[target]] = [list[target], list[index]];
    return { ...prev, [key]: list } as Catalog;
  });

  const handleSaveCatalog = async () => {
    // Preenche o id de quem acabou de ser criado, a partir do nome.
    const platforms = catalogDraft.platforms.map(p => ({ ...p, id: p.id || makeId(p.name) }));
    const serviceTypes = catalogDraft.serviceTypes.map(t => ({ ...t, id: t.id || makeId(t.label) }));

    const vazio = catalogModal === 'platforms'
      ? platforms.find(p => !p.name.trim())
      : serviceTypes.find(t => !t.label.trim());
    if (vazio) { triggerError('Preencha o nome de todos os itens antes de salvar.'); return; }

    const ids = (catalogModal === 'platforms' ? platforms.map(p => p.id) : serviceTypes.map(t => t.id));
    if (new Set(ids).size !== ids.length) { triggerError('Há dois itens com o mesmo identificador.'); return; }

    setCatalogSaving(true);
    const r = await saveCatalogToServer(
      catalogModal === 'platforms' ? { platforms } : { serviceTypes }
    );
    setCatalogSaving(false);
    if (!r.ok) { triggerError(r.error || 'Falha ao salvar.'); return; }
    await reloadCatalog();
    setCatalogModal(null);
    triggerSuccess(catalogModal === 'platforms' ? 'Redes sociais atualizadas!' : 'Tipos de entrega atualizados!');
  };

  const reloadCatalog = async () => {
    const [c, used] = await Promise.all([fetchCatalog(), fetchCatalogInUse()]);
    setCatalog(c);
    primeCatalog(c); // o site público lê do mesmo cache
    setCatalogInUse(used);
  };
  useEffect(() => { reloadCatalog(); }, []);

  // Motivos prontos para o status "Outro". Clicar preenche o título; o campo
  // continua livre para escrever qualquer outra coisa.
  const ISSUE_PRESETS: { title: string; details: string }[] = [
    {
      title: 'Perfil privado',
      details: 'Seu perfil está como privado e o serviço não consegue ser entregue nele. Deixe o perfil público e nos avise para retomarmos a entrega.'
    },
    {
      title: 'Link errado',
      details: 'O link informado no pedido não abre a publicação correta. Confira e nos envie o link certo para concluirmos a entrega.'
    },
    {
      title: 'Perfil não encontrado',
      details: 'Não localizamos o @ informado. Verifique se o nome de usuário está correto (sem espaços) e nos avise.'
    },
    {
      title: 'Publicação removida',
      details: 'A publicação informada não está mais disponível. Envie o link de outra publicação para seguirmos com o pedido.'
    },
    {
      title: 'Quantidade indisponível',
      details: 'A quantidade pedida está temporariamente indisponível para este serviço. Entre em contato para ajustarmos o pedido.'
    }
  ];

  // Modal do status "Outro".
  const [issueOrder, setIssueOrder] = useState<AdminOrder | null>(null);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDetails, setIssueDetails] = useState('');
  const [issueNotify, setIssueNotify] = useState(true);
  const [issueSaving, setIssueSaving] = useState(false);

  const openIssueModal = (order: AdminOrder) => {
    setIssueOrder(order);
    setIssueTitle(order.issueTitle || '');
    setIssueDetails(order.issueDetails || '');
    setIssueNotify(true);
    setIssueSaving(false);
  };

  const applyIssuePreset = (preset: { title: string; details: string }) => {
    setIssueTitle(preset.title);
    // Só sugere a descrição quando o campo ainda está vazio: um texto que o
    // admin escreveu não pode ser sobrescrito por um clique.
    setIssueDetails(prev => (prev.trim() ? prev : preset.details));
  };

  const handleSaveIssue = async () => {
    if (!issueOrder) return;
    const title = issueTitle.trim();
    if (!title) { triggerError('Informe o motivo do problema.'); return; }

    setIssueSaving(true);
    const r = await reportOrderIssue(issueOrder.id, { title, details: issueDetails.trim(), notify: issueNotify });
    setIssueSaving(false);

    if (!r.ok) { triggerError(r.error || 'Falha ao registrar o motivo.'); return; }

    // O motivo foi gravado mesmo se o e-mail falhar — o aviso precisa dizer as
    // duas coisas para o admin não achar que perdeu o registro.
    onUpdateOrders(await fetchOrders());
    setIssueOrder(null);
    if (!issueNotify) triggerSuccess(`Pedido #${issueOrder.id}: motivo registrado (sem aviso ao cliente).`);
    else if (r.emailSent) triggerSuccess(`Pedido #${issueOrder.id}: motivo registrado e e-mail enviado ao cliente.`);
    else triggerError(`Motivo registrado, mas o e-mail não saiu: ${r.emailError || 'falha desconhecida'}`);
  };

  const handleChangeOrderStatus = (id: string, nextStatus: string) => {
    // "Outro" exige um motivo: abre o modal e só grava ao salvar, para o select
    // não ficar num estado que o servidor não conhece.
    if (nextStatus === 'outro') {
      const order = orders.find(o => o.id === id);
      if (order) openIssueModal(order);
      return;
    }
    const updated = orders.map(o => o.id === id ? { ...o, status: nextStatus } : o);
    onUpdateOrders(updated);
    triggerSuccess(`Pedido #${id} alterado para: ${ORDER_STATUSES.find(s => s.value === nextStatus)?.label || nextStatus}`);
  };

  const handleSaveOrderEdit = () => {
    if (!editingOrder) return;
    const updated = orders.map(o => o.id === editingOrder.id ? editingOrder : o);
    onUpdateOrders(updated);
    setEditingOrder(null);
    triggerSuccess(`Pedido #${editingOrder.id} atualizado com sucesso!`);
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm('Deseja excluir este registro de pedido do histórico?')) {
      onUpdateOrders(orders.filter(o => o.id !== id));
      triggerSuccess('Pedido removido do registro.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-stretch p-0 sm:p-4">
      <div className="bg-white sm:rounded-2xl w-full flex flex-col shadow-2xl overflow-hidden border border-slate-200 min-h-screen sm:min-h-0 sm:h-[calc(100vh-2rem)]">

        {/* UPPER TITLEBAR HEADER */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-white">
              <Settings className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg tracking-tight">Painel de Gestão {generalForm.siteName || 'ImpulsioneGram'}</h2>
              <p className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase">Área Diretor-Administrativa</p>
            </div>
          </div>
          <button
            onClick={onExit}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            id="close-admin-panel"
            title="Voltar ao site"
          >
            <X className="h-5 w-5" />
            <span className="hidden sm:inline">Voltar ao site</span>
          </button>
        </div>

        {/* FEEDBACK FLOATING MESSAGES */}
        {successMessage && (
          <div className="bg-green-500 text-white text-xs font-bold font-mono px-5 py-3 flex items-center gap-2 animate-in slide-in-from-top duration-550">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="bg-red-500 text-white text-xs font-bold font-mono px-5 py-3 flex items-center gap-2 animate-in slide-in-from-top duration-550">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MAIN DASHBOARD BODY */}
        <div className="flex-grow flex overflow-hidden">
            
            {/* SIDEBAR NAVIGATION COLUMN */}
            <div className="w-56 bg-slate-50 border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-black text-slate-400 block px-2.5 mb-2.5 tracking-wider">Módulos</span>
                
                <button
                  onClick={() => { setActiveTab('dashboard'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'dashboard' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard Geral</span>
                </button>

              <button
                onClick={() => { setActiveTab('services'); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'services' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Gerenciar Serviços</span>
              </button>

              <button
                onClick={() => { setActiveTab('plans'); setEditingService(null); setIsAddingService(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'plans' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Gerenciar Planos</span>
              </button>

              <button
                onClick={() => { setActiveTab('orders'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all relative ${
                  activeTab === 'orders' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Pedidos</span>
                {newOrdersCount > 0 && (
                  <span
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black animate-pulse"
                    title={`${newOrdersCount} ${newOrdersCount === 1 ? 'pedido novo' : 'pedidos novos'} desde a sua última visita`}
                  >
                    {newOrdersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('users'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'users' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Gerenciar Usuários</span>
              </button>

              <button
                onClick={() => { setActiveTab('home'); setContentView('menu'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'home'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <Globe className="h-4 w-4" />
                <span>Conteúdo Principal</span>
              </button>

              <button
                onClick={() => { setActiveTab('offer'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'offer'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <Flame className="h-4 w-4" />
                <span>Oferta Relâmpago</span>
              </button>

              <button
                onClick={() => { setActiveTab('chatbot'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'chatbot'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                <span>Assistente (Sofia)</span>
              </button>

              <button
                onClick={() => { setActiveTab('blog'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'blog'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <Newspaper className="h-4 w-4" />
                <span>Blog</span>
              </button>

              <button
                onClick={() => { setActiveTab('testimonials'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'testimonials'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <Quote className="h-4 w-4" />
                <span>Depoimentos</span>
              </button>

              <button
                onClick={() => { setActiveTab('messages'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'messages'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <Inbox className="h-4 w-4" />
                <span>Tickets</span>
              </button>

              <button
                onClick={() => { setActiveTab('general'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'general'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Configurações Gerais</span>
              </button>

              <button
                onClick={() => { setActiveTab('contact'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'contact'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <PanelBottom className="h-4 w-4" />
                <span>Contato & Rodapé</span>
              </button>

              <button
                onClick={() => { setActiveTab('integrations'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'integrations'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <Plug className="h-4 w-4" />
                <span>Integrações / API</span>
              </button>

              <button
                onClick={() => { setActiveTab('analytics'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <Code2 className="h-4 w-4" />
                <span>JS / Analytics</span>
              </button>

              <button
                onClick={() => { setActiveTab('cookies'); setEditingService(null); setIsAddingService(false); setEditingPlan(null); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'cookies'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-100'
                }`}
              >
                <Cookie className="h-4 w-4" />
                <span>Cookies / LGPD</span>
              </button>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-1">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 transition-all"
              >
                <Lock className="h-4 w-4" />
                <span>Sair do Painel</span>
              </button>
            </div>
          </div>

          {/* ACTIVE WORKSPACE FRAME */}
          <div className="flex-grow p-6 overflow-y-auto bg-slate-50/40">
            
            {/* =================== TAB 1: DASHBOARD OVERVIEW =================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-black text-xl text-slate-900">Métricas de Faturamento e Desempenho</h3>
                  <p className="text-slate-500 text-xs font-semibold">Simulação em tempo real baseada nos checkouts efetuados pelos usuários</p>
                </div>

                {/* SUMARY GRID BOXES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black block">Faturamento Realizado</span>
                      <span className="font-display font-black text-lg text-slate-950">
                        R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-purple-100 text-primary p-2.5 rounded-xl">
                      <CircleDollarSign className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black block">Vendas Efetuadas</span>
                      <span className="font-display font-black text-lg text-slate-950">{stats.totalOrders} un.</span>
                    </div>
                    <div className="bg-green-100 text-green-700 p-2.5 rounded-xl">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black block">Ticket Médio</span>
                      <span className="font-display font-black text-lg text-slate-950">
                        R$ {stats.averageOrderPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="bg-blue-100 text-blue-700 p-2.5 rounded-xl">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-black block">Tipos de Serviço</span>
                      <span className="font-display font-black text-lg text-slate-950">{services.length} ativos</span>
                    </div>
                    <div className="bg-amber-100 text-amber-700 p-2.5 rounded-xl">
                      <Layers className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Distribution */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-slate-500" />
                      Faturamento por Rede Social
                    </h4>
                    <div className="space-y-3">
                      {catalog.platforms.map(p => {
                        const rev = stats.platformRevenue[p.id] || 0;
                        const percent = stats.totalRevenue > 0 ? (rev / stats.totalRevenue) * 100 : 0;
                        return (
                          <div key={p.id} className="space-y-1">
                            <div className="flex justify-between font-semibold text-xs text-slate-700">
                              <span>{p.name}</span>
                              <span className="font-mono">R$ {rev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({percent.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-primary h-full transition-all" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hot stats details */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm mb-3">Auditoria de Vendas Ativa</h4>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                        A plataforma está simulando vendas em ambiente Sandbox. Cada ação de pagamento completada pelos usuários finais na calculadora ou nos planos gera uma guia imediata no módulo de <strong>Pedidos</strong> para validação de fluxos.
                      </p>
                    </div>
                    <div className="bg-purple-50 text-primary border border-primary/20 rounded-xl p-4 mt-4 text-xs font-semibold space-y-1">
                      <span className="flex items-center gap-1.5 font-bold">
                        <ShieldCheck className="h-4 w-4" /> 
                        Conexão com Gateways Assegurada
                      </span>
                      <span>Os gateways configurados atuam em conformidade integral com LGPD e garantem taxa de conversão simulada estável de entrega de seguidores.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================== TAB 2: GERENCIAR SERVIÇOS =================== */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                
                {/* HEAD CONTROLS */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-display font-black text-xl text-slate-900">Catálogo de Serviços Integrados</h3>
                    <p className="text-slate-500 text-xs font-semibold">Consulte, altere preços unitários ou crie novos itens de provimento</p>
                  </div>
                  
                  <button
                    onClick={() => openCatalogModal('platforms')}
                    className="bg-white hover:border-primary hover:text-primary text-slate-600 border border-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-all shrink-0 ml-auto"
                    title="Criar, editar e remover redes sociais"
                  >
                    <Globe className="h-4 w-4" />
                    Redes Sociais
                  </button>
                  <button
                    onClick={() => openCatalogModal('types')}
                    className="bg-white hover:border-primary hover:text-primary text-slate-600 border border-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-all shrink-0"
                    title="Criar, editar e remover tipos de entrega"
                  >
                    <Layers className="h-4 w-4" />
                    Tipos de Entrega
                  </button>
                  <button
                    onClick={handleAddServiceInit}
                    className="bg-primary hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-all shrink-0 hover:scale-[1.02] shadow-sm"
                    id="add-new-service-btn"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Serviço
                  </button>
                </div>

                {/* MODAL: ADD/EDIT SERVICE (centered overlay so it's always visible) */}
                {(editingService || isAddingService) && (
                  <div
                    className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
                    onClick={() => { setEditingService(null); setIsAddingService(false); }}
                  >
                  <form
                    onSubmit={handleSaveService}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-4 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-4 p-5 sm:p-6"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                        {isAddingService
                          ? (<><Plus className="h-4 w-4 text-primary" /> Novo Serviço</>)
                          : (<><Pencil className="h-4 w-4 text-primary" /> Editando: {editingService?.label}</>)}
                      </h4>
                      <button
                        type="button"
                        onClick={() => { setEditingService(null); setIsAddingService(false); }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Fechar"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Name label */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Nome do Serviço (Visual)</label>
                        <input
                          type="text"
                          required
                          value={serviceForm.label}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="Ex: Seguidores Brasileiros Ativos"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
                        />
                      </div>

                      {/* Social platform selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Plataforma Social</label>
                        <select
                          value={serviceForm.platform}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, platform: e.target.value as SocialPlatform }))}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2"
                        >
                          {catalog.platforms.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Service Category/Type */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Tipo de Entrega</label>
                        <select
                          value={serviceForm.type}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, type: e.target.value as any }))}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2"
                        >
                          {catalog.serviceTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Price Per Unit (calculate to 1000 items) */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Preço Unitário (Média de custo / item)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                          <input
                            type="number"
                            step="0.0001"
                            required
                            value={serviceForm.pricePerItem}
                            onChange={(e) => setServiceForm(prev => ({ ...prev, pricePerItem: parseFloat(e.target.value) }))}
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg p-2.5 pl-8 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Custo por 1.000un: <strong>R$ {((serviceForm.pricePerItem || 0) * 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        </span>
                      </div>

                      {/* Min Quantity */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Quantidade Mínima</label>
                        <input
                          type="number"
                          required
                          value={serviceForm.minQuantity}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, minQuantity: parseInt(e.target.value, 10) }))}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800"
                        />
                      </div>

                      {/* Max Quantity */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Quantidade Máxima</label>
                        <input
                          type="number"
                          required
                          value={serviceForm.maxQuantity}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, maxQuantity: parseInt(e.target.value, 10) }))}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800"
                        />
                      </div>

                      {/* Delivery Speed description */}
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-black text-slate-500 uppercase block">Velocidade de Processamento</label>
                        <input
                          type="text"
                          required
                          value={serviceForm.deliverySpeed}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, deliverySpeed: e.target.value }))}
                          placeholder="Ex: Entrega instantânea, média de 5-15 minutos"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800"
                        />
                      </div>

                      {/* SMM service id (auto delivery) */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">ID do Serviço no Painel SMM</label>
                        <input
                          type="text"
                          value={serviceForm.smmServiceId || ''}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, smmServiceId: e.target.value }))}
                          placeholder="Ex: 1234 (deixe vazio para não enviar automaticamente)"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800"
                        />
                        <span className="text-[10px] text-slate-400 block font-medium">Usado para enviar o pedido ao painel SMM e entregar automaticamente após o pagamento.</span>
                      </div>

                      {/* Formato do link exigido por este serviço no painel */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Formato do link no painel</label>
                        <select
                          value={serviceForm.smmLinkFormat || 'url'}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, smmLinkFormat: e.target.value as 'url' | 'username' }))}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800"
                        >
                          <option value="url">URL completa do perfil (padrão)</option>
                          <option value="username">Somente o nome de usuário</option>
                        </select>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Confira a descrição do serviço no painel: alguns exigem "username only", sem @ e sem link.
                        </span>
                      </div>
                    </div>

                    {/* Fixed-price packages editor */}
                    <div className="space-y-3 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-primary" /> Pacotes de preço fixo
                        </label>
                        <button
                          type="button"
                          onClick={handleAddPackage}
                          className="bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" /> Adicionar pacote
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                        Defina pacotes prontos (ex.: <strong>1.000 seguidores por R$ 7,90</strong>). Quando houver pacotes, a calculadora exibe cards de escolha no lugar da barra de quantidade. Sem pacotes, ela usa o preço unitário + mín/máx acima.
                      </p>

                      {(serviceForm.packages || []).length === 0 ? (
                        <div className="text-[11px] text-slate-400 font-semibold bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3 text-center">
                          Nenhum pacote definido — o serviço usará o modo slider (preço unitário).
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(serviceForm.packages || []).map((pkg, idx) => (
                            <div key={pkg.id} className={`flex flex-wrap items-end gap-2 rounded-lg p-2.5 border ${pkg.isPopular ? 'bg-primary/5 border-primary/30' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="space-y-0.5 w-24">
                                <label className="text-[9px] font-black text-slate-400 uppercase block">Quantidade</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={pkg.quantity}
                                  onChange={(e) => handleUpdatePackage(idx, { quantity: parseInt(e.target.value, 10) || 0 })}
                                  className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              <div className="space-y-0.5 w-28">
                                <label className="text-[9px] font-black text-slate-400 uppercase block">Preço (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min={0}
                                  value={pkg.price}
                                  onChange={(e) => handleUpdatePackage(idx, { price: parseFloat(e.target.value) || 0 })}
                                  className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              <div className="space-y-0.5 flex-1 min-w-[140px]">
                                <label className="text-[9px] font-black text-slate-400 uppercase block">Rótulo (opcional)</label>
                                <input
                                  type="text"
                                  value={pkg.label || ''}
                                  onChange={(e) => handleUpdatePackage(idx, { label: e.target.value })}
                                  placeholder={`${(pkg.quantity || 0).toLocaleString('pt-BR')} ${serviceForm.type === 'followers' ? 'seguidores' : 'un.'}`}
                                  className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              <div className="flex items-center gap-1 pb-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePackagePopular(idx)}
                                  title={pkg.isPopular ? 'Pacote em destaque' : 'Marcar como destaque'}
                                  className={`p-2 rounded-lg transition-colors cursor-pointer ${pkg.isPopular ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-400 hover:text-primary'}`}
                                >
                                  <Star className="h-3.5 w-3.5" fill={pkg.isPopular ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePackage(idx)}
                                  title="Remover pacote"
                                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Manage benefits list tags */}
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <label className="text-xs font-black text-slate-500 uppercase block">Benefícios do Serviço (Pontos de Valor)</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {serviceForm.benefits.map((b, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[11px] font-bold py-1 px-2.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                            {b}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveBenefit(idx)}
                              className="text-red-500 hover:text-red-700 font-bold hover:bg-slate-200 rounded px-1 text-[10px]"
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 max-w-md">
                        <input
                          type="text"
                          placeholder="Escreva mais um diferencial..."
                          value={newBenefitText}
                          onChange={(e) => setNewBenefitText(e.target.value)}
                          className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2 flex-grow text-slate-800 outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={handleAddBenefit}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-2 rounded-lg"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-500 font-semibold flex items-start gap-2">
                      <Globe className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <span>O conteúdo e SEO da página do serviço (título, slug, imagem, descrição) e a seção de <strong>Perguntas Frequentes</strong> são editados pelos botões dedicados na lista de serviços.</span>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => { setEditingService(null); setIsAddingService(false); }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-primary hover:bg-purple-700 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Salvar Alterações
                      </button>
                    </div>
                  </form>
                  </div>
                )}

                {/* MODAL: SERVICE PAGE CONTENT & SEO */}
                {pageEditingService && (
                  <div
                    className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
                    onClick={() => setPageEditingService(null)}
                  >
                    <form
                      onSubmit={handleSaveServicePage}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-4 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-4 p-5 sm:p-6"
                    >
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-sky-600" /> Página &amp; SEO: {pageEditingService.label}
                        </h4>
                        <div className="flex items-center gap-2">
                          <a href={`/servico/${serviceSlug({ slug: pageForm.slug, pageTitle: pageForm.pageTitle, label: pageEditingService.label })}`} target="_blank" rel="noreferrer"
                            className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" /> Abrir
                          </a>
                          <button type="button" onClick={() => setPageEditingService(null)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Fechar">
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 block">Título da página <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={pageForm.pageTitle}
                          onChange={(e) => setPageForm(prev => ({ ...prev, pageTitle: e.target.value }))}
                          placeholder="Ex: Comprar Seguidores Brasileiros Reais para Instagram"
                          className="w-full bg-slate-50 border border-slate-200 text-sm font-bold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-[10px] text-slate-400">É o H1 da página e a base do slug. O nome curto do card é editado no botão de editar (lápis).</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black text-slate-400 block">Slug (URL)</label>
                          <input
                            type="text"
                            value={pageForm.slug}
                            onChange={(e) => setPageForm(prev => ({ ...prev, slug: e.target.value }))}
                            placeholder={slugify(pageForm.pageTitle) || 'seguidores-brasileiros'}
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <span className="text-[10px] text-slate-400 block">/servico/<strong>{serviceSlug({ slug: pageForm.slug, pageTitle: pageForm.pageTitle, label: pageEditingService.label }) || '...'}</strong></span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black text-slate-400 block">Subtítulo (hero)</label>
                          <input
                            type="text"
                            value={pageForm.pageSubtitle}
                            onChange={(e) => setPageForm(prev => ({ ...prev, pageSubtitle: e.target.value }))}
                            placeholder="Texto curto exibido ao lado da calculadora"
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      {/* Featured image */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 block flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Imagem destacada (SEO / og:image)</label>
                        <div className="flex items-center gap-3">
                          {pageForm.pageImageUrl ? (
                            <img src={pageForm.pageImageUrl} alt="Prévia" className="h-16 w-24 object-cover rounded-lg border border-slate-200 shrink-0" />
                          ) : (
                            <div className="h-16 w-24 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-300 shrink-0"><ImageIcon className="h-5 w-5" /></div>
                          )}
                          <div className="flex-1 space-y-1.5">
                            <input type="file" accept="image/*" onChange={(e) => handlePageImageUpload(e.target.files?.[0])}
                              className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                            <input type="text" value={pageForm.pageImageUrl} onChange={(e) => setPageForm(prev => ({ ...prev, pageImageUrl: e.target.value }))}
                              placeholder="ou cole a URL da imagem"
                              className="w-full bg-slate-50 border border-slate-200 text-[11px] font-mono rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary" />
                            <div className="flex items-center gap-3">
                              {pageImageUploading && <span className="text-[10px] text-primary font-bold">Enviando imagem...</span>}
                              {pageForm.pageImageUrl && !pageImageUploading && (
                                <button type="button" onClick={() => setPageForm(prev => ({ ...prev, pageImageUrl: '' }))}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600 cursor-pointer">
                                  <Trash2 className="h-3 w-3" /> Remover imagem
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SEO meta description */}
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 block">Meta descrição (SEO)</label>
                        <textarea
                          rows={2}
                          maxLength={200}
                          value={pageForm.pageMetaDescription}
                          onChange={(e) => setPageForm(prev => ({ ...prev, pageMetaDescription: e.target.value }))}
                          placeholder="Resumo de até ~160 caracteres para o Google. Vazio = usa o subtítulo."
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                        />
                        <span className="text-[10px] text-slate-400">{pageForm.pageMetaDescription.length}/200</span>
                      </div>

                      <KeywordsField
                        value={pageForm.pageKeywords}
                        onChange={(next) => setPageForm(prev => ({ ...prev, pageKeywords: next }))}
                        suggestions={generalForm.seoKeywords || []}
                        hint="Termos que descrevem esta página. Vazio = usa as palavras-chave do site."
                      />

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 block">Descrição da página</label>
                        <RichTextEditor
                          value={pageForm.pageDescriptionHtml}
                          onChange={(html) => setPageForm(prev => ({ ...prev, pageDescriptionHtml: html }))}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button type="button" onClick={() => setPageEditingService(null)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer">Cancelar</button>
                        <button type="submit"
                          className="bg-primary hover:bg-purple-700 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow">
                          <Save className="h-3.5 w-3.5" /> Salvar página
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* MODAL: SERVICE FAQ */}
                {faqEditingService && (
                  <div
                    className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150"
                    onClick={() => setFaqEditingService(null)}
                  >
                    <form
                      onSubmit={handleSaveServiceFaq}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-4 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-4 p-5 sm:p-6"
                    >
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-amber-600" /> Perguntas Frequentes: {faqEditingService.label}
                        </h4>
                        <button type="button" onClick={() => setFaqEditingService(null)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Fechar">
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black text-slate-400 block">Título da seção</label>
                          <input
                            type="text"
                            value={faqForm.faqTitle}
                            onChange={(e) => setFaqForm(prev => ({ ...prev, faqTitle: e.target.value }))}
                            placeholder="Perguntas Frequentes"
                            className="w-full bg-slate-50 border border-slate-200 text-sm font-bold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-black text-slate-400 block">Subtítulo / descrição da seção</label>
                          <input
                            type="text"
                            value={faqForm.faqSubtitle}
                            onChange={(e) => setFaqForm(prev => ({ ...prev, faqSubtitle: e.target.value }))}
                            placeholder="Texto curto abaixo do título (opcional)"
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-black text-slate-500 uppercase">Perguntas &amp; respostas</label>
                          <button type="button" onClick={addServiceFaq}
                            className="bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                            <Plus className="h-3.5 w-3.5" /> Nova pergunta
                          </button>
                        </div>

                        {faqForm.faqs.length === 0 ? (
                          <div className="text-[11px] text-slate-400 font-semibold bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3 text-center">
                            Nenhuma pergunta — a seção de FAQ não aparece na página deste serviço.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {faqForm.faqs.map((faq, idx) => (
                              <div key={faq.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-slate-400 shrink-0">#{idx + 1}</span>
                                  <div className="ml-auto flex items-center gap-1">
                                    <button type="button" onClick={() => moveServiceFaq(idx, -1)} disabled={idx === 0}
                                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-40 text-xs font-bold" title="Subir">↑</button>
                                    <button type="button" onClick={() => moveServiceFaq(idx, 1)} disabled={idx === faqForm.faqs.length - 1}
                                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-40 text-xs font-bold" title="Descer">↓</button>
                                    <button type="button" onClick={() => removeServiceFaq(idx)}
                                      className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200" title="Remover">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <input type="text" value={faq.question}
                                  onChange={(e) => updateServiceFaq(idx, { question: e.target.value })}
                                  placeholder="Pergunta"
                                  className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary" />
                                <textarea rows={2} value={faq.answer}
                                  onChange={(e) => updateServiceFaq(idx, { answer: e.target.value })}
                                  placeholder="Resposta"
                                  className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary resize-y" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button type="button" onClick={() => setFaqEditingService(null)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer">Cancelar</button>
                        <button type="submit"
                          className="bg-primary hover:bg-purple-700 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow">
                          <Save className="h-3.5 w-3.5" /> Salvar FAQ
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* PLATFORMS FILTER SUB-BAR */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 bg-white border border-slate-200/60 p-2.5 rounded-xl">
                  <button 
                    onClick={() => setServicesPlatformFilter('todos')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      servicesPlatformFilter === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🌟 Todos ({services.length})
                  </button>
                  {catalog.platforms.map(p => {
                    const count = services.filter(s => s.platform === p.id).length;
                    return (
                      <button 
                        key={p.id}
                        onClick={() => setServicesPlatformFilter(p.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          servicesPlatformFilter === p.id ? 'bg-primary text-white' : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p.name} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* SEARCH RESULTS DISPLAY TABLE */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-left font-semibold text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase border-b border-slate-100 font-mono tracking-wider">
                      <tr>
                        <th className="p-4">Serviço / Rede</th>
                        <th className="p-4">Preço</th>
                        <th className="p-4">Pacotes / Modo</th>
                        <th className="p-4">Velocidade</th>
                        <th className="p-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {services
                        .filter(s => servicesPlatformFilter === 'todos' || s.platform === servicesPlatformFilter)
                        .map(service => {
                          const pf = catalog.platforms.find(p => p.id === service.platform);
                          const formattedPrice = (service.pricePerItem * 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          const pkgs = Array.isArray(service.packages) ? service.packages : [];
                          const hasPackages = pkgs.length > 0;
                          const pkgPrices = pkgs.map(p => p.price).filter(n => n > 0);
                          const minPkgPrice = pkgPrices.length ? Math.min(...pkgPrices) : 0;

                          return (
                            <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-900 text-sm block">{service.label}</span>
                                  <span className="text-[10px] uppercase font-black tracking-wider text-primary font-mono block">
                                    {pf?.name} • type: {service.type}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 font-bold text-slate-950 font-mono text-sm">
                                {hasPackages
                                  ? <span>a partir de R$ {minPkgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  : <span>R$ {formattedPrice}<span className="text-[10px] text-slate-400 font-sans font-semibold"> /1k</span></span>}
                              </td>
                              <td className="p-4 text-slate-500 font-mono">
                                {hasPackages
                                  ? <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md text-[11px] font-sans"><Package className="h-3 w-3" /> {pkgs.length} pacote{pkgs.length > 1 ? 's' : ''}</span>
                                  : <span className="text-[11px] font-sans font-semibold">Slider: {service.minQuantity.toLocaleString('pt-BR')} ~ {service.maxQuantity.toLocaleString('pt-BR')}</span>}
                              </td>
                              <td className="p-4 text-slate-500 font-semibold italic text-[11px]">
                                {service.deliverySpeed}
                              </td>
                              <td className="p-4">
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleEditServiceInit(service)}
                                    className="p-1.5 hover:bg-purple-100 hover:text-primary text-slate-500 rounded transition-colors cursor-pointer"
                                    title="Editar serviço (nome, preço, pacotes)"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => openServicePageModal(service)}
                                    className="p-1.5 hover:bg-sky-100 hover:text-sky-600 text-slate-500 rounded transition-colors cursor-pointer"
                                    title="Página & SEO (conteúdo, imagem, descrição)"
                                  >
                                    <Globe className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => openServiceFaqModal(service)}
                                    className="p-1.5 hover:bg-amber-100 hover:text-amber-600 text-slate-500 rounded transition-colors cursor-pointer"
                                    title="Perguntas frequentes do serviço"
                                  >
                                    <HelpCircle className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteService(service.id)}
                                    className="p-1.5 hover:bg-red-100 hover:text-red-600 text-slate-500 rounded transition-colors cursor-pointer"
                                    title="Excluir Serviço"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================== TAB 3: GERENCIAR PLANOS =================== */}
            {activeTab === 'plans' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-display font-black text-xl text-slate-900">Gerenciador de Planos em Destaque</h3>
                    <p className="text-slate-500 text-xs font-semibold">Crie, edite ou remova pacotes pré-modelados e controle a exibição da seção no site</p>
                  </div>
                  <button
                    onClick={handleAddPlanInit}
                    className="flex items-center gap-1.5 bg-primary hover:bg-purple-700 text-white text-xs font-bold rounded-lg px-3 py-2.5 transition-colors shrink-0"
                  >
                    <Plus className="h-4 w-4" /> Adicionar plano
                  </button>
                </div>

                {/* SECTION VISIBILITY TOGGLE */}
                <label className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm cursor-pointer">
                  <span className="text-sm font-bold text-slate-800">
                    Seção "Nossos Planos" visível no site
                    <span className="block text-[11px] font-semibold text-slate-400">Se desativada, a seção some da home, do menu do header e do rodapé.</span>
                  </span>
                  <input type="checkbox" className="h-5 w-5 accent-primary shrink-0" checked={plansSectionEnabled}
                    onChange={(e) => handleTogglePlansSection(e.target.checked)} />
                </label>

                {/* PLAN EDIT FORM SCREEN */}
                {editingPlan && (
                  <form onSubmit={handleSavePlan} className="bg-white border-2 border-primary/30 p-5 rounded-xl shadow-md space-y-4 animate-in slide-in-from-top duration-300">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                      {plans.some(p => p.id === editingPlan.id) ? '📝 Customização' : '➕ Novo'} do Plano: "{editingPlan.name}"
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Nome do Plano</label>
                        <input
                          type="text"
                          required
                          value={editingPlan.name}
                          onChange={(e) => setEditingPlan(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Rede Social</label>
                        <select
                          value={editingPlan.platform}
                          onChange={(e) => setEditingPlan(prev => prev ? ({ ...prev, platform: e.target.value as SocialPlatform }) : null)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800"
                        >
                          {catalog.platforms.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Tipo de Serviço</label>
                        <select
                          value={editingPlan.type}
                          onChange={(e) => setEditingPlan(prev => prev ? ({ ...prev, type: e.target.value as PlanItem['type'] }) : null)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800"
                        >
                          <option value="followers">Seguidores</option>
                          <option value="likes">Curtidas</option>
                          <option value="views">Visualizações</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Quantidade (Itens)</label>
                        <input
                          type="number"
                          required
                          value={editingPlan.quantity}
                          onChange={(e) => setEditingPlan(prev => prev ? ({ ...prev, quantity: parseInt(e.target.value, 10) }) : null)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg p-2.5 text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Preço Final (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={editingPlan.price}
                          onChange={(e) => setEditingPlan(prev => prev ? ({ ...prev, price: parseFloat(e.target.value) }) : null)}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg p-2.5 text-slate-800"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Economia Estimada (%)</label>
                        <input
                          type="number"
                          value={editingPlan.savingsPercent || ''}
                          onChange={(e) => setEditingPlan(prev => prev ? ({ ...prev, savingsPercent: parseInt(e.target.value, 10) }) : null)}
                          placeholder="Ex: 15"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="is-popular-checkbox"
                          checked={!!editingPlan.isPopular}
                          onChange={(e) => setEditingPlan(prev => prev ? ({ ...prev, isPopular: e.target.checked }) : null)}
                          className="h-4 w-4 rounded text-primary focus:ring-primary border-slate-300"
                        />
                        <label htmlFor="is-popular-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                          Destacar como Popular (Borda Colorida)
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingPlan(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-primary hover:bg-purple-700 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Salvar Plano
                      </button>
                    </div>
                  </form>
                )}

                {/* PLANS GRID DISPLAY LIST */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.map(plan => {
                    const plat = catalog.platforms.find(p => p.id === plan.platform);
                    return (
                      <div 
                        key={plan.id}
                        className={`bg-white border rounded-xl p-5 shadow-sm space-y-3 relative group transition-all ${
                          plan.isPopular ? 'border-primary/50 bg-[#faf5ff]/20' : 'border-slate-200'
                        }`}
                      >
                        {plan.isPopular && (
                          <span className="absolute top-3 right-3 bg-primary text-white text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                            Destaque
                          </span>
                        )}

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{plat?.name}</span>
                          <h4 className="font-display font-black text-slate-900 text-base">{plan.name}</h4>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100/80 grid grid-cols-2 gap-2 text-center text-xs">
                          <div>
                            <span className="text-slate-400 font-bold block text-[9px] uppercase">Quantidade</span>
                            <strong className="text-slate-900 text-sm font-mono">{plan.quantity.toLocaleString('pt-BR')}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block text-[9px] uppercase">Valor Final</span>
                            <strong className="text-primary text-sm font-mono">R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold text-[11px] p-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Excluir plano"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditPlanInit(plan)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <Pencil className="h-3 w-3" />
                            Editar Plano
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =================== TAB 4: PEDIDOS =================== */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-black text-xl text-slate-900">Histórico de Pedidos</h3>
                  <p className="text-slate-500 text-xs font-semibold">Acompanhe, edite e altere o status dos pedidos dos clientes</p>
                </div>

                {orders.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="h-4 w-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderSearchText}
                        onChange={(e) => setOrderSearchText(e.target.value)}
                        placeholder="Buscar por pedido, perfil, e-mail, telefone ou serviço..."
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 pl-9 pr-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                      />
                    </div>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="todos">Todos os status</option>
                      {ORDER_STATUSES.map(st => (
                        <option key={st.value} value={st.value}>{st.label}</option>
                      ))}
                    </select>
                    <select
                      value={orderPlatformFilter}
                      onChange={(e) => setOrderPlatformFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="todos">Todas as redes</option>
                      {catalog.platforms.map(pf => (
                        <option key={pf.id} value={pf.id}>{pf.name}</option>
                      ))}
                    </select>
                    <select
                      value={orderPeriodFilter}
                      onChange={(e) => setOrderPeriodFilter(e.target.value as typeof orderPeriodFilter)}
                      className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="todos">Qualquer data</option>
                      <option value="hoje">Últimas 24 horas</option>
                      <option value="7">Últimos 7 dias</option>
                      <option value="30">Últimos 30 dias</option>
                    </select>
                    {orderFiltersOn && (
                      <button
                        type="button"
                        onClick={() => {
                          setOrderSearchText('');
                          setOrderStatusFilter('todos');
                          setOrderPlatformFilter('todos');
                          setOrderPeriodFilter('todos');
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary px-2 py-2.5 cursor-pointer transition-colors"
                        title="Limpar os filtros"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Limpar
                      </button>
                    )}
                  </div>
                )}

                {orders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center shadow-sm max-w-sm mx-auto border border-slate-200">
                    <HelpCircle className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <h4 className="font-bold text-slate-800">Sem pedidos realizados</h4>
                    <p className="text-slate-500 text-xs mt-1 font-semibold leading-relaxed">
                      Nenhum pedido foi efetuado ainda. Eles aparecerão aqui assim que um cliente comprar.
                    </p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-semibold">
                    <Filter className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    Nenhum pedido corresponde aos filtros selecionados.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left font-semibold text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase border-b border-slate-150 font-mono tracking-wider">
                        <tr>
                          <th className="p-4">Pedido / Perfil</th>
                          <th className="p-4">Serviço Solicitado</th>
                          <th className="p-4">Faturamento</th>
                          <th className="p-4">Cliente / Contatos</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pageSlice<AdminOrder>(filteredOrders, orderPage, orderPerPage).map(order => {
                          const orderDateStr = formatDateTime(order.date, {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          });

                          return (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-slate-900 font-mono text-sm block">#{order.id}</span>
                                  <span className="text-[10px] text-slate-400 block font-mono">{orderDateStr}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-slate-800 block">
                                  {order.quantity.toLocaleString('pt-BR')} {order.serviceLabel}
                                </span>
                                <span className="text-[10px] bg-slate-100 border text-slate-500 font-black py-0.5 px-2 rounded uppercase tracking-wider font-mono">
                                  {order.platform}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="font-bold text-slate-950 font-mono text-sm block">
                                  R$ {order.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[9px] font-black text-slate-400 uppercase font-mono block">
                                  via {order.paymentMethod}
                                </span>
                              </td>
                              <td className="p-4 text-[11px] leading-tight text-slate-500 space-y-0.5">
                                <div className="font-bold text-primary text-xs">{order.username}</div>
                                <div>{order.email}</div>
                                <div>{order.phone}</div>
                              </td>
                              <td className="p-4">
                                <select
                                  value={ORDER_STATUSES.some(s => s.value === order.status) ? order.status : 'aguardando_pagamento'}
                                  onChange={(e) => handleChangeOrderStatus(order.id, e.target.value)}
                                  className="text-[11px] font-bold border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                                  title="Alterar status do pedido"
                                >
                                  {ORDER_STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                  ))}
                                </select>

                                {/* Motivo do "Outro". Escolher "Outro" de novo
                                    não dispara o onChange do select, então o
                                    caminho para reabrir/editar é este resumo. */}
                                {order.status === 'outro' && (
                                  <button
                                    type="button"
                                    onClick={() => openIssueModal(order)}
                                    title="Editar o motivo e reenviar o aviso"
                                    className="mt-1.5 block text-left max-w-[190px] cursor-pointer group"
                                  >
                                    <span className="text-[10px] font-black text-orange-700 group-hover:underline block truncate">
                                      {order.issueTitle || 'Sem motivo registrado'}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 block">
                                      {order.issueNotifiedAt
                                        ? `Cliente avisado em ${formatDateTime(order.issueNotifiedAt)}`
                                        : order.issueNotifyError
                                          ? 'E-mail não enviado'
                                          : 'Cliente não avisado'}
                                    </span>
                                  </button>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setEditingOrder(order)}
                                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-purple-50 rounded transition-colors cursor-pointer"
                                    title="Editar pedido"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    title="Remover pedido"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <AdminPagination
                      total={filteredOrders.length}
                      page={clampPage(orderPage, filteredOrders.length, orderPerPage)}
                      perPage={orderPerPage}
                      onPageChange={setOrderPage}
                      onPerPageChange={setOrderPerPage}
                      itemLabel="pedidos"
                    />
                  </div>
                )}
              </div>
            )}

            {/* =================== TAB: COOKIES / LGPD =================== */}
            {activeTab === 'cookies' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-display font-black text-xl text-slate-900">Consentimentos de Cookies (LGPD)</h3>
                    <p className="text-slate-500 text-xs font-semibold">Registro das escolhas de cookies feitas pelos visitantes do site.</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadCookieConsents}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary border border-slate-200 bg-white rounded-lg px-3 py-2 transition-colors shrink-0"
                  >
                    <RotateCcw className="h-4 w-4" /> Atualizar
                  </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase font-black block">Total de registros</span>
                    <span className="font-display font-black text-lg text-slate-950">{cookieConsents.length}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase font-black block">Aceitaram análise</span>
                    <span className="font-display font-black text-lg text-slate-950">{cookieConsents.filter(c => c.choices?.analytics).length}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase font-black block">Aceitaram marketing</span>
                    <span className="font-display font-black text-lg text-slate-950">{cookieConsents.filter(c => c.choices?.marketing).length}</span>
                  </div>
                </div>

                {cookieConsents.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="h-4 w-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={cookieSearch}
                        onChange={(e) => setCookieSearch(e.target.value)}
                        placeholder="Buscar por identificador ou navegador..."
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 pl-9 pr-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                      />
                    </div>
                    <select
                      value={cookieAnalytics}
                      onChange={(e) => setCookieAnalytics(e.target.value as typeof cookieAnalytics)}
                      className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="todos">Análise: todos</option>
                      <option value="sim">Análise: aceita</option>
                      <option value="nao">Análise: recusada</option>
                    </select>
                    <select
                      value={cookieMarketing}
                      onChange={(e) => setCookieMarketing(e.target.value as typeof cookieMarketing)}
                      className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="todos">Marketing: todos</option>
                      <option value="sim">Marketing: aceito</option>
                      <option value="nao">Marketing: recusado</option>
                    </select>
                    <select
                      value={cookiePeriod}
                      onChange={(e) => setCookiePeriod(e.target.value as typeof cookiePeriod)}
                      className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="todos">Qualquer data</option>
                      <option value="hoje">Últimas 24 horas</option>
                      <option value="7">Últimos 7 dias</option>
                      <option value="30">Últimos 30 dias</option>
                    </select>
                    {cookieFiltersOn && (
                      <button
                        type="button"
                        onClick={() => {
                          setCookieSearch('');
                          setCookieAnalytics('todos');
                          setCookieMarketing('todos');
                          setCookiePeriod('todos');
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary px-2 py-2.5 cursor-pointer transition-colors"
                        title="Limpar os filtros"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Limpar
                      </button>
                    )}
                  </div>
                )}

                {cookieConsentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : cookieConsents.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-semibold">
                    <Cookie className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    Nenhum consentimento registrado ainda.
                  </div>
                ) : filteredConsents.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-semibold">
                    <Filter className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    Nenhum consentimento corresponde aos filtros.
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left font-semibold text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase border-b border-slate-100 font-mono tracking-wider">
                        <tr>
                          <th className="p-4">Data</th>
                          <th className="p-4">Análise</th>
                          <th className="p-4">Marketing</th>
                          <th className="p-4">Navegador</th>
                          <th className="p-4">ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pageSlice<CookieConsentRecord>(filteredConsents, cookiePage, cookiePerPage).map(rec => (
                          <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-mono text-slate-600">{formatDateTime(rec.createdAt)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${rec.choices?.analytics ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                {rec.choices?.analytics ? 'Aceito' : 'Recusado'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${rec.choices?.marketing ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                {rec.choices?.marketing ? 'Aceito' : 'Recusado'}
                              </span>
                            </td>
                            <td className="p-4 text-[10px] text-slate-400 max-w-xs truncate" title={rec.userAgent}>{rec.userAgent || '—'}</td>
                            <td className="p-4 font-mono text-[10px] text-slate-400">{rec.id.slice(0, 8)}…</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <AdminPagination
                      total={filteredConsents.length}
                      page={clampPage(cookiePage, filteredConsents.length, cookiePerPage)}
                      perPage={cookiePerPage}
                      onPageChange={setCookiePage}
                      onPerPageChange={setCookiePerPage}
                      itemLabel="consentimentos"
                    />
                  </div>
                )}
              </div>
            )}

            {/* =================== TAB 6: GERENCIAR USUÁRIOS =================== */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-display font-black text-xl text-slate-900">Gerenciamento de Usuários</h3>
                    <p className="text-slate-500 text-xs font-semibold">Crie, edite, bloqueie ou remova contas e redefina senhas</p>
                  </div>

                  <button
                    onClick={openCreateAccount}
                    className="flex items-center gap-1.5 bg-primary hover:bg-purple-700 text-white text-xs font-bold rounded-lg px-3 py-2.5 transition-colors shrink-0"
                  >
                    <Plus className="h-4 w-4" /> Novo usuário
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="h-4 w-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, e-mail ou telefone..."
                      value={userSearchText}
                      onChange={(e) => setUserSearchText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as typeof userRoleFilter)}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="todos">Todos os perfis</option>
                    <option value="cliente">Clientes</option>
                    <option value="admin">Administradores</option>
                  </select>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value as typeof userStatusFilter)}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="todos">Ativos e bloqueados</option>
                    <option value="ativos">Só ativos</option>
                    <option value="bloqueados">Só bloqueados</option>
                  </select>
                  <select
                    value={userBuyerFilter}
                    onChange={(e) => setUserBuyerFilter(e.target.value as typeof userBuyerFilter)}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="todos">Com ou sem compras</option>
                    <option value="com">Só quem já comprou</option>
                    <option value="sem">Só quem nunca comprou</option>
                  </select>
                  {(userSearchText.trim() || userRoleFilter !== 'todos' || userStatusFilter !== 'todos' || userBuyerFilter !== 'todos') && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserSearchText('');
                        setUserRoleFilter('todos');
                        setUserStatusFilter('todos');
                        setUserBuyerFilter('todos');
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary px-2 py-2.5 cursor-pointer transition-colors"
                      title="Limpar os filtros"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Limpar
                    </button>
                  )}
                </div>

                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  (() => {
                    const search = userSearchText.trim().toLowerCase();
                    const filteredUsers = users.filter(u => {
                      if (search) {
                        const alvo = [u.name, u.email, u.phone].map(v => String(v || '').toLowerCase()).join(' ');
                        if (!alvo.includes(search)) return false;
                      }
                      if (userRoleFilter !== 'todos' && (u.role || 'cliente') !== userRoleFilter) return false;
                      if (userStatusFilter === 'ativos' && u.blocked) return false;
                      if (userStatusFilter === 'bloqueados' && !u.blocked) return false;
                      if (userBuyerFilter === 'com' && !(u.ordersCount > 0)) return false;
                      if (userBuyerFilter === 'sem' && u.ordersCount > 0) return false;
                      return true;
                    });

                    return filteredUsers.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-semibold">
                        <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        Nenhum usuário cadastrado ou encontrado com esta pesquisa.
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs min-w-[760px]">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider">
                              <th className="p-4">Usuário</th>
                              <th className="p-4">Contatos</th>
                              <th className="p-4">Cadastrado Em</th>
                              <th className="p-4">Compras</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                            {pageSlice<AdminAccount>(filteredUsers, userPage, userPerPage).map(user => {
                              const createdStr = user.createdAt ? formatDateTime(user.createdAt, {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              }) : '—';

                              const isBlocked = user.blocked;
                              const isAdmin = user.role === 'admin';

                              return (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className={`p-2 rounded-full font-bold text-center shrink-0 w-8 h-8 flex items-center justify-center text-xs ${isBlocked ? 'bg-red-50 text-red-600' : isAdmin ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-primary'}`}>
                                        {(user.name || user.email || '?').slice(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                                          {user.name || '(sem nome)'}
                                          <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-black ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {isAdmin ? 'Admin' : 'Cliente'}
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">ID: {user.id.slice(0, 8)}...</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-[11px] leading-relaxed">
                                    <div className="font-semibold text-slate-800">{user.email}</div>
                                    <div className="text-slate-400 font-mono">{user.phone || '—'}</div>
                                  </td>
                                  <td className="p-4 text-slate-400 font-mono">
                                    {createdStr}
                                  </td>
                                  <td className="p-4">
                                    {user.ordersCount > 0 ? (
                                      <button
                                        type="button"
                                        onClick={() => setOrdersOfUserModal(user)}
                                        className="text-left cursor-pointer group"
                                        title="Ver os pedidos deste usuário"
                                      >
                                        <div className="font-bold text-primary text-sm font-mono group-hover:underline">{user.ordersCount} ped.</div>
                                        <div className="text-[10px] text-slate-400 font-mono">R$ {(user.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                      </button>
                                    ) : (
                                      <>
                                        <div className="font-bold text-slate-400 text-sm font-mono">0 ped.</div>
                                        <div className="text-[10px] text-slate-300 font-mono">R$ 0,00</div>
                                      </>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <button
                                      onClick={() => handleToggleUserStatus(user)}
                                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center gap-1 leading-none ${
                                        isBlocked
                                          ? 'bg-red-50 text-red-600 border-red-200'
                                          : 'bg-green-50 text-green-700 border-green-200'
                                      }`}
                                      title={isBlocked ? 'Clique para Desbloquear' : 'Clique para Bloquear'}
                                    >
                                      {isBlocked ? (<><Ban className="h-3 w-3" /> Bloqueado</>) : (<><UserCheck className="h-3 w-3" /> Ativo</>)}
                                    </button>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => openEditAccount(user)}
                                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                        title="Editar usuário"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => { setPwdResetAccount(user); setPwdResetValue(''); }}
                                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                        title="Redefinir senha"
                                      >
                                        <KeyRound className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Remover usuário"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <AdminPagination
                          total={filteredUsers.length}
                          page={clampPage(userPage, filteredUsers.length, userPerPage)}
                          perPage={userPerPage}
                          onPageChange={setUserPage}
                          onPerPageChange={setUserPerPage}
                          itemLabel="usuários"
                        />
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* =================== TAB: BLOG =================== */}
            {activeTab === 'blog' && (
              <BlogAdmin triggerSuccess={triggerSuccess} triggerError={triggerError} />
            )}

            {/* =================== TAB: DEPOIMENTOS E AVALIAÇÕES =================== */}
            {activeTab === 'testimonials' && (
              <div className="space-y-6">
                {/* Duas listas na mesma aba: é a mesma tarefa de moderação. O
                    que muda é a origem — o depoimento vem do site, a avaliação
                    vem de um pedido entregue e volta para a página do serviço. */}
                <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
                  <button
                    onClick={() => setReviewsView('testimonials')}
                    className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                      reviewsView === 'testimonials' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Depoimentos da home
                  </button>
                  <button
                    onClick={() => setReviewsView('services')}
                    className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                      reviewsView === 'services' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Avaliações de serviços
                  </button>
                </div>

                {reviewsView === 'testimonials' ? (
                  <TestimonialsAdmin triggerSuccess={triggerSuccess} triggerError={triggerError} />
                ) : (
                  <>
                    <div>
                      <h3 className="font-display font-black text-xl text-slate-900">Avaliações de Serviços</h3>
                      <p className="text-slate-500 text-xs font-semibold">
                        Escritas por quem comprou, uma por pedido entregue. Depois de publicadas, aparecem na página do serviço.
                      </p>
                    </div>
                    <ServiceReviewsAdmin services={services} triggerSuccess={triggerSuccess} triggerError={triggerError} />
                  </>
                )}
              </div>
            )}

            {/* =================== TAB: MENSAGENS =================== */}
            {activeTab === 'messages' && (
              <TicketsAdmin triggerSuccess={triggerSuccess} triggerError={triggerError} />
            )}

            {/* =================== TAB: CONFIGURAÇÕES GERAIS =================== */}
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="font-display font-black text-xl text-slate-900">Configurações Gerais</h3>
                  <p className="text-slate-500 text-xs font-semibold">Identidade do site, marca, SEO, fuso horário e tema. Arquivos são hospedados no Cloudflare R2.</p>
                </div>

                {generalLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveGeneral} className="space-y-6">

                    {/* IDENTITY */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-purple-50 text-primary p-2 rounded-lg"><Type className="h-5 w-5" /></div>
                        <h4 className="font-bold text-slate-800 text-sm">Identidade do Site</h4>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Nome do Site</label>
                        <input
                          type="text"
                          value={generalForm.siteName}
                          onChange={(e) => setGeneralForm(prev => ({ ...prev, siteName: e.target.value }))}
                          placeholder="Ex: ImpulsioneGram"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        />
                        <span className="text-[10px] text-slate-400 block font-medium">Usado no cabeçalho, rodapé, título da aba e no painel.</span>
                      </div>
                    </div>

                    {/* BRANDING (logo + favicon uploads) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-amber-50 text-amber-600 p-2 rounded-lg"><ImageIcon className="h-5 w-5" /></div>
                        <h4 className="font-bold text-slate-800 text-sm">Marca (Logo e Favicon)</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Logo */}
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Logo</label>
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                              {generalForm.logoUrl
                                ? <img src={generalForm.logoUrl} alt="logo" className="max-h-full max-w-full object-contain" />
                                : <ImageIcon className="h-5 w-5 text-slate-300" />}
                            </div>
                            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors">
                              <Upload className="h-3.5 w-3.5" />
                              {uploadingLogo ? 'Enviando...' : 'Enviar logo'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingLogo}
                                onChange={(e) => handleUploadAsset(e.target.files?.[0], 'branding', 'logoUrl', setUploadingLogo)}
                              />
                            </label>
                            {generalForm.logoUrl && (
                              <button
                                type="button"
                                onClick={() => setGeneralForm(prev => ({ ...prev, logoUrl: '' }))}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-bold px-2 py-2 rounded-lg flex items-center gap-1 transition-colors"
                                title="Remover logo"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Remover
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Favicon */}
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Favicon</label>
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                              {generalForm.faviconUrl
                                ? <img src={generalForm.faviconUrl} alt="favicon" className="max-h-full max-w-full object-contain" />
                                : <Compass className="h-5 w-5 text-slate-300" />}
                            </div>
                            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors">
                              <Upload className="h-3.5 w-3.5" />
                              {uploadingFavicon ? 'Enviando...' : 'Enviar favicon'}
                              <input
                                type="file"
                                accept="image/*,.ico"
                                className="hidden"
                                disabled={uploadingFavicon}
                                onChange={(e) => handleUploadAsset(e.target.files?.[0], 'branding', 'faviconUrl', setUploadingFavicon)}
                              />
                            </label>
                            {generalForm.faviconUrl && (
                              <button
                                type="button"
                                onClick={() => setGeneralForm(prev => ({ ...prev, faviconUrl: '' }))}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-bold px-2 py-2 rounded-lg flex items-center gap-1 transition-colors"
                                title="Remover favicon"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Remover
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SEO */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-green-50 text-green-600 p-2 rounded-lg"><Globe className="h-5 w-5" /></div>
                        <h4 className="font-bold text-slate-800 text-sm">SEO</h4>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Título (meta title)</label>
                        <input
                          type="text"
                          value={generalForm.seoTitle}
                          onChange={(e) => setGeneralForm(prev => ({ ...prev, seoTitle: e.target.value }))}
                          placeholder="Ex: ImpulsioneGram | Impulsione suas Redes Sociais"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Descrição (meta description)</label>
                        <textarea
                          rows={2}
                          value={generalForm.seoDescription}
                          onChange={(e) => setGeneralForm(prev => ({ ...prev, seoDescription: e.target.value }))}
                          placeholder="Descrição curta exibida nos resultados de busca."
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y"
                        />
                      </div>
                      <KeywordsField
                        value={generalForm.seoKeywords || []}
                        onChange={(next) => setGeneralForm(prev => ({ ...prev, seoKeywords: next }))}
                        hint="Valem para o site inteiro. Cada serviço e cada artigo pode ter as suas próprias."
                      />
                    </div>

                    {/* REGIONAL + THEME */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                          <div className="bg-sky-50 text-sky-600 p-2 rounded-lg"><Clock className="h-5 w-5" /></div>
                          <h4 className="font-bold text-slate-800 text-sm">Fuso Horário</h4>
                        </div>
                        <select
                          value={generalForm.timezone}
                          onChange={(e) => setGeneralForm(prev => ({ ...prev, timezone: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        >
                          <option value="America/Recife">Recife (UTC−3) — padrão</option>
                          <option value="America/Sao_Paulo">São Paulo / Brasília (UTC−3)</option>
                          <option value="America/Manaus">Manaus (UTC−4)</option>
                          <option value="America/Rio_Branco">Rio Branco (UTC−5)</option>
                          <option value="America/Noronha">Fernando de Noronha (UTC−2)</option>
                        </select>
                        <span className="text-[10px] text-slate-400 block font-medium">Aplicado na exibição de datas e no banco de dados.</span>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                          <div className="bg-rose-50 text-rose-600 p-2 rounded-lg"><Palette className="h-5 w-5" /></div>
                          <h4 className="font-bold text-slate-800 text-sm">Tema</h4>
                        </div>
                        <select
                          value={generalForm.theme}
                          onChange={(e) => setGeneralForm(prev => ({ ...prev, theme: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        >
                          {listThemes().map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {listThemes().find(t => t.id === generalForm.theme)?.description
                            || 'Define o visual do site público. Recarregue o site para ver a troca.'}
                        </span>
                      </div>
                    </div>

                    {/* ORDEM DAS SEÇÕES DA HOME */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg"><SlidersHorizontal className="h-5 w-5" /></div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-sm">Ordem das Seções da Home</h4>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Vale para todos os temas. Cada tema mostra as seções que possui, nesta ordem.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setGeneralForm(prev => ({ ...prev, homeSections: [...DEFAULT_HOME_ORDER] }))}
                          className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-primary flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" /> Restaurar
                        </button>
                      </div>

                      <div className="flex items-center gap-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3">
                        <span className="bg-slate-200 text-slate-500 text-[10px] font-black w-6 h-6 rounded grid place-items-center shrink-0">1</span>
                        <div>
                          <span className="text-xs font-bold text-slate-500 block">Seção principal (herói)</span>
                          <span className="text-[10px] text-slate-400 font-medium">Fixa: abre a home em todos os temas.</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {normalizeHomeOrder(generalForm.homeSections).map((id, index, list) => {
                          const info = HOME_SECTIONS.find(s => s.id === id);
                          const move = (dir: -1 | 1) => {
                            const next = [...list];
                            const target = index + dir;
                            if (target < 0 || target >= next.length) return;
                            [next[index], next[target]] = [next[target], next[index]];
                            setGeneralForm(prev => ({ ...prev, homeSections: next }));
                          };
                          return (
                            <div key={id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
                              <span className="bg-purple-50 text-primary text-[10px] font-black w-6 h-6 rounded grid place-items-center shrink-0">
                                {index + 2}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-slate-800 block">{info?.label || id}</span>
                                <span className="text-[10px] text-slate-400 font-medium block truncate">{info?.hint}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => move(-1)}
                                  disabled={index === 0}
                                  aria-label={`Mover ${info?.label || id} para cima`}
                                  className="h-8 w-8 rounded-lg border border-slate-200 grid place-items-center text-slate-500 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-slate-500 disabled:hover:border-slate-200 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => move(1)}
                                  disabled={index === list.length - 1}
                                  aria-label={`Mover ${info?.label || id} para baixo`}
                                  className="h-8 w-8 rounded-lg border border-slate-200 grid place-items-center text-slate-500 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-slate-500 disabled:hover:border-slate-200 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingGeneral}
                        className="bg-primary hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-xs py-3 px-5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 shadow-md"
                      >
                        <Save className="h-4 w-4" />
                        {isSavingGeneral ? 'Salvando...' : 'Salvar Configurações'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* =================== TAB: CONTATO & RODAPÉ =================== */}
            {activeTab === 'contact' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="font-display font-black text-xl text-slate-900">Contato, Atendimento & Rodapé</h3>
                  <p className="text-slate-500 text-xs font-semibold">Estes dados aparecem no rodapé, na seção "Fale Conosco" e no botão flutuante de WhatsApp.</p>
                </div>

                {companyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveCompany} className="space-y-6">

                    {/* CONTACT */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-green-50 text-green-600 p-2 rounded-lg"><Phone className="h-5 w-5" /></div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Atendimento & Contato</h4>
                          <p className="text-slate-400 text-[11px] font-semibold">Reflete no rodapé, no "Fale Conosco" e no WhatsApp flutuante.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5"><Mail className="h-3 w-3" /> E-mail de Contato</label>
                          <input
                            type="email"
                            value={companyForm.contactEmail}
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                            placeholder="contato@suaempresa.com.br"
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Endereço</label>
                          <input
                            type="text"
                            value={companyForm.address}
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Av. Paulista, 1000 - São Paulo / SP"
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">WhatsApp (somente números, com DDI/DDD)</label>
                          <input
                            type="text"
                            value={companyForm.whatsappNumber}
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, whatsappNumber: e.target.value.replace(/\D/g, '') }))}
                            placeholder="5511999999999"
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                          />
                          <span className="text-[10px] text-slate-400 block font-medium">Usado nos links wa.me (55 + DDD + número).</span>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">WhatsApp (exibição)</label>
                          <input
                            type="text"
                            value={companyForm.whatsappDisplay}
                            onChange={(e) => setCompanyForm(prev => ({ ...prev, whatsappDisplay: e.target.value }))}
                            placeholder="(11) 99999-9999"
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* FOOTER */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-slate-100 text-slate-600 p-2 rounded-lg"><PanelBottom className="h-5 w-5" /></div>
                        <h4 className="font-bold text-slate-800 text-sm">Rodapé</h4>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Descrição (coluna da marca)</label>
                        <textarea
                          rows={3}
                          value={companyForm.footerDescription}
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, footerDescription: e.target.value }))}
                          placeholder="Breve descrição da empresa exibida no rodapé."
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Texto de Copyright (após "© {new Date().getFullYear()}")</label>
                        <input
                          type="text"
                          value={companyForm.copyrightText}
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, copyrightText: e.target.value }))}
                          placeholder="SuaEmpresa. Todos os direitos reservados. CNPJ: 00.000.000/0001-00."
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Isenção de Responsabilidade (texto legal)</label>
                        <textarea
                          rows={4}
                          value={companyForm.footerDisclaimer}
                          onChange={(e) => setCompanyForm(prev => ({ ...prev, footerDisclaimer: e.target.value }))}
                          placeholder="Texto de isenção de responsabilidade exibido no rodapé."
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y"
                        />
                      </div>
                    </div>

                    {/* SOCIAL */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-pink-50 text-pink-600 p-2 rounded-lg"><Share2 className="h-5 w-5" /></div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Redes Sociais</h4>
                          <p className="text-slate-400 text-[11px] font-semibold">Deixe em branco para ocultar o ícone no rodapé.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {([
                          ['socialInstagram', 'Instagram', 'https://instagram.com/seu_perfil'],
                          ['socialYoutube', 'YouTube', 'https://youtube.com/@seu_canal'],
                          ['socialTiktok', 'TikTok', 'https://tiktok.com/@seu_perfil'],
                          ['socialFacebook', 'Facebook', 'https://facebook.com/sua_pagina'],
                          ['socialTwitter', 'Twitter / X', 'https://x.com/seu_perfil'],
                          ['socialKwai', 'Kwai', 'https://kwai.com/@seu_perfil']
                        ] as const).map(([field, label, ph]) => (
                          <div key={field} className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">{label}</label>
                            <input
                              type="text"
                              value={companyForm[field]}
                              onChange={(e) => setCompanyForm(prev => ({ ...prev, [field]: e.target.value }))}
                              placeholder={ph}
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingCompany}
                        className="bg-primary hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-xs py-3 px-5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 shadow-md"
                      >
                        <Save className="h-4 w-4" />
                        {isSavingCompany ? 'Salvando...' : 'Salvar Configurações'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* =================== TAB: INTEGRAÇÕES / API =================== */}
            {activeTab === 'integrations' && (
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-display font-black text-xl text-slate-900">Integrações & Chaves de API</h3>
                    <p className="text-slate-500 text-xs font-semibold">Configure o gateway de pagamento e o painel de entrega (SMM). As chaves ficam salvas com segurança no banco de dados.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSecrets(s => !s)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary border border-slate-200 bg-white rounded-lg px-3 py-2 transition-colors shrink-0"
                  >
                    {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showSecrets ? 'Ocultar chaves' : 'Mostrar chaves'}
                  </button>
                </div>

                {integrationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveIntegrations} className="space-y-6">

                    {/* PAYMENT PROVIDER SELECTOR */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Provedor de Pagamento (PIX)</h4>
                          <p className="text-slate-400 text-[11px] font-semibold">Escolha qual gateway gera as cobranças PIX no checkout. Só o provedor selecionado é usado.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { id: 'mercadopago', label: 'Mercado Pago' },
                          { id: 'woovi', label: 'Woovi' }
                        ] as const).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setIntegrationsForm(prev => ({ ...prev, paymentProvider: opt.id }))}
                            className={`p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                              integrationsForm.paymentProvider === opt.id
                                ? 'bg-primary/5 border-primary ring-1 ring-primary text-primary'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                            {integrationsForm.paymentProvider === opt.id && <span className="block text-[9px] font-black uppercase tracking-wider mt-0.5">✓ Ativo</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* MERCADO PAGO CARD (only shown when it's the active provider) */}
                    {integrationsForm.paymentProvider === 'mercadopago' && (
                    <div className="bg-white border border-primary/40 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-sky-50 text-sky-600 p-2 rounded-lg">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-sm">Mercado Pago (Pagamento PIX)</h4>
                          <p className="text-slate-400 text-[11px] font-semibold">Gera cobranças PIX reais no checkout.</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Access Token</label>
                        <input
                          type={showSecrets ? 'text' : 'password'}
                          autoComplete="off"
                          value={integrationsForm.mercadoPagoAccessToken}
                          onChange={(e) => setIntegrationsForm(prev => ({ ...prev, mercadoPagoAccessToken: e.target.value }))}
                          placeholder="APP_USR-... ou TEST-... (token de teste)"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        />
                        <span className="text-[10px] text-slate-400 block font-medium">Recomendado iniciar com o token de teste (sandbox) para validar sem cobrança real.</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Public Key <span className="text-slate-300 normal-case">(opcional, para cartão)</span></label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={integrationsForm.mercadoPagoPublicKey}
                          onChange={(e) => setIntegrationsForm(prev => ({ ...prev, mercadoPagoPublicKey: e.target.value }))}
                          placeholder="APP_USR-xxxx-xxxx (usada no checkout de cartão)"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        />
                      </div>
                    </div>
                    )}

                    {/* WOOVI CARD (only shown when it's the active provider) */}
                    {integrationsForm.paymentProvider === 'woovi' && (
                    <div className="bg-white border border-primary/40 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-sm">Woovi (Pagamento PIX)</h4>
                          <p className="text-slate-400 text-[11px] font-semibold">Gera cobranças PIX via Woovi (ex-OpenPix).</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">App ID (Authorization)</label>
                        <input
                          type={showSecrets ? 'text' : 'password'}
                          autoComplete="off"
                          value={integrationsForm.wooviAppId}
                          onChange={(e) => setIntegrationsForm(prev => ({ ...prev, wooviAppId: e.target.value.trim() }))}
                          placeholder="App ID gerado no painel do Woovi (API / Plugins)"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        />
                      </div>

                      {/* Ready-to-copy webhook URL (built from PUBLIC_URL) */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">URL do Webhook (cole no painel do Woovi)</label>
                        <div className="flex gap-1.5">
                          <input
                            readOnly
                            value={`${(publicUrl || '').replace(/\/+$/, '')}/api/woovi/webhook`}
                            className="flex-1 bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-600 overflow-hidden text-ellipsis focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${(publicUrl || '').replace(/\/+$/, '')}/api/woovi/webhook`);
                              setCopiedWebhook(true);
                              setTimeout(() => setCopiedWebhook(false), 2000);
                            }}
                            className="bg-primary hover:bg-purple-700 text-white rounded-lg px-3 flex items-center justify-center transition-colors shrink-0"
                            title="Copiar URL"
                          >
                            {copiedWebhook ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          No painel do Woovi (API / Webhooks), cadastre essa URL para confirmação automática. Mesmo sem o webhook, o status é verificado por consulta a cada poucos segundos.
                        </span>
                      </div>
                    </div>
                    )}

                    {/* SMM PANEL CARD */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-purple-50 text-primary p-2 rounded-lg">
                          <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Painel SMM (Entrega)</h4>
                          <p className="text-slate-400 text-[11px] font-semibold">Provedor que entrega seguidores/curtidas após o pagamento.</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">API URL</label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={integrationsForm.smmApiUrl}
                          onChange={(e) => setIntegrationsForm(prev => ({ ...prev, smmApiUrl: e.target.value }))}
                          placeholder="https://seupainel.com/api/v2"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">API Key</label>
                        <input
                          type={showSecrets ? 'text' : 'password'}
                          autoComplete="off"
                          value={integrationsForm.smmApiKey}
                          onChange={(e) => setIntegrationsForm(prev => ({ ...prev, smmApiKey: e.target.value }))}
                          placeholder="sua chave de API do painel"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        />
                      </div>

                      {/* Sincronização automática dos pedidos em aberto */}
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <p className="text-xs font-bold text-slate-600">Sincronização automática</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Verificar status a cada (horas)</label>
                            <input
                              type="number"
                              min={1}
                              value={integrationsForm.smmSyncHours}
                              onChange={(e) => setIntegrationsForm(prev => ({ ...prev, smmSyncHours: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                            />
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Todo pedido que não está Entregue nem Cancelado é consultado no painel.
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Cancelar não pagos após (horas)</label>
                            <input
                              type="number"
                              min={1}
                              value={integrationsForm.orderExpireHours}
                              onChange={(e) => setIntegrationsForm(prev => ({ ...prev, orderExpireHours: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                            />
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Só vale para pedidos sem pagamento. Pedido pago nunca é cancelado por tempo.
                            </span>
                          </div>
                        </div>

                        <button type="button" onClick={handleSmmSync} disabled={smmSyncing}
                          className="text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 bg-white rounded-lg px-3 py-2 transition-colors disabled:opacity-60 flex items-center gap-1.5">
                          <RotateCcw className={`h-3.5 w-3.5 ${smmSyncing ? 'animate-spin' : ''}`} />
                          {smmSyncing ? 'Sincronizando...' : 'Sincronizar pedidos agora'}
                        </button>
                        {smmSyncResult && (
                          <p className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                            {smmSyncResult}
                          </p>
                        )}
                      </div>

                      {/* SMM tools: balance + services lookup (salve as chaves antes) */}
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <p className="text-[10px] text-slate-400 font-semibold">Salve as chaves acima antes de consultar. Use a lista de serviços para descobrir os IDs e preenchê-los em cada serviço (aba Serviços).</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={handleSmmBalance} disabled={smmLoading}
                            className="text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 bg-white rounded-lg px-3 py-2 transition-colors disabled:opacity-60">
                            {smmLoading ? 'Consultando...' : 'Consultar saldo'}
                          </button>
                          <button type="button" onClick={handleSmmServices} disabled={smmLoading}
                            className="text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 bg-white rounded-lg px-3 py-2 transition-colors disabled:opacity-60">
                            Listar serviços
                          </button>
                          {smmInfo && (
                            smmInfo.error
                              ? <span className="text-xs font-bold text-red-500">{smmInfo.error}</span>
                              : <span className="text-xs font-bold text-green-600">Saldo: {smmInfo.balance} {smmInfo.currency}</span>
                          )}
                        </div>
                        {smmServicesList.length > 0 && (
                          <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                            {smmServicesList.map((s: any, i: number) => (
                              <div key={i} className="flex items-center justify-between gap-2 px-3 py-1.5 text-[11px]">
                                <span className="font-mono font-bold text-primary shrink-0">{s.service}</span>
                                <span className="text-slate-600 font-semibold truncate flex-1">{s.name}</span>
                                <span className="text-slate-400 font-mono shrink-0">{s.rate}/{s.min}-{s.max}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RAPIDAPI CARD (consulta de perfil no checkout) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-pink-50 text-pink-600 p-2 rounded-lg">
                          <Search className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">RapidAPI (Perfil Instagram)</h4>
                          <p className="text-slate-400 text-[11px] font-semibold">Consulta a foto e os números do perfil informado no checkout (social-api4).</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">x-rapidapi-key</label>
                        <input
                          type={showSecrets ? 'text' : 'password'}
                          autoComplete="off"
                          value={integrationsForm.rapidApiKey}
                          onChange={(e) => setIntegrationsForm(prev => ({ ...prev, rapidApiKey: e.target.value.trim() }))}
                          placeholder="sua chave x-rapidapi-key"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">x-rapidapi-host</label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={integrationsForm.rapidApiHost}
                          onChange={(e) => setIntegrationsForm(prev => ({ ...prev, rapidApiHost: e.target.value.trim() }))}
                          placeholder="social-api4.p.rapidapi.com"
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        />
                        <p className="text-[10px] text-slate-400 font-semibold">Deixe em branco a chave para desativar a consulta de perfil.</p>
                      </div>
                    </div>

                    {/* EMAIL CARD (SMTP or Resend) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg"><Mail className="h-5 w-5" /></div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Envio de E-mail</h4>
                          <p className="text-slate-400 text-[11px] font-semibold">Usado depois para confirmações de pagamento e criação de conta.</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Método de envio</label>
                        <select
                          value={integrationsForm.emailProvider}
                          onChange={(e) => setIntegrationsForm(prev => ({ ...prev, emailProvider: e.target.value as 'smtp' | 'resend' }))}
                          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                        >
                          <option value="smtp">SMTP (padrão)</option>
                          <option value="resend">Resend (API)</option>
                        </select>
                      </div>

                      {integrationsForm.emailProvider === 'resend' ? (
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Resend API Key</label>
                          <input type={showSecrets ? 'text' : 'password'} autoComplete="off" value={integrationsForm.resendApiKey}
                            onChange={(e) => setIntegrationsForm(prev => ({ ...prev, resendApiKey: e.target.value }))}
                            placeholder="re_xxxxxxxxxxxxxxxx"
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
                          <span className="text-[10px] text-slate-400 block font-medium">Crie a chave no painel do Resend (resend.com).</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Servidor (host)</label>
                            <input type="text" autoComplete="off" value={integrationsForm.smtpHost}
                              onChange={(e) => setIntegrationsForm(prev => ({ ...prev, smtpHost: e.target.value }))}
                              placeholder="smtp.seudominio.com"
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Porta</label>
                            <input type="text" autoComplete="off" value={integrationsForm.smtpPort}
                              onChange={(e) => setIntegrationsForm(prev => ({ ...prev, smtpPort: e.target.value.replace(/\D/g, '') }))}
                              placeholder="587"
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input type="checkbox" id="smtp-secure" checked={integrationsForm.smtpSecure}
                              onChange={(e) => setIntegrationsForm(prev => ({ ...prev, smtpSecure: e.target.checked }))}
                              className="h-4 w-4 rounded text-primary focus:ring-primary border-slate-300" />
                            <label htmlFor="smtp-secure" className="text-xs font-bold text-slate-700 cursor-pointer">Conexão segura (SSL/TLS na porta 465)</label>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Usuário</label>
                            <input type="text" autoComplete="off" value={integrationsForm.smtpUser}
                              onChange={(e) => setIntegrationsForm(prev => ({ ...prev, smtpUser: e.target.value }))}
                              placeholder="usuario@seudominio.com"
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Senha</label>
                            <input type={showSecrets ? 'text' : 'password'} autoComplete="off" value={integrationsForm.smtpPassword}
                              onChange={(e) => setIntegrationsForm(prev => ({ ...prev, smtpPassword: e.target.value }))}
                              placeholder="senha do e-mail"
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
                          </div>
                        </div>
                      )}

                      {/* Common sender fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Nome do Remetente</label>
                          <input type="text" autoComplete="off" value={integrationsForm.smtpFromName}
                            onChange={(e) => setIntegrationsForm(prev => ({ ...prev, smtpFromName: e.target.value }))}
                            placeholder="Ex: ImpulsioneGram"
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">E-mail do Remetente</label>
                          <input type="email" autoComplete="off" value={integrationsForm.smtpFromEmail}
                            onChange={(e) => setIntegrationsForm(prev => ({ ...prev, smtpFromEmail: e.target.value }))}
                            placeholder="no-reply@seudominio.com"
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
                        </div>
                      </div>

                      {/* Teste de envio */}
                      <div className="pt-2 border-t border-slate-100 space-y-2.5">
                        <p className="text-[10px] text-slate-400 font-semibold">
                          Salve as configurações acima antes de testar. O e-mail de teste sai pelo provedor selecionado.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="email"
                            value={testEmailTo}
                            onChange={(e) => setTestEmailTo(e.target.value)}
                            placeholder="destinatário do teste (opcional)"
                            className="flex-1 min-w-[200px] bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                          />
                          <button type="button" onClick={handleTestEmail} disabled={testEmailSending}
                            className="text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 bg-white rounded-lg px-3 py-2.5 transition-colors disabled:opacity-60 flex items-center gap-1.5 shrink-0">
                            <Mail className="h-3.5 w-3.5" />
                            {testEmailSending ? 'Enviando...' : 'Enviar e-mail de teste'}
                          </button>
                        </div>
                        {testEmailResult && (
                          <p className={`text-[11px] font-semibold rounded-lg p-2.5 border ${
                            testEmailResult.ok
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : 'text-red-700 bg-red-50 border-red-200'
                          }`}>
                            {testEmailResult.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* reCAPTCHA v3 CARD */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg"><ShieldCheck className="h-5 w-5" /></div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">reCAPTCHA v3 (Anti-spam)</h4>
                          <p className="text-slate-400 text-[11px] font-semibold">Proteção invisível para comentários e depoimentos. Crie as chaves em google.com/recaptcha/admin.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Site Key (pública)</label>
                          <input type="text" autoComplete="off" value={integrationsForm.recaptchaSiteKey}
                            onChange={(e) => setIntegrationsForm(prev => ({ ...prev, recaptchaSiteKey: e.target.value.trim() }))}
                            placeholder="6Lc..."
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Secret Key</label>
                          <input type={showSecrets ? 'text' : 'password'} autoComplete="off" value={integrationsForm.recaptchaSecretKey}
                            onChange={(e) => setIntegrationsForm(prev => ({ ...prev, recaptchaSecretKey: e.target.value.trim() }))}
                            placeholder="6Lc..."
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Pontuação mínima (0.0 – 1.0)</label>
                          <input type="text" autoComplete="off" value={integrationsForm.recaptchaMinScore}
                            onChange={(e) => setIntegrationsForm(prev => ({ ...prev, recaptchaMinScore: e.target.value }))}
                            placeholder="0.5"
                            className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
                          <span className="text-[10px] text-slate-400 block font-medium">Abaixo da pontuação, o envio é bloqueado como provável bot. Deixe vazias as chaves para desativar.</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[11px] text-amber-800 font-semibold flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>As chaves são salvas no servidor. A ativação de cada integração (cobrança real, entrega automática e envio de e-mail) será ligada e testada em seguida, uma de cada vez.</span>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingIntegrations}
                        className="bg-primary hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-xs py-3 px-5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 shadow-md"
                      >
                        <Save className="h-4 w-4" />
                        {isSavingIntegrations ? 'Salvando...' : 'Salvar Configurações'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* =================== TAB: OFERTA RELÂMPAGO =================== */}
            {activeTab === 'offer' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="font-display font-black text-xl text-slate-900">Oferta Relâmpago (barra superior)</h3>
                  <p className="text-slate-500 text-xs font-semibold">Ative/desative a barra de oferta, defina o desconto real do cupom e o prazo. Quando expirar, a barra some e o cupom para de funcionar automaticamente.</p>
                </div>

                {offerLoading ? (
                  <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" /> Oferta ativa</span>
                      <input type="checkbox" className="h-5 w-5 accent-primary" checked={offerForm.enabled}
                        onChange={(e) => setOfferForm(p => ({ ...p, enabled: e.target.checked }))} />
                    </label>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Texto da barra</label>
                      <input type="text" value={offerForm.text}
                        onChange={(e) => setOfferForm(p => ({ ...p, text: e.target.value }))}
                        placeholder="OFERTA RELÂMPAGO: 20% OFF EXTRA NO PIX"
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Desconto (%)</label>
                        <input type="number" min={0} max={90} value={offerForm.discountPercent}
                          onChange={(e) => setOfferForm(p => ({ ...p, discountPercent: Number(e.target.value) }))}
                          className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Código do cupom</label>
                        <input type="text" value={offerForm.couponCode}
                          onChange={(e) => setOfferForm(p => ({ ...p, couponCode: e.target.value.toUpperCase() }))}
                          placeholder="PIX20"
                          className="w-full bg-slate-50 border border-slate-200 text-sm font-bold uppercase tracking-wide rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Termina em (data e hora)</label>
                      <input type="datetime-local" value={isoToLocalInput(offerForm.endsAt)}
                        onChange={(e) => setOfferForm(p => ({ ...p, endsAt: localInputToIso(e.target.value) }))}
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                      <p className="text-[11px] text-slate-400 font-semibold">Deixe vazio para uma oferta sem prazo. Após esse horário a barra é ocultada e o cupom deixa de aplicar desconto.</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] font-semibold text-amber-800">
                      O desconto do cupom é aplicado de forma real ao total do pedido (validado no servidor) no checkout da home e na compra pelo painel do cliente. O cupom é preenchido automaticamente quando a oferta está ativa.
                    </div>

                    <div className="flex justify-end">
                      <button onClick={handleSaveOffer} disabled={offerSaving}
                        className="bg-primary hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-xs py-3 px-5 rounded-lg flex items-center gap-2 cursor-pointer transition-all shadow-md">
                        <Save className="h-4 w-4" /> {offerSaving ? 'Salvando...' : 'Salvar oferta'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =================== TAB: ASSISTENTE (SOFIA) =================== */}
            {activeTab === 'chatbot' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="font-display font-black text-xl text-slate-900">Assistente Virtual & Ícones Flutuantes</h3>
                  <p className="text-slate-500 text-xs font-semibold">Ative/desative os ícones flutuantes e gerencie o nome, a saudação e as perguntas e respostas da assistente.</p>
                </div>

                {chatbotLoading ? (
                  <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                ) : (
                  <>
                    {/* Toggles */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Chat da Sofia</span>
                        <input type="checkbox" className="h-5 w-5 accent-primary" checked={chatbotForm.chatEnabled}
                          onChange={(e) => setChatbotForm(p => ({ ...p, chatEnabled: e.target.checked }))} />
                      </label>
                      <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-green-500" /> Botão do WhatsApp</span>
                        <input type="checkbox" className="h-5 w-5 accent-primary" checked={chatbotForm.whatsappEnabled}
                          onChange={(e) => setChatbotForm(p => ({ ...p, whatsappEnabled: e.target.checked }))} />
                      </label>
                    </div>

                    {/* Identity + messages */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Nome da assistente</label>
                          <input type="text" value={chatbotForm.name}
                            onChange={(e) => setChatbotForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Cargo / etiqueta</label>
                          <input type="text" value={chatbotForm.role}
                            onChange={(e) => setChatbotForm(p => ({ ...p, role: e.target.value }))}
                            placeholder="Ex: Especialista"
                            className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Mensagem de saudação</label>
                        <textarea rows={3} value={chatbotForm.greeting}
                          onChange={(e) => setChatbotForm(p => ({ ...p, greeting: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 resize-y" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Resposta padrão (quando nada combina)</label>
                        <textarea rows={2} value={chatbotForm.fallback}
                          onChange={(e) => setChatbotForm(p => ({ ...p, fallback: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 resize-y" />
                      </div>
                    </div>

                    {/* Q&A list */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-sm">Perguntas e respostas</h4>
                        <button
                          onClick={() => setChatbotForm(p => ({ ...p, qa: [...p.qa, { question: '', answer: '' }] }))}
                          className="inline-flex items-center gap-1.5 bg-primary hover:bg-purple-700 text-white text-xs font-bold rounded-lg px-3 py-2"
                        >
                          <Plus className="h-4 w-4" /> Adicionar
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold">As perguntas viram os botões de sugestão no chat. Quando o visitante digita ou clica, a resposta correspondente é exibida.</p>
                      {chatbotForm.qa.length === 0 && (
                        <p className="text-xs text-slate-400 font-semibold text-center py-4">Nenhuma pergunta cadastrada.</p>
                      )}
                      <div className="space-y-3">
                        {chatbotForm.qa.map((item, idx) => (
                          <div key={idx} className="border border-slate-150 rounded-xl p-3 space-y-2 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                              <input type="text" value={item.question}
                                onChange={(e) => setChatbotForm(p => ({ ...p, qa: p.qa.map((q, i) => i === idx ? { ...q, question: e.target.value } : q) }))}
                                placeholder="Pergunta (vira botão de sugestão)"
                                className="flex-1 bg-white border border-slate-200 text-xs font-bold rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                              <button
                                onClick={() => setChatbotForm(p => ({ ...p, qa: p.qa.filter((_, i) => i !== idx) }))}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <textarea rows={2} value={item.answer}
                              onChange={(e) => setChatbotForm(p => ({ ...p, qa: p.qa.map((q, i) => i === idx ? { ...q, answer: e.target.value } : q) }))}
                              placeholder="Resposta da assistente"
                              className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 resize-y" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button onClick={handleSaveChatbot} disabled={chatbotSaving}
                        className="bg-primary hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-xs py-3 px-5 rounded-lg flex items-center gap-2 cursor-pointer transition-all shadow-md">
                        <Save className="h-4 w-4" /> {chatbotSaving ? 'Salvando...' : 'Salvar assistente'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* =================== TAB 7: CONTEÚDO PRINCIPAL =================== */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* Hub menu: pick which content area to edit */}
                {contentView === 'menu' && (
                  <div className="space-y-6 max-w-3xl">
                    <div>
                      <h3 className="font-display font-black text-xl text-slate-900">Conteúdo Principal</h3>
                      <p className="text-slate-500 text-xs font-semibold">Escolha a área para editar. As páginas legais aparecem no rodapé do site.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { key: 'home' as const, title: 'Página Inicial (Home)', desc: 'Banners e textos do topo da home', icon: <Globe className="h-5 w-5" />, tone: 'bg-purple-50 text-primary' },
                        { key: 'privacy' as const, title: 'Política de Privacidade', desc: 'Conteúdo da página /privacidade', icon: <ShieldCheck className="h-5 w-5" />, tone: 'bg-sky-50 text-sky-600' },
                        { key: 'terms' as const, title: 'Termos de Uso', desc: 'Conteúdo da página /termos', icon: <Newspaper className="h-5 w-5" />, tone: 'bg-amber-50 text-amber-600' },
                        { key: 'warranty' as const, title: 'Garantia / Devolução', desc: 'Conteúdo da página /garantia', icon: <Check className="h-5 w-5" />, tone: 'bg-green-50 text-green-600' }
                      ].map((card) => (
                        <button
                          key={card.key}
                          onClick={() => card.key === 'home' ? setContentView('home') : openPageEditor(card.key)}
                          className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-primary/40 hover:shadow transition-all flex items-start gap-3"
                        >
                          <div className={`inline-flex p-2.5 rounded-xl shrink-0 ${card.tone}`}>{card.icon}</div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{card.title}</h4>
                            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{card.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legal/policy page editor (rich text) */}
                {(contentView === 'privacy' || contentView === 'terms' || contentView === 'warranty') && (
                  <div className="space-y-5 max-w-3xl">
                    <button onClick={() => setContentView('menu')} className="text-xs font-bold text-slate-500 hover:text-primary inline-flex items-center gap-1">
                      <ArrowLeftCircle className="h-4 w-4" /> Voltar
                    </button>
                    {pageLoading ? (
                      <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Título da página</label>
                          <input type="text" value={pageEditor.title}
                            onChange={(e) => setPageEditor(p => ({ ...p, title: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 text-sm font-bold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Conteúdo</label>
                          <RichTextEditor value={pageEditor.html} onChange={(html) => setPageEditor(p => ({ ...p, html }))} />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <a href={`/${contentView === 'privacy' ? 'privacidade' : contentView === 'terms' ? 'termos' : 'garantia'}`} target="_blank" rel="noreferrer"
                            className="text-xs font-bold text-slate-500 hover:text-primary inline-flex items-center gap-1">
                            <Eye className="h-4 w-4" /> Ver página
                          </a>
                          <button onClick={handleSavePage} disabled={pageSaving}
                            className="bg-primary hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-xs py-3 px-5 rounded-lg flex items-center gap-2 cursor-pointer transition-all shadow-md">
                            <Save className="h-4 w-4" /> {pageSaving ? 'Salvando...' : 'Salvar página'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {contentView === 'home' && (
                <div className="space-y-6 max-w-2xl">
                <button onClick={() => setContentView('menu')} className="text-xs font-bold text-slate-500 hover:text-primary inline-flex items-center gap-1">
                  <ArrowLeftCircle className="h-4 w-4" /> Voltar
                </button>
                <div>
                  <h3 className="font-display font-black text-xl text-slate-900">Gestão de Conteúdo da Página Inicial</h3>
                  <p className="text-slate-500 text-xs font-semibold">Modifique os banners e os textos dinâmicos da plataforma instantaneamente</p>
                </div>

                <form onSubmit={handleSaveHomeContent} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Título Principal do Hero (H1)</label>
                    <textarea
                      required
                      rows={2}
                      value={homeForm.heroTitle}
                      onChange={(e) => setHomeForm(prev => ({ ...prev, heroTitle: e.target.value }))}
                      placeholder="Ex: Impulsione Suas Redes Sociais com Seguidores Reais"
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y"
                    />
                    <span className="text-[10px] text-slate-400 block font-medium">Use quebras de linha normais para formatar a visualização.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Subtítulo de Apoio do Hero</label>
                    <textarea
                      required
                      rows={3}
                      value={homeForm.heroSubtitle}
                      onChange={(e) => setHomeForm(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                      placeholder="Ex: Aumente sua autoridade, alcance orgânico e vendas com nossa entrega natural e segura."
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Texto da Barra de Alerta (Flash Promo Banner)</label>
                    <input
                      type="text"
                      required
                      value={homeForm.alertBannerText}
                      onChange={(e) => setHomeForm(prev => ({ ...prev, alertBannerText: e.target.value }))}
                      placeholder="Ex: OFERTA RELÂMPAGO DE INVERNO: 20% OFF EXTRA NO PIX"
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-500 font-semibold flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                    <span>WhatsApp e e-mail de contato agora ficam em <strong className="text-primary">Contato &amp; Rodapé</strong> (refletem no rodapé, no "Fale Conosco" e no botão flutuante).</span>
                  </div>

                  {/* FAQ (Perguntas Frequentes) CRUD */}
                  <div className="space-y-3 border-t border-slate-100 pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5">
                          <HelpCircle className="h-3.5 w-3.5 text-primary" /> Perguntas Frequentes (FAQ)
                        </label>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Gerencie a seção "Perguntas Frequentes" da home. Sem perguntas cadastradas, a home mostra o FAQ padrão.</p>
                      </div>
                      <button
                        type="button"
                        onClick={addFaq}
                        className="bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Nova pergunta
                      </button>
                    </div>

                    {homeForm.faqs.length === 0 ? (
                      <div className="text-[11px] text-slate-400 font-semibold bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3 text-center">
                        Nenhuma pergunta personalizada — a home usa o FAQ padrão.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {homeForm.faqs.map((faq, idx) => (
                          <div key={faq.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 shrink-0">#{idx + 1}</span>
                              <select
                                value={faq.category}
                                onChange={(e) => updateFaq(idx, { category: e.target.value as FaqCategory })}
                                className="bg-white border border-slate-200 text-[11px] font-bold rounded-lg py-1.5 px-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="geral">💼 Geral</option>
                                <option value="seguranca">🛡️ Segurança</option>
                                <option value="entrega">⚡ Entrega</option>
                                <option value="pagamento">💳 Pagamento</option>
                              </select>
                              <div className="ml-auto flex items-center gap-1">
                                <button type="button" onClick={() => moveFaq(idx, -1)} disabled={idx === 0}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold" title="Mover para cima">↑</button>
                                <button type="button" onClick={() => moveFaq(idx, 1)} disabled={idx === homeForm.faqs.length - 1}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold" title="Mover para baixo">↓</button>
                                <button type="button" onClick={() => removeFaq(idx)}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200" title="Remover">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) => updateFaq(idx, { question: e.target.value })}
                              placeholder="Pergunta (ex.: Os seguidores entregues são reais?)"
                              className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <textarea
                              rows={2}
                              value={faq.answer}
                              onChange={(e) => updateFaq(idx, { answer: e.target.value })}
                              placeholder="Resposta exibida ao expandir a pergunta"
                              className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="bg-primary hover:bg-purple-700 text-white font-bold text-xs py-3 px-5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 shadow-md"
                    >
                      <Save className="h-4 w-4" />
                      Salvar Alterações
                    </button>
                  </div>
                </form>
                </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h3 className="font-display font-black text-xl text-slate-900">JS / Analytics</h3>
                  <p className="text-slate-500 text-xs font-semibold">Insira códigos personalizados (Google Analytics, Tag Manager, AdSense, pixels, etc.). São injetados exatamente como digitados — cole as tags <code className="bg-slate-100 px-1 rounded">&lt;script&gt;</code> completas.</p>
                </div>

                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Atenção: este código roda no navegador dos visitantes. Cole apenas códigos de fontes confiáveis. Os snippets do site não rodam dentro deste painel administrativo.</span>
                </div>

                <form onSubmit={handleSaveAnalytics} className="space-y-6">
                  {/* SITE-WIDE CODE */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                      <div className="bg-purple-50 text-primary p-2 rounded-lg">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Código do Site (todas as páginas)</h4>
                        <p className="text-slate-400 text-[11px] font-semibold">Aplicado em todo o site público (home, blog, etc.).</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Cabeçalho — dentro do &lt;head&gt;</label>
                      <textarea
                        value={analyticsForm.siteHeadCode}
                        onChange={(e) => setAnalyticsForm(prev => ({ ...prev, siteHeadCode: e.target.value }))}
                        rows={5}
                        spellCheck={false}
                        placeholder="<!-- Google tag (gtag.js), GTM <head>, meta de verificação... -->"
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Início do &lt;body&gt;</label>
                      <textarea
                        value={analyticsForm.siteBodyCode}
                        onChange={(e) => setAnalyticsForm(prev => ({ ...prev, siteBodyCode: e.target.value }))}
                        rows={4}
                        spellCheck={false}
                        placeholder="<!-- GTM (noscript), código que deve abrir logo após o <body> -->"
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Rodapé — fim do &lt;body&gt;</label>
                      <textarea
                        value={analyticsForm.siteFooterCode}
                        onChange={(e) => setAnalyticsForm(prev => ({ ...prev, siteFooterCode: e.target.value }))}
                        rows={4}
                        spellCheck={false}
                        placeholder="<!-- Chat, remarketing, scripts que carregam por último -->"
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* ARTICLE-ONLY CODE */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                      <div className="bg-sky-50 text-sky-600 p-2 rounded-lg">
                        <Newspaper className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">Código dos Artigos do Blog</h4>
                        <p className="text-slate-400 text-[11px] font-semibold">Injetado <strong>apenas</strong> nas páginas de artigo, além do código do site. Ideal para AdSense e Analytics específico de conteúdo.</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Cabeçalho — dentro do &lt;head&gt;</label>
                      <textarea
                        value={analyticsForm.articleHeadCode}
                        onChange={(e) => setAnalyticsForm(prev => ({ ...prev, articleHeadCode: e.target.value }))}
                        rows={5}
                        spellCheck={false}
                        placeholder="<!-- AdSense (Auto ads), schema/JSON-LD extra... -->"
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Início do &lt;body&gt;</label>
                      <textarea
                        value={analyticsForm.articleBodyCode}
                        onChange={(e) => setAnalyticsForm(prev => ({ ...prev, articleBodyCode: e.target.value }))}
                        rows={4}
                        spellCheck={false}
                        placeholder="<!-- Código que abre logo após o <body> nos artigos -->"
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Rodapé — fim do &lt;body&gt;</label>
                      <textarea
                        value={analyticsForm.articleFooterCode}
                        onChange={(e) => setAnalyticsForm(prev => ({ ...prev, articleFooterCode: e.target.value }))}
                        rows={4}
                        spellCheck={false}
                        placeholder="<!-- Scripts de artigo que carregam por último -->"
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingAnalytics}
                      className="bg-primary hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-xs py-3 px-5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 shadow-md"
                    >
                      <Save className="h-4 w-4" />
                      {isSavingAnalytics ? 'Salvando...' : 'Salvar Códigos'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ===== ACCOUNT CREATE / EDIT MODAL ===== */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setIsAccountModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-display font-black text-slate-900">{accountModalMode === 'create' ? 'Novo usuário' : 'Editar usuário'}</h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Nome</label>
                <input value={accountForm.name} onChange={(e) => setAccountForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">E-mail</label>
                <input type="email" value={accountForm.email} onChange={(e) => setAccountForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Telefone</label>
                  <input value={accountForm.phone} onChange={(e) => setAccountForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Função</label>
                  <select value={accountForm.role} onChange={(e) => setAccountForm(p => ({ ...p, role: e.target.value as 'admin' | 'cliente' }))}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800">
                    <option value="cliente">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {accountModalMode === 'create' ? (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Senha</label>
                  <input type="text" value={accountForm.password} onChange={(e) => setAccountForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                </div>
              ) : (
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 pt-1 cursor-pointer">
                  <input type="checkbox" checked={accountForm.blocked} onChange={(e) => setAccountForm(p => ({ ...p, blocked: e.target.checked }))} />
                  Bloquear acesso desta conta
                </label>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setIsAccountModalOpen(false)} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-lg">Cancelar</button>
              <button onClick={handleSaveAccount} disabled={accountSaving}
                className="bg-primary hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg px-4 py-2.5 flex items-center gap-1.5">
                <Save className="h-4 w-4" /> {accountSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== RESET PASSWORD MODAL ===== */}
      {pwdResetAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPwdResetAccount(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-display font-black text-slate-900">Redefinir senha</h3>
              <button onClick={() => setPwdResetAccount(null)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs font-semibold text-slate-500">Defina uma nova senha para <strong className="text-slate-800">{pwdResetAccount.name || pwdResetAccount.email}</strong>.</p>
              <input type="text" value={pwdResetValue} onChange={(e) => setPwdResetValue(e.target.value)}
                placeholder="Nova senha (mín. 6 caracteres)"
                className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setPwdResetAccount(null)} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-lg">Cancelar</button>
              <button onClick={handleResetPassword} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg px-4 py-2.5 flex items-center gap-1.5">
                <KeyRound className="h-4 w-4" /> Redefinir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DO CATÁLOGO (redes sociais / tipos de entrega) ===== */}
      {catalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !catalogSaving && setCatalogModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-display font-black text-slate-900 flex items-center gap-2">
                  {catalogModal === 'platforms' ? <Globe className="h-4 w-4 text-primary" /> : <Layers className="h-4 w-4 text-primary" />}
                  {catalogModal === 'platforms' ? 'Redes Sociais' : 'Tipos de Entrega'}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Aparecem no formulário de serviço, no site e nas abas do catálogo.
                </p>
              </div>
              <button onClick={() => setCatalogModal(null)} disabled={catalogSaving} className="text-slate-400 hover:text-slate-700 disabled:opacity-40">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-2.5 overflow-y-auto">
              {(catalogModal === 'platforms' ? catalogDraft.platforms : catalogDraft.serviceTypes).map((item: any, index: number) => {
                const isPlatform = catalogModal === 'platforms';
                // Item já usado por serviço ou pedido: não pode sair, senão o
                // que aponta para ele fica órfão.
                const emUso = !!item.id && (isPlatform
                  ? catalogInUse.platforms.includes(item.id)
                  : catalogInUse.types.includes(item.id));
                const novo = !item.id;

                return (
                  <div key={index} className="border border-slate-200 rounded-xl p-3 space-y-2.5 bg-slate-50/60">
                    <div className="flex items-center gap-2">
                      {isPlatform && (
                        <span className="w-9 h-9 rounded-lg grid place-items-center text-white shrink-0 bg-slate-800">
                          <PlatformGlyph platform={item} className="h-4 w-4" />
                        </span>
                      )}
                      <input
                        value={isPlatform ? item.name : item.label}
                        onChange={(e) => isPlatform
                          ? patchPlatform(index, { name: e.target.value })
                          : patchServiceType(index, { label: e.target.value })}
                        placeholder={isPlatform ? 'Ex: Threads' : 'Ex: Compartilhamentos'}
                        className="flex-1 bg-white border border-slate-200 text-xs font-bold rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => moveCatalogItem(index, -1)} disabled={index === 0}
                          aria-label="Mover para cima"
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white grid place-items-center text-slate-500 hover:text-primary disabled:opacity-30 cursor-pointer">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => moveCatalogItem(index, 1)}
                          disabled={index === (isPlatform ? catalogDraft.platforms.length : catalogDraft.serviceTypes.length) - 1}
                          aria-label="Mover para baixo"
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white grid place-items-center text-slate-500 hover:text-primary disabled:opacity-30 cursor-pointer">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => removeCatalogItem(index)} disabled={emUso}
                          aria-label={emUso ? 'Em uso — não pode ser removido' : 'Remover'}
                          title={emUso ? 'Há serviços ou pedidos usando este item.' : 'Remover'}
                          className="h-8 w-8 rounded-lg border border-slate-200 bg-white grid place-items-center text-slate-400 hover:text-red-600 hover:border-red-200 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 disabled:cursor-not-allowed cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {novo ? 'Identificador: gerado ao salvar' : `Identificador: ${item.id}`}
                      </span>
                      {emUso && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          Em uso
                        </span>
                      )}
                    </div>

                    {isPlatform ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="block">
                          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-1">Ícone</span>
                          <select value={item.icon} onChange={(e) => patchPlatform(index, { icon: e.target.value })}
                            className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-lg py-2 px-2.5 text-slate-800">
                            {PLATFORM_ICON_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-1">Imagem própria (opcional)</span>
                          <input value={item.imageUrl || ''} onChange={(e) => patchPlatform(index, { imageUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full bg-white border border-slate-200 text-xs font-mono rounded-lg py-2 px-2.5 text-slate-800" />
                        </label>
                      </div>
                    ) : (
                      <label className="block">
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-1">O pedido pede</span>
                        <select value={item.target} onChange={(e) => patchServiceType(index, { target: e.target.value as 'profile' | 'post' })}
                          className="w-full bg-white border border-slate-200 text-xs font-semibold rounded-lg py-2 px-2.5 text-slate-800">
                          <option value="profile">O perfil (ex: seguidores)</option>
                          <option value="post">O link da publicação (ex: curtidas)</option>
                        </select>
                        <span className="text-[10px] text-slate-400 block font-medium mt-1">
                          Define qual campo o cliente preenche no checkout e o que é enviado ao painel SMM.
                        </span>
                      </label>
                    )}
                  </div>
                );
              })}

              <button type="button" onClick={catalogModal === 'platforms' ? addPlatform : addServiceType}
                className="w-full border border-dashed border-slate-300 rounded-xl py-2.5 text-xs font-bold text-slate-500 hover:text-primary hover:border-primary flex items-center justify-center gap-1.5 cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> {catalogModal === 'platforms' ? 'Adicionar rede' : 'Adicionar tipo'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
              <span className="text-[10px] font-semibold text-slate-400">
                Itens em uso por algum serviço ou pedido não podem ser removidos.
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCatalogModal(null)} disabled={catalogSaving}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2.5 rounded-lg disabled:opacity-40 cursor-pointer">
                  Cancelar
                </button>
                <button onClick={handleSaveCatalog} disabled={catalogSaving}
                  className="bg-primary hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-2 cursor-pointer">
                  <Save className="h-4 w-4" /> {catalogSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DO STATUS "OUTRO" (motivo do problema) ===== */}
      {issueOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !issueSaving && setIssueOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-display font-black text-slate-900">
                  Qual foi o problema? <span className="font-mono text-sm text-slate-400">#{issueOrder.id}</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  O cliente recebe este aviso por e-mail e vê o motivo no painel dele.
                </p>
              </div>
              <button onClick={() => setIssueOrder(null)} disabled={issueSaving} className="text-slate-400 hover:text-slate-700 disabled:opacity-40">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-[11px] font-semibold text-slate-500">
                <span className="text-slate-800">{issueOrder.serviceLabel || 'Pedido'}</span>
                {issueOrder.username ? ` • ${issueOrder.username}` : ''}
                {issueOrder.email ? ` • ${issueOrder.email}` : ' • sem e-mail cadastrado'}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Motivos frequentes</label>
                <div className="flex flex-wrap gap-2">
                  {ISSUE_PRESETS.map(p => (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => applyIssuePreset(p)}
                      aria-pressed={issueTitle === p.title}
                      className={`text-[11px] font-bold rounded-full px-3 py-1.5 border transition-colors cursor-pointer ${
                        issueTitle === p.title
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Motivo (título)</label>
                <input
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  maxLength={140}
                  placeholder="Ex: Perfil privado"
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
                />
                <span className="text-[10px] text-slate-400 block font-medium">
                  Vira o assunto do e-mail. Clique num motivo acima ou escreva o seu.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Descrição (opcional)</label>
                <textarea
                  value={issueDetails}
                  onChange={(e) => setIssueDetails(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Explique o que o cliente precisa fazer para resolver."
                  className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800 resize-y"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={issueNotify}
                  onChange={(e) => setIssueNotify(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded text-primary focus:ring-primary border-slate-300"
                />
                <span className="text-xs font-bold text-slate-700">
                  Avisar o cliente por e-mail
                  <span className="block text-[10px] font-semibold text-slate-400">
                    {issueOrder.email
                      ? `Enviado para ${issueOrder.email}.`
                      : 'Este pedido não tem e-mail cadastrado — o motivo será apenas registrado.'}
                  </span>
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setIssueOrder(null)}
                disabled={issueSaving}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveIssue}
                disabled={issueSaving || !issueTitle.trim()}
                className="bg-primary hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {issueSaving ? 'Salvando...' : 'Salvar e avisar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PEDIDOS DE UM USUÁRIO (coluna "Compras") ===== */}
      {ordersOfUserModal && (
        <UserOrdersModal
          user={ordersOfUserModal}
          orders={orders}
          catalog={catalog}
          onClose={() => setOrdersOfUserModal(null)}
        />
      )}

      {/* ===== ORDER EDIT MODAL ===== */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingOrder(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-display font-black text-slate-900">Editar pedido <span className="font-mono text-sm text-slate-400">#{editingOrder.id}</span></h3>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Serviço</label>
                <input value={editingOrder.serviceLabel} onChange={(e) => setEditingOrder({ ...editingOrder, serviceLabel: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Quantidade</label>
                  <input type="number" value={editingOrder.quantity} onChange={(e) => setEditingOrder({ ...editingOrder, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Valor (R$)</label>
                  <input type="number" step="0.01" value={editingOrder.price} onChange={(e) => setEditingOrder({ ...editingOrder, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Plataforma</label>
                  <input value={editingOrder.platform} onChange={(e) => setEditingOrder({ ...editingOrder, platform: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Perfil / @</label>
                  <input value={editingOrder.username} onChange={(e) => setEditingOrder({ ...editingOrder, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">URL do post (opcional)</label>
                <input value={editingOrder.postUrl || ''} onChange={(e) => setEditingOrder({ ...editingOrder, postUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Status</label>
                <select value={ORDER_STATUSES.some(s => s.value === editingOrder.status) ? editingOrder.status : 'aguardando_pagamento'}
                  onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary text-slate-800">
                  {ORDER_STATUSES.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </select>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setEditingOrder(null)} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-lg">Cancelar</button>
              <button onClick={handleSaveOrderEdit} className="bg-primary hover:bg-purple-700 text-white text-xs font-bold rounded-lg px-4 py-2.5 flex items-center gap-1.5">
                <Save className="h-4 w-4" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
