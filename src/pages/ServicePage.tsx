import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWidgets from '../components/FloatingWidgets';
import CookieConsent from '../components/CookieConsent';
import InteractiveCalculator from '../components/InteractiveCalculator';
import { SOCIAL_PLATFORMS } from '../data';
import { ServiceItem } from '../types';
import { AuthUser, HomeContent, CompanySettings, serviceSlug } from '../utils/storage';
import { Check, ShieldCheck, Zap } from 'lucide-react';

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

  // Match by explicit/derived slug or by id (so links work even before an
  // admin sets a custom slug).
  const service = useMemo(
    () => services.find((s) => serviceSlug(s) === slug || s.id === slug),
    [services, slug]
  );

  useEffect(() => {
    if (service) document.title = `${service.label}${siteName ? ' | ' + siteName : ''}`;
  }, [service, siteName]);

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

  const platformName = SOCIAL_PLATFORMS.find((p) => p.id === service.platform)?.name || service.platform;
  const subtitle = (service.pageSubtitle || '').trim()
    || `Impulsione seu perfil no ${platformName} com ${(TYPE_LABEL[service.type] || 'engajamento').toLowerCase()} de alta qualidade, entrega segura e reposição garantida.`;

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
                {service.label}
              </h1>
              <p className="text-slate-500 mt-4 text-sm sm:text-base font-semibold leading-relaxed max-w-lg">
                {subtitle}
              </p>

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
        {service.pageDescriptionHtml && service.pageDescriptionHtml.trim() && (
          <section className="px-4 sm:px-6 lg:px-8 mt-14">
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm">
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: service.pageDescriptionHtml }} />
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
