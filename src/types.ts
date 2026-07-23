export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'facebook' | 'kwai';

// A fixed-price package for a service (e.g. "1.000 seguidores por R$ 7,90").
// When a service defines packages, the calculator shows selectable package
// cards instead of the quantity slider.
export interface ServicePackage {
  id: string;
  quantity: number;
  price: number;
  label?: string;      // optional custom label, else derived from quantity
  isPopular?: boolean; // highlights the card as the recommended choice
}

export interface ServiceItem {
  id: string;
  platform: SocialPlatform;
  type: 'followers' | 'likes' | 'views' | 'comments' | 'stories';
  label: string;
  pricePerItem: number; // Price per unit (used as slider fallback when no packages)
  minQuantity: number;
  maxQuantity: number;
  deliverySpeed: string;
  benefits: string[];
  smmServiceId?: string; // ID do serviço no painel SMM (entrega automática)
  packages?: ServicePackage[]; // fixed-price packages (preferred over the slider)
  slug?: string; // URL slug for the dedicated service page (/servico/:slug)
  pageTitle?: string; // H1 of the service page (can be longer than the card name); slug is derived from it
  pageSubtitle?: string; // subtitle shown next to the calculator on the service page
  pageDescriptionHtml?: string; // rich HTML description below the service page hero
  pageImageUrl?: string; // featured image (used for the hero + og:image/SEO)
  pageMetaDescription?: string; // SEO meta description (falls back to the subtitle)
  faqTitle?: string; // editable title of the service page's FAQ section
  faqSubtitle?: string; // editable subtitle/description of the FAQ section
  faqs?: ServiceFaq[]; // per-service FAQ questions (also emitted as FAQPage rich snippet)
}

export interface ServiceFaq {
  id: string;
  question: string;
  answer: string;
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
