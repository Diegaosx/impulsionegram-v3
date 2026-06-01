import { ServiceItem, PlanItem } from '../types';
import { SERVICES, PREBUILT_PLANS } from '../data';

export interface AdminOrder {
  id: string;
  username: string;
  platform: string;
  serviceLabel: string;
  quantity: number;
  price: number;
  paymentMethod: 'PIX' | 'Card';
  email: string;
  phone: string;
  date: string;
  status: 'Pendente' | 'Processando' | 'Aprovado' | 'Entregue' | 'Cancelado';
}

const SERVICES_KEY = 'impulsionegram_services_v1';
const PLANS_KEY = 'impulsionegram_plans_v1';
const ORDERS_KEY = 'impulsionegram_orders_v1';

// Initial pre-seeded simulated orders
const SEED_ORDERS: AdminOrder[] = [
  {
    id: "TRX-824195",
    username: "@juliana.vasconcelos",
    platform: "instagram",
    serviceLabel: "Seguidores Brasileiros",
    quantity: 2000,
    price: 49.90,
    paymentMethod: "Card",
    email: "juliana.vasc@gmail.com",
    phone: "(11) 98765-4321",
    date: "2026-06-01T10:15:30Z",
    status: "Entregue"
  },
  {
    id: "TRX-412781",
    username: "@burguer_gourmet_br",
    platform: "instagram",
    serviceLabel: "Curtidas Premium",
    quantity: 500,
    price: 19.90,
    paymentMethod: "PIX",
    email: "renan_burguer@outlook.com",
    phone: "(21) 91234-5678",
    date: "2026-06-01T12:05:00Z",
    status: "Entregue"
  },
  {
    id: "TRX-918234",
    username: "@gamer_becker_tt",
    platform: "tiktok",
    serviceLabel: "Seguidores TikTok",
    quantity: 5000,
    price: 119.90,
    paymentMethod: "PIX",
    email: "leticia.becker@gamer.com",
    phone: "(47) 99888-7777",
    date: "2026-06-01T14:10:12Z",
    status: "Aprovado"
  }
];

export function getStoredServices(): ServiceItem[] {
  try {
    const data = localStorage.getItem(SERVICES_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading services from localStorage:', e);
  }
  // Seeds database-fallback if empty
  setStoredServices(SERVICES);
  return SERVICES;
}

export function setStoredServices(services: ServiceItem[]) {
  try {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services));
  } catch (e) {
    console.error('Error saving services to localStorage:', e);
  }
}

export function getStoredPlans(): PlanItem[] {
  try {
    const data = localStorage.getItem(PLANS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading plans from localStorage:', e);
  }
  setStoredPlans(PREBUILT_PLANS);
  return PREBUILT_PLANS;
}

export function setStoredPlans(plans: PlanItem[]) {
  try {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  } catch (e) {
    console.error('Error saving plans to localStorage:', e);
  }
}

export function getStoredOrders(): AdminOrder[] {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading orders from localStorage:', e);
  }
  setStoredOrders(SEED_ORDERS);
  return SEED_ORDERS;
}

export function setStoredOrders(orders: AdminOrder[]) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving orders to localStorage:', e);
  }
}

export function addSimulatedOrder(order: Omit<AdminOrder, 'id' | 'date'>): AdminOrder {
  const newOrder: AdminOrder = {
    ...order,
    id: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
    date: new Date().toISOString(),
  };
  const currentOrders = getStoredOrders();
  const updated = [newOrder, ...currentOrders];
  setStoredOrders(updated);
  return newOrder;
}

export function resetAllToDefault() {
  localStorage.removeItem(SERVICES_KEY);
  localStorage.removeItem(PLANS_KEY);
  localStorage.removeItem(ORDERS_KEY);
  return {
    services: getStoredServices(),
    plans: getStoredPlans(),
    orders: getStoredOrders()
  };
}
