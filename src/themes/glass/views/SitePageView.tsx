// Páginas institucionais do tema "Cristal".
//
// A referência não tem páginas institucionais — os links do rodapé dela são
// decorativos e apontam todos para a mesma rota da aplicação. O padrão herdado
// é o do FAQ: coluna de leitura de 820px, filete separando blocos.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeSitePageProps } from '../../types';
import { PageSlug, SitePage as SitePageData, fetchPage } from '../../../utils/storage';
import { formatDateTime } from '../../../utils/datetime';
import GlassHeader from '../chrome/Header';
import GlassFooter from '../chrome/Footer';
import GlassFab from '../chrome/Fab';

const TITLES: Record<PageSlug, string> = {
  privacy: 'Política de Privacidade',
  terms: 'Termos de Uso',
  warranty: 'Garantia e Reembolso'
};

export default function GlassSitePageView({ slug, company, siteName, logoUrl, currentUser }: ThemeSitePageProps) {
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
    <div className="gl-page min-h-screen flex flex-col">
      <GlassHeader siteName={siteName} logoUrl={logoUrl} currentUser={currentUser} onNavigate={goHome} />

      <main className="flex-1">
        <section className="gl-wrap py-12 md:py-16">
          <h1 className="text-center font-bold" style={{ color: 'var(--gl-ink)', fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.1 }}>
            {page?.title || TITLES[slug]}
          </h1>

          <div className="gl-card max-w-[820px] mx-auto mt-9 p-6 md:p-10">
            {loading ? (
              <p className="text-center" style={{ color: 'var(--gl-body)' }}>Carregando…</p>
            ) : page?.html ? (
              <div className="blog-content" dangerouslySetInnerHTML={{ __html: page.html }} />
            ) : (
              <p className="text-center" style={{ color: 'var(--gl-body)' }}>Este conteúdo ainda não foi publicado.</p>
            )}

            {page?.updatedAt && (
              <p className="text-sm mt-8" style={{ color: 'var(--gl-muted)' }}>
                Atualizado em {formatDateTime(page.updatedAt)}
              </p>
            )}
          </div>
        </section>
      </main>

      <GlassFooter siteName={siteName} company={company} onNavigate={goHome} />
      <GlassFab company={company} />
    </div>
  );
}
