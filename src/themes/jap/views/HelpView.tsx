// Página de ajuda no padrão de painel azul-bebê.
//
// O formulário em si é o HelpForm compartilhado — ele também é usado pela área
// do cliente, então continua em src/components e não pertence a nenhum tema.

import { useNavigate } from 'react-router-dom';
import { ThemeHelpProps } from '../../types';
import HelpForm from '../../../components/HelpForm';
import JapHeader from '../chrome/Header';
import JapFooter from '../chrome/Footer';
import JapFaq from '../sections/Faq';

export default function JapHelpView({ homeContent, company, siteName, logoUrl, currentUser }: ThemeHelpProps) {
  const navigate = useNavigate();

  const goHome = (sectionId: string) => {
    navigate('/');
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  return (
    <div className="jap-page min-h-screen flex flex-col">
      <JapHeader siteName={siteName} logoUrl={logoUrl} currentUser={currentUser} onNavigate={goHome} />

      <main className="pt-[71px] md:pt-[91px] lg:pt-[111px] flex-1">
        <section className="py-[30px] md:py-[50px] lg:py-[90px]">
          <div className="max-w-[960px] mx-auto px-6 lg:px-3">
            <h1 className="text-center font-bold" style={{ color: 'var(--jap-ink)', fontSize: 'clamp(24px, 3vw, 48px)', lineHeight: 1.2 }}>
              Como podemos ajudar?
            </h1>
            <p className="text-center mt-4 text-base" style={{ color: 'var(--jap-body)' }}>
              Fale com a gente ou veja as dúvidas mais comuns abaixo.
            </p>

            <div className="jap-card mt-10 p-5 md:p-10">
              <HelpForm homeContent={homeContent} company={company} onGoFaq={() => goHome('faq')} />
            </div>
          </div>
        </section>

        <JapFaq
          faqs={homeContent?.faqs || []}
          title="Dúvidas frequentes"
          subtitle="Talvez sua resposta já esteja aqui."
        />
      </main>

      <JapFooter siteName={siteName} logoUrl={logoUrl} company={company} onNavigate={goHome} />
    </div>
  );
}
