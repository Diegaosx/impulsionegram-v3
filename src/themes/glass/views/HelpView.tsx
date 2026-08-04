// Ajuda do tema "Cristal".
//
// A referência não tem formulário de contato — a única afordância é o botão
// flutuante. Aqui o FAB continua, mas há também o formulário compartilhado.

import { useNavigate } from 'react-router-dom';
import { ThemeHelpProps } from '../../types';
import HelpForm from '../../../components/HelpForm';
import GlassHeader from '../chrome/Header';
import GlassFooter from '../chrome/Footer';
import GlassFab from '../chrome/Fab';
import GlassFaq from '../sections/Faq';

export default function GlassHelpView({ homeContent, company, siteName, logoUrl, currentUser }: ThemeHelpProps) {
  const navigate = useNavigate();

  const goHome = (sectionId: string) => {
    navigate('/');
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  return (
    <div className="gl-page min-h-screen flex flex-col">
      <GlassHeader siteName={siteName} logoUrl={logoUrl} currentUser={currentUser} onNavigate={goHome} />

      <main className="flex-1">
        <section className="gl-wrap py-12 md:py-16">
          <h1 className="text-center font-bold" style={{ color: 'var(--gl-ink)', fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.1 }}>
            Como podemos <span className="gl-accent">ajudar</span>?
          </h1>
          <p className="text-center mt-3 text-lg mx-auto" style={{ maxWidth: 640, color: 'var(--gl-body)', lineHeight: 1.55 }}>
            Fale com a gente ou veja as dúvidas mais comuns abaixo.
          </p>

          <div className="gl-card max-w-[820px] mx-auto mt-9 p-6 md:p-10">
            <HelpForm homeContent={homeContent} company={company} onGoFaq={() => goHome('faq')} />
          </div>
        </section>

        <GlassFaq faqs={homeContent?.faqs || []} title="Dúvidas frequentes" subtitle="Talvez sua resposta já esteja aqui." />
      </main>

      <GlassFooter siteName={siteName} company={company} onNavigate={goHome} />
      <GlassFab company={company} />
    </div>
  );
}
