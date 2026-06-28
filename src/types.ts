export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'facebook' | 'kwai';

export interface ServiceItem {
  id: string;
  platform: SocialPlatform;
  type: 'followers' | 'likes' | 'views' | 'comments' | 'stories';
  label: string;
  pricePerItem: number; // Price per unit
  minQuantity: number;
  maxQuantity: number;
  deliverySpeed: string;
  benefits: string[];
  smmServiceId?: string; // ID do serviço no painel SMM (entrega automática)
}

export interface PlanItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  platform: SocialPlatform;
  type: 'followers' | 'likes' | 'views';
  features: string[];
  isPopular?: boolean;
  savingsPercent?: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number; // 1-5
  text: string;
  platformUsed: SocialPlatform;
  verified: boolean;
  date: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'geral' | 'seguranca' | 'entrega' | 'pagamento';
}

export interface OrderDetails {
  platform: SocialPlatform;
  type: string;
  quantity: number;
  username: string; // social media handle
  email: string;
  phone: string;
  price: number;
  postUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  suggestedQuestions?: string[];
}
