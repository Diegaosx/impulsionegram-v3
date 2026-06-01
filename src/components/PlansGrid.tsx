import { useState, useMemo } from 'react';
import { PREBUILT_PLANS } from '../data';
import { SocialPlatform, PlanItem } from '../types';
import { Check, Flame, Award, ShieldAlert, Sparkles, Instagram, Plus } from 'lucide-react';

interface PlansGridProps {
  onSelectPlanCustomizer: (platform: SocialPlatform, type: string, quantity: number) => void;
  onNavigate: (sectionId: string) => void;
  plans?: PlanItem[];
}

export default function PlansGrid({ onSelectPlanCustomizer, onNavigate, plans: customPlans }: PlansGridProps) {
  const [activeTab, setActiveTab] = useState<'instagram' | 'tiktok'>('instagram');

  // Filter plans based on selected network
  const plans = useMemo(() => {
    const list = customPlans || PREBUILT_PLANS;
    return list.filter(p => p.platform === activeTab);
  }, [activeTab, customPlans]);

  const handleBuyPlan = (plan: PlanItem) => {
    onSelectPlanCustomizer(plan.platform, plan.type, plan.quantity);
    onNavigate('calculadora');
  };

  return (
    <section id="planos" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase font-black bg-purple-50 border border-primary/20 text-primary px-3 py-1.5 rounded-full tracking-wider">
            Planos Pré-configurados
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-4">
            Nossos Planos Populares
          </h2>
          <p className="text-slate-500 mt-3 text-lg font-medium">
            Escolha um de nossos pacotes estruturados sob medida e agilize o crescimento do seu perfil de forma imediata.
          </p>

          {/* Tab Selector buttons */}
          <div className="flex justify-center mt-8 gap-2 bg-slate-100 p-1 rounded-lg max-w-xs mx-auto border border-slate-200">
            <button
              onClick={() => setActiveTab('instagram')}
              className={`flex-1 text-center py-2.5 rounded text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'instagram'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="plan-tab-ig"
            >
              📸 Instagram
            </button>
            <button
              onClick={() => setActiveTab('tiktok')}
              className={`flex-1 text-center py-2.5 rounded text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tiktok'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              id="plan-tab-tt"
            >
              🎵 TikTok
            </button>
          </div>
        </div>

        {/* 3 Columns Pre-Packaged Grid + 4th custom column */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch pt-2">
          
          {plans.map((plan) => {
            const savings = plan.savingsPercent || 0;
            const installmentAmount = (plan.price / 12 * 1.15).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            return (
              <div 
                key={plan.id}
                className={`rounded-lg p-6 relative flex flex-col justify-between transition-all duration-200 ${
                  plan.isPopular 
                    ? 'bg-slate-900 border-2 border-primary text-white shadow-md scale-[1.02] md:-translate-y-1' 
                    : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 text-slate-800'
                }`}
                id={`prebuilt-plan-card-${plan.id}`}
              >
                {/* Popularity/Discount Badge */}
                {savings > 0 && (
                  <span className={`absolute -top-3 right-6 px-2.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                    plan.isPopular 
                      ? 'bg-accent text-slate-950' 
                      : 'bg-green-100 text-green-850 border border-green-200'
                  }`}>
                    Economize {savings}%
                  </span>
                )}

                <div>
                  {plan.isPopular && (
                    <div className="flex items-center gap-1 text-[10px] font-black tracking-widest text-blue-400 uppercase mb-2">
                      <Award className="h-3.5 w-3.5 text-yellow-400 animate-spin" />
                      Mais Recomendado
                    </div>
                  )}

                  <h3 className="font-display font-black text-xl mb-1">{plan.name}</h3>
                  <p className={`text-xs font-semibold ${plan.isPopular ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {plan.quantity.toLocaleString('pt-BR')} Seguidores Brasileiros
                  </p>

                  {/* Pricing Tag */}
                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold">R$</span>
                      <span className="font-display font-black text-3xl tracking-tight leading-none">
                        {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <span className={`text-[10px] font-semibold block mt-1.5 ${plan.isPopular ? 'text-indigo-200' : 'text-slate-500'}`}>
                      Ou em até 12x de R$ {installmentAmount}
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3.5 border-t border-slate-200 pt-5 mt-5">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-semibold">
                        <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.isPopular ? 'text-green-400' : 'text-green-600'}`} />
                        <span className={plan.isPopular ? 'text-slate-300' : 'text-slate-500'}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Button */}
                <div className="mt-8">
                  <button
                    onClick={() => handleBuyPlan(plan)}
                    className={`w-full py-3 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      plan.isPopular 
                        ? 'bg-primary hover:bg-blue-700 text-white' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                    id={`buy-plan-btn-${plan.id}`}
                  >
                    Ativar Plano Instantâneo
                  </button>
                </div>
              </div>
            );
          })}

          {/* 4th Column: Custom "Plan Builder" Column with distinctive CTA */}
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 shadow-sm flex flex-col justify-between text-slate-800">
            <div>
              <span className="bg-primary/10 text-primary text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider mb-2 inline-block">
                Controle Integral
              </span>
              <h3 className="font-display font-bold text-lg text-slate-950 mb-1">Plano Sob Medida</h3>
              <p className="text-xs font-medium text-slate-400">Formato 100% personalizado para você</p>

              <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-6">
                Precisa de uma quantidade maior? Quer pacotes combinados de curtidas + visualizações de stories + seguidores em contas simultâneas?
              </p>

              <div className="space-y-3.5 border-t border-slate-200 pt-5 mt-5">
                <div className="flex items-start gap-2 text-xs font-semibold">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-slate-500">Selecione até 100 mil seguidores</span>
                </div>
                <div className="flex items-start gap-2 text-xs font-semibold">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-semibold text-slate-500">Divisão personalizada de curtidas</span>
                </div>
                <div className="flex items-start gap-2 text-xs font-semibold">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-semibold text-slate-500">Velocidade de entrega controlada</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => {
                  onSelectPlanCustomizer(activeTab, 'followers', 1500);
                  onNavigate('calculadora');
                }}
                className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3.5 rounded text-xs uppercase tracking-wider shadow cursor-pointer flex items-center justify-center gap-1"
                id="customize-plan-btn"
              >
                <Plus className="h-4 w-4" />
                Montar Do Meu Jeito
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
