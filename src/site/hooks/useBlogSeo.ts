// SEO e dados estruturados do blog.
//
// Usa os helpers compartilhados de src/utils/seo.ts. O blog tinha cópias
// privadas de upsertMeta/upsertCanonical/setJsonLd, e a cópia dele nunca
// removia og:image/twitter:image quando a página não tinha imagem — então a
// imagem de um artigo vazava para a listagem. O helper compartilhado já é
// idempotente nesse ponto.

import { useEffect } from 'react';
import { BlogPost } from '../../utils/storage';
import { applyBasicSEO, setJsonLd, upsertMeta } from '../../utils/seo';

export interface UseBlogSeoInput {
  activePost: BlogPost | null;
  currentCategory: string | null;
  activeSearchFilter: string;
  siteName?: string;
  logoUrl?: string;
}

const breadcrumb = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: it.url
  }))
});

export function useBlogSeo({ activePost, currentCategory, activeSearchFilter, siteName, logoUrl }: UseBlogSeoInput) {
  useEffect(() => {
    const brand = siteName || 'ImpulsioneGram';
    const origin = window.location.origin;
    const path = window.location.pathname;
    const blogUrl = `${origin}/blog`;

    if (activePost) {
      const canonical = `${origin}/blog/artigo/${activePost.slug}`;
      applyBasicSEO({
        title: `${activePost.title} | Blog ${brand}`,
        description: activePost.description,
        canonical,
        brand,
        image: activePost.image,
        type: 'article'
      });
      // og:title/twitter:title do artigo usam o título puro, sem o sufixo.
      upsertMeta('property', 'og:title', activePost.title);
      upsertMeta('name', 'twitter:title', activePost.title);
      if (activePost.publishedAt) {
        upsertMeta('property', 'article:published_time', activePost.publishedAt);
      }
      (activePost.categories || []).forEach(c => upsertMeta('property', 'article:section', c));

      const publisher: any = { '@type': 'Organization', name: brand, url: origin };
      if (logoUrl) publisher.logo = { '@type': 'ImageObject', url: logoUrl };

      setJsonLd('article', {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: activePost.title,
        description: activePost.description,
        image: activePost.image ? [activePost.image] : undefined,
        author: { '@type': 'Person', name: activePost.author || brand },
        publisher,
        datePublished: activePost.publishedAt || undefined,
        dateModified: activePost.publishedAt || undefined,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        articleSection: activePost.categories?.length ? activePost.categories : undefined,
        keywords: activePost.tags?.length ? activePost.tags.join(', ') : undefined,
        url: canonical
      });

      const crumbs = [
        { name: 'Início', url: origin + '/' },
        { name: 'Blog', url: blogUrl }
      ];
      if (activePost.categories?.[0]) {
        crumbs.push({
          name: activePost.categories[0],
          url: `${origin}/blog/categoria/${encodeURIComponent(activePost.categories[0])}`
        });
      }
      crumbs.push({ name: activePost.title, url: canonical });
      setJsonLd('breadcrumb', breadcrumb(crumbs));
      return;
    }

    if (currentCategory) {
      const canonical = `${origin}/blog/categoria/${encodeURIComponent(currentCategory)}`;
      const title = `Artigos sobre ${currentCategory}`;
      applyBasicSEO({
        title: `${title} | Blog ${brand}`,
        description: `Confira os melhores artigos de marketing e crescimento social na categoria ${currentCategory} do nosso Blog.`,
        canonical,
        brand
      });
      upsertMeta('property', 'og:title', title);
      upsertMeta('name', 'twitter:title', title);
      setJsonLd('article', null);
      setJsonLd('breadcrumb', breadcrumb([
        { name: 'Início', url: origin + '/' },
        { name: 'Blog', url: blogUrl },
        { name: currentCategory, url: canonical }
      ]));
      return;
    }

    const canonical = activeSearchFilter ? blogUrl : `${origin}${path}`;
    const title = 'Blog de Marketing de Redes Sociais e Engajamento';
    applyBasicSEO({
      title: `${title} | Blog ${brand}`,
      description: `Dicas, estratégias, guias práticos e tendências de Instagram, TikTok e Marketing Digital no Blog oficial ${brand}.`,
      canonical,
      brand
    });
    upsertMeta('property', 'og:title', title);
    upsertMeta('name', 'twitter:title', title);
    setJsonLd('article', null);
    setJsonLd('breadcrumb', breadcrumb([
      { name: 'Início', url: origin + '/' },
      { name: 'Blog', url: blogUrl }
    ]));
  }, [activePost, currentCategory, activeSearchFilter, siteName, logoUrl]);

  // Ao sair do blog, remove os dados estruturados dele.
  useEffect(() => {
    return () => {
      setJsonLd('article', null);
      setJsonLd('breadcrumb', null);
    };
  }, []);
}
