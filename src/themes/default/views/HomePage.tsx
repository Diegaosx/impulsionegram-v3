import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocialPlatform } from '../../../types';
import Header from '../chrome/Header';
import Hero from '../sections/Hero';
import ServicesGrid from '../sections/ServicesGrid';
import Benefits from '../sections/Benefits';
import InteractiveCalculator from '../sections/InteractiveCalculator';
import PlansGrid from '../sections/PlansGrid';
import HowItWorks from '../sections/HowItWorks';
import Testimonials from '../sections/Testimonials';
import FAQAccordion from '../sections/FAQAccordion';
import ContactForm from '../sections/ContactForm';
import Newsletter from '../sections/Newsletter';
import Footer from '../chrome/Footer';
import FloatingWidgets from '../chrome/FloatingWidgets';
import CookieConsent from '../chrome/CookieConsent';
import { HomeContent, CompanySettings, AuthUser } from '../../../utils/storage';
import { orderedSections, useHomeLayout } from '../../../site/homeSections';

interface HomePageProps {
  services: any[];
  plans: any[];
  homeContent: HomeContent | null;
  siteName?: string;
  logoUrl?: string;
  company?: CompanySettings | null;
  currentUser?: AuthUser | null;
  onAuthSuccess?: (user: AuthUser) => void;
  onAddSimulatedOrder: (orderInfo: any) => void;
}

export default function HomePage({ services, plans, homeContent, siteName, logoUrl, company, currentUser, onAuthSuccess, onAddSimulatedOrder }: HomePageProps) {
  const navigate = useNavigate();
  // Ordem das seções e visibilidade dos planos vêm do painel.
  const { order, plansEnabled } = useHomeLayout();

  // Navigation scrolling logic
  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // UI-only state for synchronizing platform selections across the landing page
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('instagram');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('followers');
  const [, setSelectedQuantity] = useState<number>(1000);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Track successful checkouts to feed notifications
  const [statsCount, setStatsCount] = useState<number>(15482);

  const handleUpdatePlatformStats = () => {
    setStatsCount(prev => prev + 1);
  };

  const handleCustomizerSelection = (plat: SocialPlatform, type: string, qty: number) => {
    setSelectedPlatform(plat);
    setSelectedServiceType(type);
    setSelectedQuantity(qty);
  };

  const handleSetPlatformFilter = (platform: SocialPlatform | 'todos') => {
    if (platform !== 'todos') {
      setSelectedPlatform(platform);
    }
    setSearchFilter('');
  };

  const handleAddSimulatedOrder = (orderInfo: any) => {
    onAddSimulatedOrder(orderInfo);
    handleUpdatePlatformStats();
  };

  // Cada seção da home vira uma entrada aqui; a ordem é decidida pelo painel.
  // Blocos ausentes (ids que este tema não implementa) são simplesmente
  // pulados, e "planos" some quando a seção está desativada.
  const blocks: Record<string, React.ReactNode> = {
    servicos: (
      <ServicesGrid
        services={services}
        onSelectService={(plat, type) => handleCustomizerSelection(plat, type, 1000)}
        searchTerm={searchFilter}
        onNavigate={handleScrollToSection}
      />
    ),
    beneficios: <Benefits />,
    calculadora: (
      <InteractiveCalculator
        services={services}
        initialPlatform={selectedPlatform}
        initialType={selectedServiceType}
        onAddOrderToStats={handleUpdatePlatformStats}
        onAddSimulatedOrder={handleAddSimulatedOrder}
        currentUser={currentUser}
        onAuthSuccess={onAuthSuccess}
      />
    ),
    planos: plansEnabled ? (
      <PlansGrid
        plans={plans}
        onSelectPlanCustomizer={handleCustomizerSelection}
        onNavigate={handleScrollToSection}
      />
    ) : null,
    'como-funciona': <HowItWorks />,
    depoimentos: <Testimonials />,
    faq: <FAQAccordion onNavigate={handleScrollToSection} company={company} homeContent={homeContent} />,
    contato: <ContactForm company={company} />,
    newsletter: <Newsletter />
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white pb-0">

      {/* Dynamic Header with painel control togglers */}
      <Header
        onNavigate={handleScrollToSection}
        cartCount={0}
        onOpenCart={() => handleScrollToSection('calculadora')}
        onSearch={setSearchFilter}
        onOpenAdmin={() => navigate('/login')}
        siteName={siteName}
        logoUrl={logoUrl}
      />

      {/* Hero Section */}
      <Hero
        onNavigate={handleScrollToSection}
        homeContent={homeContent}
      />

      {/* Seções ordenáveis pelo painel */}
      {orderedSections(order, blocks).map(s => (
        <React.Fragment key={s.id}>{s.node}</React.Fragment>
      ))}

      {/* Footer Maps */}
      <Footer
        onNavigate={handleScrollToSection}
        onSetPlatformFilter={handleSetPlatformFilter}
        siteName={siteName}
        company={company}
      />

      {/* Floating Helpers and Chat BotSofia */}
      <FloatingWidgets
        onNavigate={handleScrollToSection}
        ordersCalculatedStat={statsCount - 15482}
        homeContent={homeContent}
        company={company}
      />

      {/* LGPD Cookie consent */}
      <CookieConsent />

    </div>
  );
}
