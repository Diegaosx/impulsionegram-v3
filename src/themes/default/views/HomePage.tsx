import { useState } from 'react';
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
import { usePlansEnabled } from '../../../utils/usePlansEnabled';

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
  const plansEnabled = usePlansEnabled();

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

      {/* Services Showcase Catalog - dynamic */}
      <ServicesGrid
        services={services}
        onSelectService={(plat, type) => handleCustomizerSelection(plat, type, 1000)}
        searchTerm={searchFilter}
        onNavigate={handleScrollToSection}
      />

      {/* Benefits Block */}
      <Benefits />

      {/* Interactive Pricing Customizer Calculator - dynamic */}
      <InteractiveCalculator
        services={services}
        initialPlatform={selectedPlatform}
        initialType={selectedServiceType}
        onAddOrderToStats={handleUpdatePlatformStats}
        onAddSimulatedOrder={handleAddSimulatedOrder}
        currentUser={currentUser}
        onAuthSuccess={onAuthSuccess}
      />

      {/* Pre-packaged Popular Plans Grid - dynamic (hidden when section disabled) */}
      {plansEnabled && (
        <PlansGrid
          plans={plans}
          onSelectPlanCustomizer={handleCustomizerSelection}
          onNavigate={handleScrollToSection}
        />
      )}

      {/* Simple Stepper: How it Works */}
      <HowItWorks />

      {/* Testimonials Review Feed */}
      <Testimonials />

      {/* FAQ Accorion Collapsible Block */}
      <FAQAccordion onNavigate={handleScrollToSection} company={company} homeContent={homeContent} />

      {/* Customer Contact forms */}
      <ContactForm company={company} />

      {/* Newsletter Block */}
      <Newsletter />

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
