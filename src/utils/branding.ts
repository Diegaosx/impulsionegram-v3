import { GeneralSettings } from './storage';

// Apply site branding/SEO to the document head at runtime (SPA), so the
// configurable title, description and favicon take effect without a rebuild.
export function applyBrandingToHead(s: GeneralSettings) {
  const title = s.seoTitle || s.siteName;
  if (title) document.title = title;

  if (s.seoDescription) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', s.seoDescription);
  }

  if (s.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'icon');
      document.head.appendChild(link);
    }
    link.setAttribute('href', s.faviconUrl);
  }
}
