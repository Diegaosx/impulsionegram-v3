// Ajuda do tema "Turbo".
//
// A referência resolve atendimento só pelo FAB. Aqui o FAB continua, com os
// canais que o painel cadastrou, e a página traz também o formulário
// compartilhado e o acordeão de dúvidas.

import { useNavigate } from 'react-router-dom';
import { ThemeHelpProps } from '../../types';
import HelpForm from '../../../components/HelpForm';
import TurboHeader from '../chrome/Header';
import TurboFooter from '../chrome/Footer';
import TurboFab from '../chrome/Fab';
import TurboFaq from '../sections/Faq';

export default function TurboHelpView({ homeContent, company, siteName, logoUrl, currentUser }: ThemeHelpProps) {
  const navigate = useNavigate();

  const goHome = (sectionId: string) => {
    navigate('/');
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  return (
    <div className="tb-page min-h-screen flex flex-col">
      <div className="tb-hero-grad">
        <TurboHeader
          siteName={siteName}
          logoUrl={logoUrl}
          currentUser={currentUser}
          onNavigate={goHome}
          contactEmail={company?.contactEmail}
        />
        <div className="tb-wrap pt-8 pb-14">
          <span className="tb-kicker">Suporte</span>
          <h1 className="tb-title mt-2.5">Como podemos ajudar?</h1>
          <p className="tb-lead mt-4" style={{ maxWidth: 620, fontSize: 18 }}>
            Fale com a gente ou veja as dúvidas mais comuns logo abaixo.
          </p>
        </div>
      </div>

      <main className="flex-1">
        <section className="tb-wrap py-12 md:py-16">
          <div className="tb-card max-w-[860px] mx-auto p-6 md:p-10">
            <HelpForm homeContent={homeContent} company={company} onGoFaq={() => goHome('faq')} />
          </div>
        </section>

        <TurboFaq
          faqs={homeContent?.faqs || []}
          kicker="Central de ajuda"
          title="Dúvidas frequentes"
          subtitle="Talvez sua resposta já esteja aqui."
        />
      </main>

      <TurboFooter siteName={siteName} logoUrl={logoUrl} company={company} onNavigate={goHome} />
      <TurboFab company={company} />
    </div>
  );
}
