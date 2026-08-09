import { useEffect, useMemo, useState, ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, User as UserIcon, LogOut, ArrowLeft, Sparkles,
  Package, CircleDollarSign, Clock, CheckCircle2, ShoppingCart, QrCode, LifeBuoy, ArrowLeftCircle,
  AlertCircle, MessageSquare, Star, Search, RotateCcw, Repeat
} from 'lucide-react';
import {
  AuthUser, AdminOrder, HomeContent, CompanySettings, ServiceReview,
  fetchMyOrders, fetchServices, fetchMyReviews, repeatMyOrder
} from '../utils/storage';
import { ServiceItem } from '../types';
import { orderStatusInfo } from '../utils/orderStatus';
import { formatDateTime } from '../utils/datetime';
import BuyServices from '../components/BuyServices';
import OrderConfirmation from '../components/OrderConfirmation';
import ProfileForm from '../components/ProfileForm';
import HelpForm from '../components/HelpForm';
import ClientTickets from '../components/ClientTickets';
import ReviewOrderModal from '../components/ReviewOrderModal';
import AdminPagination, { clampPage, pageSlice } from '../components/AdminPagination';
import { orderStatusInfo as statusInfo } from '../utils/orderStatus';

interface ClientDashboardProps {
  user: AuthUser;
  onLogout: () => void;
  onUserUpdate: (user: AuthUser) => void;
  siteName?: string;
  logoUrl?: string;
  company?: CompanySettings | null;
  homeContent?: HomeContent | null;
}

type Tab = 'overview' | 'orders' | 'buy' | 'order' | 'profile' | 'tickets' | 'help';

