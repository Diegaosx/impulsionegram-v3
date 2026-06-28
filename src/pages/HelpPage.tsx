import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWidgets from '../components/FloatingWidgets';
import CookieConsent from '../components/CookieConsent';
import HelpForm from '../components/HelpForm';
import { HomeContent, CompanySettings } from '../utils/storage';
import { LifeBuoy } from 'lucide-react';

interface HelpPageProps {
  homeContent: HomeContent | null;
  company?: CompanySettings | null;
  siteName?: string;
  logoUrl?: string;
}

export default function HelpPage({ homeContent, company, siteName, logoUrl }: HelpPageProps) {
  const navigate = useNavigate();

  const goHome = (sectionId: string) => {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      <Header
        onNavigate={goHome}
        cartCount={0}
        onOpenCart={() => goHome('calculadora')}
        onSearch={() => {}}
        onOpenAdmin={() => navigate('/login')}
        siteName={siteName}
        logoUrl={logoUrl}
      />

      <main className="pt-32 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase font-black bg-purple-50 border border-primary/20 text-primary px-3 py-1.5 rounded-full tracking-wider">
              <LifeBuoy className="h-3.5 w-3.5" /> Central de Ajuda
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight mt-4">Como podemos ajudar?</h1>
            <p className="text-slate-500 mt-3 text-sm font-semibold max-w-xl mx-auto">
              Tire suas dúvidas, fale com o suporte ou envie uma mensagem. Respondemos o quanto antes.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <HelpForm homeContent={homeContent} company={company} onGoFaq={() => goHome('faq')} />
          </div>
        </div>
      </main>

      <Footer onNavigate={goHome} onSetPlatformFilter={() => goHome('servicos')} siteName={siteName} company={company} />
      <FloatingWidgets onNavigate={goHome} ordersCalculatedStat={0} homeContent={homeContent} company={company} />
      <CookieConsent />
    </div>
  );
}
