// The theme contract.
//
// A theme owns the PRESENTATION of the public site and nothing else. Every slot
// below receives its data ready to render — themes never fetch, never talk to
// the API and never own business rules, so a second theme cannot fork or break
// checkout, blog, SEO or the integrations that the dashboard drives.
//
// Adding a theme means implementing these slots and registering the theme in
// src/themes/index.ts. No routing or App.tsx change is ever required.

import { ComponentType } from 'react';
import { ServiceItem } from '../types';
import { AuthUser, CompanySettings, HomeContent, PageSlug } from '../utils/storage';

// Data every public page needs: dashboard-driven content plus site branding.
export interface ThemeBaseProps {
  homeContent: HomeContent | null;
  company?: CompanySettings | null;
  siteName?: string;
  logoUrl?: string;
  // Sessão atual: todo tema precisa disso no chrome, para o botão de acesso
  // levar ao painel certo (admin ou cliente) em vez de pedir login de novo.
  currentUser?: AuthUser | null;
  // Diz se o catálogo já terminou de carregar. Sem isso a página de serviço
  // não consegue separar "ainda carregando" de "não há serviço nenhum", e um
  // catálogo vazio a deixa girando o spinner para sempre.
  servicesLoaded?: boolean;
}

export interface ThemeHomeProps extends ThemeBaseProps {
  services: any[];
  plans: any[];
  onAuthSuccess?: (user: AuthUser) => void;
  onAddSimulatedOrder: (orderInfo: any) => void;
}

export interface ThemeServiceProps extends ThemeBaseProps {
  services: ServiceItem[];
  onAuthSuccess?: (user: AuthUser) => void;
  onAddSimulatedOrder?: (order: any) => void;
}

export type ThemeBlogProps = ThemeBaseProps;

export interface ThemeSitePageProps extends ThemeBaseProps {
  slug: PageSlug;
}

export type ThemeHelpProps = ThemeBaseProps;

// Every public route maps to exactly one slot.
export interface ThemeSlots {
  Home: ComponentType<ThemeHomeProps>;
  Service: ComponentType<ThemeServiceProps>;
  Blog: ComponentType<ThemeBlogProps>;
  SitePage: ComponentType<ThemeSitePageProps>;
  Help: ComponentType<ThemeHelpProps>;
}

export type ThemeSlotName = keyof ThemeSlots;

export interface ThemeDefinition {
  id: string;           // stored in GeneralSettings.theme
  label: string;        // shown in the admin theme selector
  description?: string; // optional hint under the selector
  slots: ThemeSlots;
}

// Shape the admin selector renders (no components, just the catalog entry).
export interface ThemeSummary {
  id: string;
  label: string;
  description?: string;
}