export default function ClientDashboard({ user, onLogout, onUserUpdate, siteName, logoUrl, company, homeContent }: ClientDashboardProps) {
  const navigate = useNavigate();
  // ?aba=tickets: é para cá que o site manda quem clica em "Abrir um ticket"
  // vindo do rodapé, da página de ajuda ou da seção de contato.
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(searchParams.get('aba') === 'tickets' ? 'tickets' : 'overview');

  // O link também é clicado de dentro da própria área do cliente (a aba
  // "Ajuda" tem o mesmo botão). Nesse caso o componente não remonta e o valor
  // inicial acima não vale de nada: é preciso reagir à mudança da URL. O
  // parâmetro sai depois de consumido, senão voltar para outra aba e recarregar
  // jogaria o usuário de novo no atendimento.
  useEffect(() => {
    if (searchParams.get('aba') !== 'tickets') return;
    setTab('tickets');
    const limpo = new URLSearchParams(searchParams);
    limpo.delete('aba');
    setSearchParams(limpo, { replace: true });
  }, [searchParams, setSearchParams]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [confirmedOrder, setConfirmedOrder] = useState<AdminOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  // Avaliações que este cliente já enviou: é o que decide entre oferecer o
  // botão e mostrar em que pé está a que já foi escrita.
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [reviewingOrder, setReviewingOrder] = useState<AdminOrder | null>(null);
  const reloadReviews = () => fetchMyReviews().then(setReviews);

  // Filtros e paginação de "Meus Pedidos". Quem compra sempre acaba com uma
  // lista longa; sem isso, achar um pedido antigo vira rolagem.
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('todos');
  const [orderPage, setOrderPage] = useState(1);
  const [orderPerPage, setOrderPerPage] = useState(10);
  // Comprar novamente: um pedido novo do mesmo serviço, que já cai no PIX.
  const [repeating, setRepeating] = useState('');
  const [repeatError, setRepeatError] = useState('');

  const reloadOrders = () => fetchMyOrders().then(setOrders);

  useEffect(() => {
    fetchMyOrders().then(setOrders).finally(() => setLoading(false));
    fetchServices().then(setServices).catch(() => {});
    fetchMyReviews().then(setReviews).catch(() => {});
  }, []);

  const goBuy = () => { setConfirmedOrder(null); setTab('buy'); };
  const openOrder = (id: string) => {
    const o = orders.find((x) => x.id === id) || null;
    setSelectedOrder(o);
    setTab('order');
  };

  const filteredOrders = useMemo(() => {
    const termo = orderSearch.trim().toLowerCase();
    return orders.filter(o => {
      if (termo) {
        const alvo = [o.id, o.serviceLabel, o.platform, o.username]
          .map(v => String(v || '').toLowerCase()).join(' ');
        if (!alvo.includes(termo)) return false;
      }
      // Comparado pela chave canônica: pedidos antigos gravaram "Pendente" e
      // afins, e o filtro precisa alcançá-los.
      if (orderStatus !== 'todos' && statusInfo(o.status).key !== orderStatus) return false;
      return true;
    });
  }, [orders, orderSearch, orderStatus]);

  useEffect(() => { setOrderPage(1); }, [orderSearch, orderStatus]);

  const repetirPedido = async (order: AdminOrder) => {
    setRepeatError('');
    setRepeating(order.id);
    const res = await repeatMyOrder(order.id);
    setRepeating('');
    if (!res.ok || !res.order) { setRepeatError(res.error || 'Não foi possível repetir o pedido.'); return; }
    // Cai direto na tela de pagamento do pedido novo.
    await reloadOrders();
    setSelectedOrder(res.order);
    setTab('order');
  };

  const metrics = useMemo(() => {
    const total = orders.length;
    const spent = orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
    // "Outro" entra em andamento: é um pedido não resolvido, e deixá-lo fora
    // dos dois contadores faria o total não bater com nada na tela.
    const pending = orders.filter((o) => ['aguardando_pagamento', 'processando', 'pago', 'outro'].includes(orderStatusInfo(o.status).key)).length;
    const delivered = orders.filter((o) => orderStatusInfo(o.status).key === 'entregue').length;
    return { total, spent, pending, delivered };
  }, [orders]);

  const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const firstName = (user.name || 'Cliente').split(' ')[0];
  const initials = (user.name || user.email || '?').trim().slice(0, 2).toUpperCase();

  const NavBtn = ({ id, icon, label }: { id: Tab; icon: ReactNode; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
        tab === id ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-primary hover:bg-slate-100'
      }`}
    >
      {icon}<span>{label}</span>
    </button>
  );

  const goHomeFaq = () => {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById('faq');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName || 'Logo'} className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-display text-xl font-black text-primary">{siteName || 'ImpulsioneGram'}</span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={goBuy} className="hidden sm:flex items-center gap-1.5 bg-primary hover:bg-purple-700 text-white text-xs font-bold rounded-lg px-3 py-2 transition-colors">
              <ShoppingCart className="h-4 w-4" /> Comprar
            </button>
            <button onClick={() => setTab('help')} className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 rounded-lg px-3 py-2">
              <LifeBuoy className="h-4 w-4" /> Ajuda
            </button>
            <button onClick={() => setTab('profile')} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 rounded-lg px-3 py-2">
              <UserIcon className="h-4 w-4" /> Perfil
            </button>
            <button onClick={() => navigate('/')} className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 rounded-lg px-3 py-2">
              <ArrowLeft className="h-4 w-4" /> Site
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar (constant) */}
        <aside className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4 lg:sticky lg:top-20">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-11 h-11 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-purple-100 text-primary flex items-center justify-center font-black">{initials}</div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">{firstName}</p>
                <p className="text-[11px] text-slate-400 font-semibold truncate">{user.email}</p>
              </div>
            </div>
            <nav className="space-y-1">
              <NavBtn id="overview" icon={<LayoutDashboard className="h-4 w-4" />} label="Visão Geral" />
              <NavBtn id="buy" icon={<ShoppingCart className="h-4 w-4" />} label="Comprar" />
              <NavBtn id="orders" icon={<ShoppingBag className="h-4 w-4" />} label="Meus Pedidos" />
              <NavBtn id="profile" icon={<UserIcon className="h-4 w-4" />} label="Perfil" />
              <NavBtn id="tickets" icon={<MessageSquare className="h-4 w-4" />} label="Atendimento" />
              <NavBtn id="help" icon={<LifeBuoy className="h-4 w-4" />} label="Ajuda" />
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="lg:col-span-9 space-y-6">
          {tab === 'overview' && (
            <>
              <div className="bg-gradient-to-br from-primary to-purple-700 text-white rounded-2xl p-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="font-display font-black text-2xl">Olá, {firstName}! 👋</h1>
                  <p className="text-white/80 text-sm font-semibold mt-1">Acompanhe seus pedidos e impulsione seu perfil.</p>
                </div>
                <button onClick={goBuy} className="flex items-center gap-1.5 bg-white text-primary font-bold text-xs rounded-lg px-4 py-2.5 hover:scale-[1.02] transition-transform shadow">
                  <Sparkles className="h-4 w-4" /> Comprar serviços
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={<Package className="h-5 w-5" />} label="Pedidos" value={String(metrics.total)} tone="text-primary bg-purple-50" />
                <MetricCard icon={<CircleDollarSign className="h-5 w-5" />} label="Total gasto" value={money(metrics.spent)} tone="text-green-600 bg-green-50" />
                <MetricCard icon={<Clock className="h-5 w-5" />} label="Em andamento" value={String(metrics.pending)} tone="text-amber-600 bg-amber-50" />
                <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Entregues" value={String(metrics.delivered)} tone="text-emerald-600 bg-emerald-50" />
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-slate-800 text-sm">Pedidos recentes</h2>
                  {orders.length > 3 && (
                    <button onClick={() => setTab('orders')} className="text-xs font-bold text-primary hover:underline">Ver todos</button>
                  )}
                </div>
                <OrdersList
                  orders={orders.slice(0, 3)}
                  loading={loading}
                  onBuy={goBuy}
                  onPay={openOrder}
                  reviews={reviews}
                  onReview={setReviewingOrder}
                />
              </div>
            </>
          )}

          {tab === 'buy' && (
            confirmedOrder ? (
              <OrderConfirmation
                order={confirmedOrder}
                onGoToOrders={() => { setConfirmedOrder(null); reloadOrders(); setTab('orders'); }}
                onBuyMore={() => setConfirmedOrder(null)}
              />
            ) : (
              <BuyServices
                services={services}
                onCreated={(order) => { setConfirmedOrder(order); reloadOrders(); }}
              />
            )
          )}

          {tab === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h1 className="font-display font-black text-xl text-slate-900 mb-4">Meus Pedidos</h1>

              {orders.length > 0 && (
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="h-4 w-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Buscar por pedido, serviço ou perfil..."
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 pl-9 pr-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                    />
                  </div>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  >
                    <option value="todos">Todos os status</option>
                    <option value="aguardando_pagamento">Aguardando pagamento</option>
                    <option value="processando">Processando</option>
                    <option value="pago">Pagamento aprovado</option>
                    <option value="entregue">Entregue</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="outro">Com problema</option>
                  </select>
                  {(orderSearch.trim() || orderStatus !== 'todos') && (
                    <button
                      type="button"
                      onClick={() => { setOrderSearch(''); setOrderStatus('todos'); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary px-2 py-2.5 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Limpar
                    </button>
                  )}
                </div>
              )}

              {repeatError && (
                <p className="bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold rounded-lg px-3 py-2 mb-3">{repeatError}</p>
              )}

              {orders.length > 0 && filteredOrders.length === 0 ? (
                <p className="text-center text-xs font-semibold text-slate-500 py-10">
                  Nenhum pedido corresponde aos filtros.
                </p>
              ) : (
                <OrdersList
                  orders={pageSlice<AdminOrder>(filteredOrders, orderPage, orderPerPage)}
                  loading={loading}
                  onBuy={goBuy}
                  onPay={openOrder}
                  reviews={reviews}
                  onReview={setReviewingOrder}
                  onRepeat={repetirPedido}
                  repeatingId={repeating}
                />
              )}

              {filteredOrders.length > 0 && (
                <div className="-mx-5 -mb-5 mt-4">
                  <AdminPagination
                    total={filteredOrders.length}
                    page={clampPage(orderPage, filteredOrders.length, orderPerPage)}
                    perPage={orderPerPage}
                    onPageChange={setOrderPage}
                    onPerPageChange={setOrderPerPage}
                    itemLabel="pedidos"
                    perPageOptions={[5, 10, 25, 50]}
                  />
                </div>
              )}
            </div>
          )}

          {tab === 'order' && (
            <div className="space-y-4">
              <button onClick={() => { reloadOrders(); setTab('orders'); }} className="text-xs font-bold text-slate-500 hover:text-primary inline-flex items-center gap-1">
                <ArrowLeftCircle className="h-4 w-4" /> Voltar aos pedidos
              </button>
              {selectedOrder ? (
                <OrderConfirmation
                  order={selectedOrder}
                  onGoToOrders={() => { reloadOrders(); setTab('orders'); }}
                  onBuyMore={goBuy}
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm font-semibold">Pedido não encontrado.</div>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <div className="space-y-4">
              <h1 className="font-display font-black text-xl text-slate-900">Meu Perfil</h1>
              <ProfileForm user={user} onUserUpdate={onUserUpdate} />
            </div>
          )}

          {tab === 'tickets' && <ClientTickets orders={orders} />}

          {reviewingOrder && (
            <ReviewOrderModal
              order={reviewingOrder}
              onClose={() => setReviewingOrder(null)}
              onSaved={reloadReviews}
            />
          )}

          {tab === 'help' && (
            <div className="space-y-4">
              <h1 className="font-display font-black text-xl text-slate-900">Central de Ajuda</h1>
              <HelpForm homeContent={homeContent || null} company={company} onGoFaq={goHomeFaq} user={user} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className={`inline-flex p-2 rounded-lg ${tone}`}>{icon}</div>
      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-3">{label}</p>
      <p className="font-display font-black text-xl text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

function OrdersList({ orders, loading, onBuy, onPay, reviews = [], onReview, onRepeat, repeatingId = '' }: {
  orders: AdminOrder[];
  loading: boolean;
  onBuy: () => void;
  onPay: (id: string) => void;
  reviews?: ServiceReview[];
  onReview?: (order: AdminOrder) => void;
  onRepeat?: (order: AdminOrder) => void;
  repeatingId?: string;
}) {
  if (loading) {
    return <div className="flex items-center justify-center py-10"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary"></div></div>;
  }
  if (orders.length === 0) {
    return (
      <div className="text-center py-10 space-y-3">
        <ShoppingBag className="h-9 w-9 text-slate-300 mx-auto" />
        <p className="text-slate-500 text-sm font-semibold">Você ainda não tem pedidos.</p>
        <button onClick={onBuy} className="inline-flex items-center gap-1.5 bg-primary hover:bg-purple-700 text-white text-xs font-bold rounded-lg px-4 py-2.5 transition-colors">
          <ShoppingCart className="h-4 w-4" /> Fazer meu primeiro pedido
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {orders.map((o) => {
        const st = orderStatusInfo(o.status);
        const isPending = st.key === 'aguardando_pagamento' || st.key === 'pendente';
        const canPay = isPending && (o.paymentMethod || 'PIX') === 'PIX';
        const minhaAvaliacao = reviews.find(r => r.orderId === o.id);
        const podeAvaliar = st.key === 'entregue' && !minhaAvaliacao && !!onReview;
        // Repetir só faz sentido quando o pedido chegou ao fim de alguma forma;
        // com um pagamento em aberto, o caminho é pagar o que já existe.
        const podeRepetir = !!onRepeat && ['entregue', 'cancelado', 'pago', 'outro'].includes(st.key);
        return (
          <div key={o.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition-colors">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800 text-sm">{o.serviceLabel || 'Pedido'}</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${st.badge}`}>{st.label}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                {o.quantity ? `${Number(o.quantity).toLocaleString('pt-BR')} • ` : ''}{o.platform || ''} • #{o.id}
              </p>
              {(o.smmStatus || o.smmRemains) && st.key !== 'entregue' && st.key !== 'outro' && (
                <p className="text-[10px] text-sky-600 font-bold mt-0.5">
                  Entrega: {o.smmStatus || 'em andamento'}{o.smmRemains ? ` • faltam ${Number(o.smmRemains).toLocaleString('pt-BR')}` : ''}
                </p>
              )}
              {/* Problema no pedido: o cliente precisa ver o motivo aqui, não
                  só no e-mail — é a tela que ele abre para conferir o pedido. */}
              {st.key === 'outro' && o.issueTitle && (
                <div className="mt-1.5 rounded-lg bg-orange-50 border border-orange-200 px-2.5 py-2">
                  <p className="text-[11px] font-black text-orange-800 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" /> {o.issueTitle}
                  </p>
                  {o.issueDetails && (
                    <p className="text-[10px] font-semibold text-orange-700 mt-1 whitespace-pre-line leading-relaxed">
                      {o.issueDetails}
                    </p>
                  )}
                </div>
              )}
              {st.key === 'cancelado' && o.cancelReason && (
                <p className="text-[10px] text-red-600 font-bold mt-0.5">{o.cancelReason}</p>
              )}
              <p className="text-[10px] text-slate-300 font-mono mt-0.5">{o.date ? formatDateTime(o.date) : ''}</p>
            </div>
            <div className="text-right shrink-0 space-y-1.5">
              <p className="font-display font-black text-slate-900 text-sm">{(Number(o.price) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{o.paymentMethod || ''}</p>
              {canPay && (
                <button
                  onClick={() => onPay(o.id)}
                  className="inline-flex items-center gap-1 bg-primary hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-wide rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  <QrCode className="h-3 w-3" /> Pagar com PIX
                </button>
              )}
              {podeAvaliar && (
                <button
                  onClick={() => onReview!(o)}
                  className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-wide rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                >
                  <Star className="h-3 w-3" /> Avaliar serviço
                </button>
              )}
              {podeRepetir && (
                <button
                  onClick={() => onRepeat!(o)}
                  disabled={repeatingId === o.id}
                  className="inline-flex items-center gap-1 bg-white hover:bg-purple-50 text-primary border border-primary/30 disabled:opacity-60 text-[10px] font-black uppercase tracking-wide rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
                  title="Cria um pedido novo, igual a este, e abre o PIX"
                >
                  <Repeat className="h-3 w-3" />
                  {repeatingId === o.id ? 'Criando...' : 'Comprar novamente'}
                </button>
              )}
              {minhaAvaliacao && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide rounded-lg px-2.5 py-1.5 border ${
                    minhaAvaliacao.status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                  title={minhaAvaliacao.status === 'approved'
                    ? 'A sua avaliação está publicada na página do serviço.'
                    : 'A sua avaliação está em conferência.'}
                >
                  <Star className="h-3 w-3" />
                  {minhaAvaliacao.status === 'approved' ? 'Avaliado' : 'Em análise'}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
