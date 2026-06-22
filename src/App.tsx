import { useState, useEffect } from 'react';
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
  fetchServices, saveServicesToServer,
  fetchPlans, savePlansToServer,
  fetchOrders, saveOrdersToServer,
  addOrderToServer, resetServerDatabase,
  fetchHomeContent, saveHomeContentToServer, HomeContent
} from './utils/storage';

export default function App() {
  // Navigation scrolling logic
  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // State hooks from Node.js backend
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load all initial server state from Node process APIs
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [loadedServices, loadedPlans, loadedOrders, loadedHome] = await Promise.all([
          fetchServices(),
          fetchPlans(),
          fetchOrders(),
          fetchHomeContent()
        ]);
        setServices(loadedServices);
        setPlans(loadedPlans);
        setOrders(loadedOrders);
        setHomeContent(loadedHome);
      } catch (err) {
        console.error('Error loading secure REST API endpoints:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBackendData();
  }, []);

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
  const handleUpdateServices = async (newSvcList: typeof services) => {
    try {
      await saveServicesToServer(newSvcList);
      setServices(newSvcList);
    } catch (e) {
      console.error('Failed to update services on backend:', e);
    }
  };

  const handleUpdatePlans = async (newPlanList: typeof plans) => {
    try {
      await savePlansToServer(newPlanList);
      setPlans(newPlanList);
    } catch (e) {
      console.error('Failed to update plans on backend:', e);
    }
  };

  const handleUpdateOrders = async (newOrdersList: typeof orders) => {
    try {
      await saveOrdersToServer(newOrdersList);
      setOrders(newOrdersList);
    } catch (e) {
      console.error('Failed to update orders on backend:', e);
    }
  };

  const handleUpdateHomeContent = async (newContent: HomeContent) => {
    try {
      await saveHomeContentToServer(newContent);
      setHomeContent(newContent);
    } catch (e) {
      console.error('Failed to update home content on backend:', e);
    }
  };

  const handleResetAll = async () => {
    try {
      const backup = await resetServerDatabase();
      setServices(backup.services);
      setPlans(backup.plans);
      setOrders(backup.orders);
      if (backup.homeContent) {
        setHomeContent(backup.homeContent);
      }
    } catch (e) {
      console.error('Failed to reset backend database:', e);
    }
  };

  const handleAddSimulatedOrder = async (orderInfo: any) => {
    try {
      const savedOrder = await addOrderToServer(orderInfo);
      setOrders(prev => [savedOrder, ...prev]);
      handleUpdatePlatformStats();
    } catch (e) {
      console.error('Failed to record order on backend:', e);
    }
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
      />

      {/* Floating Helpers and Chat BotSofia */}
      <FloatingWidgets 
        onNavigate={handleScrollToSection}
        ordersCalculatedStat={statsCount - 15482}
        homeContent={homeContent}
      />

      {/* Admin Panel CRUD Overlay backdrop */}
      <AdminPanel 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        services={services}
        plans={plans}
        orders={orders}
        homeContent={homeContent}
        onUpdateServices={handleUpdateServices}
        onUpdatePlans={handleUpdatePlans}
        onUpdateOrders={handleUpdateOrders}
        onUpdateHomeContent={handleUpdateHomeContent}
        onResetAll={handleResetAll}
      />

    </div>
  );
}
