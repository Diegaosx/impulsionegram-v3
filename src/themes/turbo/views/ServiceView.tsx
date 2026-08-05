// Página de serviço do tema "Turbo".
//
// É aqui que a troca de tema por rede social acontece: a página inteira recebe
// --tb-grad-page com o gradiente da rede do serviço, e header, faixa do topo e
// setas dos carrosséis passam a usar essa cor sem nenhuma outra mudança.
//
// A ficha técnica usa o cartão branco de raio 30 com linhas de 56px — a peça
// mais próxima de uma tabela que a referência define.
//
// SEO e dados estruturados continuam sendo responsabilidade compartilhada
// (utils/seo); o tema só decide a marcação.

import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ThemeServiceProps } from '../../types';
import { SOCIAL_PLATFORMS } from '../../../data';
import { serviceSlug } from '../../../utils/storage';
import { applyBasicSEO, setJsonLd } from '../../../utils/seo';
import { sellablePackages } from '../../../site/pricing';
import TurboHeader from '../chrome/Header';
import TurboFooter from '../chrome/Footer';
import TurboFab from '../chrome/Fab';
import TurboSocialRail from '../chrome/SocialRail';
import PlatformIcon, { platformGradient } from '../chrome/PlatformIcon';
import TurboCalculator from '../sections/Calculator';
import TurboFaq from '../sections/Faq';
import { Check } from 'lucide-react';

const TYPE_LABEL: Record<string, string> = {
  followers: 'Seguidores', likes: 'Curtidas', views: 'Visualizações',
  comments: 'Comentários', stories: 'Views Stories'
};

