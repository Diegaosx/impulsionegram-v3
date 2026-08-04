// Dados e navegação do blog.
//
// Headless: rotas, posts, comentários, filtros, taxonomia e o envio de
// comentário (com reCAPTCHA) vivem aqui, para um tema só decidir a marcação.
// Também cuida da injeção do código customizado por artigo e do SEO.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AnalyticsSettings, BlogComment, BlogPost,
  fetchAnalyticsSettings, fetchBlogPosts, fetchPostComments, postComment
} from '../../utils/storage';
import { getRecaptchaToken } from '../../utils/recaptcha';
import { applyArticleCode, clearArticleCode } from '../../utils/codeInjection';
import { useBlogSeo } from './useBlogSeo';

export interface CommentDraft {
  name: string;
  email: string;
  text: string;
}

export function useBlogData({ siteName, logoUrl }: { siteName?: string; logoUrl?: string }) {
  const navigate = useNavigate();
  const { slug, categoria } = useParams<{ slug?: string; categoria?: string }>();
  const [searchParams] = useSearchParams();

  const currentSlug = slug || null;
  const currentCategory = categoria ? decodeURIComponent(categoria) : null;
  const activeSearchFilter = searchParams.get('q') || '';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [searchQuery, setSearchQuery] = useState(activeSearchFilter);

  // Formulário de comentário.
  const [draft, setDraft] = useState<CommentDraft>({ name: '', email: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [commentError, setCommentError] = useState('');

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

  // Volta ao topo a cada mudança de rota dentro do blog.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, categoria, activeSearchFilter]);

  // Mantém o campo de busca em sincronia com o ?q= da URL.
  useEffect(() => {
    setSearchQuery(activeSearchFilter);
  }, [activeSearchFilter]);

  const activePost = useMemo(
    () => (currentSlug ? posts.find(p => p.slug === currentSlug) || null : null),
    [currentSlug, posts]
  );

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

  const prevNextPosts = useMemo(() => {
    if (!activePost) return { prev: null as BlogPost | null, next: null as BlogPost | null };
    const i = posts.findIndex(p => p.slug === activePost.slug);
    return {
      prev: i > 0 ? posts[i - 1] : null,
      next: i >= 0 && i < posts.length - 1 ? posts[i + 1] : null
    };
  }, [activePost, posts]);

  // Código customizado injetado só enquanto um artigo está aberto.
  const [articleCode, setArticleCode] = useState<AnalyticsSettings | null>(null);
  useEffect(() => {
    fetchAnalyticsSettings().then(setArticleCode).catch(() => {});
  }, []);
  useEffect(() => {
    if (articleCode && activePost) applyArticleCode(articleCode);
    else clearArticleCode();
    return () => clearArticleCode();
  }, [articleCode, activePost]);

  useBlogSeo({ activePost, currentCategory, activeSearchFilter, siteName, logoUrl });

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

  // Contagem por categoria, derivada dos posts carregados — a rota de
  // categorias do admin não é pública.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach(p => (p.categories || []).forEach(c => { counts[c] = (counts[c] || 0) + 1; }));
    return counts;
  }, [posts]);

  const recentPosts = useMemo(() => posts.slice(0, 3), [posts]);

  const goToArticle = useCallback((postSlug: string) => navigate(`/blog/artigo/${postSlug}`), [navigate]);
  const goToCategory = useCallback((name: string) => navigate(`/blog/categoria/${encodeURIComponent(name)}`), [navigate]);

  const submitSearch = useCallback((e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    const q = searchQuery.trim();
    navigate(q ? `/blog?q=${encodeURIComponent(q)}` : '/blog');
  }, [searchQuery, navigate]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    navigate('/blog');
  }, [navigate]);

  const setDraftField = useCallback(<K extends keyof CommentDraft>(key: K, value: CommentDraft[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  }, []);

  const submitComment = useCallback(async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!draft.name.trim() || !draft.email.trim() || !draft.text.trim() || !currentSlug) return;
    setSubmitting(true);
    setCommentError('');
    const token = await getRecaptchaToken('comment');
    const result = await postComment(currentSlug, draft.name.trim(), draft.email.trim(), draft.text.trim(), token);
    setSubmitting(false);
    if (result.ok) {
      // Comentários passam por aprovação, então não entram na lista na hora.
      setSubmitted(true);
      setDraft(prev => ({ ...prev, text: '' }));
    } else {
      setCommentError(result.error || 'Não foi possível enviar o comentário. Verifique sua conexão e tente novamente.');
    }
  }, [draft, currentSlug]);

  const resetCommentFeedback = useCallback(() => {
    setSubmitted(false);
    setCommentError('');
  }, []);

  return {
    // rota
    currentSlug, currentCategory, activeSearchFilter,
    // dados
    posts, loadingPosts, activePost, filteredPosts, categoryCounts, recentPosts, prevNextPosts, comments,
    // busca
    searchQuery, setSearchQuery, submitSearch, clearSearch,
    // navegação
    goToArticle, goToCategory,
    // comentário
    draft, setDraftField, submitting, submitted, commentError, submitComment, resetCommentFeedback
  };
}
