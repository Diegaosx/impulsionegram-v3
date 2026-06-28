import { GeneralSettings } from './storage';

// Apply site branding/SEO to the document head at runtime (SPA), so the
// configurable title, description and favicon take effect without a rebuild.
export function applyBrandingToHead(s: GeneralSettings, opts: { skipTitle?: boolean } = {}) {
  const title = s.seoTitle || s.siteName;
  // The blog manages its own per-article document.title; skip it there so the
  // global branding doesn't clobber the article SEO on initial load.
  if (title && !opts.skipTitle) document.title = title;

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
