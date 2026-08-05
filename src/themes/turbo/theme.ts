// Tema "Turbo" — quarto tema do site público.
//
// SaaS promocional roxo: um único roxo em cinco graus, âmbar só como acento,
// Roboto 900 nos títulos, arredondamento agressivo e uma única sombra difusa.
// A rede social escolhida troca o gradiente do topo e das setas, então cada
// página de serviço tem a cara da própria rede.
//
// Consome exatamente os mesmos dados e a mesma lógica de negócio dos outros
// temas (serviços, blog, pagamento, integrações) — aqui só há marcação.

import { registerTheme } from '../registry';
import { ThemeDefinition } from '../types';

import HomeView from './views/HomeView';
import ServiceView from './views/ServiceView';
import BlogView from './views/BlogView';
import SitePageView from './views/SitePageView';
import HelpView from './views/HelpView';

import './theme.css';

const turboTheme: ThemeDefinition = {
  id: 'turbo',
  label: 'Turbo (Roxo)',
  description: 'Roxo monocromático com acentos âmbar e cor própria por rede social.',
  slots: {
    Home: HomeView,
    Service: ServiceView,
    Blog: BlogView,
    SitePage: SitePageView,
    Help: HelpView
  }
};

export default registerTheme(turboTheme);
