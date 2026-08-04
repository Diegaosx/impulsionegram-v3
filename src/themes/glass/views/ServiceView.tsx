// Página de serviço do tema "Cristal".
//
// SEO e dados estruturados continuam sendo responsabilidade compartilhada
// (utils/seo) — o tema só decide a marcação.

import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ThemeServiceProps } from '../../types';
import { SOCIAL_PLATFORMS } from '../../../data';
import { serviceSlug } from '../../../utils/storage';
import { applyBasicSEO, setJsonLd } from '../../../utils/seo';
import { sellablePackages } from '../../../site/pricing';
import GlassHeader from '../chrome/Header';
import GlassFooter from '../chrome/Footer';
import GlassFab from '../chrome/Fab';
import GlassCalculator from '../sections/Calculator';
import GlassFaq from '../sections/Faq';
import { Check } from 'lucide-react';

const TYPE_LABEL: Record<string, string> = {
  followers: 'Seguidores', likes: 'Curtidas', views: 'Visualizações',
  comments: 'Comentários', stories: 'Views Stories'
};

export default function GlassServiceView({
  services, company, siteName, logoUrl, currentUser, onAuthSuccess, onAddSimulatedOrder
}: ThemeServiceProps) {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
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

  if (services.length === 0) {
    return (
      <div className="gl-page min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--gl-purple)' }} />
      </div>
    );
  }
  if (!service) return <Navigate to="/" replace />;

  const hasDescription = !!(service.pageDescriptionHtml && service.pageDescriptionHtml.trim());

  return (
    <div className="gl-page min-h-screen flex flex-col">
      <GlassHeader siteName={siteName} logoUrl={logoUrl} currentUser={currentUser} onNavigate={goHome} />

      <main className="flex-1">
        <section className="gl-wrap pt-12 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="gl-chip" aria-hidden="true">{platformName}</span>
                <span className="gl-chip" aria-hidden="true">{TYPE_LABEL[service.type] || service.type}</span>
              </div>

              <h1 className="font-bold mt-5" style={{ color: 'var(--gl-ink)', fontSize: 'clamp(34px, 4.5vw, 60px)', lineHeight: 1.05 }}>
                {pageTitle}
              </h1>
              <p className="mt-4 text-lg" style={{ color: 'var(--gl-body)', lineHeight: 1.55 }}>{subtitle}</p>

              {image && (
                <img
                  src={image}
                  alt={pageTitle}
                  loading="eager"
                  className="mt-7 w-full object-cover aspect-video"
                  style={{ borderRadius: 34, boxShadow: '0 30px 90px rgba(238,47,135,.24)' }}
                />
              )}

              {service.benefits?.length > 0 && (
                <ul className="mt-7 space-y-2.5">
                  {service.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-base" style={{ color: 'var(--gl-body)' }}>
                      <Check className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--gl-success)' }} /> {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <GlassCalculator
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
          <section className="gl-wrap py-8">
            <div className="gl-card p-6 md:p-10 max-w-[820px] mx-auto">
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: service.pageDescriptionHtml as string }} />
            </div>
          </section>
        )}

        <GlassFaq
          faqs={faqs}
          title={(service.faqTitle || '').trim() || undefined}
          subtitle={(service.faqSubtitle || '').trim() || undefined}
        />
      </main>

      <GlassFooter siteName={siteName} company={company} onNavigate={goHome} />
      <GlassFab company={company} />
    </div>
  );
}
