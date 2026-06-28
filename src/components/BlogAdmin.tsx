import { useEffect, useState, FormEvent } from 'react';
import {
  Plus, Pencil, Trash2, Save, Upload, FileText, MessageSquare,
  Eye, EyeOff, ArrowLeft, Image as ImageIcon, Tag, FolderTree, ExternalLink,
  Shield, Ban
} from 'lucide-react';
import {
  BlogPost, BlogComment,
  fetchBlogPosts, saveBlogPostToServer, deleteBlogPostFromServer,
  fetchAllComments, setCommentStatus, deleteCommentFromServer, uploadAsset,
  fetchBlogCategories, addBlogCategoryToServer, deleteBlogCategoryFromServer,
  fetchBlogTags, deleteBlogTagFromServer,
  BlockedIpRecord, fetchBlockedIps, unblockIpFromServer
} from '../utils/storage';
import { formatDateTime } from '../utils/datetime';
import ChipMultiInput from './ChipMultiInput';
import RichTextEditor from './RichTextEditor';

interface BlogAdminProps {
  triggerSuccess: (msg: string) => void;
  triggerError: (msg: string) => void;
}

interface PostForm {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  image: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
  content: string;
}

const EMPTY_FORM: PostForm = {
  slug: '', title: '', description: '', categories: [],
  image: '', author: '', date: '', readTime: '5 min', tags: [], content: ''
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function BlogAdmin({ triggerSuccess, triggerError }: BlogAdminProps) {
  const [view, setView] = useState<'posts' | 'comments' | 'taxonomy'>('posts');

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const [blockedIps, setBlockedIps] = useState<BlockedIpRecord[]>([]);

  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadPosts = async () => {
    setLoadingPosts(true);
    setPosts(await fetchBlogPosts());
    setLoadingPosts(false);
  };
  const loadComments = async () => {
    setLoadingComments(true);
    setComments(await fetchAllComments());
    setBlockedIps(await fetchBlockedIps());
    setLoadingComments(false);
  };

  const handleUnblockIp = async (ip: string) => {
    try {
      await unblockIpFromServer(ip);
      setBlockedIps(prev => prev.filter(b => b.ip !== ip));
      triggerSuccess(`IP ${ip} desbloqueado.`);
    } catch {
      triggerError('Falha ao desbloquear o IP.');
    }
  };
  const loadTaxonomy = async () => {
    setCategoriesList(await fetchBlogCategories());
    setTagsList(await fetchBlogTags());
  };

  useEffect(() => { loadPosts(); loadTaxonomy(); }, []);
  useEffect(() => { if (view === 'comments') loadComments(); }, [view]);

  const startNew = () => { setForm(EMPTY_FORM); setIsNew(true); setIsEditing(true); };

  const startEdit = (post: BlogPost) => {
    setForm({
      slug: post.slug,
      title: post.title,
      description: post.description,
      categories: post.categories || [],
      image: post.image,
      author: post.author,
      date: post.date,
      readTime: post.readTime,
      tags: post.tags || [],
      content: post.content || ''
    });
    setIsNew(false);
    setIsEditing(true);
  };

  const handleTitleChange = (value: string) => {
    setForm(prev => ({ ...prev, title: value, slug: isNew ? slugify(value) : prev.slug }));
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadAsset(file, 'blog');
      setForm(prev => ({ ...prev, image: url }));
      triggerSuccess('Imagem enviada! Clique em Salvar para aplicar.');
    } catch (e: any) {
      triggerError(e?.message || 'Falha no upload da imagem.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) {
      triggerError('Título e slug são obrigatórios.');
      return;
    }
    setIsSaving(true);
    try {
      const post: BlogPost = {
        slug: slugify(form.slug),
        title: form.title.trim(),
        description: form.description.trim(),
        content: form.content,
        categories: form.categories,
        image: form.image.trim(),
        author: form.author.trim(),
        date: form.date.trim(),
        readTime: form.readTime.trim(),
        tags: form.tags
      };
      await saveBlogPostToServer(post);
      triggerSuccess(isNew ? 'Artigo criado com sucesso!' : 'Artigo atualizado!');
      setIsEditing(false);
      await loadPosts();
      await loadTaxonomy();
    } catch (e: any) {
      triggerError(e?.message || 'Falha ao salvar o artigo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!window.confirm('Excluir este artigo? Os comentários dele também serão removidos.')) return;
    try {
      await deleteBlogPostFromServer(slug);
      triggerSuccess('Artigo removido.');
      await loadPosts();
    } catch (e: any) {
      triggerError('Falha ao excluir o artigo.');
    }
  };

  const handleToggleComment = async (c: BlogComment) => {
    const next = c.status === 'approved' ? 'hidden' : 'approved';
    setComments(prev => prev.map(x => x.id === c.id ? { ...x, status: next } : x));
    try {
      await setCommentStatus(c.id, next);
      triggerSuccess(next === 'approved' ? 'Comentário aprovado.' : 'Comentário ocultado.');
    } catch (e) {
      triggerError('Falha ao atualizar o comentário.');
      loadComments();
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm('Excluir este comentário permanentemente?')) return;
    setComments(prev => prev.filter(x => x.id !== id));
    try {
      await deleteCommentFromServer(id);
      triggerSuccess('Comentário excluído.');
    } catch (e) {
      triggerError('Falha ao excluir o comentário.');
      loadComments();
    }
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    try {
      await addBlogCategoryToServer(name);
      setNewCategory('');
      await loadTaxonomy();
      triggerSuccess('Categoria adicionada.');
    } catch (e) {
      triggerError('Falha ao adicionar a categoria.');
    }
  };

  const handleDeleteCategory = async (name: string) => {
    if (!window.confirm(`Remover a categoria "${name}"? Os artigos existentes mantêm o valor já salvo.`)) return;
    try {
      await deleteBlogCategoryFromServer(name);
      await loadTaxonomy();
      triggerSuccess('Categoria removida.');
    } catch (e) {
      triggerError('Falha ao remover a categoria.');
    }
  };

  const handleDeleteTag = async (name: string) => {
    if (!window.confirm(`Remover a tag "${name}"?`)) return;
    try {
      await deleteBlogTagFromServer(name);
      await loadTaxonomy();
      triggerSuccess('Tag removida.');
    } catch (e) {
      triggerError('Falha ao remover a tag.');
    }
  };

  const postTitleBySlug = (s: string) => posts.find(p => p.slug === s)?.title || s;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-display font-black text-xl text-slate-900">Gerenciar Blog</h3>
          <p className="text-slate-500 text-xs font-semibold">Crie e edite artigos, organize categorias/tags e modere os comentários.</p>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button onClick={() => setView('posts')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'posts' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                <FileText className="h-3.5 w-3.5 inline mr-1" /> Artigos
              </button>
              <button onClick={() => setView('taxonomy')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'taxonomy' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                <FolderTree className="h-3.5 w-3.5 inline mr-1" /> Categorias & Tags
              </button>
              <button onClick={() => setView('comments')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'comments' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                <MessageSquare className="h-3.5 w-3.5 inline mr-1" /> Comentários
              </button>
            </div>
            {view === 'posts' && (
              <button onClick={startNew} className="bg-primary hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] shadow-sm">
                <Plus className="h-4 w-4" /> Novo Artigo
              </button>
            )}
          </div>
        )}
      </div>

      {/* --- POST EDIT FORM --- */}
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white border-2 border-primary/30 rounded-xl p-6 shadow-md space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="font-bold text-sm text-slate-800">{isNew ? '➕ Novo Artigo' : `✏️ Editando: ${form.title}`}</h4>
            <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Título</label>
              <input type="text" required value={form.title} onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Título do artigo"
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Slug (URL)</label>
              <input type="text" required value={form.slug} onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="titulo-do-artigo"
                className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
              <span className="text-[10px] text-slate-400 block">/blog/artigo/{form.slug || '...'}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Categorias (uma ou mais)</label>
              <ChipMultiInput
                value={form.categories}
                onChange={(next) => setForm(prev => ({ ...prev, categories: next }))}
                suggestions={categoriesList}
                placeholder="Selecione ou crie categorias..."
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Descrição (resumo)</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve resumo exibido nos cards e no SEO."
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y" />
            </div>

            {/* Image */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Imagem de destaque</label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-24 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {form.image
                    ? <img src={form.image} alt="capa" className="max-h-full max-w-full object-cover" />
                    : <ImageIcon className="h-5 w-5 text-slate-300" />}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input type="text" value={form.image} onChange={(e) => setForm(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="URL da imagem ou envie um arquivo"
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingImage ? 'Enviando...' : 'Enviar imagem (R2)'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingImage}
                      onChange={(e) => handleImageUpload(e.target.files?.[0])} />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Autor</label>
              <input type="text" value={form.author} onChange={(e) => setForm(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Nome do autor"
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Data (exibição)</label>
                <input type="text" value={form.date} onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                  placeholder="Ex: 28 Jun 2026"
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Tempo de leitura</label>
                <input type="text" value={form.readTime} onChange={(e) => setForm(prev => ({ ...prev, readTime: e.target.value }))}
                  placeholder="Ex: 5 min"
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Tags</label>
              <ChipMultiInput
                value={form.tags}
                onChange={(next) => setForm(prev => ({ ...prev, tags: next }))}
                suggestions={tagsList}
                placeholder="Digite uma tag e Enter (sugere as existentes)..."
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Conteúdo</label>
              <RichTextEditor value={form.content} onChange={(html) => setForm(prev => ({ ...prev, content: html }))} />
              <span className="text-[10px] text-slate-400 block">Use a barra de ferramentas (negrito, títulos, listas, links, imagens) ou alterne para "HTML" para editar o código diretamente.</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer">Cancelar</button>
            <button type="submit" disabled={isSaving} className="bg-primary hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow">
              <Save className="h-3.5 w-3.5" /> {isSaving ? 'Salvando...' : 'Salvar Artigo'}
            </button>
          </div>
        </form>
      ) : view === 'posts' ? (
        /* --- POSTS LIST --- */
        loadingPosts ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-semibold">
            <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" /> Nenhum artigo. Clique em "Novo Artigo".
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left font-semibold text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase border-b border-slate-100 font-mono tracking-wider">
                <tr>
                  <th className="p-4">Artigo</th>
                  <th className="p-4">Categorias</th>
                  <th className="p-4">Data</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map(post => (
                  <tr key={post.slug} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                          {post.image && <img src={post.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
                        </div>
                        <span className="font-bold text-slate-900 line-clamp-2">{post.title}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(post.categories || []).map(c => (
                          <span key={c} className="bg-purple-50 text-primary text-[10px] font-black uppercase px-2 py-0.5 rounded">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 font-mono">{post.date || '—'}</td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-end">
                        <a href={`/blog/artigo/${post.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-blue-100 hover:text-blue-600 text-slate-500 rounded cursor-pointer inline-block" title="Visualizar artigo"><ExternalLink className="h-4 w-4" /></a>
                        <button onClick={() => startEdit(post)} className="p-1.5 hover:bg-purple-100 hover:text-primary text-slate-500 rounded cursor-pointer" title="Editar"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(post.slug)} className="p-1.5 hover:bg-red-100 hover:text-red-600 text-slate-500 rounded cursor-pointer" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : view === 'taxonomy' ? (
        /* --- CATEGORIES & TAGS MANAGEMENT --- */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="bg-purple-50 text-primary p-2 rounded-lg"><FolderTree className="h-5 w-5" /></div>
              <h4 className="font-bold text-slate-800 text-sm">Categorias</h4>
            </div>
            <div className="flex gap-2">
              <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                placeholder="Nova categoria"
                className="flex-1 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white" />
              <button type="button" onClick={handleAddCategory} className="bg-primary hover:bg-purple-700 text-white font-bold text-xs px-3 rounded-lg flex items-center gap-1"><Plus className="h-4 w-4" /> Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoriesList.length === 0 ? <span className="text-slate-400 text-xs font-semibold">Nenhuma categoria.</span> :
                categoriesList.map(c => (
                  <span key={c} className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold py-1 px-2 rounded-lg flex items-center gap-1.5">
                    {c}
                    <button type="button" onClick={() => handleDeleteCategory(c)} className="text-red-500 hover:text-red-700" title="Remover"><Trash2 className="h-3 w-3" /></button>
                  </span>
                ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="bg-pink-50 text-pink-600 p-2 rounded-lg"><Tag className="h-5 w-5" /></div>
              <h4 className="font-bold text-slate-800 text-sm">Tags</h4>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold">As tags são criadas ao escrever o artigo (com sugestão automática). Aqui você pode removê-las.</p>
            <div className="flex flex-wrap gap-2">
              {tagsList.length === 0 ? <span className="text-slate-400 text-xs font-semibold">Nenhuma tag.</span> :
                tagsList.map(t => (
                  <span key={t} className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold py-1 px-2 rounded-lg flex items-center gap-1.5">
                    {t}
                    <button type="button" onClick={() => handleDeleteTag(t)} className="text-red-500 hover:text-red-700" title="Remover"><Trash2 className="h-3 w-3" /></button>
                  </span>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* --- COMMENTS MODERATION --- */
        loadingComments ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-2 bg-sky-50 border border-sky-200 text-sky-800 rounded-lg p-3 text-xs font-semibold">
              <Shield className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Todo comentário entra como <strong>Pendente</strong> e só aparece no site após você aprovar. Links são removidos automaticamente e o envio é limitado (1 a cada 10 min, máx. 3/24h por IP).</span>
            </div>

            {/* Blocked IPs (antispam) */}
            {blockedIps.length > 0 && (
              <div className="bg-white border border-red-200 rounded-xl p-4 shadow-sm">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-2">
                  <Ban className="h-4 w-4 text-red-500" /> IPs bloqueados ({blockedIps.length})
                </h4>
                <div className="space-y-1.5">
                  {blockedIps.map(b => (
                    <div key={b.ip} className="flex items-center justify-between gap-3 text-xs border border-slate-100 rounded-lg px-3 py-2">
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-slate-700">{b.ip}</span>
                        <span className="text-slate-400 ml-2">{b.reason}</span>
                        <span className="text-slate-300 ml-2 font-mono">{formatDateTime(b.createdAt)}</span>
                      </div>
                      <button onClick={() => handleUnblockIp(b.ip)} className="shrink-0 text-[11px] font-bold text-primary hover:bg-purple-50 border border-purple-200 rounded px-2 py-1 transition-colors">
                        Desbloquear
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {comments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-semibold">
                <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" /> Nenhum comentário ainda.
              </div>
            ) : (
              <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className={`bg-white border rounded-xl p-4 shadow-sm flex items-start justify-between gap-4 ${c.status === 'hidden' ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{c.author}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{c.email}</span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${c.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : c.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {c.status === 'approved' ? 'Visível' : c.status === 'pending' ? 'Pendente' : 'Oculto'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs font-medium leading-relaxed">{c.content}</p>
                  <div className="text-[10px] text-slate-400 font-mono mt-1.5">
                    em "{postTitleBySlug(c.postSlug)}" · {formatDateTime(c.createdAt)}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => handleToggleComment(c)} className="p-1.5 hover:bg-slate-100 text-slate-500 rounded cursor-pointer" title={c.status === 'approved' ? 'Ocultar' : 'Aprovar'}>
                    {c.status === 'approved' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => handleDeleteComment(c.id)} className="p-1.5 hover:bg-red-100 hover:text-red-600 text-slate-500 rounded cursor-pointer" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
