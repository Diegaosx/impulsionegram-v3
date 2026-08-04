// Tema "Cristal" — terceiro tema do site público.
//
// Glassmorphism claro: fundo com manchas radiais translúcidas, superfícies
// brancas flutuando com bordas muito claras e sombras longas, e um trio
// rosa/azul/violeta sempre aplicado como gradiente 135°.
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

const glassTheme: ThemeDefinition = {
  id: 'glass',
  label: 'Cristal (Gradiente)',
  description: 'Vidro claro com gradientes rosa, azul e violeta.',
  slots: {
    Home: HomeView,
    Service: ServiceView,
    Blog: BlogView,
    SitePage: SitePageView,
    Help: HelpView
  }
};

export default registerTheme(glassTheme);
