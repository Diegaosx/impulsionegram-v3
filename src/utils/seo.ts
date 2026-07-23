// Client-side SEO helpers: upsert <title>/<meta>/<link rel=canonical> tags and
// inject JSON-LD structured data. Used by pages that need per-route SEO in this
// single-page app (blog articles, service pages, …).

// Upsert a <meta> tag selected by an attribute/value pair.
export function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// Remove a <meta> tag selected by an attribute/value pair (if present).
export function removeMeta(attr: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

// Upsert the single <link rel="canonical"> tag.
export function upsertCanonical(url: string) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

// Inject (or replace) a JSON-LD structured-data block, tagged by id so it can
// be swapped/removed on navigation. Pass null to remove it.
export function setJsonLd(id: string, data: object | null) {
  const selector = `script[type="application/ld+json"][data-seo="${id}"]`;
  document.head.querySelector(selector)?.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-seo', id);
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}

export interface BasicSEO {
  title: string;          // full document title (used as-is)
  description: string;
  canonical: string;
  brand?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
}

// Apply title, description, canonical, robots and Open Graph / Twitter tags.
export function applyBasicSEO({ title, description, canonical, brand, image, type = 'website' }: BasicSEO) {
  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  upsertCanonical(canonical);

  upsertMeta('property', 'og:type', type === 'product' ? 'product' : type);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonical);
  if (brand) upsertMeta('property', 'og:site_name', brand);
  upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  // Keep the image tags idempotent: when a page has no image, drop any tags a
  // previous page left behind so its image can't leak across client-side
  // navigation (e.g. Service A with a featured image → Service B without).
  if (image) {
    upsertMeta('property', 'og:image', image);
    upsertMeta('name', 'twitter:image', image);
  } else {
    removeMeta('property', 'og:image');
    removeMeta('name', 'twitter:image');
  }
}
