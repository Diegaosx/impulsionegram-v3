// Páginas institucionais (termos, privacidade, garantia) no padrão de painel
// azul-bebê da referência — que é exatamente como ela monta /terms e /faq.
//
// Diferente da referência, aqui o título da página é um h1 de verdade: lá as
// páginas institucionais usam h2 sem nenhum h1.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeSitePageProps } from '../../types';
import { PageSlug, SitePage as SitePageData, fetchPage } from '../../../utils/storage';
import { formatDateTime } from '../../../utils/datetime';
import JapHeader from '../chrome/Header';
import JapFooter from '../chrome/Footer';

const TITLES: Record<PageSlug, string> = {
  privacy: 'Política de Privacidade',
  terms: 'Termos de Uso',
  warranty: 'Garantia e Reembolso'
};

export default function JapSitePageView({ slug, company, siteName, logoUrl }: ThemeSitePageProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState<SitePageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPage(slug)
      .then(p => { if (active) setPage(p); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const goHome = (sectionId: string) => {
    navigate('/');
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  const title = page?.title || TITLES[slug];

  return (
    <div className="jap-page min-h-screen flex flex-col">
      <JapHeader siteName={siteName} logoUrl={logoUrl} onNavigate={goHome} />

      <main className="pt-[71px] md:pt-[91px] lg:pt-[111px] flex-1">
        <section className="py-[30px] md:py-[50px] lg:py-[90px]">
          <div className="max-w-[960px] mx-auto px-6 lg:px-3">
            <h1 className="text-center font-bold" style={{ color: 'var(--jap-ink)', fontSize: 'clamp(24px, 3vw, 48px)', lineHeight: 1.2 }}>
              {title}
            </h1>

            <div className="jap-card-tint mt-10 p-5 md:p-[66px]">
              {loading ? (
                <p className="text-center text-sm" style={{ color: 'var(--jap-body)' }}>Carregando…</p>
              ) : page?.html ? (
                <div className="blog-content" dangerouslySetInnerHTML={{ __html: page.html }} />
              ) : (
                <p className="text-center text-sm" style={{ color: 'var(--jap-body)' }}>
                  Este conteúdo ainda não foi publicado.
                </p>
              )}

              {page?.updatedAt && (
                <p className="text-xs mt-8" style={{ color: 'var(--jap-muted)' }}>
                  Atualizado em {formatDateTime(page.updatedAt)}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      <JapFooter siteName={siteName} logoUrl={logoUrl} company={company} onNavigate={goHome} />
    </div>
  );
}
