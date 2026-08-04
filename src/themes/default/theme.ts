// The default theme — the site exactly as it has always looked.
//
// Its views live in ./views and are composed from ./chrome and ./sections.
// Nothing here is special-cased: a second theme registers the same way.

import { registerTheme } from '../registry';
import { ThemeDefinition } from '../types';

import HomeView from './views/HomePage';
import ServiceView from './views/ServicePage';
import BlogView from './views/BlogPage';
import SitePageView from './views/SitePage';
import HelpView from './views/HelpPage';

import './theme.css';

const defaultTheme: ThemeDefinition = {
  id: 'default',
  label: 'Padrão (Roxo)',
  description: 'O layout original do site, em roxo e rosa.',
  slots: {
    Home: HomeView,
    Service: ServiceView,
    Blog: BlogView,
    SitePage: SitePageView,
    Help: HelpView
  }
};

export default registerTheme(defaultTheme);
