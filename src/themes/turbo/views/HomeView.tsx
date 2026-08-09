// Home do tema "Turbo".
//
// Segue a ordem de seções da referência — herói com palavra rotativa sobre o
// gradiente, seletor de redes, "como funciona" em quatro cards, vantagens em
// carrossel, depoimentos, grid de redes, chamada do blog, faixa verde só no
// mobile e FAQ —, acrescentando o grid de serviços e a calculadora, que a
// referência não tem em lugar nenhum público e que são o miolo do nosso site.

import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ThemeHomeProps } from '../../types';
import { orderedSections, useHomeLayout } from '../../../site/homeSections';
import { ServiceItem, SocialPlatform } from '../../../types';
import { platformsWithServices, useCatalog } from '../../../utils/catalog';
import { TestimonialItem, fetchTestimonials } from '../../../utils/storage';
import TurboHeader from '../chrome/Header';
import TurboFooter from '../chrome/Footer';
import TurboFab from '../chrome/Fab';
import TurboSocialRail from '../chrome/SocialRail';
import PlatformIcon, { platformGradient } from '../chrome/PlatformIcon';
import TurboServicesGrid from '../sections/ServicesGrid';
import TurboCalculator from '../sections/Calculator';
import TurboFaq from '../sections/Faq';
import { ChevronLeft, ChevronRight, Clock, CreditCard, Headphones, RefreshCw, ShieldCheck, Star, Zap } from 'lucide-react';

const ROTATING = ['seguidores', 'curtidas', 'visualizações', 'resultados'];

const STEPS = [
  { title: 'Escolha a rede', text: 'Instagram, TikTok, YouTube e mais. Selecione onde você quer crescer.' },
  { title: 'Selecione o serviço', text: 'Seguidores, curtidas ou visualizações, na quantidade que precisar.' },
  { title: 'Informe o perfil', text: 'Cole o seu @ ou o link da publicação. Nunca pedimos a sua senha.' },
  { title: 'Pague com PIX', text: 'Aprovação instantânea e processamento logo em seguida.' }
];

const PERKS = [
  { icon: <Zap className="h-5 w-5" />, title: 'Início imediato', text: 'O processamento começa assim que o pagamento é aprovado.' },
  { icon: <ShieldCheck className="h-5 w-5" />, title: 'Sem pedir senha', text: 'Só precisamos do seu @ ou do link do post. Nada além disso.' },
  { icon: <RefreshCw className="h-5 w-5" />, title: 'Reposição 30 dias', text: 'Houve queda no período? Repomos sem custo adicional.' },
  { icon: <CreditCard className="h-5 w-5" />, title: 'PIX aprovado na hora', text: 'Pagamento instantâneo, sem cadastro de cartão.' },
  { icon: <Clock className="h-5 w-5" />, title: 'Acompanhe pelo painel', text: 'Do envio à conclusão, o andamento fica visível para você.' },
  { icon: <Headphones className="h-5 w-5" />, title: 'Suporte brasileiro', text: 'Atendimento em português, por quem conhece o serviço.' }
];

