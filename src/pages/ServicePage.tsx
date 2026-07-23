import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWidgets from '../components/FloatingWidgets';
import CookieConsent from '../components/CookieConsent';
import InteractiveCalculator from '../components/InteractiveCalculator';
import { SOCIAL_PLATFORMS } from '../data';
import { ServiceItem } from '../types';
import { AuthUser, HomeContent, CompanySettings, serviceSlug } from '../utils/storage';
import { applyBasicSEO, setJsonLd } from '../utils/seo';
import { Check, ShieldCheck, Zap, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ServicePageProps {
  services: ServiceItem[];
  homeContent: HomeContent | null;
  company?: CompanySettings | null;
  siteName?: string;
  logoUrl?: string;
  currentUser?: AuthUser | null;
  onAuthSuccess?: (user: AuthUser) => void;
  onAddSimulatedOrder?: (order: any) => void;
}

const TYPE_LABEL: Record<string, string> = {
  followers: 'Seguidores',
  likes: 'Curtidas',
  views: 'Visualizações',
  comments: 'Comentários',
  stories: 'Views Stories'
};

export default function ServicePage({ services, homeContent, company, siteName, logoUrl, currentUser, onAuthSuccess, onAddSimulatedOrder }: ServicePageProps) {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Match by explicit/derived slug or by id (so links work even before an
  // admin sets a custom slug).
  const service = useMemo(
    () => services.find((s) => serviceSlug(s) === slug || s.id === slug),
    [services, slug]
  );

  const brand = siteName || 'ImpulsioneGram';
  const platformName = service ? (SOCIAL_PLATFORMS.find((p) => p.id === service.platform)?.name || service.platform) : '';
  const pageTitle = (service?.pageTitle || '').trim() || service?.label || '';
  const subtitle = service
    ? ((service.pageSubtitle || '').trim()
      || `Impulsione seu perfil no ${platformName} com ${(TYPE_LABEL[service.type] || 'engajamento').toLowerCase()} de alta qualidade, entrega segura e reposição garantida.`)
    : '';
  const metaDescription = service ? ((service.pageMetaDescription || '').trim() || subtitle) : '';
  const image = service?.pageImageUrl?.trim() || '';
  const faqs = useMemo(() => (service?.faqs || []).filter((f) => f.question && f.answer), [service]);
  const faqTitle = (service?.faqTitle || '').trim() || 'Perguntas Frequentes';
  const faqSubtitle = (service?.faqSubtitle || '').trim();

  // SEO: title, meta description, canonical, Open Graph + JSON-LD (Product,
  // FAQPage and BreadcrumbList rich snippets).
  useEffect(() => {
    if (!service) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const canonical = `${origin}/servico/${serviceSlug(service)}`;

    applyBasicSEO({
      title: `${pageTitle}${brand ? ' | ' + brand : ''}`,
      description: metaDescription,
      canonical,
      brand,
      image: image || undefined,
      type: 'product'
    });

    const prices = (service.packages || []).map((p) => p.price).filter((n) => n > 0);
    const lowestPrice = prices.length
      ? Math.min(...prices)
      : Math.round(service.pricePerItem * (service.minQuantity || 1000) * 100) / 100;

    setJsonLd('service-product', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: pageTitle,
      description: metaDescription,
      ...(image ? { image: [image] } : {}),
      brand: { '@type': 'Brand', name: brand },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'BRL',
        price: lowestPrice.toFixed(2),
        availability: 'https://schema.org/InStock',
        url: canonical
      }
    });

    setJsonLd('service-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Serviços', item: `${origin}/#servicos` },
        { '@type': 'ListItem', position: 3, name: pageTitle, item: canonical }
      ]
    });

    setJsonLd('service-faq', faqs.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer }
          }))
        }
      : null);

    return () => {
      setJsonLd('service-product', null);
      setJsonLd('service-breadcrumb', null);
      setJsonLd('service-faq', null);
    };
  }, [service, pageTitle, metaDescription, image, brand, faqs]);

  const goHome = (sectionId: string) => {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  // Services still loading → wait; loaded but not found → back to home.
  if (services.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!service) return <Navigate to="/" replace />;

  const hasDescription = !!(service.pageDescriptionHtml && service.pageDescriptionHtml.trim());

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      <Header
        onNavigate={goHome}
        cartCount={0}
        onOpenCart={() => goHome('servicos')}
        onSearch={() => {}}
        onOpenAdmin={() => navigate('/login')}
        siteName={siteName}
        logoUrl={logoUrl}
      />

      <main className="pt-28 sm:pt-32 pb-20">
        {/* Split hero: title/subtitle on the left, calculator on the right */}
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 bg-slate-900 text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded">
                  {platformName}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white border border-slate-200 px-2 py-1 rounded">
                  {TYPE_LABEL[service.type] || service.type}
                </span>
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight leading-tight">
                {pageTitle}
              </h1>
              <p className="text-slate-500 mt-4 text-sm sm:text-base font-semibold leading-relaxed max-w-lg">
                {subtitle}
              </p>

              {image && (
                <img
                  src={image}
                  alt={pageTitle}
                  loading="eager"
                  className="mt-6 w-full max-w-lg rounded-2xl border border-slate-200 object-cover aspect-video shadow-sm"
                />
              )}

              {service.benefits && service.benefits.length > 0 && (
                <ul className="mt-6 space-y-2.5">
                  {service.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-semibold">
                      <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> {b}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-accent" /> Início rápido</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-green-500" /> Reposição por 30 dias</span>
              </div>
            </div>

            {/* Calculator limited to this single service */}
            <div>
              <InteractiveCalculator
                services={services}
                restrictServiceId={service.id}
                embedded
                onAddOrderToStats={() => {}}
                onAddSimulatedOrder={onAddSimulatedOrder}
                currentUser={currentUser}
                onAuthSuccess={onAuthSuccess}
              />
            </div>
          </div>
        </section>

        {/* Rich description below the hero */}
        {hasDescription && (
          <section className="px-4 sm:px-6 lg:px-8 mt-14">
            <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm">
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: service.pageDescriptionHtml as string }} />
            </div>
          </section>
        )}

        {/* Per-service FAQ (also emitted as FAQPage structured data) */}
        {faqs.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 mt-14">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-1.5 text-xs uppercase font-black bg-purple-50 border border-primary/20 text-primary px-3 py-1.5 rounded-full tracking-wider">
                  <HelpCircle className="h-3.5 w-3.5" /> FAQ
                </span>
                <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight mt-4">{faqTitle}</h2>
                {faqSubtitle && <p className="text-slate-500 mt-2 text-sm font-semibold max-w-xl mx-auto">{faqSubtitle}</p>}
              </div>
              <div className="space-y-3">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div key={faq.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${isOpen ? 'border-primary' : 'border-slate-200'}`}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full flex justify-between items-center gap-4 p-4 text-left font-display font-bold text-slate-800 text-sm cursor-pointer"
                      >
                        <span className="flex items-start gap-2.5">
                          <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <span>{faq.question}</span>
                        </span>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-primary shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-0 text-slate-500 text-sm leading-relaxed font-semibold whitespace-pre-line">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer onNavigate={goHome} onSetPlatformFilter={() => goHome('servicos')} siteName={siteName} company={company} />
      <FloatingWidgets onNavigate={goHome} ordersCalculatedStat={0} homeContent={homeContent} company={company} />
      <CookieConsent />
    </div>
  );
}
