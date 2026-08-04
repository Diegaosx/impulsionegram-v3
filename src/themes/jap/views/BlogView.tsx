// Blog do tema "Painel", com marcação própria.
//
// Todos os dados, filtros, comentários e SEO vêm de useBlogData — este arquivo
// não faz nenhuma chamada de API e não importa nada de outro tema.
//
// Layout seguindo a referência: listagem em grade de 3 colunas com card sem
// contêiner visual, e artigo em coluna centralizada com título grande e capa
// 3:2.

import { useNavigate } from 'react-router-dom';
import { ThemeBlogProps } from '../../types';
import { useBlogData } from '../../../site/hooks/useBlogData';
import { formatDateTime } from '../../../utils/datetime';
import JapHeader from '../chrome/Header';
import JapFooter from '../chrome/Footer';
import { ArrowLeft, ArrowRight, Search, X, MessageSquare, Check, AlertCircle } from 'lucide-react';

export default function JapBlogView({ company, siteName, logoUrl }: ThemeBlogProps) {
  const navigate = useNavigate();
  const blog = useBlogData({ siteName, logoUrl });

  const goHome = (sectionId: string) => {
    navigate('/');
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  const { activePost, filteredPosts, loadingPosts, currentCategory, activeSearchFilter, prevNextPosts, comments } = blog;

  return (
    <div className="jap-page min-h-screen flex flex-col">
      <JapHeader siteName={siteName} logoUrl={logoUrl} onNavigate={goHome} />

      <main className="pt-[71px] md:pt-[91px] lg:pt-[111px] flex-1">
        {activePost ? (
          /* ---------- Artigo ---------- */
          <article className="py-[30px] md:py-[50px] lg:py-[90px]">
            <div className="max-w-[960px] mx-auto px-6 lg:px-3">
              <button onClick={() => navigate('/blog')} className="jap-btn jap-btn-sm jap-btn-outline mb-8">
                <ArrowLeft className="h-4 w-4" /> Voltar ao blog
              </button>

              <p className="text-xl font-light" style={{ color: 'var(--jap-body)' }}>
                {activePost.publishedAt ? <time dateTime={activePost.publishedAt}>{formatDateTime(activePost.publishedAt)}</time> : activePost.date}
                {activePost.author && <> · {activePost.author}</>}
                {activePost.readTime && <> · {activePost.readTime}</>}
              </p>

              <h1 className="font-bold mt-4" style={{ color: 'var(--jap-ink)', fontSize: 'clamp(26px, 4vw, 55px)', lineHeight: 1.2 }}>
                {activePost.title}
              </h1>

              {activePost.categories?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {activePost.categories.map(c => (
                    <button key={c} className="jap-chip" onClick={() => blog.goToCategory(c)}>{c}</button>
                  ))}
                </div>
              )}

              {activePost.image && (
                <img src={activePost.image} alt={activePost.title}
                  className="w-full aspect-[3/2] object-cover rounded-2xl mt-8" style={{ boxShadow: 'var(--jap-shadow-card)' }} />
              )}

              <div className="blog-content mt-10" dangerouslySetInnerHTML={{ __html: activePost.content }} />

              {activePost.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-10">
                  {activePost.tags.map(t => <span key={t} className="jap-chip">#{t}</span>)}
                </div>
              )}

              {/* Navegação entre artigos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
                {prevNextPosts.prev && (
                  <button onClick={() => blog.goToArticle(prevNextPosts.prev!.slug)} className="jap-card p-5 text-left">
                    <span className="text-xs uppercase font-bold" style={{ color: 'var(--jap-muted)' }}>
                      <ArrowLeft className="h-3 w-3 inline" /> Anterior
                    </span>
                    <span className="block font-bold mt-1" style={{ color: 'var(--jap-ink)' }}>{prevNextPosts.prev.title}</span>
                  </button>
                )}
                {prevNextPosts.next && (
                  <button onClick={() => blog.goToArticle(prevNextPosts.next!.slug)} className="jap-card p-5 text-left sm:text-right sm:ml-auto sm:w-full">
                    <span className="text-xs uppercase font-bold" style={{ color: 'var(--jap-muted)' }}>
                      Próximo <ArrowRight className="h-3 w-3 inline" />
                    </span>
                    <span className="block font-bold mt-1" style={{ color: 'var(--jap-ink)' }}>{prevNextPosts.next.title}</span>
                  </button>
                )}
              </div>

              {/* Comentários */}
              <section className="mt-14">
                <h2 className="font-bold text-2xl" style={{ color: 'var(--jap-ink)' }}>
                  Comentários {comments.length > 0 && <span style={{ color: 'var(--jap-muted)' }}>({comments.length})</span>}
                </h2>

                {comments.length === 0 && (
                  <p className="text-sm mt-3" style={{ color: 'var(--jap-body)' }}>Seja o primeiro a comentar.</p>
                )}

                <div className="space-y-4 mt-6">
                  {comments.map(c => (
                    <div key={c.id} className="jap-card p-5">
                      <p className="font-bold" style={{ color: 'var(--jap-ink)' }}>{c.author}</p>
                      <p className="text-xs" style={{ color: 'var(--jap-muted)' }}>{formatDateTime(c.createdAt)}</p>
                      <p className="text-base mt-3 whitespace-pre-line" style={{ color: 'var(--jap-body)' }}>{c.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={blog.submitComment} className="jap-card-tint p-5 md:p-10 mt-8 space-y-4">
                  <h3 className="font-bold text-xl" style={{ color: 'var(--jap-ink)' }}>Deixe seu comentário</h3>

                  {blog.submitted && (
                    <p className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--jap-success)' }}>
                      <Check className="h-4 w-4" /> Comentário enviado! Ele aparece após aprovação.
                    </p>
                  )}
                  {blog.commentError && (
                    <p className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--jap-danger)' }}>
                      <AlertCircle className="h-4 w-4" /> {blog.commentError}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-xs uppercase font-bold block mb-1.5" style={{ color: 'var(--jap-muted)' }}>Nome</span>
                      <input className="jap-input" value={blog.draft.name} onChange={e => blog.setDraftField('name', e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-xs uppercase font-bold block mb-1.5" style={{ color: 'var(--jap-muted)' }}>E-mail</span>
                      <input className="jap-input" type="email" value={blog.draft.email} onChange={e => blog.setDraftField('email', e.target.value)} />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-xs uppercase font-bold block mb-1.5" style={{ color: 'var(--jap-muted)' }}>Comentário</span>
                    <textarea rows={4} className="jap-input !h-auto" value={blog.draft.text} onChange={e => blog.setDraftField('text', e.target.value)} />
                  </label>
                  <button type="submit" disabled={blog.submitting} className="jap-btn jap-btn-primary disabled:opacity-50">
                    <MessageSquare className="h-4 w-4" /> {blog.submitting ? 'Enviando…' : 'Enviar comentário'}
                  </button>
                </form>
              </section>
            </div>
          </article>
        ) : (
          /* ---------- Listagem ---------- */
          <section className="py-[30px] md:py-[50px] lg:py-[90px]">
            <div className="max-w-[1320px] mx-auto px-6 lg:px-3">
              <h1 className="text-center font-bold" style={{ color: 'var(--jap-ink)', fontSize: 'clamp(26px, 4vw, 55px)', lineHeight: 1.2 }}>
                {currentCategory ? `Artigos sobre ${currentCategory}` : `Blog ${siteName || 'ImpulsioneGram'}`}
              </h1>
              <p className="text-center mt-4 text-base" style={{ color: 'var(--jap-body)' }}>
                Dicas e estratégias de crescimento para as suas redes sociais.
              </p>

              <form onSubmit={blog.submitSearch} className="flex gap-2 max-w-lg mx-auto mt-8">
                <input
                  className="jap-input"
                  value={blog.searchQuery}
                  onChange={e => blog.setSearchQuery(e.target.value)}
                  placeholder="Buscar artigos…"
                  aria-label="Buscar artigos"
                />
                <button type="submit" className="jap-btn jap-btn-primary !px-4" aria-label="Buscar">
                  <Search className="h-4 w-4" />
                </button>
              </form>

              {(activeSearchFilter || currentCategory) && (
                <div className="flex justify-center mt-4">
                  <button onClick={blog.clearSearch} className="jap-chip">
                    <X className="h-3 w-3" />
                    {activeSearchFilter ? `Busca: ${activeSearchFilter}` : `Categoria: ${currentCategory}`}
                  </button>
                </div>
              )}

              {Object.keys(blog.categoryCounts).length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {Object.entries(blog.categoryCounts).map(([name, count]) => (
                    <button key={name} className="jap-chip" aria-pressed={currentCategory === name} onClick={() => blog.goToCategory(name)}>
                      {name} <span style={{ opacity: 0.7 }}>({count})</span>
                    </button>
                  ))}
                </div>
              )}

              {loadingPosts ? (
                <p className="text-center mt-14 text-sm" style={{ color: 'var(--jap-body)' }}>Carregando artigos…</p>
              ) : filteredPosts.length === 0 ? (
                <p className="text-center mt-14 text-sm" style={{ color: 'var(--jap-body)' }}>
                  Nenhum artigo encontrado.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 gap-y-[70px] mt-14">
                  {filteredPosts.map(post => (
                    <article key={post.slug}>
                      {post.image && (
                        <button onClick={() => blog.goToArticle(post.slug)} className="block w-full cursor-pointer" aria-label={post.title}>
                          <img src={post.image} alt={post.title} className="w-full aspect-[3/2] object-cover" />
                        </button>
                      )}
                      <h2 className="font-bold mt-6" style={{ fontSize: 'clamp(20px, 2vw, 32px)', lineHeight: 1.2 }}>
                        <button onClick={() => blog.goToArticle(post.slug)} className="text-left underline cursor-pointer" style={{ color: 'var(--jap-blue)' }}>
                          {post.title}
                        </button>
                      </h2>
                      <p className="text-base mt-3" style={{ color: 'var(--jap-body)' }}>
                        {post.description}{' '}
                        <button onClick={() => blog.goToArticle(post.slug)} className="underline cursor-pointer" style={{ color: 'var(--jap-blue)' }}>
                          ler mais
                        </button>
                      </p>
                      <p className="text-xs mt-3" style={{ color: 'var(--jap-muted)' }}>
                        {post.date}{post.readTime && ` · ${post.readTime}`}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <JapFooter siteName={siteName} logoUrl={logoUrl} company={company} onNavigate={goHome} />
    </div>
  );
}
