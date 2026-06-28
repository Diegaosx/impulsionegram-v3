import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AdminOrder, AuthUser, fetchMyOrders } from '../utils/storage';
import OrderConfirmation from '../components/OrderConfirmation';

interface OrderConfirmationPageProps {
  user: AuthUser;
  siteName?: string;
  logoUrl?: string;
}

export default function OrderConfirmationPage({ user, siteName, logoUrl }: OrderConfirmationPageProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders()
      .then((orders) => setOrder(orders.find((o) => o.id === id) || null))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName || 'Logo'} className="h-8 w-auto object-contain" />
            ) : (
              <span className="font-display text-xl font-black text-primary">{siteName || 'ImpulsioneGram'}</span>
            )}
          </button>
          <button onClick={() => navigate('/minha-conta')} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 rounded-lg px-3 py-2">
            <ArrowLeft className="h-4 w-4" /> Minha Conta
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : order ? (
          <>
            <p className="text-center text-sm font-semibold text-slate-500 mb-4">Obrigado pela compra, {(user.name || '').split(' ')[0]}! 🎉</p>
            <OrderConfirmation
              order={order}
              onGoToOrders={() => navigate('/minha-conta')}
              onBuyMore={() => navigate('/minha-conta')}
            />
          </>
        ) : (
          <div className="text-center py-16 space-y-3">
            <p className="text-slate-500 font-semibold">Pedido não encontrado.</p>
            <button onClick={() => navigate('/minha-conta')} className="text-primary font-bold hover:underline">Ir para Minha Conta</button>
          </div>
        )}
      </main>
    </div>
  );
}
