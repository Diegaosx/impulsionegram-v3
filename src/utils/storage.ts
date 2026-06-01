import { ServiceItem, PlanItem } from '../types';

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

// REST Backend API calls
export async function fetchServices(): Promise<ServiceItem[]> {
  try {
    const res = await fetch('/api/services');
    if (!res.ok) throw new Error('Failed to fetch services');
    return await res.json();
  } catch (error) {
    console.error('Error fetching services API:', error);
    return [];
  }
}

export async function saveServicesToServer(services: ServiceItem[]): Promise<void> {
  const res = await fetch('/api/services', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(services)
  });
  if (!res.ok) throw new Error('Failed to save services to server');
}

export async function fetchPlans(): Promise<PlanItem[]> {
  try {
    const res = await fetch('/api/plans');
    if (!res.ok) throw new Error('Failed to fetch plans');
    return await res.json();
  } catch (error) {
    console.error('Error fetching plans API:', error);
    return [];
  }
}

export async function savePlansToServer(plans: PlanItem[]): Promise<void> {
  const res = await fetch('/api/plans', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plans)
  });
  if (!res.ok) throw new Error('Failed to save plans to server');
}

export async function fetchOrders(): Promise<AdminOrder[]> {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json();
  } catch (error) {
    console.error('Error fetching orders API:', error);
    return [];
  }
}

export async function saveOrdersToServer(orders: AdminOrder[]): Promise<void> {
  const res = await fetch('/api/orders', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orders)
  });
  if (!res.ok) throw new Error('Failed to update orders status on server');
}

export async function addOrderToServer(order: Omit<AdminOrder, 'id' | 'date'>): Promise<AdminOrder> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  if (!res.ok) throw new Error('Failed to create order on server');
  const data = await res.json();
  return data.order;
}

export async function resetServerDatabase(): Promise<{ services: ServiceItem[], plans: PlanItem[], orders: AdminOrder[] }> {
  const res = await fetch('/api/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset server database');
  return await res.json();
}
