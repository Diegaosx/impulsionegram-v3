import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import BlogPage from './pages/BlogPage';
import AdminPanel from './components/AdminPanel';
import {
  fetchServices, saveServicesToServer,
  fetchPlans, savePlansToServer,
  fetchOrders, saveOrdersToServer,
  addOrderToServer, resetServerDatabase,
  fetchHomeContent, saveHomeContentToServer, HomeContent,
  fetchGeneralSettings, fetchCompanySettings, CompanySettings,
  fetchAnalyticsSettings, AnalyticsSettings
} from './utils/storage';
import { applyBrandingToHead } from './utils/branding';
import { setAppTimezone } from './utils/datetime';
import { applySiteCode, clearSiteCode } from './utils/codeInjection';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Shared server-backed state
  const [services, setServices] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [homeContent, setHomeContent] = useState<HomeContent | null>(null);

  // Site branding (applied to header/head)
  const [siteName, setSiteName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [company, setCompany] = useState<CompanySettings | null>(null);

  // Custom JS / Analytics code snippets (injected on public pages)
  const [analytics, setAnalytics] = useState<AnalyticsSettings | null>(null);

  // Admin authentication (persisted in localStorage)
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('admin_authenticated') === 'true'
  );

  // Load all initial server state from the REST API
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [loadedServices, loadedPlans, loadedOrders, loadedHome, loadedGeneral, loadedCompany, loadedAnalytics] = await Promise.all([
          fetchServices(),
          fetchPlans(),
          fetchOrders(),
          fetchHomeContent(),
          fetchGeneralSettings(),
          fetchCompanySettings(),
          fetchAnalyticsSettings()
        ]);
        setServices(loadedServices);
        setPlans(loadedPlans);
        setOrders(loadedOrders);
        setHomeContent(loadedHome);
        setCompany(loadedCompany);
        setAnalytics(loadedAnalytics);

        // Apply configurable branding / SEO / timezone
        setSiteName(loadedGeneral.siteName);
        setLogoUrl(loadedGeneral.logoUrl);
        setAppTimezone(loadedGeneral.timezone);
        applyBrandingToHead(loadedGeneral, {
          skipTitle: window.location.pathname.startsWith('/blog')
        });
      } catch (err) {
        console.error('Error loading secure REST API endpoints:', err);
      }
    }
    loadBackendData();
  }, []);

  // Inject the site-wide custom code on public pages only. The admin dashboard
  // and login screen are excluded so analytics/ads don't run inside the panel.
  useEffect(() => {
    if (!analytics) return;
    const path = location.pathname;
    const isAdminArea = path.startsWith('/dashboard') || path.startsWith('/login');
    if (isAdminArea) {
      clearSiteCode();
    } else {
      applySiteCode(analytics);
    }
  }, [analytics, location.pathname]);

  // --- Auth handlers ---
  const handleLoginSuccess = () => {
    localStorage.setItem('admin_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  };

  // --- Data handlers (propagated to the dashboard) ---
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
    } catch (e) {
      console.error('Failed to record order on backend:', e);
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            services={services}
            plans={plans}
            homeContent={homeContent}
            siteName={siteName}
            logoUrl={logoUrl}
            company={company}
            onAddSimulatedOrder={handleAddSimulatedOrder}
          />
        }
      />

      <Route
        path="/blog"
        element={<BlogPage homeContent={homeContent} company={company} siteName={siteName} logoUrl={logoUrl} />}
      />
      <Route
        path="/blog/artigo/:slug"
        element={<BlogPage homeContent={homeContent} company={company} siteName={siteName} logoUrl={logoUrl} />}
      />
      <Route
        path="/blog/categoria/:categoria"
        element={<BlogPage homeContent={homeContent} company={company} siteName={siteName} logoUrl={logoUrl} />}
      />

      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <LoginPage onLoginSuccess={handleLoginSuccess} />
        }
      />

      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <AdminPanel
              services={services}
              plans={plans}
              orders={orders}
              homeContent={homeContent}
              onUpdateServices={handleUpdateServices}
              onUpdatePlans={handleUpdatePlans}
              onUpdateOrders={handleUpdateOrders}
              onUpdateHomeContent={handleUpdateHomeContent}
              onResetAll={handleResetAll}
              onLogout={handleLogout}
              onExit={() => navigate('/')}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
