import { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle2, ShoppingBag, Clock, ArrowRight, Copy, Check, QrCode, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { AdminOrder, fetchOrderPayment, generateOrderPix } from '../utils/storage';
import { orderStatusInfo } from '../utils/orderStatus';
import { formatDateTime } from '../utils/datetime';

interface OrderConfirmationProps {
  order: AdminOrder;
  onGoToOrders: () => void;
  onBuyMore?: () => void;
}

interface PixData { qrCode: string; qrCodeBase64: string; ticketUrl: string }

export default function OrderConfirmation({ order, onGoToOrders, onBuyMore }: OrderConfirmationProps) {
  const money = (v: number) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const isPix = (order.paymentMethod || 'PIX') === 'PIX';
  const [pix, setPix] = useState<PixData>({
    qrCode: order.pixQrCode || '',
    qrCodeBase64: order.pixQrCodeBase64 || '',
    ticketUrl: order.pixTicketUrl || ''
  });
  const [pixError, setPixError] = useState<string>(order.pixError || '');
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<string>(order.status);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoTried = useRef(false);

  const hasPix = !!pix.qrCodeBase64 || !!pix.qrCode;
  const paid = status === 'pago' || status === 'entregue';
  const st = orderStatusInfo(status);

  const generate = useCallback(async (regenerate: boolean) => {
    setGenerating(true);
    setPixError('');
    const res = await generateOrderPix(order.id, regenerate);
    if (res.ok && res.pix) {
      setPix(res.pix);
    } else {
      setPixError(res.error || 'Não foi possível gerar o PIX.');
    }
    setGenerating(false);
  }, [order.id]);

  // Auto-generate the PIX QR once when the order is a pending PIX order without one.
  useEffect(() => {
    if (autoTried.current) return;
    if (isPix && !paid && !hasPix) {
      autoTried.current = true;
      generate(false);
    }
  }, [isPix, paid, hasPix, generate]);

  // Poll the payment status while a PIX charge is pending.
  useEffect(() => {
    if (!hasPix || paid) return;
    let active = true;
    const check = async () => {
      const res = await fetchOrderPayment(order.id);
      if (active && res) {
        setStatus(res.status);
        if (res.pixError) setPixError(res.pixError);
      }
    };
    check();
    timer.current = setInterval(check, 5000);
    return () => { active = false; if (timer.current) clearInterval(timer.current); };
  }, [order.id, hasPix, paid]);

  const copyPix = () => {
    if (!pix.qrCode) return;
    navigator.clipboard.writeText(pix.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm max-w-xl mx-auto text-center space-y-5">
      <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center ${paid ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-primary'}`}>
        {paid ? <CheckCircle2 className="h-8 w-8" /> : <ShoppingBag className="h-7 w-7" />}
      </div>
      <div>
        <h1 className="font-display font-black text-2xl text-slate-900">{paid ? 'Pagamento confirmado!' : 'Pedido criado!'}</h1>
        <p className="text-slate-500 text-sm font-semibold mt-1">
          {paid
            ? 'Recebemos seu pagamento. Seu pedido entrou na fila de entrega.'
            : (hasPix
                ? 'Pague o PIX abaixo para concluir. A confirmação é automática.'
                : 'Seu pedido foi registrado. Assim que o pagamento for confirmado, ele entra na fila de entrega.')}
        </p>
      </div>

      {/* Generating spinner while the QR is being created */}
      {isPix && !paid && !hasPix && generating && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center justify-center gap-2 text-slate-600 text-sm font-bold">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Gerando código PIX...
        </div>
      )}

      {/* PIX payment block (only while pending) */}
      {hasPix && !paid && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-center gap-2 text-slate-700 text-xs font-black uppercase tracking-wider">
            <QrCode className="h-4 w-4 text-primary" /> Pague com PIX
          </div>
          {pix.qrCodeBase64 && (
            <img
              src={`data:image/png;base64,${pix.qrCodeBase64}`}
              alt="QR Code PIX"
              className="mx-auto w-48 h-48 rounded-lg border border-slate-200 bg-white p-2"
            />
          )}
          {pix.qrCode && (
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">PIX copia e cola</label>
              <div className="flex gap-1.5">
                <input readOnly value={pix.qrCode}
                  className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-[11px] font-mono text-slate-500 overflow-hidden text-ellipsis" />
                <button onClick={copyPix} className="bg-primary hover:bg-purple-700 text-white rounded-lg px-3 flex items-center justify-center transition-colors" title="Copiar">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aguardando pagamento...
          </div>
          <button
            onClick={() => generate(true)}
            disabled={generating}
            className="text-[11px] font-bold text-slate-500 hover:text-primary inline-flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${generating ? 'animate-spin' : ''}`} /> Gerar novo código
          </button>
        </div>
      )}

      {/* PIX could not be generated automatically: show the error + retry */}
      {isPix && !paid && !hasPix && !generating && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3 text-left">
          <div className="flex items-start gap-2 text-amber-800 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {pixError
                ? `Não foi possível gerar o PIX automaticamente: ${pixError}`
                : 'O código PIX ainda não foi gerado para este pedido.'}
            </span>
          </div>
          <button
            onClick={() => generate(false)}
            className="w-full bg-primary hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs inline-flex items-center justify-center gap-1.5"
          >
            <QrCode className="h-4 w-4" /> Gerar código PIX
          </button>
        </div>
      )}

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

      {!isPix && !paid && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs font-semibold flex items-start gap-2 text-left">
          <Clock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Pagamento via {order.paymentMethod || 'PIX'}: a confirmação é feita pela nossa equipe. Você verá o status atualizado em "Meus Pedidos".</span>
        </div>
      )}

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
