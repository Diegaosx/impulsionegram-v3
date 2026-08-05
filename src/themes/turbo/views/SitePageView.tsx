// Páginas institucionais do tema "Turbo".
//
// A referência não tem páginas legais próprias — os links do rodapé apontam
// para fora. O padrão herdado aqui é o do resto do tema: faixa de gradiente com
// o trio kicker/título/parágrafo e um cartão branco de raio 30 com o conteúdo.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeSitePageProps } from '../../types';
import { PageSlug, SitePage as SitePageData, fetchPage } from '../../../utils/storage';
import { formatDateTime } from '../../../utils/datetime';
import TurboHeader from '../chrome/Header';
import TurboFooter from '../chrome/Footer';
import TurboFab from '../chrome/Fab';

const TITLES: Record<PageSlug, string> = {
  privacy: 'Política de Privacidade',
  terms: 'Termos de Uso',
  warranty: 'Garantia e Reembolso'
};

export default function TurboSitePageView({ slug, company, siteName, logoUrl, currentUser }: ThemeSitePageProps) {
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
          <span className="tb-kicker">Institucional</span>
          <h1 className="tb-title mt-2.5">{page?.title || TITLES[slug]}</h1>
        </div>
      </div>

      <main className="flex-1">
        <section className="tb-wrap py-12 md:py-16">
          <div className="tb-card max-w-[860px] mx-auto p-6 md:p-10">
            {loading ? (
              <p className="text-center tb-lead">Carregando…</p>
            ) : page?.html ? (
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: page.html }} />
            ) : (
              <p className="text-center tb-lead">Este conteúdo ainda não foi publicado.</p>
            )}

            {page?.updatedAt && (
              <p className="text-sm mt-8" style={{ color: 'var(--tb-muted)' }}>
                Atualizado em {formatDateTime(page.updatedAt)}
              </p>
            )}
          </div>
        </section>
      </main>

      <TurboFooter siteName={siteName} logoUrl={logoUrl} company={company} onNavigate={goHome} />
      <TurboFab company={company} />
    </div>
  );
}
