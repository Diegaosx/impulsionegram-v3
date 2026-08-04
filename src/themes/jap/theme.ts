// Tema "Painel" — segundo tema do site público.
//
// Linguagem visual de painel SMM: superfície cinza-clara, cartões brancos
// flutuando, laranja como único acento forte e azul-bebê nas seções
// alternadas. Consome exatamente os mesmos dados e a mesma lógica de negócio
// do tema padrão (serviços, blog, pagamento, integrações) — aqui só há
// marcação.

import { registerTheme } from '../registry';
import { ThemeDefinition } from '../types';

import HomeView from './views/HomeView';
import ServiceView from './views/ServiceView';
import BlogView from './views/BlogView';
import SitePageView from './views/SitePageView';
import HelpView from './views/HelpView';

import './theme.css';

const japTheme: ThemeDefinition = {
  id: 'jap',
  label: 'Painel (Laranja)',
  description: 'Visual de painel SMM: fundo claro, cartões brancos e acento laranja.',
  slots: {
    Home: HomeView,
    Service: ServiceView,
    Blog: BlogView,
    SitePage: SitePageView,
    Help: HelpView
  }
};

export default registerTheme(japTheme);
