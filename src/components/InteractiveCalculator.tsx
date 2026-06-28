import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVICES, SOCIAL_PLATFORMS } from '../data';
import { SocialPlatform, ServiceItem } from '../types';
import { AuthUser, AdminOrder, checkAccountExists, registerAccount, createMyOrder } from '../utils/storage';
import OrderConfirmation from './OrderConfirmation';
import {
  Instagram, Youtube, Twitter, Facebook, Flame, Zap, Shield,
  Lock, Sparkles, Smartphone, Mail, User, Compass, ShoppingCart, Loader2, ArrowRight, X, LogIn
} from 'lucide-react';

interface InteractiveCalculatorProps {
  initialPlatform?: SocialPlatform;
  initialType?: string;
  onAddOrderToStats: () => void;
  services?: ServiceItem[];
  onAddSimulatedOrder?: (order: any) => void;
  currentUser?: AuthUser | null;
  onAuthSuccess?: (user: AuthUser) => void;
}

export default function InteractiveCalculator({
  initialPlatform,
  initialType,
  onAddOrderToStats,
  services,
  currentUser,
  onAuthSuccess
}: InteractiveCalculatorProps) {
  const navigate = useNavigate();
  
  // Selection States
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [serviceType, setServiceType] = useState<string>('followers');
  const [quantity, setQuantity] = useState<number>(1000);
  
  // Dynamic Input States
  const [customInput, setCustomInput] = useState<string>('1000');
  
  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'account' | 'login_prompt' | 'processing' | 'done'>('info');
  const [createdOrder, setCreatedOrder] = useState<AdminOrder | null>(null);

  // User Form Inputs
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState(''); // target profile (@handle)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const paymentMethod: 'PIX' | 'Card' = 'PIX'; // PIX only for now
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [accountError, setAccountError] = useState('');

  // Handle outside notification trigger
  useEffect(() => {
    if (initialPlatform) {
      setPlatform(initialPlatform);
    }
    if (initialType) {
      setServiceType(initialType);
    }
  }, [initialPlatform, initialType]);

  // Handle ESC key press and body overflow prevention when checkout modal is shown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCheckout) {
        setShowCheckout(false);
      }
    };
    if (showCheckout) {
      document.addEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = 'unset';
    };
  }, [showCheckout]);

  // Find all available service categories for current platform
  const categoriesList = useMemo(() => {
    const list = services || SERVICES;
    const matching = list.filter(s => s.platform === platform);
    return matching.map(m => ({ type: m.type, label: m.label }));
  }, [platform, services]);

  // Sync serviceType if it is not in the categories list of the new platform
  useEffect(() => {
    const isAvailable = categoriesList.some(c => c.type === serviceType);
    if (!isAvailable && categoriesList.length > 0) {
      setServiceType(categoriesList[0].type);
    }
  }, [platform, categoriesList, serviceType]);

  // Get active service configuration item
  const activeService = useMemo<ServiceItem | undefined>(() => {
    const list = services || SERVICES;
    return list.find(s => s.platform === platform && s.type === serviceType);
  }, [platform, serviceType, services]);

  // Adjust default quantity limits whenever service changes
  useEffect(() => {
    if (activeService) {
      const defaultQty = Math.max(activeService.minQuantity, Math.min(1000, activeService.maxQuantity));
      setQuantity(defaultQty);
      setCustomInput(defaultQty.toString());
    }
  }, [activeService]);

  // Calculate bulk progressive discounts
  const bulkMetrics = useMemo(() => {
    let discountPercent = 0;
    if (quantity >= 10000) {
      discountPercent = 30; // 30% reduction
    } else if (quantity >= 5000) {
      discountPercent = 20; // 20% reduction
    } else if (quantity >= 2000) {
      discountPercent = 10; // 10% reduction
    }
    
    const basePrice = activeService ? quantity * activeService.pricePerItem : 0;
    const discount = basePrice * (discountPercent / 100);
    const finalPrice = basePrice - discount;
    
    return {
      discountPercent,
      basePrice,
      discountValue: discount,
      finalPrice,
      pricePerUnit: quantity > 0 ? finalPrice / quantity : 0
    };
  }, [quantity, activeService]);

  // Sync Slider vs Text Input
  const handleQuantitySliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setQuantity(val);
    setCustomInput(val.toString());
  };

  const handleCustomInputBlur = () => {
    if (!activeService) return;
    let val = parseInt(customInput.replace(/\D/g, ''), 10);
    if (isNaN(val)) val = activeService.minQuantity;
    
    const clamped = Math.max(activeService.minQuantity, Math.min(activeService.maxQuantity, val));
    setQuantity(clamped);
    setCustomInput(clamped.toString());
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInput(e.target.value);
  };

  const incrementQuantity = (amount: number) => {
    if (!activeService) return;
    const nextVal = Math.min(activeService.maxQuantity, quantity + amount);
    setQuantity(nextVal);
    setCustomInput(nextVal.toString());
  };

  const decrementQuantity = (amount: number) => {
    if (!activeService) return;
    const nextVal = Math.max(activeService.minQuantity, quantity - amount);
    setQuantity(nextVal);
    setCustomInput(nextVal.toString());
  };

  // Launch Checkout Modal
  const handleOpenCheckout = () => {
    setFormErrors({});
    setAccountError('');
    setCreatedOrder(null);
    setPostUrl('');
    setPassword('');
    setConfirmPassword('');
    // Prefill from the logged-in user when available.
    if (currentUser) {
      setFullName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
    } else {
      setFullName('');
      setEmail('');
      setPhone('');
    }
    setUsername('');
    setCheckoutStep('info');
    setShowCheckout(true);
  };

  const targetProfile = () => (username.trim().startsWith('@') || !username.trim() ? username.trim() : '@' + username.trim());

  // Create the order (client is authenticated by now) and show the confirmation
  // (with the Mercado Pago PIX QR code, when configured) inside the modal.
  const createOrderAndRedirect = async () => {
    setCheckoutStep('processing');
    setAccountError('');
    const res = await createMyOrder({
      platform,
      serviceType,
      serviceLabel: activeService ? activeService.label : 'Serviço Personalizado',
      quantity,
      price: bulkMetrics.finalPrice,
      paymentMethod,
      targetProfile: targetProfile(),
      postUrl: postUrl.trim()
    });
    if (res.ok && res.order) {
      onAddOrderToStats();
      setCreatedOrder(res.order);
      setCheckoutStep('done');
    } else {
      setAccountError(res.error || 'Falha ao criar o pedido.');
      setCheckoutStep(currentUser ? 'info' : 'account');
    }
  };

  // Step 1 → validate profile/contact, then branch on account existence.
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!username.trim()) {
      errors.username = 'Informe o perfil/@ de destino';
    }
    if (!currentUser && !fullName.trim()) {
      errors.fullName = 'Informe seu nome';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Insira um e-mail válido';
    }
    if (!phone.replace(/\D/g, '').trim() || phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Insira um telefone com DDD';
    }
    if (activeService && activeService.type !== 'followers' && !postUrl.trim()) {
      errors.postUrl = 'O link da publicação é obrigatório para curtidas/visualizações';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    // Already logged in → create the order directly.
    if (currentUser) {
      await createOrderAndRedirect();
      return;
    }

    // Guest → does an account already exist for this e-mail/phone?
    setCheckoutStep('processing');
    const check = await checkAccountExists(email.trim(), phone.trim());
    if (check.exists) {
      setCheckoutStep('login_prompt');
    } else {
      setCheckoutStep('account');
    }
  };

  // Guest creates the account (password) then the order.
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');
    if (password.length < 6) { setAccountError('A senha deve ter ao menos 6 caracteres.'); return; }
    if (password !== confirmPassword) { setAccountError('As senhas não coincidem.'); return; }
    setCheckoutStep('processing');
    const reg = await registerAccount({ name: fullName.trim(), email: email.trim(), phone: phone.trim(), password });
    if (!reg.ok || !reg.user) {
      setAccountError(reg.error || 'Não foi possível criar a conta.');
      setCheckoutStep('account');
      return;
    }
    if (onAuthSuccess) onAuthSuccess(reg.user);
    await createOrderAndRedirect();
  };

  // Get SVG icon based on active platform style
  const getPlatformIcon = (plat: SocialPlatform) => {
    switch (plat) {
      case 'instagram': return <Instagram className="h-6 w-6" />;
      case 'youtube': return <Youtube className="h-6 w-6" />;
      case 'twitter': return <Twitter className="h-6 w-6" />;
      case 'facebook': return <Facebook className="h-6 w-6" />;
      case 'kwai': return <Flame className="h-6 w-6" />;
      case 'tiktok': return <Flame className="h-6 w-6 text-black" />; // Styled
    }
  };

  return (
    <section id="calculadora" className="py-20 bg-slate-950 text-white relative border-t border-b border-slate-900">
      
      {/* Subtle clean grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.05),transparent_50%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-black uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded">
            📈 Ferramenta de Simulação Avançada
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight mt-4">
            Monte Seu Plano Personalizado
          </h2>
          <p className="text-slate-400 mt-3 text-sm font-semibold max-w-xl mx-auto leading-relaxed">
            Arraste o controle deslizante abaixo, configure a quantidade de seguidores ou curtidas brasileiras e veja o valor na hora com desconto progressivo!
          </p>
        </div>

        {/* Dynamic Calculator Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch" id="calculator-widget-panel">
          
          {/* Configuring Part (8 columns) */}
          <div className="lg:col-span-7 bg-slate-900/50 rounded-xl p-6 sm:p-8 border border-slate-800 flex flex-col justify-between">
            <div>
              {/* Step 1: Select Platform */}
              <label className="text-xs uppercase tracking-widest font-mono font-black text-slate-400 block mb-3">1. Selecione a Rede Social</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
                {SOCIAL_PLATFORMS.map((plat) => (
                  <button
                    key={plat.id}
                    onClick={() => setPlatform(plat.id)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      platform === plat.id 
                        ? 'bg-primary border-primary text-white scale-102 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
                    }`}
                    id={`calc-plat-${plat.id}`}
                  >
                    <div className="mb-2">{getPlatformIcon(plat.id)}</div>
                    {plat.name.split('/')[0]}
                  </button>
                ))}
              </div>

              {/* Step 2: Select Service Type */}
              <label className="text-xs uppercase tracking-widest font-mono font-black text-slate-400 block mb-3">2. Escolha o Engajamento</label>
              <div className="flex flex-wrap gap-2 mb-8">
                {categoriesList.map((cat) => (
                  <button
                    key={cat.type}
                    onClick={() => setServiceType(cat.type)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      serviceType === cat.type
                        ? 'bg-primary text-white border border-primary'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-850 border border-slate-800'
                    }`}
                    id={`calc-type-${cat.type}`}
                  >
                    {cat.type === 'followers' && '👤 '}
                    {cat.type === 'likes' && '❤️ '}
                    {cat.type === 'views' && '👁️ '}
                    {cat.type === 'stories' && '📖 '}
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Step 3: Quantities */}
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase tracking-widest font-mono font-black text-slate-400">3. Defina a Quantidade</label>
                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-1">
                  <button onClick={() => decrementQuantity(100)} className="px-2.5 py-1 text-slate-400 hover:text-white font-bold">-100</button>
                  <input
                    type="text"
                    value={customInput}
                    onChange={handleCustomInputChange}
                    onBlur={handleCustomInputBlur}
                    className="w-16 text-center bg-transparent border-none text-xs font-bold text-accent focus:outline-none"
                    id="calc-manual-qty-input"
                  />
                  <button onClick={() => incrementQuantity(100)} className="px-2.5 py-1 text-slate-400 hover:text-white font-bold">+100</button>
                </div>
              </div>

              {activeService && (
                <div className="space-y-6">
                  {/* Slider Control */}
                  <div className="relative pt-4">
                    <input
                       type="range"
                       min={activeService.minQuantity}
                       max={activeService.maxQuantity}
                       step={activeService.platform === 'youtube' && activeService.type === 'followers' ? 50 : 100}
                       value={quantity}
                       onChange={handleQuantitySliderChange}
                       className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary"
                       id="calc-slider-qty"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-2.5 font-mono">
                      <span>MÍN: {activeService.minQuantity.toLocaleString('pt-BR')}</span>
                      <span>MÁX: {activeService.maxQuantity.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Progressive Discount Badges Feed */}
                  <div className="grid grid-cols-3 gap-2 py-1">
                    <div className={`p-2.5 rounded-lg border text-center transition-all ${quantity >= 10000 ? 'bg-green-600/10 border-green-500/40 text-green-400 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      <div className="text-[10px] uppercase font-bold tracking-wider">≥ 10.000 un.</div>
                      <div className="text-[10px] font-mono font-black mt-0.5 text-accent">30% OFF</div>
                    </div>
                    <div className={`p-2.5 rounded-lg border text-center transition-all ${quantity >= 5000 && quantity < 10000 ? 'bg-green-600/10 border-green-500/40 text-green-400 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      <div className="text-[10px] uppercase font-bold tracking-wider">≥ 5.000 un.</div>
                      <div className="text-[10px] font-mono font-black mt-0.5 text-accent">20% OFF</div>
                    </div>
                    <div className={`p-2.5 rounded-lg border text-center transition-all ${quantity >= 2000 && quantity < 5000 ? 'bg-green-600/10 border-green-500/40 text-green-400 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      <div className="text-[10px] uppercase font-bold tracking-wider">≥ 2.000 un.</div>
                      <div className="text-[10px] font-mono font-black mt-0.5 text-accent">10% OFF</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick security trust links for calc */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-accent" />
                <span>Início {activeService?.deliverySpeed.toLowerCase().includes('imediato') ? 'imediato' : 'rápido'} com entrega progressiva</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Garantidores de recargas por 30 dias</span>
              </div>
            </div>

          </div>

          {/* Pricing Panel Output (5 columns) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-850 rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-lg relative overflow-hidden" id="calc-summary-panel">
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 font-mono font-black text-white/5 text-9xl select-none leading-none">
              $
            </div>

            <div className="relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 py-1 px-3 rounded mb-6 inline-block">
                🛒 Demonstrativo de Compra
              </span>

              <h4 className="font-display font-black text-xl mb-1 text-white">
                Resumo do Pedido
              </h4>
              <p className="text-slate-400 text-xs font-semibold mb-6 flex items-center gap-1.5">
                <span>Plano Customizado</span>
                <span className="bg-primary text-white px-2 py-0.5 text-[9px] font-black rounded uppercase">
                  {platform}
                </span>
              </p>

              {/* Quantities descriptor */}
              <div className="space-y-4 border-b border-slate-800 pb-6 mb-6">
                <div className="flex justify-between font-bold text-xs text-slate-400">
                  <span>Engajamento:</span>
                  <span className="text-white">{activeService?.label}</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-slate-400 font-mono">
                  <span>Quantidade:</span>
                  <span className="text-accent text-sm">{quantity.toLocaleString('pt-BR')} un.</span>
                </div>

                {bulkMetrics.discountPercent > 0 && (
                  <div className="flex justify-between font-mono font-bold text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 p-2 rounded">
                    <span>Desconto progressivo:</span>
                    <span>-{bulkMetrics.discountPercent}% OFF (-R$ {bulkMetrics.discountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                  </div>
                )}
              </div>

              {/* Prices Section */}
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] font-bold uppercase block">Valor Total do Plano</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-black text-3xl text-accent">
                    R$ {bulkMetrics.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {bulkMetrics.discountPercent > 0 && (
                    <span className="text-xs line-through text-slate-500">
                      R$ {bulkMetrics.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block pt-1">
                  Pagamento via PIX com aprovação e processamento instantâneo
                </span>
              </div>
            </div>

            {/* Primary Order CTA */}
            <div className="mt-8 relative z-10">
              <button
                onClick={handleOpenCheckout}
                className="w-full bg-primary hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded transition-all cursor-pointer flex items-center justify-center gap-2"
                id="interactive-buy-btn"
              >
                <ShoppingCart className="h-4 w-4" />
                Desejo Comprar Agora
              </button>
              <span className="text-[9px] text-slate-500 text-center font-bold block mt-3 uppercase tracking-wider">
                🔐 Conexão SSL Segura de Pagamento
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* --- CHECKOUT SIMULATOR DIALOG / MODAL --- */}
      {showCheckout && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-fade-in cursor-pointer" 
          id="checkout-modal-overlay"
          onClick={() => setShowCheckout(false)}
        >
          
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] overflow-y-auto relative animate-scale-up cursor-default"
          >
            
            {/* Checkout Stage Title Banner */}
            <div className="bg-slate-900 text-white p-6 pb-5 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-indigo-500" />
              
              {/* Highly prominent close button styled with background hover states */}
              <button
                onClick={() => setShowCheckout(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 bg-slate-850 rounded-full transition-all cursor-pointer z-20 flex items-center justify-center"
                aria-label="Close Checkout"
                id="close-checkout-modal"
                title="Fechar (ESC)"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="flex items-center gap-3 pr-8">
                <div className="bg-blue-600/20 text-blue-400 p-2 rounded-xl">
                  {getPlatformIcon(platform)}
                </div>
                <div>
                  <h3 className="font-display font-black text-lg">Checkout de Pedido Seguro</h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Plano Customizado: {quantity.toLocaleString('pt-BR')} {activeService?.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Step Selector Ribbon */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex justify-between text-[11px] font-black text-slate-500">
              <span className={checkoutStep === 'info' ? 'text-blue-600 font-bold' : ''}>1. Seus dados</span>
              <span className={(checkoutStep === 'account' || checkoutStep === 'login_prompt') ? 'text-blue-600 font-bold' : ''}>2. Sua conta</span>
              <span className={(checkoutStep === 'processing' || checkoutStep === 'done') ? 'text-blue-600 font-bold' : ''}>3. Pedido</span>
            </div>

            {/* MODAL MAIN CONTENTS */}
            <div className="p-6">

              {accountError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-2.5 font-bold flex items-center gap-2 mb-4">
                  <X className="h-4 w-4 shrink-0" /> {accountError}
                </div>
              )}

              {/* --- STEP 1: PROFILE + CONTACT --- */}
              {checkoutStep === 'info' && (
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  {!currentUser && (
                    <div>
                      <label className="text-xs font-black uppercase text-slate-500 block mb-1">Seu nome</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User className="h-4 w-4" /></div>
                        <input type="text" placeholder="Seu nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)}
                          className={`w-full bg-slate-50 border ${formErrors.fullName ? 'border-red-500' : 'border-slate-200'} text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800`} id="checkout-name-input" />
                      </div>
                      {formErrors.fullName && <p className="text-red-500 text-[11px] font-bold mt-1">{formErrors.fullName}</p>}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-black uppercase text-slate-500 block mb-1">Perfil/@ de destino</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User className="h-4 w-4" /></div>
                      <input type="text" placeholder="@seu_perfil" value={username} onChange={(e) => setUsername(e.target.value)}
                        className={`w-full bg-slate-50 border ${formErrors.username ? 'border-red-500' : 'border-slate-200'} text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800`} id="checkout-username-input" />
                    </div>
                    {formErrors.username ? (
                      <p className="text-red-500 text-[11px] font-bold mt-1">{formErrors.username}</p>
                    ) : (
                      <p className="text-[10px] font-semibold text-slate-400 mt-1">Sua conta deve estar pública. Nunca pedimos sua senha da rede social!</p>
                    )}
                  </div>

                  {activeService && activeService.type !== 'followers' && (
                    <div>
                      <label className="text-xs font-black uppercase text-slate-500 block mb-1">Link da publicação</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Compass className="h-4 w-4" /></div>
                        <input type="url" placeholder="https://www.instagram.com/p/..." value={postUrl} onChange={(e) => setPostUrl(e.target.value)}
                          className={`w-full bg-slate-50 border ${formErrors.postUrl ? 'border-red-500' : 'border-slate-200'} text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800`} id="checkout-post-url-input" />
                      </div>
                      {formErrors.postUrl && <p className="text-red-500 text-[11px] font-bold mt-1">{formErrors.postUrl}</p>}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black uppercase text-slate-500 block mb-1">E-mail</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Mail className="h-4 w-4" /></div>
                        <input type="email" placeholder="seuemail@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={!!currentUser}
                          className={`w-full bg-slate-50 border ${formErrors.email ? 'border-red-500' : 'border-slate-200'} text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800 ${currentUser ? 'opacity-70' : ''}`} id="checkout-email-input" />
                      </div>
                      {formErrors.email && <p className="text-red-500 text-[11px] font-bold mt-1">{formErrors.email}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase text-slate-500 block mb-1">WhatsApp (com DDD)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Smartphone className="h-4 w-4" /></div>
                        <input type="tel" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)}
                          className={`w-full bg-slate-50 border ${formErrors.phone ? 'border-red-500' : 'border-slate-200'} text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800`} id="checkout-phone-input" />
                      </div>
                      {formErrors.phone && <p className="text-red-500 text-[11px] font-bold mt-1">{formErrors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase text-slate-500 block mb-1">Forma de pagamento</label>
                    <div className="py-2.5 px-4 rounded-xl border border-green-500 bg-green-50 text-green-800 font-bold text-sm flex items-center justify-center gap-2">
                      🇧🇷 PIX — aprovação instantânea
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Total do pedido</span>
                    <span className="font-display font-black text-lg text-slate-900">R$ {bulkMetrics.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-sm tracking-wide cursor-pointer flex items-center justify-center gap-2 shadow-lg" id="submit-info-btn">
                    Continuar <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* --- STEP 2a: CREATE ACCOUNT (guest) --- */}
              {checkoutStep === 'account' && (
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div className="bg-purple-50 border border-primary/20 text-primary text-xs font-semibold rounded-xl p-3">
                    Crie uma senha para acompanhar seu pedido em "Minha Conta". Já vamos te deixar logado.
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-slate-500 block mb-1">Crie uma senha</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock className="h-4 w-4" /></div>
                      <input type="password" autoComplete="new-password" placeholder="Mín. 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800" id="checkout-password-input" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase text-slate-500 block mb-1">Confirmar senha</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock className="h-4 w-4" /></div>
                      <input type="password" autoComplete="new-password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800" id="checkout-confirm-input" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-primary hover:bg-purple-700 text-white font-bold py-4 rounded-xl text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg" id="create-account-order-btn">
                    Criar conta e gerar pedido <ArrowRight className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setCheckoutStep('info')} className="w-full text-xs font-bold text-slate-400 hover:text-blue-600 py-1 cursor-pointer">← Voltar</button>
                </form>
              )}

              {/* --- STEP 2b: ACCOUNT EXISTS → LOGIN --- */}
              {checkoutStep === 'login_prompt' && (
                <div className="text-center space-y-4 py-2">
                  <div className="mx-auto h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><LogIn className="h-6 w-6" /></div>
                  <div>
                    <h4 className="font-display font-black text-lg text-slate-900">Você já tem conta!</h4>
                    <p className="text-slate-500 text-xs font-semibold mt-1">Já existe uma conta com este e-mail ou telefone. Faça login para concluir a compra pelo seu painel.</p>
                  </div>
                  <button onClick={() => { setShowCheckout(false); navigate('/login'); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm cursor-pointer flex items-center justify-center gap-2" id="go-login-btn">
                    <LogIn className="h-4 w-4" /> Fazer login
                  </button>
                  <button type="button" onClick={() => setCheckoutStep('info')} className="w-full text-xs font-bold text-slate-400 hover:text-blue-600 py-1 cursor-pointer">← Usar outro e-mail</button>
                </div>
              )}

              {/* --- STEP 3: PROCESSING --- */}
              {checkoutStep === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                  <p className="text-slate-600 text-sm font-semibold">Processando seu pedido...</p>
                </div>
              )}

              {/* --- STEP 4: DONE (confirmation + PIX QR) --- */}
              {checkoutStep === 'done' && createdOrder && (
                <OrderConfirmation
                  order={createdOrder}
                  onGoToOrders={() => { setShowCheckout(false); navigate('/minha-conta'); }}
                />
              )}

            </div>

          </div>
        </div>
      )}

    </section>
  );
}
