import { ShieldCheck, Zap, Star, ArrowRight, UserCheck, Play } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeroProps {
  onNavigate: (sectionId: string) => void;
  homeContent: {
    heroTitle: string;
    heroSubtitle: string;
    alertBannerText: string;
    companyWhatsApp: string;
    companyEmail: string;
  } | null;
}

export default function Hero({ onNavigate, homeContent }: HeroProps) {
  const [followerCount, setFollowerCount] = useState(14450);

  // Animate follower count upwards to simulate actual live tracking growth!
  useEffect(() => {
    const timer = setInterval(() => {
      setFollowerCount((prev) => {
        if (prev >= 15000) {
          return 14450;
        }
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="inicio" className="relative pt-28 pb-16 md:pt-36 md:pb-24 lg:pt-40 overflow-hidden bg-gradient-to-br from-[#faf5ff] via-white to-white border-b border-slate-200">
      {/* Subtle clean geometric accent lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Text Content Block */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Live Promo Tag */}
            <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              {homeContent?.alertBannerText || "Promoção de Inverno: Até 50% OFF em Combos Selecionados!"}
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight whitespace-pre-line">
              {homeContent?.heroTitle || "Impulsione suas redes sociais com seguidores reais e brasileiros"}
            </h1>

            <p className="text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
              {homeContent?.heroSubtitle || "Serviços premium de seguidores, curtidas e visualizações estáveis para Instagram, TikTok, YouTube e mais. Crescimento rápido, permanente e 100% seguro."}
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-3">
              <button
                onClick={() => onNavigate('calculadora')}
                className="w-full sm:w-auto bg-primary hover:bg-purple-700 text-white text-base font-bold py-4 px-8 rounded-lg shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 group"
                id="hero-calculator-btn"
              >
                Ver Planos e Preços
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => onNavigate('como-funciona')}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-base font-bold py-4 px-8 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                id="hero-howitworks-btn"
              >
                <div className="bg-purple-50 p-1.5 rounded-full text-primary">
                  <Play className="h-3 w-3 fill-current" />
                </div>
                Como Funciona?
              </button>
            </div>

            {/* Micro Trust Indicators */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-center lg:justify-start items-center gap-6 text-slate-500 text-sm">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span className="font-semibold text-slate-700">Sem senhas</span> ou logins
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-5 w-5 text-yellow-500" />
                Entrega <span className="font-semibold text-slate-700">Turbo & Gradual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-5 w-5 text-primary" />
                <span className="font-semibold text-slate-700">10k+</span> Clientes satisfeitos
              </div>
            </div>

          </div>

          {/* Graphics/Social Mockup Column */}
          <div className="lg:col-span-5 relative mt-8 lg:mt-0">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
              
              {/* Fake Dashboard Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-purple-100 text-primary rounded-full flex items-center justify-center font-bold font-display">
                    IG
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">ImpulsioneGram AI</h4>
                    <p className="text-xs text-green-500 font-semibold">● Painel de Crescimento</p>
                  </div>
                </div>
                <div className="bg-purple-50 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Ao Vivo
                </div>
              </div>

              {/* Stat Counters Grid */}
              <div className="py-6 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/80">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">Métricas de Alcance</span>
                  <span className="font-display font-black text-slate-800 text-2xl">+412%</span>
                  <span className="text-[10px] text-green-600 font-bold block mt-1">▲ Impulsionamento algorítmico</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/80">
                  <span className="text-xs text-slate-500 block font-semibold mb-1">Tempo de Entrega</span>
                  <span className="font-display font-black text-slate-800 text-2xl">⚡ Méd. 5min</span>
                  <span className="text-[10px] text-primary font-bold block mt-1">Aprovação automática</span>
                </div>
              </div>

              {/* Dynamic Follower Box */}
              <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-5 font-display font-black text-6xl translate-x-4 translate-y-4">
                  BR
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-indigo-200 uppercase tracking-widest font-bold">Perfil Alvo</span>
                    <h5 className="font-bold mt-0.5 text-white">@seu_perfil_profissional</h5>
                  </div>
                  <div className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded text-xs gap-1 flex items-center font-bold">
                    🇧🇷 BR
                  </div>
                </div>

                <div className="mt-6 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block">Seguidores Brasileiros Reais</span>
                    <span className="font-display font-black text-4xl block tracking-tight tabular-nums transition-all text-accent">
                      {followerCount.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <span className="bg-green-600 text-white text-[11px] font-bold py-1 px-2.5 rounded shadow">
                    + Estável
                  </span>
                </div>

                {/* Progress Visual */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                    <span>Meta diária</span>
                    <span>98.4% concluído</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded overflow-hidden">
                    <div className="bg-primary h-full rounded transition-all duration-1000" style={{ width: `${(followerCount / 15000) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Live purchase feed */}
              <div className="pt-4 mt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">Últimos Pedidos Processados</span>
                
                <div className="space-y-2.5 max-h-32 overflow-hidden text-xs">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-black">ig</div>
                      <span className="font-bold text-slate-700">@loja_virtual...</span>
                    </div>
                    <span className="text-green-600 font-bold">+1.000 seguidores</span>
                    <span className="text-[10px] text-slate-400">Há 12s</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-100 text-black flex items-center justify-center font-black">tk</div>
                      <span className="font-bold text-slate-700">@lucas_crea...</span>
                    </div>
                    <span className="text-green-600 font-bold">+500 curtidas</span>
                    <span className="text-[10px] text-slate-400">Há 54s</span>
                  </div>
                </div>
              </div>

            </div>

            {/* floating badges */}
            <div className="absolute -bottom-4 -left-4 bg-white border border-slate-200 rounded-xl p-3 shadow-md flex items-center gap-2 pl-4 pr-5 py-3">
              <Star className="h-6 w-6 text-accent fill-current" />
              <div>
                <div className="font-bold text-sm text-slate-800">4.9 / 5 Estrelas</div>
                <div className="text-[10px] text-slate-400 font-medium">Avaliações baseadas no TrustPilot</div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
