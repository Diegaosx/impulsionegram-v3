import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  User,
  Clock,
  ArrowLeft,
  ArrowRight,
  Search,
  ChevronRight,
  MessageSquare,
  Plus,
  Send,
  Bookmark,
  Check,
  X,
  TrendingUp,
  Flame,
  AlertCircle
} from 'lucide-react';
import {
  BlogPost, BlogComment,
  fetchBlogPosts, fetchPostComments, postComment,
  fetchAnalyticsSettings, AnalyticsSettings
} from '../utils/storage';
import { getRecaptchaToken } from '../utils/recaptcha';
import { formatDateTime } from '../utils/datetime';
import { applyArticleCode, clearArticleCode } from '../utils/codeInjection';

// --- SEO HELPERS ---

// Upsert a <meta> tag selected by an attribute/value pair.
function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// Upsert the single <link rel="canonical"> tag.
function upsertCanonical(url: string) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

// Inject (or replace) a JSON-LD structured-data block, tagged by id so it can
// be swapped on navigation. Pass null to remove it.
function setJsonLd(id: string, data: object | null) {
  const selector = `script[type="application/ld+json"][data-seo="${id}"]`;
  document.head.querySelector(selector)?.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-seo', id);
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}

interface SEOOptions {
  title: string;
  description: string;
  brand: string;
  canonical: string;
  image?: string;
  type?: 'website' | 'article';
}

// Apply title, description, canonical, robots and Open Graph / Twitter tags.
function updateSEO({ title, description, brand, canonical, image, type = 'website' }: SEOOptions) {
  document.title = `${title} | Blog ${brand}`;

  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  upsertCanonical(canonical);

  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:site_name', brand);
  upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  if (image) {
    upsertMeta('property', 'og:image', image);
    upsertMeta('name', 'twitter:image', image);
  }
}

interface BlogViewProps {
  // Navigate to a landing-page section (the blog lives on its own route).
  onNavigate: (sectionId: string) => void;
  siteName?: string;
  logoUrl?: string;
}

