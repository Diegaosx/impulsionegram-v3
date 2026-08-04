// Home do tema "Cristal".
//
// Segue a ordem de seções da referência — herói centrado, serviços, como
// funciona, compromisso, FAQ e CTA final —, mas com o grid de serviços e a
// calculadora que ela não tem em lugar nenhum público.

import { useState } from 'react';
import { ThemeHomeProps } from '../../types';
import { ServiceItem } from '../../../types';
import GlassHeader from '../chrome/Header';
import GlassFooter from '../chrome/Footer';
import GlassFab from '../chrome/Fab';
import GlassServicesGrid from '../sections/ServicesGrid';
import GlassCalculator from '../sections/Calculator';
import GlassFaq from '../sections/Faq';
import { ShieldCheck, Zap, Users } from 'lucide-react';

const STEPS = [
  { title: 'Escolha o serviço', text: 'Selecione a rede social e o tipo de engajamento que você precisa.' },
  { title: 'Informe o perfil', text: 'Cole seu @ ou o link da publicação. Nunca pedimos a sua senha.' },
  { title: 'Pague com PIX', text: 'Aprovação instantânea e início do processamento em seguida.' }
];

const PROMISES = [
  { label: 'Entrega acompanhada', text: 'Você vê o andamento do pedido pelo painel, do envio à conclusão.' },
  { label: 'Reposição garantida', text: 'Se houver queda dentro de 30 dias, repomos sem custo adicional.' },
  { label: 'Suporte brasileiro', text: 'Atendimento em português, por quem conhece o serviço de ponta a ponta.' }
];

