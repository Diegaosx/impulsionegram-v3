import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWidgets from '../components/FloatingWidgets';
import CookieConsent from '../components/CookieConsent';
import BlogView from '../components/BlogView';
import { HomeContent, CompanySettings } from '../utils/storage';

interface BlogPageProps {
  homeContent: HomeContent | null;
  company?: CompanySettings | null;
  siteName?: string;
  logoUrl?: string;
}

export default function BlogPage({ homeContent, company, siteName, logoUrl }: BlogPageProps) {
  const navigate = useNavigate();

  // Navigate back to the landing page and scroll to a section (the blog is a
  // separate route, so the target sections only exist on "/").
  const handleNavigate = (sectionId: string) => {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans selection:bg-blue-600 selection:text-white">
      <Header
        onNavigate={handleNavigate}
        cartCount={0}
        onOpenCart={() => handleNavigate('calculadora')}
        onSearch={() => {}}
        onOpenAdmin={() => navigate('/login')}
        siteName={siteName}
        logoUrl={logoUrl}
      />

      <BlogView onNavigate={handleNavigate} />

      <Footer
        onNavigate={handleNavigate}
        onSetPlatformFilter={() => handleNavigate('servicos')}
        siteName={siteName}
        company={company}
      />

      <FloatingWidgets
        onNavigate={handleNavigate}
        ordersCalculatedStat={0}
        homeContent={homeContent}
        company={company}
      />

      <CookieConsent />
    </div>
  );
}
