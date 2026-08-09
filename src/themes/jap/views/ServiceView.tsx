// Página de serviço do tema "Painel".
//
// SEO e dados estruturados continuam sendo responsabilidade compartilhada
// (utils/seo), não do tema — o tema só decide a marcação.

import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ThemeServiceProps } from '../../types';
import { platformName as catalogPlatformName, serviceTypeLabel, useCatalog } from '../../../utils/catalog';
import { serviceSlug } from '../../../utils/storage';
import { applyBasicSEO, setJsonLd } from '../../../utils/seo';
import ServiceReviews from '../../../components/ServiceReviews';
import { sellablePackages } from '../../../site/pricing';
import JapHeader from '../chrome/Header';
import JapFooter from '../chrome/Footer';
import JapCalculator from '../sections/Calculator';
import JapFaq from '../sections/Faq';
import { Check } from 'lucide-react';

export default function JapServiceView({
  services, homeContent, company, siteName, logoUrl, currentUser, servicesLoaded, onAuthSuccess, onAddSimulatedOrder
}: ThemeServiceProps) {
  const navigate = useNavigate();
  const catalog = useCatalog();
  const { slug } = useParams<{ slug: string }>();
  // ?pacote=<id> vem dos cards do grid, para a calculadora abrir já no pacote
  // que o cliente clicou na home.
  const [searchParams] = useSearchParams();
  const initialPackageId = searchParams.get('pacote') || undefined;

  const service = useMemo(
    () => services.find(s => serviceSlug(s) === slug || s.id === slug),
    [services, slug]
  );

  const brand = siteName || 'ImpulsioneGram';
  const platformName = service ? catalogPlatformName(catalog, service.platform) : '';
  const pageTitle = (service?.pageTitle || '').trim() || service?.label || '';
  const subtitle = service
    ? ((service.pageSubtitle || '').trim()
      || `Impulsione seu perfil no ${platformName} com ${serviceTypeLabel(catalog, service.type).toLowerCase()} de alta qualidade.`)
    : '';
  const metaDescription = service ? ((service.pageMetaDescription || '').trim() || subtitle) : '';
  const image = service?.pageImageUrl?.trim() || '';
  const faqs = useMemo(() => (service?.faqs || []).filter(f => f.question && f.answer), [service]);

  useEffect(() => {
    if (!service) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const canonical = `${origin}/servico/${serviceSlug(service)}`;
    applyBasicSEO({ title: `${pageTitle}${brand ? ' | ' + brand : ''}`, description: metaDescription, canonical, brand, image: image || undefined, type: 'product', keywords: service.pageKeywords });

    const pkgs = sellablePackages(service).map(p => p.price);
    const lowest = pkgs.length ? Math.min(...pkgs) : Math.round(service.pricePerItem * (service.minQuantity || 1000) * 100) / 100;

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
      <div className="jap-page min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--jap-orange)' }} />
      </div>
    );
  }
  if (!service) return <Navigate to="/" replace />;

  const hasDescription = !!(service.pageDescriptionHtml && service.pageDescriptionHtml.trim());

  return (
    <div className="jap-page min-h-screen flex flex-col">
      <JapHeader siteName={siteName} logoUrl={logoUrl} currentUser={currentUser} onNavigate={goHome} />

      <main className="pt-[71px] md:pt-[91px] lg:pt-[111px] flex-1">
        <section className="py-[30px] md:py-[50px] lg:py-[70px]">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-3 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="jap-chip" aria-hidden="true">{platformName}</span>
                <span className="jap-chip" aria-hidden="true">{serviceTypeLabel(catalog, service.type)}</span>
              </div>

              <h1 className="font-bold mt-5" style={{ color: 'var(--jap-ink)', fontSize: 'clamp(26px, 4vw, 55px)', lineHeight: 1.2 }}>
                {pageTitle}
              </h1>
              <p className="mt-4 text-base" style={{ color: 'var(--jap-body)' }}>{subtitle}</p>

              {image && (
                <img src={image} alt={pageTitle} loading="eager"
                  className="mt-7 w-full rounded-2xl object-cover aspect-video" style={{ boxShadow: 'var(--jap-shadow-card)' }} />
              )}

              {service.benefits?.length > 0 && (
                <ul className="mt-7 space-y-2.5">
                  {service.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-base" style={{ color: 'var(--jap-body)' }}>
                      <Check className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--jap-success)' }} /> {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <JapCalculator
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
          <section className="py-[30px] md:py-[50px]" style={{ background: 'var(--jap-surface-tint)' }}>
            <div className="max-w-[1320px] mx-auto px-6 lg:px-3">
              <div className="jap-card p-5 md:p-10">
                <div className="blog-content" dangerouslySetInnerHTML={{ __html: service.pageDescriptionHtml as string }} />
              </div>
            </div>
          </section>
        )}

        <JapFaq
          faqs={faqs}
          title={(service.faqTitle || '').trim() || 'Perguntas frequentes'}
          subtitle={(service.faqSubtitle || '').trim() || undefined}
        />

        {/* Avaliações de quem comprou este serviço. */}
        <section className="py-[30px] md:py-[50px]">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-3">
            <ServiceReviews serviceId={service.id} cardClassName="jap-card" />
          </div>
        </section>
      </main>

      <JapFooter siteName={siteName} logoUrl={logoUrl} company={company} onNavigate={goHome} />
    </div>
  );
}