export default function TurboServiceView({
  services, company, siteName, logoUrl, currentUser, servicesLoaded, onAuthSuccess, onAddSimulatedOrder
}: ThemeServiceProps) {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  // ?pacote=<id> vem dos cards do grid: a calculadora abre no pacote clicado.
  const [searchParams] = useSearchParams();
  const initialPackageId = searchParams.get('pacote') || undefined;

  const service = useMemo(
    () => services.find(s => serviceSlug(s) === slug || s.id === slug),
    [services, slug]
  );

  const brand = siteName || 'ImpulsioneGram';
  const platformName = service ? (SOCIAL_PLATFORMS.find(p => p.id === service.platform)?.name || service.platform) : '';
  const pageTitle = (service?.pageTitle || '').trim() || service?.label || '';
  const subtitle = service
    ? ((service.pageSubtitle || '').trim()
      || `Impulsione seu perfil no ${platformName} com ${(TYPE_LABEL[service.type] || 'engajamento').toLowerCase()} de alta qualidade.`)
    : '';
  const metaDescription = service ? ((service.pageMetaDescription || '').trim() || subtitle) : '';
  const image = service?.pageImageUrl?.trim() || '';
  const faqs = useMemo(() => (service?.faqs || []).filter(f => f.question && f.answer), [service]);

  useEffect(() => {
    if (!service) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const canonical = `${origin}/servico/${serviceSlug(service)}`;
    applyBasicSEO({ title: `${pageTitle}${brand ? ' | ' + brand : ''}`, description: metaDescription, canonical, brand, image: image || undefined, type: 'product' });

    const prices = sellablePackages(service).map(p => p.price);
    const lowest = prices.length ? Math.min(...prices) : Math.round(service.pricePerItem * (service.minQuantity || 1000) * 100) / 100;

    setJsonLd('service-product', {
      '@context': 'https://schema.org', '@type': 'Product', name: pageTitle, description: metaDescription,
      ...(image ? { image: [image] } : {}), brand: { '@type': 'Brand', name: brand },
      offers: { '@type': 'Offer', priceCurrency: 'BRL', price: lowest.toFixed(2), availability: 'https://schema.org/InStock', url: canonical }
    });
    setJsonLd('service-breadcrumb', {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Serviços', item: `${origin}/#servicos` },
        { '@type': 'ListItem', position: 3, name: pageTitle, item: canonical }
      ]
    });
    setJsonLd('service-faq', faqs.length ? {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } }))
    } : null);

    return () => {
      setJsonLd('service-product', null);
      setJsonLd('service-breadcrumb', null);
      setJsonLd('service-faq', null);
    };
  }, [service, pageTitle, metaDescription, image, brand, faqs]);

  const goHome = (sectionId: string) => {
    navigate('/');
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  if (!servicesLoaded && services.length === 0) {
    return (
      <div className="tb-page min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--tb-brand)' }} />
      </div>
    );
  }
  if (!service) return <Navigate to="/" replace />;

  const hasDescription = !!(service.pageDescriptionHtml && service.pageDescriptionHtml.trim());

  const specs = [
    { label: 'Rede social', value: platformName },
    { label: 'Serviço', value: TYPE_LABEL[service.type] || service.type },
    { label: 'Quantidade mínima', value: `${service.minQuantity?.toLocaleString('pt-BR')} un.` },
    { label: 'Quantidade máxima', value: `${service.maxQuantity?.toLocaleString('pt-BR')} un.` },
    { label: 'Entrega', value: service.deliverySpeed || 'Início imediato' },
    { label: 'Reposição', value: '30 dias sem custo adicional' },
    { label: 'Pagamento', value: 'PIX com aprovação instantânea' }
  ];

  return (
    // A rede do serviço define o gradiente de toda a página.
    <div className="tb-page min-h-screen flex flex-col" style={{ ['--tb-grad-page' as any]: platformGradient(service.platform) }}>
      <div className="tb-hero-grad">
        <TurboHeader
          siteName={siteName}
          logoUrl={logoUrl}
          currentUser={currentUser}
          onNavigate={goHome}
          platforms={SOCIAL_PLATFORMS.filter(p => services.some(s => s.platform === p.id)).map(p => p.id)}
          contactEmail={company?.contactEmail}
        />

        <div className="tb-wrap pt-10 pb-16 md:pb-24">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full grid place-items-center bg-white shrink-0" style={{ color: 'var(--tb-ink)' }}>
              <PlatformIcon id={service.platform} className="h-5 w-5" />
            </span>
            <span className="tb-kicker">{platformName} · {TYPE_LABEL[service.type] || service.type}</span>
          </div>

          <h1 className="tb-title mt-4" style={{ maxWidth: 820 }}>{pageTitle}</h1>
          <p className="tb-lead mt-4" style={{ maxWidth: 660, fontSize: 18 }}>{subtitle}</p>
        </div>
      </div>

      <main className="flex-1">
        <section className="tb-wrap py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              {image && (
                <img
                  src={image}
                  alt={pageTitle}
                  loading="eager"
                  className="w-full object-cover aspect-video"
                  style={{ borderRadius: 'var(--tb-r-card)', boxShadow: 'var(--tb-shadow)' }}
                />
              )}

              {service.benefits?.length > 0 && (
                <ul className={`space-y-2.5 ${image ? 'mt-7' : ''}`}>
                  {service.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-[15px]" style={{ color: 'var(--tb-body)' }}>
                      <Check className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--tb-success)' }} /> {b}
                    </li>
                  ))}
                </ul>
              )}

              {/* Ficha técnica: cartão branco, linhas de 56px, sem cabeçalho */}
              <div className="tb-card mt-8 overflow-hidden">
                {specs.map((row, i) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 px-6"
                    style={{ height: 56, borderTop: i === 0 ? 'none' : '1px solid var(--tb-line)' }}
                  >
                    <span className="text-sm font-bold" style={{ color: 'var(--tb-muted)' }}>{row.label}</span>
                    <span className="text-sm font-black text-right" style={{ color: 'var(--tb-ink)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <TurboCalculator
              services={services}
              restrictServiceId={service.id}
              initialPackageId={initialPackageId}
              embedded
              currentUser={currentUser}
              onAuthSuccess={onAuthSuccess}
              onOrderCreated={() => onAddSimulatedOrder?.({})}
            />
          </div>
        </section>

        {hasDescription && (
          <section className="tb-wrap pb-12 md:pb-16">
            <div className="tb-card p-6 md:p-10">
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: service.pageDescriptionHtml as string }} />
            </div>
          </section>
        )}

        <TurboFaq
          faqs={faqs}
          title={(service.faqTitle || '').trim() || undefined}
          subtitle={(service.faqSubtitle || '').trim() || undefined}
        />
      </main>

      <TurboFooter siteName={siteName} logoUrl={logoUrl} company={company} onNavigate={goHome} />
      <TurboSocialRail company={company} />
      <TurboFab company={company} />
    </div>
  );
}
