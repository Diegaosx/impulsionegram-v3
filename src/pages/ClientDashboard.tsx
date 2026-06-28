import { useEffect, useMemo, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, User as UserIcon, LogOut, ArrowLeft, Sparkles,
  Package, CircleDollarSign, Clock, CheckCircle2, ShoppingCart, QrCode, LifeBuoy, ArrowLeftCircle
} from 'lucide-react';
import { AuthUser, AdminOrder, HomeContent, CompanySettings, fetchMyOrders, fetchServices } from '../utils/storage';
import { ServiceItem } from '../types';
import { orderStatusInfo } from '../utils/orderStatus';
import { formatDateTime } from '../utils/datetime';
import BuyServices from '../components/BuyServices';
import OrderConfirmation from '../components/OrderConfirmation';
import ProfileForm from '../components/ProfileForm';
import HelpForm from '../components/HelpForm';

interface ClientDashboardProps {
  user: AuthUser;
  onLogout: () => void;
  onUserUpdate: (user: AuthUser) => void;
  siteName?: string;
  logoUrl?: string;
  company?: CompanySettings | null;
  homeContent?: HomeContent | null;
}

type Tab = 'overview' | 'orders' | 'buy' | 'order' | 'profile' | 'help';

export default function ClientDashboard({ user, onLogout, onUserUpdate, siteName, logoUrl, company, homeContent }: ClientDashboardProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [confirmedOrder, setConfirmedOrder] = useState<AdminOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const reloadOrders = () => fetchMyOrders().then(setOrders);

  useEffect(() => {
    fetchMyOrders().then(setOrders).finally(() => setLoading(false));
    fetchServices().then(setServices).catch(() => {});
  }, []);

  const goBuy = () => { setConfirmedOrder(null); setTab('buy'); };
  const openOrder = (id: string) => {
    const o = orders.find((x) => x.id === id) || null;
    setSelectedOrder(o);
    setTab('order');
  };

  const metrics = useMemo(() => {
    const total = orders.length;
    const spent = orders.reduce((sum, o) => sum + (Number(o.price) || 0), 0);
    const pending = orders.filter((o) => ['aguardando_pagamento', 'processando'].includes(orderStatusInfo(o.status).key)).length;
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
                <OrdersList orders={orders.slice(0, 3)} loading={loading} onBuy={goBuy} onPay={openOrder} />
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
              <OrdersList orders={orders} loading={loading} onBuy={goBuy} onPay={openOrder} />
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

          {tab === 'help' && (
            <div className="space-y-4">
              <h1 className="font-display font-black text-xl text-slate-900">Central de Ajuda</h1>
              <HelpForm homeContent={homeContent || null} company={company} onGoFaq={goHomeFaq} />
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

function OrdersList({ orders, loading, onBuy, onPay }: { orders: AdminOrder[]; loading: boolean; onBuy: () => void; onPay: (id: string) => void }) {
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
              {(o.smmStatus || o.smmRemains) && o.status !== 'entregue' && (
                <p className="text-[10px] text-sky-600 font-bold mt-0.5">
                  Entrega: {o.smmStatus || 'em andamento'}{o.smmRemains ? ` • faltam ${Number(o.smmRemains).toLocaleString('pt-BR')}` : ''}
                </p>
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
