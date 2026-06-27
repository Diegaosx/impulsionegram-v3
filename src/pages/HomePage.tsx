import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocialPlatform } from '../types';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ServicesGrid from '../components/ServicesGrid';
import Benefits from '../components/Benefits';
import InteractiveCalculator from '../components/InteractiveCalculator';
import PlansGrid from '../components/PlansGrid';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import FAQAccordion from '../components/FAQAccordion';
import ContactForm from '../components/ContactForm';
import Newsletter from '../components/Newsletter';
import Footer from '../components/Footer';
import FloatingWidgets from '../components/FloatingWidgets';
import { HomeContent } from '../utils/storage';

interface HomePageProps {
  services: any[];
  plans: any[];
  homeContent: HomeContent | null;
  siteName?: string;
  logoUrl?: string;
  onAddSimulatedOrder: (orderInfo: any) => void;
}

export default function HomePage({ services, plans, homeContent, siteName, logoUrl, onAddSimulatedOrder }: HomePageProps) {
  const navigate = useNavigate();

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
      />

      {/* Pre-packaged Popular Plans Grid - dynamic */}
      <PlansGrid
        plans={plans}
        onSelectPlanCustomizer={handleCustomizerSelection}
        onNavigate={handleScrollToSection}
      />

      {/* Simple Stepper: How it Works */}
      <HowItWorks />

      {/* Testimonials Review Feed */}
      <Testimonials />

      {/* FAQ Accorion Collapsible Block */}
      <FAQAccordion onNavigate={handleScrollToSection} />

      {/* Customer Contact forms */}
      <ContactForm />

      {/* Newsletter Block */}
      <Newsletter />

      {/* Footer Maps */}
      <Footer
        onNavigate={handleScrollToSection}
        onSetPlatformFilter={handleSetPlatformFilter}
        siteName={siteName}
      />

      {/* Floating Helpers and Chat BotSofia */}
      <FloatingWidgets
        onNavigate={handleScrollToSection}
        ordersCalculatedStat={statsCount - 15482}
        homeContent={homeContent}
      />

    </div>
  );
}