export default function TurboHomeView({
  services, plans, homeContent, company, siteName, logoUrl, currentUser, onAuthSuccess, onAddSimulatedOrder
}: ThemeHomeProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [quickBuy, setQuickBuy] = useState<{ serviceId: string; packageId?: string } | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const perkRail = useRef<HTMLDivElement>(null);
  const voiceRail = useRef<HTMLDivElement>(null);
  // Ordem das seções e visibilidade dos planos vêm do painel.
  const { order, plansEnabled } = useHomeLayout();

  const list: ServiceItem[] = services || [];

  // O mega-menu do header aponta para /?rede=<id> quando o clique vem de fora
  // da home; aqui a rede vira o filtro inicial do grid.
  const requested = searchParams.get('rede') as SocialPlatform | null;
  const [platform, setPlatform] = useState<SocialPlatform | 'todos'>(requested || 'todos');
  useEffect(() => { if (requested) setPlatform(requested); }, [requested]);

  // Palavra âmbar rotativa do herói.
  useEffect(() => {
    const t = setInterval(() => setWordIndex(i => (i + 1) % ROTATING.length), 2600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    fetchTestimonials().then(t => { if (active) setTestimonials(t.slice(0, 12)); });
    return () => { active = false; };
  }, []);

  const catalog = useCatalog();
  const availablePlatforms = useMemo(
    () => platformsWithServices(catalog, list),
    [catalog, list]
  );

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBuy = (s: ServiceItem, packageId?: string) => setQuickBuy({ serviceId: s.id, packageId });

  const pickPlatform = (id: SocialPlatform) => { setPlatform(id); scrollTo('servicos'); };

  const heroTitle = homeContent?.heroTitle || 'Impulsione suas redes sociais';

  // Blocos ordenáveis. Ids que este tema não implementa (contato, newsletter)
  // não entram no mapa e são pulados; depoimentos e planos somem sozinhos
  // quando o painel não tem o que mostrar.
  const blocks: Record<string, ReactNode> = {
    servicos: (
      <TurboServicesGrid
        services={list}
        platform={platform}
        onPlatformChange={setPlatform}
        onBuy={handleBuy}
      />
    ),

    calculadora: (
      <TurboCalculator
        services={list}
        currentUser={currentUser}
        onAuthSuccess={onAuthSuccess}
        onOrderCreated={() => onAddSimulatedOrder?.({})}
      />
    ),

    /* Como funciona — quatro cards, o primeiro no estado ativo #E1D9F5 */
    'como-funciona': (
      <section id="como-funciona" className="tb-wrap py-12 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="tb-kicker">Passo a passo</span>
          <h2 className="tb-title mt-2.5">Como funciona</h2>
          <p className="tb-lead mt-3.5">Quatro passos, sem burocracia e sem pedir a sua senha.</p>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="tb-card p-6"
              style={i === 0 ? { background: 'var(--tb-active)' } : undefined}
            >
              <span
                className="w-11 h-11 rounded-full grid place-items-center font-black text-white"
                style={{ background: i === 0 ? 'var(--tb-brand)' : 'var(--tb-grad-brand)' }}
              >
                {i + 1}
              </span>
              <h3 className="text-lg font-black mt-4" style={{ color: 'var(--tb-ink)' }}>{s.title}</h3>
              <p className="mt-2 text-[15px]" style={{ color: 'var(--tb-body)', lineHeight: 1.6 }}>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    ),

    /* Vantagens em carrossel */
    beneficios: (
      <section id="vantagens" className="tb-wrap py-12 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <span className="tb-kicker">Vantagens</span>
            <h2 className="tb-title mt-2.5">Por que comprar com a gente</h2>
          </div>
          <div className="flex gap-2.5">
            <button className="tb-arrow" aria-label="Vantagem anterior" onClick={() => perkRail.current?.scrollBy({ left: -320, behavior: 'smooth' })}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="tb-arrow" aria-label="Próxima vantagem" onClick={() => perkRail.current?.scrollBy({ left: 320, behavior: 'smooth' })}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div ref={perkRail} className="tb-rail mt-8">
          {PERKS.map(p => (
            <article key={p.title} className="tb-card p-6 shrink-0" style={{ width: 300 }}>
              <span className="w-11 h-11 rounded-full grid place-items-center text-white" style={{ background: 'var(--tb-grad-brand)' }}>
                {p.icon}
              </span>
              <h3 className="text-lg font-black mt-4" style={{ color: 'var(--tb-ink)' }}>{p.title}</h3>
              <p className="mt-2 text-[15px]" style={{ color: 'var(--tb-body)', lineHeight: 1.6 }}>{p.text}</p>
            </article>
          ))}
        </div>
      </section>
    ),

    /* Planos, quando o painel os habilita */
    planos: plansEnabled && plans && plans.length > 0 ? (
      <section id="planos" className="tb-wrap py-12 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="tb-kicker">Assinaturas</span>
          <h2 className="tb-title mt-2.5">Planos populares</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {plans.map((p: any) => (
            <div key={p.id} className="tb-card p-7">
              <h3 className="text-[22px] font-black" style={{ color: 'var(--tb-ink)' }}>{p.name}</h3>
              <p className="text-[32px] font-black mt-3" style={{ color: 'var(--tb-brand)' }}>
                {Number(p.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              {Array.isArray(p.features) && (
                <ul className="mt-4 space-y-2" style={{ color: 'var(--tb-body)' }}>
                  {p.features.map((f: string, i: number) => <li key={i}>• {f}</li>)}
                </ul>
              )}
              <button onClick={() => scrollTo('calculadora')} className="tb-btn w-full mt-6">Assinar</button>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    /* Depoimentos em carrossel — some quando o painel não aprovou nenhum */
    depoimentos: testimonials.length > 0 ? (
      <section className="tb-wrap py-12 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <span className="tb-kicker">Depoimentos</span>
            <h2 className="tb-title mt-2.5">Quem já comprou</h2>
          </div>
          <div className="flex gap-2.5">
            <button className="tb-arrow" aria-label="Depoimento anterior" onClick={() => voiceRail.current?.scrollBy({ left: -340, behavior: 'smooth' })}>
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="tb-arrow" aria-label="Próximo depoimento" onClick={() => voiceRail.current?.scrollBy({ left: 340, behavior: 'smooth' })}>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div ref={voiceRail} className="tb-rail mt-8">
          {testimonials.map(t => (
            <figure key={t.id} className="tb-card p-6 shrink-0" style={{ width: 320 }}>
              <div className="flex items-center gap-1" aria-label={`Nota ${t.rating} de 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4"
                    aria-hidden="true"
                    style={{ color: i < t.rating ? 'var(--tb-amber)' : 'var(--tb-line)' }}
                    fill={i < t.rating ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <blockquote className="mt-3.5 text-[15px]" style={{ color: 'var(--tb-body)', lineHeight: 1.6 }}>{t.text}</blockquote>
              <figcaption className="flex items-center gap-3 mt-5">
                {t.avatar
                  ? <img src={t.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  : <span className="w-10 h-10 rounded-full grid place-items-center font-black text-white" style={{ background: 'var(--tb-grad-brand)' }}>{t.name.charAt(0)}</span>}
                <span>
                  <span className="block font-black" style={{ color: 'var(--tb-ink)' }}>{t.name}</span>
                  <span className="block text-sm" style={{ color: 'var(--tb-muted)' }}>{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    ) : null,

    /* Grid de redes — atalho visual para o catálogo */
    redes: availablePlatforms.length > 0 ? (
      <section className="tb-wrap py-12 md:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="tb-kicker">Redes atendidas</span>
          <h2 className="tb-title mt-2.5">Crescimento em todas as suas redes</h2>
          <p className="tb-lead mt-3.5">Clique na rede para ver os serviços disponíveis.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-10">
          {availablePlatforms.map(p => (
            <button
              key={p.id}
              onClick={() => pickPlatform(p.id)}
              className="tb-card-sm p-5 flex flex-col items-center gap-3 cursor-pointer transition-transform hover:-translate-y-1"
            >
              <span className="w-14 h-14 rounded-full grid place-items-center text-white" style={{ background: platformGradient(p.id) }}>
                <PlatformIcon item={p} />
              </span>
              <span className="font-black text-sm" style={{ color: 'var(--tb-ink)' }}>{p.name}</span>
            </button>
          ))}
        </div>
      </section>
    ) : null,

    /* Chamada do blog */
    blog: (
      <section className="tb-wrap py-6 md:py-12">
        <div className="tb-card p-8 md:p-12 text-center" style={{ background: 'var(--tb-grad-brand)' }}>
          <span className="tb-kicker" style={{ color: 'var(--tb-amber-2)' }}>Conteúdo</span>
          <h2 className="tb-title mt-2.5" style={{ color: '#fff' }}>Aprenda a crescer sem depender de sorte</h2>
          <p className="tb-lead mt-3.5 mx-auto" style={{ color: 'rgba(255,255,255,.86)', maxWidth: 620 }}>
            Estratégias, testes e bastidores de quem trabalha com engajamento todos os dias.
          </p>
          <button onClick={() => navigate('/blog')} className="tb-btn tb-btn-amber mt-7">Ler o blog</button>
        </div>
      </section>
    ),

    faq: <TurboFaq faqs={homeContent?.faqs || []} />
  };


  return (
    <div className="tb-page min-h-screen flex flex-col">
      {/* Faixa de gradiente que abriga topbar, header e herói. */}
      <div className="tb-hero-grad">
        <TurboHeader
          siteName={siteName}
          logoUrl={logoUrl}
          currentUser={currentUser}
          onNavigate={scrollTo}
          platforms={availablePlatforms.map(p => p.id)}
          contactEmail={company?.contactEmail || homeContent?.companyEmail}
          onSelectPlatform={pickPlatform}
        />

        <section id="inicio" className="tb-wrap pt-12 pb-20 md:pb-28 text-center">
          {homeContent?.alertBannerText && (
            <span
              className="inline-block px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-full"
              style={{ background: 'var(--tb-grad-amber)', color: 'var(--tb-ink)' }}
            >
              {homeContent.alertBannerText}
            </span>
          )}

          <h1 className="tb-title mt-5 mx-auto" style={{ maxWidth: 900, fontSize: 'clamp(34px, 5.6vw, 64px)' }}>
            {heroTitle}
            <br className="hidden sm:block" />
            <span className="tb-amber-word"> com {ROTATING[wordIndex]} de verdade</span>
          </h1>

          <p className="tb-lead mx-auto mt-5" style={{ maxWidth: 660, fontSize: 18 }}>
            {homeContent?.heroSubtitle
              || 'Entrega automática, pagamento por PIX, reposição garantida e suporte brasileiro do início ao fim.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-9">
            <button onClick={() => scrollTo('servicos')} className="tb-btn tb-btn-amber">Ver serviços</button>
            <button onClick={() => scrollTo('calculadora')} className="tb-btn tb-btn-ghost">Simular pedido</button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 mt-9 text-sm font-black" style={{ color: 'rgba(255,255,255,.92)' }}>
            <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4" /> Início imediato</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Reposição por 30 dias</span>
            <span className="inline-flex items-center gap-2"><CreditCard className="h-4 w-4" /> PIX aprovado na hora</span>
          </div>
        </section>
      </div>

      <main className="flex-1">
        {/* Checkout da compra rápida: só o modal, remontado a cada clique. */}
        {quickBuy && (
          <div key={`${quickBuy.serviceId}:${quickBuy.packageId || ''}`}>
            <TurboCalculator
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

        {/* Faixa verde de reputação — só no mobile, como na referência */}
        <div className="md:hidden px-4 pb-2">
          <div
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-black text-white"
            style={{ background: 'var(--tb-success)', borderRadius: 'var(--tb-r-pill)' }}
          >
            <ShieldCheck className="h-4 w-4" /> Compra 100% segura · reposição garantida
          </div>
        </div>

      </main>

      <TurboFooter siteName={siteName} logoUrl={logoUrl} company={company} onNavigate={scrollTo} />
      <TurboSocialRail company={company} />
      <TurboFab company={company} />
    </div>
  );
}
