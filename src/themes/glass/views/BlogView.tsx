// Blog do tema "Cristal".
//
// A referência não tem blog. O que dá para herdar dela é o .card de vidro para
// a listagem e a coluna de 820px do FAQ como largura de leitura do artigo.
//
// Dados, filtros, comentários e SEO vêm de useBlogData — este arquivo não faz
// nenhuma chamada de API.

import { useNavigate } from 'react-router-dom';
import { ThemeBlogProps } from '../../types';
import { useBlogData } from '../../../site/hooks/useBlogData';
import { formatDateTime } from '../../../utils/datetime';
import GlassHeader from '../chrome/Header';
import GlassFooter from '../chrome/Footer';
import GlassFab from '../chrome/Fab';
import { ArrowLeft, ArrowRight, Search, X, Check, AlertCircle } from 'lucide-react';

export default function GlassBlogView({ company, siteName, logoUrl, currentUser }: ThemeBlogProps) {
  const navigate = useNavigate();
  const blog = useBlogData({ siteName, logoUrl });

  const goHome = (sectionId: string) => {
    navigate('/');
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  const { activePost, filteredPosts, loadingPosts, currentCategory, activeSearchFilter, prevNextPosts, comments } = blog;

  return (
    <div className="gl-page min-h-screen flex flex-col">
      <GlassHeader siteName={siteName} logoUrl={logoUrl} currentUser={currentUser} onNavigate={goHome} />

      <main className="flex-1">
        {activePost ? (
          /* ---------- Artigo ---------- */
          <article className="gl-wrap py-12 md:py-16">
            <div className="max-w-[820px] mx-auto">
              <button onClick={() => navigate('/blog')} className="gl-btn gl-btn-ghost !min-h-[42px] !px-5 mb-8">
                <ArrowLeft className="h-4 w-4" /> Voltar ao blog
              </button>

              <p className="text-lg" style={{ color: 'var(--gl-muted)' }}>
                {activePost.publishedAt
                  ? <time dateTime={activePost.publishedAt}>{formatDateTime(activePost.publishedAt)}</time>
                  : activePost.date}
                {activePost.author && <> · {activePost.author}</>}
                {activePost.readTime && <> · {activePost.readTime}</>}
              </p>

              <h1 className="font-bold mt-3" style={{ color: 'var(--gl-ink)', fontSize: 'clamp(34px, 5vw, 60px)', lineHeight: 1.05 }}>
                {activePost.title}
              </h1>

              {activePost.categories?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {activePost.categories.map(c => (
                    <button key={c} className="gl-chip" onClick={() => blog.goToCategory(c)}>{c}</button>
                  ))}
                </div>
              )}

              {activePost.image && (
                <img src={activePost.image} alt={activePost.title}
                  className="w-full aspect-[3/2] object-cover mt-8"
                  style={{ borderRadius: 34, boxShadow: 'var(--gl-sh-card)' }} />
              )}

              <div className="blog-content mt-10" dangerouslySetInnerHTML={{ __html: activePost.content }} />

              {activePost.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-10">
                  {activePost.tags.map(t => <span key={t} className="gl-chip">#{t}</span>)}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
                {prevNextPosts.prev && (
                  <button onClick={() => blog.goToArticle(prevNextPosts.prev!.slug)} className="gl-card p-5 text-left cursor-pointer">
                    <span className="text-sm font-black" style={{ color: 'var(--gl-muted)' }}>
                      <ArrowLeft className="h-3 w-3 inline" /> Anterior
                    </span>
                    <span className="block font-bold mt-1" style={{ color: 'var(--gl-ink)' }}>{prevNextPosts.prev.title}</span>
                  </button>
                )}
                {prevNextPosts.next && (
                  <button onClick={() => blog.goToArticle(prevNextPosts.next!.slug)} className="gl-card p-5 text-left sm:text-right sm:ml-auto sm:w-full cursor-pointer">
                    <span className="text-sm font-black" style={{ color: 'var(--gl-muted)' }}>
                      Próximo <ArrowRight className="h-3 w-3 inline" />
                    </span>
                    <span className="block font-bold mt-1" style={{ color: 'var(--gl-ink)' }}>{prevNextPosts.next.title}</span>
                  </button>
                )}
              </div>

              {/* Comentários */}
              <section className="mt-14">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--gl-ink)' }}>
                  Comentários {comments.length > 0 && <span style={{ color: 'var(--gl-muted)' }}>({comments.length})</span>}
                </h2>

                {comments.length === 0 && (
                  <p className="mt-3" style={{ color: 'var(--gl-body)' }}>Seja o primeiro a comentar.</p>
                )}

                <div className="space-y-4 mt-6">
                  {comments.map(c => (
                    <div key={c.id} className="gl-card p-5">
                      <p className="font-black" style={{ color: 'var(--gl-ink)' }}>{c.author}</p>
                      <p className="text-sm" style={{ color: 'var(--gl-muted)' }}>{formatDateTime(c.createdAt)}</p>
                      <p className="mt-3 whitespace-pre-line" style={{ color: 'var(--gl-body)', lineHeight: 1.6 }}>{c.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={blog.submitComment} className="gl-card p-6 md:p-8 mt-8 space-y-4">
                  <h3 className="text-[22px] font-bold" style={{ color: 'var(--gl-ink)' }}>Deixe seu comentário</h3>

                  {blog.submitted && (
                    <p className="flex items-center gap-2 font-bold" style={{ color: 'var(--gl-success)' }}>
                      <Check className="h-4 w-4" /> Comentário enviado! Ele aparece após aprovação.
                    </p>
                  )}
                  {blog.commentError && (
                    <p className="flex items-center gap-2 font-bold" style={{ color: 'var(--gl-danger)' }}>
                      <AlertCircle className="h-4 w-4" /> {blog.commentError}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-black block mb-1.5" style={{ color: 'var(--gl-muted)' }}>Nome</span>
                      <input className="gl-field" value={blog.draft.name} onChange={e => blog.setDraftField('name', e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-sm font-black block mb-1.5" style={{ color: 'var(--gl-muted)' }}>E-mail</span>
                      <input className="gl-field" type="email" value={blog.draft.email} onChange={e => blog.setDraftField('email', e.target.value)} />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-sm font-black block mb-1.5" style={{ color: 'var(--gl-muted)' }}>Comentário</span>
                    <textarea rows={4} className="gl-field" value={blog.draft.text} onChange={e => blog.setDraftField('text', e.target.value)} />
                  </label>
                  <button type="submit" disabled={blog.submitting} className="gl-btn">
                    {blog.submitting ? 'Enviando…' : 'Enviar comentário'}
                  </button>
                </form>
              </section>
            </div>
          </article>
        ) : (
          /* ---------- Listagem ---------- */
          <section className="gl-wrap py-12 md:py-16">
            <h1 className="text-center font-bold" style={{ color: 'var(--gl-ink)', fontSize: 'clamp(34px, 5vw, 60px)', lineHeight: 1.05 }}>
              {currentCategory
                ? <>Artigos sobre <span className="gl-accent">{currentCategory}</span></>
                : <>Blog <span className="gl-accent">{siteName || 'ImpulsioneGram'}</span></>}
            </h1>
            <p className="text-center mt-3 text-lg mx-auto" style={{ maxWidth: 640, color: 'var(--gl-body)', lineHeight: 1.55 }}>
              Dicas e estratégias de crescimento para as suas redes sociais.
            </p>

            <form onSubmit={blog.submitSearch} className="flex gap-2 max-w-lg mx-auto mt-8">
              <input
                className="gl-field"
                value={blog.searchQuery}
                onChange={e => blog.setSearchQuery(e.target.value)}
                placeholder="Buscar artigos…"
                aria-label="Buscar artigos"
              />
              <button type="submit" className="gl-btn !px-5" aria-label="Buscar">
                <Search className="h-4 w-4" />
              </button>
            </form>

            {(activeSearchFilter || currentCategory) && (
              <div className="flex justify-center mt-4">
                <button onClick={blog.clearSearch} className="gl-chip">
                  <X className="h-3 w-3" />
                  {activeSearchFilter ? `Busca: ${activeSearchFilter}` : `Categoria: ${currentCategory}`}
                </button>
              </div>
            )}

            {Object.keys(blog.categoryCounts).length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {Object.entries(blog.categoryCounts).map(([name, count]) => (
                  <button key={name} className="gl-chip" aria-pressed={currentCategory === name} onClick={() => blog.goToCategory(name)}>
                    {name} <span style={{ opacity: 0.7 }}>({count})</span>
                  </button>
                ))}
              </div>
            )}

            {loadingPosts ? (
              <p className="text-center mt-14" style={{ color: 'var(--gl-body)' }}>Carregando artigos…</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-center mt-14" style={{ color: 'var(--gl-body)' }}>Nenhum artigo encontrado.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
                {filteredPosts.map(post => (
                  <article key={post.slug} className="gl-card overflow-hidden flex flex-col">
                    {post.image && (
                      <button onClick={() => blog.goToArticle(post.slug)} className="block w-full cursor-pointer" aria-label={post.title}>
                        <img src={post.image} alt={post.title} className="w-full aspect-[3/2] object-cover" />
                      </button>
                    )}
                    <div className="p-[26px] flex flex-col flex-1">
                      <h2 className="text-[22px] font-bold" style={{ color: 'var(--gl-ink)', lineHeight: 1.2 }}>
                        <button onClick={() => blog.goToArticle(post.slug)} className="text-left cursor-pointer hover:text-[var(--gl-pink)]">
                          {post.title}
                        </button>
                      </h2>
                      <p className="mt-3 flex-1" style={{ color: 'var(--gl-body)', lineHeight: 1.55 }}>{post.description}</p>
                      <div className="flex items-center justify-between mt-5">
                        <span className="text-sm" style={{ color: 'var(--gl-muted)' }}>
                          {post.date}{post.readTime && ` · ${post.readTime}`}
                        </span>
                        <button onClick={() => blog.goToArticle(post.slug)} className="font-black cursor-pointer" style={{ color: 'var(--gl-purple)' }}>
                          Ler mais →
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <GlassFooter siteName={siteName} company={company} onNavigate={goHome} />
      <GlassFab company={company} />
    </div>
  );
}