export default function GlassHomeView({
  services, plans, homeContent, company, siteName, logoUrl, currentUser, onAuthSuccess, onAddSimulatedOrder
}: ThemeHomeProps) {
  const [quickBuy, setQuickBuy] = useState<{ serviceId: string; packageId?: string } | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBuy = (s: ServiceItem, packageId?: string) => setQuickBuy({ serviceId: s.id, packageId });

  const list: ServiceItem[] = services || [];
  const heroTitle = homeContent?.heroTitle || 'Impulsione suas redes sociais com entrega real';
  // Destaca a última palavra em rosa, como a referência faz em cada headline.
  const words = heroTitle.trim().split(/\s+/);
  const heroHead = words.slice(0, -1).join(' ');
  const heroTail = words[words.length - 1];

  return (
    <div className="gl-page min-h-screen flex flex-col">
      <GlassHeader siteName={siteName} logoUrl={logoUrl} currentUser={currentUser} onNavigate={scrollTo} />

      <main className="flex-1">
        {/* Herói centrado */}
        <section id="inicio" className="gl-wrap pt-16 pb-9 text-center">
          <h1
            className="mx-auto font-bold"
            style={{ color: 'var(--gl-ink)', maxWidth: 850, fontSize: 'clamp(42px, 6vw, 78px)', lineHeight: 1.02 }}
          >
            {heroHead} <span className="gl-accent">{heroTail}</span>
          </h1>

          <p className="mx-auto mt-5 text-lg md:text-xl" style={{ maxWidth: 640, color: 'var(--gl-body)', lineHeight: 1.55 }}>
            {homeContent?.heroSubtitle
              || 'Seguidores, curtidas e visualizações com processamento automático, pagamento por PIX e suporte brasileiro.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-9">
            <button onClick={() => scrollTo('servicos')} className="gl-btn">Ver serviços</button>
            <button onClick={() => scrollTo('calculadora')} className="gl-btn gl-btn-ghost">Simular pedido</button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-9 font-black" style={{ color: 'var(--gl-ink)' }}>
            {[
              { icon: <Zap className="h-5 w-5" />, label: 'Início rápido' },
              { icon: <ShieldCheck className="h-5 w-5" />, label: 'Reposição por 30 dias' },
              { icon: <Users className="h-5 w-5" />, label: 'Perfis reais' }
            ].map(f => (
              <span key={f.label} className="flex items-center gap-2.5">
                <span className="gl-tile !w-11 !h-11">{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>
        </section>

        <GlassServicesGrid services={list} onBuy={handleBuy} />

        {/* Checkout da compra rápida: só o modal, remontado a cada clique. */}
        {quickBuy && (
          <div key={`${quickBuy.serviceId}:${quickBuy.packageId || ''}`}>
            <GlassCalculator
              services={list}
              restrictServiceId={quickBuy.serviceId}
              initialPackageId={quickBuy.packageId}
              modalOnly
              autoOpen
              onClose={() => setQuickBuy(null)}
              currentUser={currentUser}
              onAuthSuccess={onAuthSuccess}
              onOrderCreated={() => onAddSimulatedOrder?.({})}
            />
          </div>
        )}

        <GlassCalculator
          services={list}
          currentUser={currentUser}
          onAuthSuccess={onAuthSuccess}
          onOrderCreated={() => onAddSimulatedOrder?.({})}
        />

        {/* Como funciona */}
        <section id="como-funciona" className="gl-wrap py-8 md:py-16">
          <div className="text-center max-w-2xl mx-auto mb-9">
            <h2 className="font-bold" style={{ color: 'var(--gl-ink)', fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.1 }}>
              Como <span className="gl-accent">funciona</span>
            </h2>
            <p className="mt-3 text-lg" style={{ color: 'var(--gl-body)', lineHeight: 1.55 }}>
              Três passos, sem burocracia e sem pedir a sua senha.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <div key={s.title} className="gl-card p-[26px]">
                <span className="gl-tile">{i + 1}</span>
                <h3 className="text-[22px] font-bold mt-4" style={{ color: 'var(--gl-ink)' }}>{s.title}</h3>
                <p className="mt-2" style={{ color: 'var(--gl-body)', lineHeight: 1.55 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Compromisso de atendimento */}
        <section className="gl-wrap py-8 md:py-16">
          <div className="text-center max-w-2xl mx-auto mb-9">
            <h2 className="font-bold" style={{ color: 'var(--gl-ink)', fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.1 }}>
              Nosso <span className="gl-accent">compromisso</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROMISES.map((p, i) => (
              <div key={p.label} className="gl-card p-[26px]">
                <div className="flex items-center gap-3 mb-3.5">
                  <span className="w-[46px] h-[46px] rounded-full grid place-items-center font-black text-white"
                    style={{ background: 'var(--gl-grad-brand)' }}>{i + 1}</span>
                  <strong className="font-black" style={{ color: 'var(--gl-ink)' }}>{p.label}</strong>
                </div>
                <p style={{ color: 'var(--gl-body)', lineHeight: 1.55 }}>{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Planos, quando houver */}
        {plans && plans.length > 0 && (
          <section id="planos" className="gl-wrap py-8 md:py-16">
            <div className="text-center max-w-2xl mx-auto mb-9">
              <h2 className="font-bold" style={{ color: 'var(--gl-ink)', fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.1 }}>
                Planos <span className="gl-accent">populares</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {plans.map((p: any) => (
                <div key={p.id} className="gl-card p-[26px]">
                  <h3 className="text-[22px] font-bold" style={{ color: 'var(--gl-ink)' }}>{p.name}</h3>
                  <p className="text-3xl font-black mt-3" style={{ color: 'var(--gl-purple)' }}>
                    {Number(p.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  {Array.isArray(p.features) && (
                    <ul className="mt-4 space-y-2">
                      {p.features.map((f: string, i: number) => (
                        <li key={i} style={{ color: 'var(--gl-body)' }}>• {f}</li>
                      ))}
                    </ul>
                  )}
                  <button onClick={() => scrollTo('calculadora')} className="gl-btn w-full mt-6">Assinar</button>
                </div>
              ))}
            </div>
          </section>
        )}

        <GlassFaq faqs={homeContent?.faqs || []} />

        {/* CTA final */}
        <section className="gl-wrap text-center pb-[84px] pt-4">
          <h2 className="font-bold" style={{ color: 'var(--gl-ink)', fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.1 }}>
            Pronto para <span className="gl-accent">começar</span>?
          </h2>
          <p className="mx-auto mt-3 text-lg" style={{ maxWidth: 640, color: 'var(--gl-body)', lineHeight: 1.55 }}>
            Monte seu pedido em menos de um minuto e pague por PIX.
          </p>
          <button onClick={() => scrollTo('calculadora')} className="gl-btn mt-7">Começar agora</button>
        </section>
      </main>

      <GlassFooter siteName={siteName} company={company} onNavigate={scrollTo} />
      <GlassFab company={company} />
    </div>
  );
}
