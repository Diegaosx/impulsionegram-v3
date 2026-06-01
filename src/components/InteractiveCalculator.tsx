import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SERVICES, SOCIAL_PLATFORMS } from '../data';
import { SocialPlatform, ServiceItem, OrderDetails } from '../types';
import { 
  Instagram, Youtube, Twitter, Facebook, Flame, Zap, Shield, 
  HelpCircle, CreditCard, Sparkles, CheckCircle2, Copy, 
  RefreshCw, Smartphone, Mail, User, Compass, ShoppingCart, Loader2, ArrowRight, X, Heart
} from 'lucide-react';

interface InteractiveCalculatorProps {
  initialPlatform?: SocialPlatform;
  initialType?: string;
  onAddOrderToStats: () => void;
}

export default function InteractiveCalculator({ 
  initialPlatform, 
  initialType, 
  onAddOrderToStats 
}: InteractiveCalculatorProps) {
  
  // Selection States
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [serviceType, setServiceType] = useState<string>('followers');
  const [quantity, setQuantity] = useState<number>(1000);
  
  // Dynamic Input States
  const [customInput, setCustomInput] = useState<string>('1000');
  
  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'payment' | 'processing' | 'success'>('info');
  
  // User Form Inputs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Payment Type
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [pixTimer, setPixTimer] = useState(900); // 15:00 min
  
  // Credit Card Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  
  // Simulation indicators
  const [processingStatus, setProcessingStatus] = useState('Processando transação...');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [transactionId, setTransactionId] = useState('');

  // Handle outside notification trigger
  useEffect(() => {
    if (initialPlatform) {
      setPlatform(initialPlatform);
    }
    if (initialType) {
      setServiceType(initialType);
    }
  }, [initialPlatform, initialType]);

  // Find all available service categories for current platform
  const categoriesList = useMemo(() => {
    const matching = SERVICES.filter(s => s.platform === platform);
    return matching.map(m => ({ type: m.type, label: m.label }));
  }, [platform]);

  // Sync serviceType if it is not in the categories list of the new platform
  useEffect(() => {
    const isAvailable = categoriesList.some(c => c.type === serviceType);
    if (!isAvailable && categoriesList.length > 0) {
      setServiceType(categoriesList[0].type);
    }
  }, [platform, categoriesList, serviceType]);

  // Get active service configuration item
  const activeService = useMemo<ServiceItem | undefined>(() => {
    return SERVICES.find(s => s.platform === platform && s.type === serviceType);
  }, [platform, serviceType]);

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
    setUsername('');
    setEmail('');
    setPhone('');
    setPostUrl('');
    setCheckoutStep('info');
    setShowCheckout(true);
  };

  // Validate form info
  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    
    if (!username.trim()) {
      errors.username = 'O nome de usuário ou link é obrigatório';
    } else if (username.trim().startsWith('@') && username.trim().length < 3) {
      errors.username = 'Insira um usuário válido';
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Insira um endereço de e-mail válido';
    }

    if (!phone.replace(/\D/g, '').trim() || phone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Insira um número de telefone com DDD';
    }

    if (activeService && activeService.type !== 'followers' && !postUrl.trim()) {
      errors.postUrl = 'O link da publicação correspondente é obrigatório para curtidas e visualizações';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setCheckoutStep('payment');
  };

  // Live Timer for Pix
  useEffect(() => {
    if (showCheckout && checkoutStep === 'payment' && paymentMethod === 'pix' && pixTimer > 0) {
      const interval = setInterval(() => {
        setPixTimer(t => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showCheckout, checkoutStep, paymentMethod, pixTimer]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pix code copy simulation
  const handleCopyPix = () => {
    const dummyPixCode = `00020101021226830014br.gov.bcb.pix0141contato@seguidoresbrasil.com.br5204000053039865405${bulkMetrics.finalPrice.toFixed(2)}5802BR5917SEGUIDORES_BRASIL6009SAO_PAULO62070503***6304FC7D`;
    navigator.clipboard.writeText(dummyPixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  // Confirm Payment and Initiate Loading Simulation
  const handleConfirmPayment = () => {
    setCheckoutStep('processing');
    setProcessingProgress(0);
    setProcessingStatus('Inicializando ambiente seguro de aprovação...');
    setTransactionId('SB-' + Math.floor(100000 + Math.random() * 900000));

    const steps = [
      { text: 'Conectando ao gateway de pagamento (Mercado Pago)...', progress: 15 },
      { text: 'Processando autenticação do Pix token bancário...', progress: 35 },
      { text: 'Pagamento aprovado! Alinhando perfis de entrega...', progress: 55 },
      { text: 'Criando canal seguro de provimento no servidor...', progress: 75 },
      { text: 'Sincronizando com o perfil ' + (username.startsWith('@') ? username : '@' + username) + '...', progress: 90 },
      { text: 'Pronto! Pedido agendado e fila de entrega aberta.', progress: 100 },
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setProcessingStatus(steps[currentStepIdx].text);
        setProcessingProgress(steps[currentStepIdx].progress);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setCheckoutStep('success');
        onAddOrderToStats(); // Notification trigger
      }
    }, 1200);
  };

  // Card Inputs Masking Helper (Basic)
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
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
                  Ou em até 12x de R$ {(bulkMetrics.finalPrice / 12 * 1.15).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} no cartão de crédito
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
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-fade-in" id="checkout-modal-overlay">
          
          <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden relative animate-scale-up">
            
            {/* Header close btn */}
            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
              aria-label="Close Checkout"
              id="close-checkout-modal"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Checkout Stage Title Banner */}
            <div className="bg-slate-900 text-white p-6 pb-5 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-indigo-500" />
              <div className="flex items-center gap-3">
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
              <span className={checkoutStep === 'info' ? 'text-blue-600 font-bold' : ''}>1. Dados do Perfil</span>
              <span className={checkoutStep === 'payment' ? 'text-blue-600 font-bold' : ''}>2. Pagamento</span>
              <span className={checkoutStep === 'processing' ? 'text-blue-600 font-bold' : ''}>3. Confirmação</span>
              <span className={checkoutStep === 'success' ? 'text-blue-600 font-bold' : ''}>4. Canal Liberado</span>
            </div>

            {/* MODAL MAIN CONTENTS */}
            <div className="p-6">
              
              {/* --- STEP 1: ACCOUNT DETAILS FORM --- */}
              {checkoutStep === 'info' && (
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-black uppercase text-slate-500 block mb-1">
                      Usuário do perfil (Ex: @seu_perfil)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        placeholder="@nome_do_usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={`w-full bg-slate-50 border ${formErrors.username ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600'} text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 font-semibold text-slate-800`}
                        id="checkout-username-input"
                      />
                    </div>
                    {formErrors.username ? (
                      <p className="text-red-500 text-[11px] font-bold mt-1">{formErrors.username}</p>
                    ) : (
                      <p className="text-[10px] font-semibold text-slate-400 mt-1">Sua conta deve estar Pública. Nunca pedimos senha!</p>
                    )}
                  </div>

                  {/* If Curtidas/Views requested: Prompt for Post URL link details */}
                  {activeService && activeService.type !== 'followers' && (
                    <div>
                      <label className="text-xs font-black uppercase text-slate-500 block mb-1">
                        Link da publicação específica
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Compass className="h-4 w-4" />
                        </div>
                        <input
                          type="url"
                          placeholder="https://www.instagram.com/p/..."
                          value={postUrl}
                          onChange={(e) => setPostUrl(e.target.value)}
                          className={`w-full bg-slate-50 border ${formErrors.postUrl ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600'} text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 font-semibold text-slate-800`}
                          id="checkout-post-url-input"
                        />
                      </div>
                      {formErrors.postUrl && (
                        <p className="text-red-500 text-[11px] font-bold mt-1">{formErrors.postUrl}</p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black uppercase text-slate-500 block mb-1">E-mail para comprovante</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          type="email"
                          placeholder="seuemail@exemplo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full bg-slate-50 border ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600'} text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 font-semibold text-slate-800`}
                          id="checkout-email-input"
                        />
                      </div>
                      {formErrors.email && <p className="text-red-500 text-[11px] font-bold mt-1">{formErrors.email}</p>}
                    </div>

                    <div>
                      <label className="text-xs font-black uppercase text-slate-500 block mb-1">WhatsApp (com DDD)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <input
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`w-full bg-slate-50 border ${formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-600'} text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 font-semibold text-slate-800`}
                          id="checkout-phone-input"
                        />
                      </div>
                      {formErrors.phone && <p className="text-red-500 text-[11px] font-bold mt-1">{formErrors.phone}</p>}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-2.5 mt-2">
                    <Shield className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600 font-semibold">
                      Garantia de segurança máxima. Não salvamos cookies fora do seu navegador e não divulgamos termos de aquisição corporativa para terceiros.
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-sm tracking-wide mt-4 cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                    id="submit-info-btn"
                  >
                    Prosseguir Para Pagamento
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* --- STEP 2: PAYMENT METHOD CONFIGURATION --- */}
              {checkoutStep === 'payment' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setPaymentMethod('pix')}
                      className={`py-3 px-4 rounded-xl border font-black text-sm flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        paymentMethod === 'pix' 
                          ? 'border-green-500 bg-green-50 text-green-800 shadow-md' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      id="payment-method-pix"
                    >
                      <span className="text-2xl">🇧🇷</span>
                      <span>Pix (Desconto!)</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`py-3 px-4 rounded-xl border font-black text-sm flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        paymentMethod === 'card' 
                          ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-md' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      id="payment-method-card"
                    >
                      <CreditCard className="h-6 w-6 text-blue-600" />
                      <span>Cartão de Crédito</span>
                    </button>
                  </div>

                  {/* --- PIX DETAILS SIMULATOR --- */}
                  {paymentMethod === 'pix' && (
                    <div className="space-y-4 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                      <div className="flex justify-between items-center bg-green-100 border border-green-200 text-green-800 p-2.5 rounded-xl text-xs font-bold text-center">
                        <span>Aprovado em 2 segundos via PIX</span>
                        <span className="bg-green-600 text-white py-0.5 px-2 rounded-full font-black animate-pulse">
                          -5% OFF EXTRA
                        </span>
                      </div>

                      <div className="flex flex-col items-center py-2 bg-white rounded-xl border border-slate-200">
                        {/* Fake SVG QRCode image */}
                        <div className="aspect-square bg-slate-100 border border-slate-200 rounded p-2 mb-2 w-32 relative flex items-center justify-center">
                          <div className="grid grid-cols-5 gap-2 w-24 h-24 opacity-60">
                            {Array.from({ length: 25 }).map((_, i) => (
                              <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-slate-800' : 'bg-transparent'}`}></div>
                            ))}
                          </div>
                          <div className="absolute bg-white border border-slate-200 p-1 rounded">
                            {getPlatformIcon(platform)}
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-500 font-bold block mb-1">Leia com o app do seu Banco</span>
                        <span className="text-xs font-semibold text-slate-700 block">Tempo restante: <strong className="text-red-500 font-bold">{formatTimer(pixTimer)}</strong></span>
                      </div>

                      {/* Pix copypaste code buffer */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 uppercase block">Pix Copia e Cola:</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value="00020101021226830014br.gov.bcb.pix0141contato@seguidoresbrasil.com.br5204000053..."
                            className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-500 font-mono text-xs overflow-hidden text-ellipsis flex-grow outline-none focus:ring-1 focus:ring-green-500"
                            id="pix-copia-cola-field"
                          />
                          <button
                            onClick={handleCopyPix}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 flex items-center justify-center cursor-pointer transition-colors"
                            id="copy-pix-btn"
                            title="Copiar Chave Pix"
                          >
                            {copiedPix ? 'Copiado!' : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleConfirmPayment}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-sm mt-4 shadow-lg cursor-pointer"
                        id="confirm-pix-payment-btn"
                      >
                        Confirmar Pagamento Realizado
                      </button>
                    </div>
                  )}

                  {/* --- CREDIT CARD DETAILS SIMULATOR --- */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-3.5 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Número do Cartão</label>
                        <input
                          type="text"
                          placeholder="4444 4444 4444 4444"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          className="w-full bg-white border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                          id="card-number-input"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Nome impresso no Cartão</label>
                        <input
                          type="text"
                          placeholder="MARIO S BRASIL"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          className="w-full bg-white border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                          id="card-name-input"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-slate-500 uppercase block">Validade</label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                            id="card-expiry-input"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black text-slate-500 uppercase block">Código CVV</label>
                          <input
                            type="password"
                            placeholder="***"
                            maxLength={4}
                            value={cardCVV}
                            onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-white border border-slate-200 text-sm font-semibold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                            id="card-cvv-input"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-500 uppercase block">Parcelamento</label>
                        <select className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-700">
                          <option>1x de R$ {bulkMetrics.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Sem juros)</option>
                          <option>3x de R$ {(bulkMetrics.finalPrice / 3 * 1.05).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</option>
                          <option>6x de R$ {(bulkMetrics.finalPrice / 6 * 1.10).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</option>
                          <option>12x de R$ {(bulkMetrics.finalPrice / 12 * 1.15).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</option>
                        </select>
                      </div>

                      <button
                        onClick={handleConfirmPayment}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-sm mt-4 shadow-lg cursor-pointer"
                        id="confirm-card-payment-btn"
                      >
                        Pagar R$ {bulkMetrics.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </button>
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      onClick={() => setCheckoutStep('info')}
                      className="text-xs text-slate-500 hover:text-blue-600 font-black cursor-pointer uppercase tracking-wider"
                      id="back-to-info-btn"
                    >
                      ← Voltar para dados do perfil
                    </button>
                  </div>
                </div>
              )}

              {/* --- STEP 3: TRANSACTION PROCESSING LOADER --- */}
              {checkoutStep === 'processing' && (
                <div className="flex flex-col items-center justify-center py-10 space-y-6">
                  <div className="relative">
                    <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                    <ShoppingCart className="h-6 w-6 text-slate-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>

                  <div className="text-center space-y-2">
                    <h4 className="font-bold text-slate-800 text-base">Aguardando Confirmação...</h4>
                    <p className="text-slate-500 text-sm font-semibold max-w-xs">{processingStatus}</p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-300" style={{ width: `${processingProgress}%` }}></div>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-400">Progresso: {processingProgress}%</span>
                </div>
              )}

              {/* --- STEP 4: SUCCESS RECEIPT AND SHIPMENT ENGINE CHANNEL --- */}
              {checkoutStep === 'success' && (
                <div className="space-y-4 text-center">
                  <div className="mx-auto bg-green-100 text-green-700 p-3.5 rounded-full inline-block animate-bounce">
                    <CheckCircle2 className="h-10 w-10 fill-current text-white bg-green-500 rounded-full" />
                  </div>

                  <div>
                    <h3 className="font-display font-black text-2xl text-slate-950">Pedido Agendado com Sucesso!</h3>
                    <p className="text-slate-500 text-sm font-semibold mt-1">
                      O canal de provimento de engajamento do seu perfil já foi integrado e inicializado.
                    </p>
                  </div>

                  {/* Comprehensive Receipt */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 text-left text-xs font-semibold space-y-3">
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-400 uppercase font-black">Código do Pedido:</span>
                      <span className="font-mono font-bold text-slate-800">{transactionId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Perfil Alvo:</span>
                      <span className="font-bold text-blue-600">{username.startsWith('@') ? username : '@' + username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Serviço Agendado:</span>
                      <span className="font-bold text-slate-800">{quantity.toLocaleString('pt-BR')} {activeService?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tempo de Entrega Estimado:</span>
                      <span className="font-bold text-green-600">{activeService?.deliverySpeed}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm">
                      <span className="text-slate-800">Total Pago:</span>
                      <span className="text-slate-950 text-base">R$ {bulkMetrics.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Share Receipt with Support via WhatsApp trigger */}
                  <div className="bg-purple-50 p-3.5 rounded-xl border border-primary/20 text-xs text-primary text-left">
                    📧 Comprovante enviado para o e-mail: <strong>{email}</strong>. Seu código está ativado. Guarde este comprovante para faturamento.
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <a
                      href={`https://api.whatsapp.com/send?phone=5511999999999&text=Ol%C3%A1%21+Gostaria+de+acompanhar+meu+pedido+${transactionId}+no+perfil+${username}+da+ImpulsioneGram.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      id="receipt-whatsapp-share"
                    >
                      💬 Acompanhar no WhatsApp
                    </a>
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer"
                      id="close-success-dialog"
                    >
                      Concluído
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </section>
  );
}
