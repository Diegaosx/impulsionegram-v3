import { useState } from 'react';
import { SocialPlatform } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import ServicesGrid from './components/ServicesGrid';
import Benefits from './components/Benefits';
import InteractiveCalculator from './components/InteractiveCalculator';
import PlansGrid from './components/PlansGrid';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import FAQAccordion from './components/FAQAccordion';
import ContactForm from './components/ContactForm';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import FloatingWidgets from './components/FloatingWidgets';
import AdminPanel from './components/AdminPanel';
import { 
  getStoredServices, setStoredServices, 
  getStoredPlans, setStoredPlans, 
  getStoredOrders, setStoredOrders, 
  addSimulatedOrder, resetAllToDefault
} from './utils/storage';

export default function App() {
  // Navigation scrolling logic
  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // State hooks from localStorage seed
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [services, setServices] = useState(() => getStoredServices());
  const [plans, setPlans] = useState(() => getStoredPlans());
  const [orders, setOrders] = useState(() => getStoredOrders());

  // State hooks to synchronize platform selections between plans grid, services tabs and calculators
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('instagram');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('followers');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1000);
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

  // State handlers propagated down to operations panel
  const handleUpdateServices = (newSvcList: typeof services) => {
    setStoredServices(newSvcList);
    setServices(newSvcList);
  };

  const handleUpdatePlans = (newPlanList: typeof plans) => {
    setStoredPlans(newPlanList);
    setPlans(newPlanList);
  };

  const handleUpdateOrders = (newOrdersList: typeof orders) => {
    setStoredOrders(newOrdersList);
    setOrders(newOrdersList);
  };

  const handleResetAll = () => {
    const backup = resetAllToDefault();
    setServices(backup.services);
    setPlans(backup.plans);
    setOrders(backup.orders);
  };

  const handleAddSimulatedOrder = (orderInfo: any) => {
    addSimulatedOrder(orderInfo);
    setOrders(getStoredOrders());
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
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Hero Section */}
      <Hero onNavigate={handleScrollToSection} />

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
      />

      {/* Floating Helpers and Chat BotSofia */}
      <FloatingWidgets 
        onNavigate={handleScrollToSection}
        ordersCalculatedStat={statsCount - 15482}
      />

      {/* Admin Panel CRUD Overlay backdrop */}
      <AdminPanel 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        services={services}
        plans={plans}
        orders={orders}
        onUpdateServices={handleUpdateServices}
        onUpdatePlans={handleUpdatePlans}
        onUpdateOrders={handleUpdateOrders}
        onResetAll={handleResetAll}
      />

    </div>
  );
}
