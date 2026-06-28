import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWidgets from '../components/FloatingWidgets';
import CookieConsent from '../components/CookieConsent';
import { HomeContent, CompanySettings, PageSlug, SitePage as SitePageData, fetchPage } from '../utils/storage';
import { formatDateTime } from '../utils/datetime';

interface SitePageProps {
  slug: PageSlug;
  homeContent: HomeContent | null;
  company?: CompanySettings | null;
  siteName?: string;
  logoUrl?: string;
}

export default function SitePage({ slug, homeContent, company, siteName, logoUrl }: SitePageProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState<SitePageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchPage(slug).then(setPage).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (page?.title) document.title = `${page.title}${siteName ? ' | ' + siteName : ''}`;
  }, [page?.title, siteName]);

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
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm">
              <h1 className="font-display font-black text-3xl text-slate-900 tracking-tight">{page?.title || 'Página'}</h1>
              {page?.updatedAt && (
                <p className="text-[11px] text-slate-400 font-semibold mt-2">Última atualização: {formatDateTime(page.updatedAt)}</p>
              )}
              <div className="border-t border-slate-100 mt-6 pt-6">
                {page?.html?.trim() ? (
                  <div className="blog-content" dangerouslySetInnerHTML={{ __html: page.html }} />
                ) : (
                  <p className="text-slate-500 text-sm font-semibold">Conteúdo em breve.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer onNavigate={goHome} onSetPlatformFilter={() => goHome('servicos')} siteName={siteName} company={company} />
      <FloatingWidgets onNavigate={goHome} ordersCalculatedStat={0} homeContent={homeContent} company={company} />
      <CookieConsent />
    </div>
  );
}