export default function BlogView({ onNavigate, siteName, logoUrl }: BlogViewProps) {
  // Routing is driven by react-router:
  // - /blog (main page, optional ?q= search)
  // - /blog/artigo/:slug (individual article)
  // - /blog/categoria/:categoria (category page)
  const navigate = useNavigate();
  const { slug, categoria } = useParams<{ slug?: string; categoria?: string }>();
  const [searchParams] = useSearchParams();

  const currentSlug = slug || null;
  const currentCategory = categoria ? decodeURIComponent(categoria) : null;
  const activeSearchFilter = searchParams.get('q') || '';

  // Posts loaded from the API
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Comments for the active article (loaded from the API)
  const [comments, setComments] = useState<BlogComment[]>([]);

  // Sidebar Search input (kept in sync with the URL ?q= param)
  const [searchQuery, setSearchQuery] = useState(activeSearchFilter);

  // Modal comments state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Load posts once
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingPosts(true);
      const data = await fetchBlogPosts();
      if (active) {
        setPosts(data);
        setLoadingPosts(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Scroll to top whenever the blog route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, categoria, activeSearchFilter]);

  // Keep the search input in sync when the URL ?q= changes
  useEffect(() => {
    setSearchQuery(activeSearchFilter);
  }, [activeSearchFilter]);

  // Find the selected article if slug is active
  const activePost = useMemo(() => {
    if (!currentSlug) return null;
    return posts.find(p => p.slug === currentSlug) || null;
  }, [currentSlug, posts]);

  // Load comments for the active article
  useEffect(() => {
    if (!currentSlug) {
      setComments([]);
      return;
    }
    let active = true;
    (async () => {
      const data = await fetchPostComments(currentSlug);
      if (active) setComments(data);
    })();
    return () => { active = false; };
  }, [currentSlug]);

  // Compute navigation (prev & next posts)
  const prevNextPosts = useMemo(() => {
    if (!activePost) return { prev: null, next: null };
    const currentIndex = posts.findIndex(p => p.slug === activePost.slug);
    const prev = currentIndex > 0 ? posts[currentIndex - 1] : null;
    const next = currentIndex >= 0 && currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
    return { prev, next };
  }, [activePost, posts]);

  // Load the custom article code snippets once, then inject them only while an
  // article is open and remove them when leaving the article.
  const [articleCode, setArticleCode] = useState<AnalyticsSettings | null>(null);
  useEffect(() => {
    fetchAnalyticsSettings().then(setArticleCode).catch(() => {});
  }, []);
  useEffect(() => {
    if (articleCode && activePost) {
      applyArticleCode(articleCode);
    } else {
      clearArticleCode();
    }
    return () => clearArticleCode();
  }, [articleCode, activePost]);

  // SEO Update Trigger — title/description/canonical/OG plus JSON-LD structured
  // data following Google's guidelines (Article + BreadcrumbList).
  useEffect(() => {
    const brand = siteName || 'ImpulsioneGram';
    const origin = window.location.origin;
    const path = window.location.pathname;
    const blogUrl = `${origin}/blog`;

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

    if (activePost) {
      const canonical = `${origin}/blog/artigo/${activePost.slug}`;
      updateSEO({
        title: activePost.title,
        description: activePost.description,
        brand,
        canonical,
        image: activePost.image,
        type: 'article'
      });
      if (activePost.publishedAt) {
        upsertMeta('property', 'article:published_time', activePost.publishedAt);
      }
      (activePost.categories || []).forEach((c) => upsertMeta('property', 'article:section', c));

      const publisher: any = {
        '@type': 'Organization',
        name: brand,
        url: origin
      };
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
        articleSection: activePost.categories && activePost.categories.length ? activePost.categories : undefined,
        keywords: activePost.tags && activePost.tags.length ? activePost.tags.join(', ') : undefined,
        url: canonical
      });

      const crumbs = [
        { name: 'Início', url: origin + '/' },
        { name: 'Blog', url: blogUrl }
      ];
      if (activePost.categories && activePost.categories[0]) {
        crumbs.push({ name: activePost.categories[0], url: `${origin}/blog/categoria/${encodeURIComponent(activePost.categories[0])}` });
      }
      crumbs.push({ name: activePost.title, url: canonical });
      setJsonLd('breadcrumb', breadcrumb(crumbs));
    } else if (currentCategory) {
      const canonical = `${origin}/blog/categoria/${encodeURIComponent(currentCategory)}`;
      updateSEO({
        title: `Artigos sobre ${currentCategory}`,
        description: `Confira os melhores artigos de marketing e crescimento social na categoria ${currentCategory} do nosso Blog.`,
        brand,
        canonical
      });
      setJsonLd('article', null);
      setJsonLd('breadcrumb', breadcrumb([
        { name: 'Início', url: origin + '/' },
        { name: 'Blog', url: blogUrl },
        { name: currentCategory, url: canonical }
      ]));
    } else {
      const canonical = activeSearchFilter ? `${blogUrl}` : `${origin}${path}`;
      updateSEO({
        title: 'Blog de Marketing de Redes Sociais e Engajamento',
        description: `Dicas, estratégias, guias práticos e tendências de Instagram, TikTok e Marketing Digital no Blog oficial ${brand}.`,
        brand,
        canonical
      });
      setJsonLd('article', null);
      setJsonLd('breadcrumb', breadcrumb([
        { name: 'Início', url: origin + '/' },
        { name: 'Blog', url: blogUrl }
      ]));
    }
  }, [activePost, currentCategory, activeSearchFilter, siteName, logoUrl]);

  // Remove blog-specific structured data when leaving the blog entirely.
  useEffect(() => {
    return () => {
      setJsonLd('article', null);
      setJsonLd('breadcrumb', null);
    };
  }, []);

  // Filter posts based on Category or Search queries
  const filteredPosts = useMemo(() => {
    let list = posts;

    if (currentCategory) {
      list = list.filter(p => (p.categories || []).some(c => c.toLowerCase() === currentCategory.toLowerCase()));
    }

    if (activeSearchFilter) {
      const q = activeSearchFilter.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [posts, currentCategory, activeSearchFilter]);

  // Count posts per category for the sidebar
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach(p => {
      (p.categories || []).forEach(c => {
        counts[c] = (counts[c] || 0) + 1;
      });
    });
    return counts;
  }, [posts]);

  // Handle category clicks
  const navigateToCategory = (catName: string) => {
    navigate(`/blog/categoria/${encodeURIComponent(catName)}`);
  };

  // Handle article clicks
  const navigateToArticle = (postSlug: string) => {
    navigate(`/blog/artigo/${postSlug}`);
  };

  // Handle search submission (drives the ?q= URL param)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/blog?q=${encodeURIComponent(q)}` : '/blog');
  };

  // Clear search filter
  const handleClearSearch = () => {
    setSearchQuery('');
    navigate('/blog');
  };

  // Handle adding comments via Modal (persisted on the server)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentEmail.trim() || !commentText.trim() || !currentSlug) return;

    setIsSubmittingComment(true);
    setCommentError('');
    const token = await getRecaptchaToken('comment');
    const created = await postComment(currentSlug, commentName.trim(), commentEmail.trim(), commentText.trim(), token);
    setIsSubmittingComment(false);

    if (created) {
      setComments(prev => [...prev, created]);
      setCommentSuccess(true);
      setCommentText('');
      setTimeout(() => {
        setCommentSuccess(false);
        setIsCommentModalOpen(false);
      }, 2000);
    } else {
      setCommentError('Não foi possível enviar o comentário. Verifique sua conexão e tente novamente.');
    }
  };

  // Clean form and open modal
  const openNewCommentModal = () => {
    setCommentSuccess(false);
    setIsCommentModalOpen(true);
  };

  // Static items list for Sidebar
  const recentPopularPosts = useMemo(() => posts.slice(0, 3), [posts]);

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen py-24 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto mt-6">

        {/* Blog Breadcrumbs & Header Banner */}
        <div className="mb-10 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-slate-500 mb-3 bg-white border border-slate-200/60 inline-flex px-3 py-1.5 rounded-full shadow-sm">
            <button onClick={() => onNavigate('inicio')} className="hover:text-primary transition-colors cursor-pointer">Início</button>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <button onClick={() => navigate('/blog')} className="hover:text-primary transition-colors cursor-pointer">Blog</button>

            {currentCategory && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="text-primary font-bold">Categoria: {currentCategory}</span>
              </>
            )}

            {activePost && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <button onClick={() => navigateToCategory(activePost.categories[0])} className="hover:text-primary transition-colors cursor-pointer">{activePost.categories[0]}</button>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="text-primary font-bold max-w-xs truncate hidden md:inline">{activePost.title}</span>
              </>
            )}
          </div>

          {!activePost && (
            <div className="mt-4">
              <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-none">
                Blog <span className="text-primary">ImpulsioneGram</span>
              </h1>
              <p className="mt-3 text-slate-600 font-medium text-sm sm:text-base max-w-2xl">
                O seu portal completo para dominar o algoritmo, engajar sua audiência, explodir seu alcance e faturar mais com as redes sociais.
              </p>
            </div>
          )}
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: MAIN CONTENT (8 columns) */}
          <main className="lg:col-span-8 space-y-8">

            {loadingPosts ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : currentSlug && !activePost ? (
              <div className="text-center py-16 px-6 bg-white border border-slate-100 rounded-3xl shadow-md">
                <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-display font-black text-xl text-slate-950 mb-1">Artigo não encontrado</h3>
                <button onClick={() => navigate('/blog')} className="mt-4 bg-primary text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors cursor-pointer">
                  Ver Todos os Artigos
                </button>
              </div>
            ) : activePost ? (
              /* --- ARTICLE DETAIL PAGE --- */
              <article className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-fade-in" id="individual-article-view">
                {/* Header Image */}
                <div className="relative h-64 sm:h-96 w-full overflow-hidden">
                  <img
                    src={activePost.image}
                    alt={activePost.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                    {(activePost.categories || []).map(cat => (
                      <button
                        key={cat}
                        onClick={() => navigateToCategory(cat)}
                        className="bg-primary/95 hover:bg-primary text-white font-black text-xs uppercase px-3.5 py-1.5 rounded-full shadow-md tracking-wider cursor-pointer"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meta details */}
                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 mb-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" />
                      <span>{activePost.author}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{activePost.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{activePost.readTime} de leitura</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-950 tracking-tight leading-tight mb-6">
                    {activePost.title}
                  </h1>

                  {/* Article content (HTML) */}
                  <div
                    className="blog-content text-slate-700 leading-relaxed font-medium text-sm sm:text-base"
                    dangerouslySetInnerHTML={{ __html: activePost.content }}
                  />

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100">
                    {(activePost.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        onClick={() => navigate(`/blog?q=${encodeURIComponent(tag)}`)}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Previous & Next Article Navigation Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 pt-8 border-t border-slate-150">

                    {prevNextPosts.prev ? (
                      <button
                        onClick={() => navigateToArticle(prevNextPosts.prev!.slug)}
                        className="text-left p-4 rounded-2xl border border-slate-100 hover:border-primary/20 hover:bg-slate-50/50 transition-all cursor-pointer group flex items-start gap-3"
                        id="prev-article-nav"
                      >
                        <ArrowLeft className="h-5 w-5 text-slate-400 mt-1 group-hover:-translate-x-1 transition-transform" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Artigo Anterior</span>
                          <span className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 group-hover:text-primary transition-colors">
                            {prevNextPosts.prev.title}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200/60 bg-slate-50/30 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        Primeiro artigo do blog
                      </div>
                    )}

                    {prevNextPosts.next ? (
                      <button
                        onClick={() => navigateToArticle(prevNextPosts.next!.slug)}
                        className="text-right p-4 rounded-2xl border border-slate-100 hover:border-primary/20 hover:bg-slate-50/50 transition-all cursor-pointer group flex items-start justify-end gap-3"
                        id="next-article-nav"
                      >
                        <div className="order-1 sm:order-none">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Próximo Artigo</span>
                          <span className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 group-hover:text-primary transition-colors">
                            {prevNextPosts.next.title}
                          </span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 mt-1 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200/60 bg-slate-50/30 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        Último artigo do blog
                      </div>
                    )}

                  </div>

                  {/* --- COMMENTS SECTION --- */}
                  <div className="mt-12 pt-8 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <h3 className="font-display font-black text-xl text-slate-950">
                          Comentários ({comments.length})
                        </h3>
                      </div>

                      <button
                        onClick={openNewCommentModal}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        id="open-comment-modal-btn"
                      >
                        <Plus className="h-4 w-4" />
                        Comentar
                      </button>
                    </div>

                    {comments.length === 0 ? (
                      <div className="text-center py-10 px-4 bg-slate-50/80 rounded-2xl border border-slate-200/40">
                        <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 font-semibold text-xs">Seja o primeiro a deixar um comentário sobre este artigo!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-5 rounded-2xl transition-all">
                            <div className="flex justify-between items-center mb-2.5">
                              <span className="font-bold text-sm text-slate-900">{comment.author}</span>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100/80 px-2 py-1 rounded">{formatDateTime(comment.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <p className="text-slate-600 font-medium text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </article>
            ) : (
              /* --- GRID LIST VIEW PAGE & CATEGORIES --- */
              <div className="space-y-6">

                {(activeSearchFilter || currentCategory) && (
                  <div className="flex items-center justify-between bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                      <span>Exibindo resultados para:</span>
                      {currentCategory && (
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                          Categoria: {currentCategory}
                        </span>
                      )}
                      {activeSearchFilter && (
                        <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full font-bold">
                          Busca: "{activeSearchFilter}"
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleClearSearch}
                      className="text-slate-400 hover:text-red-500 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Limpar Filtros
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {filteredPosts.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-white border border-slate-100 rounded-3xl shadow-md">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-display font-black text-xl text-slate-950 mb-1">Nenhum artigo encontrado</h3>
                    <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto">
                      Não encontramos artigos que correspondam aos filtros ativos. Tente pesquisar por outros termos.
                    </p>
                    <button
                      onClick={handleClearSearch}
                      className="mt-4 bg-primary text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors cursor-pointer"
                    >
                      Ver Todos os Artigos
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="blog-articles-grid">
                    {filteredPosts.map((post) => (
                      <article
                        key={post.slug}
                        className="bg-white rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group h-full"
                      >
                        <div>
                          <div className="relative h-48 w-full overflow-hidden cursor-pointer" onClick={() => navigateToArticle(post.slug)}>
                            <img
                              src={post.image}
                              alt={post.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3">
                              <span className="bg-white/95 text-slate-900 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded shadow">
                                {post.categories[0]}
                              </span>
                            </div>
                          </div>

                          <div className="p-5 sm:p-6">
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 mb-2.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {post.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {post.readTime}
                              </span>
                            </div>

                            <h3
                              className="font-display font-black text-base sm:text-lg text-slate-950 tracking-tight leading-snug mb-2 group-hover:text-primary transition-colors cursor-pointer line-clamp-2"
                              onClick={() => navigateToArticle(post.slug)}
                            >
                              {post.title}
                            </h3>

                            <p className="text-slate-500 font-medium text-xs leading-relaxed line-clamp-3">
                              {post.description}
                            </p>
                          </div>
                        </div>

                        <div className="p-5 sm:p-6 pt-0">
                          <button
                            onClick={() => navigateToArticle(post.slug)}
                            className="w-full bg-slate-50 hover:bg-primary hover:text-white text-slate-800 font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Ler Artigo Completo
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

              </div>
            )}

          </main>

          {/* RIGHT COLUMN: SIDEBAR (4 columns) */}
          <aside className="lg:col-span-4 space-y-6">

            {/* 1. Search Widget */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-md">
              <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Search className="h-4 w-4 text-primary" />
                Buscar no Blog
              </h4>

              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs rounded-2xl py-3 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary font-semibold transition-all"
                  id="sidebar-search-input"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                  title="Pesquisar"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* 2. Categories Widget */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-md">
              <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <Bookmark className="h-4 w-4 text-primary" />
                Categorias
              </h4>

              <div className="flex flex-col gap-2">
                {Object.keys(categoryCounts).map((catName) => {
                  const count = categoryCounts[catName];
                  const isCurrent = currentCategory?.toLowerCase() === catName.toLowerCase();
                  return (
                    <button
                      key={catName}
                      onClick={() => navigateToCategory(catName)}
                      className={`flex justify-between items-center text-left text-xs sm:text-sm font-semibold p-2.5 rounded-xl transition-all cursor-pointer ${isCurrent ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:text-primary hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <ChevronRight className="h-4 w-4 opacity-70" />
                        {catName}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Recent Posts */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-md">
              <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" />
                Artigos Recentes
              </h4>

              <div className="space-y-4">
                {recentPopularPosts.map((p) => (
                  <div
                    key={p.slug}
                    className="flex gap-3 group cursor-pointer"
                    onClick={() => navigateToArticle(p.slug)}
                  >
                    <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                      <img
                        src={p.image}
                        alt={p.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-primary block">{p.categories[0]}</span>
                      <h5 className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {p.title}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Sales CTA Widget */}
            <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/20 rounded-full blur-xl"></div>

              <div className="relative z-10 space-y-4 text-center sm:text-left">
                <span className="bg-primary/25 border border-primary/40 text-primary-light text-[10px] font-black px-3 py-1.5 rounded-full inline-block uppercase tracking-wider">
                  Promoção Ativa
                </span>

                <h4 className="font-display font-black text-lg tracking-tight leading-snug">
                  Quer acelerar o crescimento das suas redes?
                </h4>

                <p className="text-slate-300 text-xs font-medium leading-relaxed">
                  Adquira seguidores, curtidas e visualizações estáveis com entrega imediata e contas 100% brasileiras e reais.
                </p>

                <button
                  onClick={() => onNavigate('servicos')}
                  className="w-full bg-white hover:bg-primary hover:text-white text-slate-950 font-black text-xs py-3 rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  <Flame className="h-4 w-4 animate-pulse" />
                  Impulsionar Perfil Agora
                </button>
              </div>
            </div>

          </aside>

        </div>

      </div>

      {/* --- WRITE COMMENT MODAL --- */}
      {isCommentModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 cursor-pointer"
          id="comment-modal-overlay"
          onClick={() => setIsCommentModalOpen(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden relative animate-fade-in cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white p-6 pb-5 relative flex items-center gap-3">
              <button
                onClick={() => setIsCommentModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer z-10 flex items-center justify-center"
                aria-label="Fechar Modal"
                id="close-comment-modal"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="bg-primary/20 p-2.5 rounded-xl text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-base tracking-tight">Deixe seu Comentário</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Sua opinião é muito importante</p>
              </div>
            </div>

            <div className="p-6">
              {commentSuccess ? (
                <div className="text-center py-8 space-y-3">
                  <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="h-6 w-6" />
                  </div>
                  <h4 className="font-display font-black text-lg text-slate-900">Comentário Enviado!</h4>
                  <p className="text-slate-500 font-semibold text-xs">
                    Seu comentário foi registrado com sucesso e já está disponível para visualização.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAddComment} className="space-y-4">
                  {commentError && (
                    <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{commentError}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="comment-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Nome Completo</label>
                      <input
                        type="text"
                        id="comment-name"
                        required
                        placeholder="Ex: Pedro Silva"
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-semibold transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="comment-email" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">E-mail</label>
                      <input
                        type="email"
                        id="comment-email"
                        required
                        placeholder="Ex: pedro@email.com"
                        value={commentEmail}
                        onChange={(e) => setCommentEmail(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-semibold transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="comment-text" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Seu Comentário</label>
                    <textarea
                      id="comment-text"
                      required
                      rows={4}
                      placeholder="Escreva aqui suas dúvidas, feedback ou opiniões sobre este artigo..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-semibold transition-all"
                    ></textarea>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingComment}
                      className="w-full bg-primary hover:bg-purple-700 text-white font-black text-xs py-3 rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider disabled:opacity-50"
                    >
                      {isSubmittingComment ? (
                        <>Enviando...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Publicar Comentário
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCommentModalOpen(false)}
                      className="w-full text-[10px] font-bold text-slate-400 hover:text-red-500 py-2.5 text-center transition-colors cursor-pointer block mt-1"
                    >
                      Cancelar e fechar
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
