import { AnalyticsSettings } from './storage';

// Injects arbitrary HTML/JS snippets (Google Analytics, AdSense, Tag Manager,
// pixels, etc.) into the live document. Setting innerHTML alone does NOT run
// <script> tags, so we recreate each script element so the browser executes it.
// Every injected top-level element is tagged with data-injected="<marker>" so a
// scope (e.g. article-specific code) can be cleanly removed on route changes.

export type InjectPosition = 'head' | 'body-start' | 'body-end';

// Re-create scripts so they actually execute; clone everything else verbatim.
function toExecutable(node: Node): Node {
  if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'SCRIPT') {
    const old = node as HTMLScriptElement;
    const fresh = document.createElement('script');
    for (const attr of Array.from(old.attributes)) {
      fresh.setAttribute(attr.name, attr.value);
    }
    fresh.text = old.text;
    return fresh;
  }
  return node.cloneNode(true);
}

function injectSnippet(html: string, position: InjectPosition, marker: string): void {
  if (!html || !html.trim()) return;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const nodes = Array.from(tpl.content.childNodes).map(toExecutable);
  for (const n of nodes) {
    if (n.nodeType === Node.ELEMENT_NODE) (n as Element).setAttribute('data-injected', marker);
  }
  if (position === 'head') {
    nodes.forEach((n) => document.head.appendChild(n));
  } else if (position === 'body-start') {
    // Insert in reverse so the snippet's original order is preserved at the top.
    nodes.reverse().forEach((n) => document.body.insertBefore(n, document.body.firstChild));
  } else {
    nodes.forEach((n) => document.body.appendChild(n));
  }
}

function removeInjected(marker: string): void {
  document.querySelectorAll(`[data-injected="${marker}"]`).forEach((el) => el.remove());
}

// Site-wide code — applied on every public page. Idempotent: clears any prior
// injection with the same marker before re-applying.
export function applySiteCode(s: AnalyticsSettings): void {
  removeInjected('site-head');
  injectSnippet(s.siteHeadCode, 'head', 'site-head');
  removeInjected('site-body');
  injectSnippet(s.siteBodyCode, 'body-start', 'site-body');
  removeInjected('site-footer');
  injectSnippet(s.siteFooterCode, 'body-end', 'site-footer');
}

export function clearSiteCode(): void {
  removeInjected('site-head');
  removeInjected('site-body');
  removeInjected('site-footer');
}

// Article-scoped code — applied additionally on blog article pages, removed
// when navigating away from the article.
export function applyArticleCode(s: AnalyticsSettings): void {
  removeInjected('article-head');
  injectSnippet(s.articleHeadCode, 'head', 'article-head');
  removeInjected('article-body');
  injectSnippet(s.articleBodyCode, 'body-start', 'article-body');
  removeInjected('article-footer');
  injectSnippet(s.articleFooterCode, 'body-end', 'article-footer');
}

export function clearArticleCode(): void {
  removeInjected('article-head');
  removeInjected('article-body');
  removeInjected('article-footer');
}
