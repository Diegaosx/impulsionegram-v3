// Home do tema "Painel".
//
// Ordem das seções inspirada na referência de layout, mas com duas seções que
// são nossas e que ela não tem em lugar nenhum público: o grid de serviços e a
// calculadora.

import { Fragment, ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeHomeProps } from '../../types';
import { orderedSections, useHomeLayout } from '../../../site/homeSections';
import { ServiceItem } from '../../../types';
import JapHeader from '../chrome/Header';
import JapFooter from '../chrome/Footer';
import JapServicesGrid from '../sections/ServicesGrid';
import JapCalculator from '../sections/Calculator';
import JapFaq from '../sections/Faq';
import { ShieldCheck, Zap, Users } from 'lucide-react';

const STEPS = [
  { title: 'Escolha o serviço', text: 'Selecione a rede social e o tipo de engajamento que você precisa.' },
  { title: 'Informe o perfil', text: 'Cole seu @ ou o link da publicação. Nada de senha — nunca pedimos.' },
  { title: 'Pague com PIX', text: 'Aprovação instantânea e início do processamento em seguida.' },
  { title: 'Acompanhe a entrega', text: 'Veja o andamento pelo painel, com reposição garantida por 30 dias.' }
];

export default function JapHomeView({
  services, plans, homeContent, company, siteName, logoUrl, currentUser, onAuthSuccess, onAddSimulatedOrder
}: ThemeHomeProps) {
  const navigate = useNavigate();
  // Ordem das seções e visibilidade dos planos vêm do painel.
  const { order, plansEnabled } = useHomeLayout();
  // Compra direto pelo card: abre o checkout já no pacote anunciado, sem
  // passar pela seção da calculadora.
  const [quickBuy, setQuickBuy] = useState<{ serviceId: string; packageId?: string } | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // "Comprar" num card do grid abre o checkout na hora, no pacote do card.
  const handleBuy = (s: ServiceItem, packageId?: string) => {
    setQuickBuy({ serviceId: s.id, packageId });
  };

  const list: ServiceItem[] = services || [];

  // Blocos ordenáveis. Ids que este tema não implementa (depoimentos, redes,
  // contato, newsletter, blog) simplesmente não entram no mapa e são pulados.
  const blocks: Record<string, ReactNode> = {
    'como-funciona': (
      <section id="como-funciona" className="py-[30px] md:py-[50px] lg:py-[90px]" style={{ background: 'var(--jap-surface-tint)' }}>
        <div className="max-w-[1320px] mx-auto px-6 lg:px-3">
          <h2 className="text-center font-bold" style={{ color: 'var(--jap-ink)', fontSize: 'clamp(24px, 3vw, 48px)', lineHeight: 1.2 }}>
            Como funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {STEPS.map((s, i) => (
              <div key={s.title} className="jap-card p-5 md:p-10">
                <span className="jap-tile text-lg font-bold">{i + 1}</span>
                <h3 className="font-bold text-xl mt-4" style={{ color: 'var(--jap-ink)' }}>{s.title}</h3>
                <p className="text-sm mt-2" style={{ color: 'var(--jap-body)' }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    servicos: <JapServicesGrid services={list} onBuy={handleBuy} />,

    calculadora: (
      <JapCalculator
        services={list}
        currentUser={currentUser}
        onAuthSuccess={onAuthSuccess}
        onOrderCreated={() => onAddSimulatedOrder?.({})}
      />
    ),

    planos: plansEnabled && plans && plans.length > 0 ? (
      <section id="planos" className="py-[30px] md:py-[50px] lg:py-[90px]">
        <div className="max-w-[1320px] mx-auto px-6 lg:px-3">
          <h2 className="text-center font-bold" style={{ color: 'var(--jap-ink)', fontSize: 'clamp(24px, 3vw, 48px)', lineHeight: 1.2 }}>
            Planos populares
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {plans.map((p: any) => (
              <div key={p.id} className="jap-card p-5 md:p-10">
                <h3 className="font-bold text-xl" style={{ color: 'var(--jap-ink)' }}>{p.name}</h3>
                <p className="text-3xl font-bold mt-3" style={{ color: 'var(--jap-orange-ink)' }}>
                  {Number(p.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                {Array.isArray(p.features) && (
                  <ul className="mt-4 space-y-2">
                    {p.features.map((f: string, i: number) => (
                      <li key={i} className="text-sm" style={{ color: 'var(--jap-body)' }}>• {f}</li>
                    ))}
                  </ul>
                )}
                <button onClick={() => scrollTo('calculadora')} className="jap-btn jap-btn-sm jap-btn-primary w-full mt-6">
                  Assinar
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    ) : null,

    faq: <JapFaq faqs={homeContent?.faqs || []} />
  };

  return (
    <div className="jap-page min-h-screen flex flex-col">
      <JapHeader siteName={siteName} logoUrl={logoUrl} currentUser={currentUser} onNavigate={scrollTo} />

      <main className="pt-[71px] md:pt-[91px] lg:pt-[111px] flex-1">
        {/* Hero */}
        <section id="inicio" className="py-[30px] md:py-[50px] lg:py-[90px]">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-3 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="font-bold" style={{ color: 'var(--jap-ink)', fontSize: 'clamp(26px, 4vw, 55px)', lineHeight: 1.2 }}>
                {homeContent?.heroTitle || 'Impulsione suas redes sociais com entrega real e segura'}
              </h1>
              <p className="mt-5" style={{ color: 'var(--jap-body)', fontSize: 'clamp(20px, 2vw, 32px)', fontWeight: 300, lineHeight: 1.2 }}>
                {homeContent?.heroSubtitle || 'Seguidores, curtidas e visualizações com processamento automático e suporte brasileiro.'}
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <button onClick={() => scrollTo('calculadora')} className="jap-btn jap-btn-primary">Começar agora</button>
                <button onClick={() => scrollTo('servicos')} className="jap-btn jap-btn-outline">Ver serviços</button>
              </div>
            </div>

            <div className="jap-card p-8 grid grid-cols-3 gap-4 text-center">
              {[
                { icon: <Zap className="h-6 w-6" />, label: 'Início rápido' },
                { icon: <ShieldCheck className="h-6 w-6" />, label: 'Reposição 30 dias' },
                { icon: <Users className="h-6 w-6" />, label: 'Perfis reais' }
              ].map(f => (
                <div key={f.label} className="flex flex-col items-center gap-3">
                  <span className="jap-tile">{f.icon}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--jap-ink)' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Faixa de estatísticas */}
        <section className="pb-[30px] md:pb-[50px] lg:pb-[90px]">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              { n: `${list.length || '—'}`, l: 'Serviços disponíveis' },
              { n: '24/7', l: 'Processamento automático' },
              { n: '30 dias', l: 'Garantia de reposição' }
            ].map(s => (
              <div key={s.l} className="rounded-2xl p-8 text-center" style={{ background: 'var(--jap-orange-ink)' }}>
                <p className="text-3xl font-bold text-white">{s.n}</p>
                <p className="text-xl font-light text-white/90 mt-2">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Checkout da compra rápida: só o modal, remontado a cada clique. */}
        {quickBuy && (
          <div key={`${quickBuy.serviceId}:${quickBuy.packageId || ''}`}>
          <JapCalculator
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

        {/* Seções ordenáveis pelo painel */}
        {orderedSections(order, blocks).map(s => (
          <Fragment key={s.id}>{s.node}</Fragment>
        ))}
      </main>

      <JapFooter siteName={siteName} logoUrl={logoUrl} company={company} onNavigate={scrollTo} />
    </div>
  );
}
