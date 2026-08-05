// Blog do tema "Turbo".
//
// A referência trata o blog como um segundo sistema visual, mais moderno que o
// site: outra família tipográfica, outro roxo (#8514CF), raio 21 e container de
// 1600px. Esse sistema vive fechado em .tb-blog (theme.css) para não vazar para
// o resto do tema — na prática, dois temas que convivem.
//
// O header e o rodapé continuam sendo os do site, porque a navegação precisa
// ser a mesma; só o miolo muda de linguagem.
//
// Dados, filtros, comentários e SEO vêm de useBlogData: nenhuma chamada de API
// mora aqui.

import { useNavigate } from 'react-router-dom';
import { ThemeBlogProps } from '../../types';
import { useBlogData } from '../../../site/hooks/useBlogData';
import { formatDateTime } from '../../../utils/datetime';
import TurboHeader from '../chrome/Header';
import TurboFooter from '../chrome/Footer';
import TurboFab from '../chrome/Fab';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Search, X } from 'lucide-react';

export default function TurboBlogView({ company, siteName, logoUrl, currentUser }: ThemeBlogProps) {
  const navigate = useNavigate();
  const blog = useBlogData({ siteName, logoUrl });

  const goHome = (sectionId: string) => {
    navigate('/');
    setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  const { activePost, filteredPosts, loadingPosts, currentCategory, activeSearchFilter, prevNextPosts, comments } = blog;

  return (
    <div className="tb-page min-h-screen flex flex-col">
      <div className="tb-hero-grad">
        <TurboHeader
          siteName={siteName}
          logoUrl={logoUrl}
          currentUser={currentUser}
          onNavigate={goHome}
          contactEmail={company?.contactEmail}
        />
        <div className="tb-wrap pt-8 pb-14">
          <span className="tb-kicker">Blog</span>
          <h1 className="tb-title mt-2.5" style={{ maxWidth: 820 }}>
            {activePost
              ? activePost.title
              : currentCategory
                ? `Artigos sobre ${currentCategory}`
                : 'Estratégias de crescimento para as suas redes'}
          </h1>
          {!activePost && (
            <p className="tb-lead mt-4" style={{ maxWidth: 640, fontSize: 18 }}>
              Testes, bastidores e o que realmente move o ponteiro em cada rede social.
            </p>
          )}
        </div>
      </div>

      {/* A partir daqui, o sistema visual é o do blog. */}
      <main className="tb-blog flex-1 py-12 md:py-16">
        {activePost ? (
          /* ---------- Artigo ---------- */
          <article className="tb-blog-wrap">
            <div className="max-w-[860px] mx-auto">
              <button onClick={() => navigate('/blog')} className="tb-btn tb-btn-ghost !min-h-[42px] !px-5">
                <ArrowLeft className="h-4 w-4" /> Voltar ao blog
              </button>

              <p className="text-sm font-bold mt-8" style={{ color: 'var(--tb-muted)' }}>
                {activePost.publishedAt
                  ? <time dateTime={activePost.publishedAt}>{formatDateTime(activePost.publishedAt)}</time>
                  : activePost.date}
                {activePost.author && <> · {activePost.author}</>}
                {activePost.readTime && <> · {activePost.readTime}</>}
              </p>

              <h2 className="tb-blog-title mt-3" style={{ fontSize: 'clamp(30px, 4.4vw, 46px)', lineHeight: 1.12 }}>
                {activePost.title}
              </h2>

              {activePost.categories?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {activePost.categories.map(c => (
                    <button key={c} className="tb-chip" onClick={() => blog.goToCategory(c)}>{c}</button>
                  ))}
                </div>
              )}

              {activePost.image && (
                <img
                  src={activePost.image}
                  alt={activePost.title}
                  className="w-full aspect-[3/2] object-cover mt-8"
                  style={{ borderRadius: 21 }}
                />
              )}

              <div className="blog-content mt-10" dangerouslySetInnerHTML={{ __html: activePost.content }} />

              {activePost.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-10">
                  {activePost.tags.map(t => <span key={t} className="tb-chip">#{t}</span>)}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
                {prevNextPosts.prev && (
                  <button onClick={() => blog.goToArticle(prevNextPosts.prev!.slug)} className="tb-blog-card p-5 text-left cursor-pointer">
                    <span className="text-sm font-black" style={{ color: 'var(--tb-muted)' }}>
                      <ArrowLeft className="h-3 w-3 inline" /> Anterior
                    </span>
                    <span className="tb-blog-title block mt-1">{prevNextPosts.prev.title}</span>
                  </button>
                )}
                {prevNextPosts.next && (
                  <button onClick={() => blog.goToArticle(prevNextPosts.next!.slug)} className="tb-blog-card p-5 text-left sm:text-right sm:ml-auto sm:w-full cursor-pointer">
                    <span className="text-sm font-black" style={{ color: 'var(--tb-muted)' }}>
                      Próximo <ArrowRight className="h-3 w-3 inline" />
                    </span>
                    <span className="tb-blog-title block mt-1">{prevNextPosts.next.title}</span>
                  </button>
                )}
              </div>

              {/* Comentários */}
              <section className="mt-14">
                <h2 className="tb-blog-title" style={{ fontSize: 26 }}>
                  Comentários {comments.length > 0 && <span style={{ color: 'var(--tb-muted)' }}>({comments.length})</span>}
                </h2>

                {comments.length === 0 && (
                  <p className="mt-3" style={{ color: 'var(--tb-body)' }}>Seja o primeiro a comentar.</p>
                )}

                <div className="space-y-4 mt-6">
                  {comments.map(c => (
                    <div key={c.id} className="tb-blog-card p-5">
                      <p className="font-black" style={{ color: 'var(--tb-ink)' }}>{c.author}</p>
                      <p className="text-sm" style={{ color: 'var(--tb-muted)' }}>{formatDateTime(c.createdAt)}</p>
                      <p className="mt-3 whitespace-pre-line" style={{ color: 'var(--tb-body)', lineHeight: 1.65 }}>{c.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={blog.submitComment} className="tb-blog-card p-6 md:p-8 mt-8 space-y-4">
                  <h3 className="tb-blog-title" style={{ fontSize: 21 }}>Deixe seu comentário</h3>

                  {blog.submitted && (
                    <p className="flex items-center gap-2 font-bold" style={{ color: 'var(--tb-success)' }}>
                      <Check className="h-4 w-4" /> Comentário enviado! Ele aparece após aprovação.
                    </p>
                  )}
                  {blog.commentError && (
                    <p className="flex items-center gap-2 font-bold" style={{ color: 'var(--tb-danger)' }}>
                      <AlertCircle className="h-4 w-4" /> {blog.commentError}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="tb-kicker mb-1.5">Nome</span>
                      <input className="tb-field" value={blog.draft.name} onChange={e => blog.setDraftField('name', e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="tb-kicker mb-1.5">E-mail</span>
                      <input className="tb-field" type="email" value={blog.draft.email} onChange={e => blog.setDraftField('email', e.target.value)} />
                    </label>
                  </div>
                  <label className="block">
                    <span className="tb-kicker mb-1.5">Comentário</span>
                    <textarea rows={4} className="tb-field" value={blog.draft.text} onChange={e => blog.setDraftField('text', e.target.value)} />
                  </label>
                  <button type="submit" disabled={blog.submitting} className="tb-btn">
                    {blog.submitting ? 'Enviando…' : 'Enviar comentário'}
                  </button>
                </form>
              </section>
            </div>
          </article>
        ) : (
          /* ---------- Listagem ---------- */
          <section className="tb-blog-wrap">
            <form onSubmit={blog.submitSearch} className="flex gap-2 max-w-lg mx-auto">
              <input
                className="tb-field"
                value={blog.searchQuery}
                onChange={e => blog.setSearchQuery(e.target.value)}
                placeholder="Buscar artigos…"
                aria-label="Buscar artigos"
              />
              <button type="submit" className="tb-btn !px-5" aria-label="Buscar">
                <Search className="h-4 w-4" />
              </button>
            </form>

            {(activeSearchFilter || currentCategory) && (
              <div className="flex justify-center mt-4">
                <button onClick={blog.clearSearch} className="tb-chip">
                  <X className="h-3 w-3" />
                  {activeSearchFilter ? `Busca: ${activeSearchFilter}` : `Categoria: ${currentCategory}`}
                </button>
              </div>
            )}

            {Object.keys(blog.categoryCounts).length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {Object.entries(blog.categoryCounts).map(([name, count]) => (
                  <button key={name} className="tb-chip" aria-pressed={currentCategory === name} onClick={() => blog.goToCategory(name)}>
                    {name} <span style={{ opacity: 0.7 }}>({count})</span>
                  </button>
                ))}
              </div>
            )}

            {loadingPosts ? (
              <p className="text-center mt-14" style={{ color: 'var(--tb-body)' }}>Carregando artigos…</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-center mt-14" style={{ color: 'var(--tb-body)' }}>Nenhum artigo encontrado.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-12">
                {filteredPosts.map(post => (
                  <article key={post.slug} className="tb-blog-card flex flex-col">
                    {post.image && (
                      <button onClick={() => blog.goToArticle(post.slug)} className="block w-full cursor-pointer" aria-label={post.title}>
                        <img src={post.image} alt={post.title} className="w-full aspect-[3/2] object-cover" />
                      </button>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <h2 className="tb-blog-title" style={{ fontSize: 20, lineHeight: 1.25 }}>
                        <button onClick={() => blog.goToArticle(post.slug)} className="text-left cursor-pointer">
                          {post.title}
                        </button>
                      </h2>
                      <p className="mt-3 flex-1 text-[15px]" style={{ color: 'var(--tb-body)', lineHeight: 1.6 }}>{post.description}</p>
                      <div className="flex items-center justify-between mt-5">
                        <span className="text-sm" style={{ color: 'var(--tb-muted)' }}>
                          {post.date}{post.readTime && ` · ${post.readTime}`}
                        </span>
                        <button
                          onClick={() => blog.goToArticle(post.slug)}
                          className="font-black cursor-pointer"
                          style={{ color: 'var(--tb-blog-purple)' }}
                        >
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

      <TurboFooter siteName={siteName} logoUrl={logoUrl} company={company} onNavigate={goHome} />
      <TurboFab company={company} />
    </div>
  );
}
