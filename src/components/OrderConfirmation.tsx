import { CheckCircle2, ShoppingBag, Clock, ArrowRight } from 'lucide-react';
import { AdminOrder } from '../utils/storage';
import { orderStatusInfo } from '../utils/orderStatus';
import { formatDateTime } from '../utils/datetime';

interface OrderConfirmationProps {
  order: AdminOrder;
  onGoToOrders: () => void;
  onBuyMore?: () => void;
}

export default function OrderConfirmation({ order, onGoToOrders, onBuyMore }: OrderConfirmationProps) {
  const st = orderStatusInfo(order.status);
  const money = (v: number) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm max-w-xl mx-auto text-center space-y-5">
      <div className="mx-auto h-14 w-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <div>
        <h1 className="font-display font-black text-2xl text-slate-900">Pedido criado!</h1>
        <p className="text-slate-500 text-sm font-semibold mt-1">
          Seu pedido foi registrado. Assim que o pagamento for confirmado, ele entra na fila de entrega.
        </p>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 text-left text-xs font-semibold space-y-3">
        <div className="flex justify-between pb-2 border-b border-slate-200">
          <span className="text-slate-400 uppercase font-black">Código</span>
          <span className="font-mono font-bold text-slate-800">{order.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Serviço</span>
          <span className="font-bold text-slate-800 text-right">{order.serviceLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Quantidade</span>
          <span className="font-bold text-slate-800">{Number(order.quantity || 0).toLocaleString('pt-BR')}</span>
        </div>
        {order.username && (
          <div className="flex justify-between">
            <span className="text-slate-400">Perfil</span>
            <span className="font-bold text-primary">{order.username}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Status</span>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${st.badge}`}>{st.label}</span>
        </div>
        {order.date && (
          <div className="flex justify-between">
            <span className="text-slate-400">Data</span>
            <span className="font-mono text-slate-500">{formatDateTime(order.date)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
          <span className="text-slate-800 font-bold">Total</span>
          <span className="text-slate-950 font-display font-black">{money(order.price)}</span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs font-semibold flex items-start gap-2 text-left">
        <Clock className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Pagamento via {order.paymentMethod || 'PIX'}: a cobrança automática será ativada em breve. Por ora, nossa equipe confirma o pagamento manualmente.</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button onClick={onGoToOrders} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer">
          <ShoppingBag className="h-4 w-4" /> Ver meus pedidos
        </button>
        {onBuyMore && (
          <button onClick={onBuyMore} className="flex-1 bg-primary hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer">
            Comprar mais <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
