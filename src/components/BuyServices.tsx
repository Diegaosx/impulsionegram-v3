import { useEffect, useMemo, useState } from 'react';
import { ServiceItem, SocialPlatform } from '../types';
import { SOCIAL_PLATFORMS } from '../data';
import { AdminOrder, createMyOrder } from '../utils/storage';
import { ShoppingCart, AlertCircle, Minus, Plus, Sparkles } from 'lucide-react';

interface BuyServicesProps {
  services: ServiceItem[];
  defaultProfile?: string;
  onCreated: (order: AdminOrder) => void;
}

export default function BuyServices({ services, defaultProfile, onCreated }: BuyServicesProps) {
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [serviceType, setServiceType] = useState<string>('followers');
  const [quantity, setQuantity] = useState<number>(1000);
  const [targetProfile, setTargetProfile] = useState<string>(defaultProfile || '');
  const [postUrl, setPostUrl] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Card'>('PIX');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = useMemo(
    () => services.filter((s) => s.platform === platform).map((s) => ({ type: s.type, label: s.label })),
    [services, platform]
  );

  useEffect(() => {
    if (categories.length && !categories.some((c) => c.type === serviceType)) {
      setServiceType(categories[0].type);
    }
  }, [categories, serviceType]);

  const activeService = useMemo(
    () => services.find((s) => s.platform === platform && s.type === serviceType),
    [services, platform, serviceType]
  );

  useEffect(() => {
    if (activeService) {
      setQuantity(Math.max(activeService.minQuantity, Math.min(1000, activeService.maxQuantity)));
    }
  }, [activeService]);

  const pricing = useMemo(() => {
    let discountPercent = 0;
    if (quantity >= 10000) discountPercent = 30;
    else if (quantity >= 5000) discountPercent = 20;
    else if (quantity >= 2000) discountPercent = 10;
    const base = activeService ? quantity * activeService.pricePerItem : 0;
    const discount = base * (discountPercent / 100);
    return { discountPercent, base, discount, final: base - discount };
  }, [quantity, activeService]);

  const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const needsPostUrl = activeService && activeService.type !== 'followers';

  const setQty = (v: number) => {
    if (!activeService) return setQuantity(v);
    setQuantity(Math.max(activeService.minQuantity, Math.min(activeService.maxQuantity, v)));
  };

  const submit = async () => {
    setError('');
    if (!targetProfile.trim()) { setError('Informe o perfil/@ de destino.'); return; }
    if (needsPostUrl && !postUrl.trim()) { setError('Informe o link da publicação para curtidas/visualizações.'); return; }
    if (!activeService || pricing.final <= 0) { setError('Selecione um serviço válido.'); return; }
    setSubmitting(true);
    const res = await createMyOrder({
      platform,
      serviceType,
      serviceLabel: activeService.label,
      quantity,
      price: pricing.final,
      paymentMethod,
      targetProfile: targetProfile.trim(),
      postUrl: postUrl.trim()
    });
    setSubmitting(false);
    if (res.ok && res.order) onCreated(res.order);
    else setError(res.error || 'Falha ao criar o pedido.');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      <div>
        <h1 className="font-display font-black text-xl text-slate-900">Comprar serviços</h1>
        <p className="text-slate-500 text-xs font-semibold">Monte seu pedido e gere a cobrança. Você acompanha o status em "Meus Pedidos".</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 font-bold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Platform */}
      <div>
        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-2">1. Rede social</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SOCIAL_PLATFORMS.map((p) => (
            <button key={p.id} onClick={() => setPlatform(p.id)}
              className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${platform === p.id ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {p.name.split('/')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Service type */}
      <div>
        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-2">2. Serviço</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c.type} onClick={() => setServiceType(c.type)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${serviceType === c.type ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      {activeService && (
        <div>
          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-2">3. Quantidade</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(quantity - 100)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><Minus className="h-4 w-4" /></button>
            <input
              type="range"
              min={activeService.minQuantity}
              max={activeService.maxQuantity}
              step={100}
              value={quantity}
              onChange={(e) => setQty(parseInt(e.target.value, 10))}
              className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary"
            />
            <button onClick={() => setQty(quantity + 100)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><Plus className="h-4 w-4" /></button>
            <span className="w-24 text-right font-display font-black text-slate-900">{quantity.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 font-mono">
            <span>mín {activeService.minQuantity.toLocaleString('pt-BR')}</span>
            <span>máx {activeService.maxQuantity.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      )}

      {/* Target profile + post url */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Perfil/@ de destino</label>
          <input type="text" value={targetProfile} onChange={(e) => setTargetProfile(e.target.value)} placeholder="@seu_perfil"
            className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800" />
        </div>
        {needsPostUrl && (
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Link da publicação</label>
            <input type="url" value={postUrl} onChange={(e) => setPostUrl(e.target.value)} placeholder="https://instagram.com/p/..."
              className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white text-slate-800" />
          </div>
        )}
      </div>

      {/* Payment method */}
      <div>
        <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block mb-2">4. Pagamento</label>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button onClick={() => setPaymentMethod('PIX')}
            className={`py-2.5 rounded-lg border text-xs font-bold transition-all ${paymentMethod === 'PIX' ? 'border-green-500 bg-green-50 text-green-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            🇧🇷 PIX
          </button>
          <button onClick={() => setPaymentMethod('Card')}
            className={`py-2.5 rounded-lg border text-xs font-bold transition-all ${paymentMethod === 'Card' ? 'border-primary bg-purple-50 text-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            💳 Cartão
          </button>
        </div>
      </div>

      {/* Summary + CTA */}
      <div className="border-t border-slate-100 pt-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Total</span>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-2xl text-slate-900">{money(pricing.final)}</span>
            {pricing.discountPercent > 0 && (
              <>
                <span className="text-xs line-through text-slate-400">{money(pricing.base)}</span>
                <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full">-{pricing.discountPercent}%</span>
              </>
            )}
          </div>
        </div>
        <button onClick={submit} disabled={submitting}
          className="bg-primary hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-xs py-3 px-6 rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.01] shadow-md">
          {submitting ? 'Gerando pedido...' : (<><ShoppingCart className="h-4 w-4" /> Gerar pedido</>)}
        </button>
      </div>

      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-primary" />
        O pedido é criado com status "Aguardando pagamento". A cobrança PIX automática será ativada em breve.
      </p>
    </div>
  );
}
