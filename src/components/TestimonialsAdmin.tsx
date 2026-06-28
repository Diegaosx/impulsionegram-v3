import { useEffect, useState, FormEvent } from 'react';
import {
  Plus, Pencil, Trash2, Save, Upload, Star, Check, EyeOff, Clock, ArrowLeft, Quote
} from 'lucide-react';
import {
  TestimonialItem,
  fetchAllTestimonials, saveTestimonialToServer, setTestimonialStatus,
  deleteTestimonialFromServer, uploadAsset
} from '../utils/storage';
import { formatDateTime } from '../utils/datetime';

interface TestimonialsAdminProps {
  triggerSuccess: (msg: string) => void;
  triggerError: (msg: string) => void;
}

interface TForm {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  platformUsed: string;
  verified: boolean;
  status: 'approved' | 'pending' | 'hidden';
}

const EMPTY_FORM: TForm = {
  id: '',
  name: '',
  role: '',
  avatar: '',
  rating: 5,
  text: '',
  platformUsed: 'instagram',
  verified: true,
  status: 'approved'
};

const STATUS_BADGE: Record<string, string> = {
  approved: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  hidden: 'bg-slate-100 text-slate-500 border-slate-200'
};

const STATUS_LABEL: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  hidden: 'Oculto'
};

export default function TestimonialsAdmin({ triggerSuccess, triggerError }: TestimonialsAdminProps) {
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'hidden'>('all');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<TForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fetchAllTestimonials());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  const startNew = () => { setForm(EMPTY_FORM); setEditing(true); };
  const startEdit = (t: TestimonialItem) => {
    setForm({
      id: t.id, name: t.name, role: t.role, avatar: t.avatar, rating: t.rating,
      text: t.text, platformUsed: t.platformUsed, verified: t.verified,
      status: t.status
    });
    setEditing(true);
  };

  const handleAvatarUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadAsset(file, 'testimonials');
      setForm(prev => ({ ...prev, avatar: url }));
      triggerSuccess('Foto enviada com sucesso!');
    } catch (err: any) {
      triggerError(err?.message || 'Falha no upload da foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) {
      triggerError('Nome e depoimento são obrigatórios.');
      return;
    }
    setIsSaving(true);
    try {
      await saveTestimonialToServer(form);
      triggerSuccess('Depoimento salvo com sucesso!');
      setEditing(false);
      await load();
    } catch (err: any) {
      triggerError(err?.message || 'Falha ao salvar o depoimento.');
    } finally {
      setIsSaving(false);
    }
  };

  const changeStatus = async (id: string, status: 'approved' | 'hidden' | 'pending') => {
    try {
      await setTestimonialStatus(id, status);
      triggerSuccess(`Depoimento marcado como ${STATUS_LABEL[status].toLowerCase()}.`);
      await load();
    } catch {
      triggerError('Falha ao atualizar o status.');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Excluir este depoimento permanentemente?')) return;
    try {
      await deleteTestimonialFromServer(id);
      triggerSuccess('Depoimento removido.');
      await load();
    } catch {
      triggerError('Falha ao excluir o depoimento.');
    }
  };

  // --- EDIT / CREATE FORM ---
  if (editing) {
    return (
      <div className="space-y-6 max-w-2xl">
        <button
          onClick={() => setEditing(false)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para a lista
        </button>

        <div>
          <h3 className="font-display font-black text-xl text-slate-900">{form.id ? 'Editar Depoimento' : 'Novo Depoimento'}</h3>
          <p className="text-slate-500 text-xs font-semibold">Depoimentos aprovados aparecem na home.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Profissão / @ da rede</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                placeholder="Ex: @perfil ou Empreendedora"
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Rede social</label>
              <select
                value={form.platformUsed}
                onChange={(e) => setForm(p => ({ ...p, platformUsed: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg p-2.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter/X</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Avaliação</label>
              <div className="flex gap-1 items-center pt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button type="button" key={i} onClick={() => setForm(p => ({ ...p, rating: i + 1 }))} className="p-0.5">
                    <Star className={`h-5 w-5 cursor-pointer ${i < form.rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Depoimento</label>
            <textarea
              rows={4}
              value={form.text}
              onChange={(e) => setForm(p => ({ ...p, text: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Foto (opcional)</label>
            <div className="flex items-center gap-3">
              {form.avatar && (
                <img src={form.avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
              )}
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-primary border border-slate-200 bg-white rounded-lg px-3 py-2 cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                {isUploading ? 'Enviando...' : 'Enviar foto'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }}
                />
              </label>
              {form.avatar && (
                <button type="button" onClick={() => setForm(p => ({ ...p, avatar: '' }))} className="text-xs font-bold text-red-500 hover:underline">Remover</button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm(p => ({ ...p, status: e.target.value as TForm['status'] }))}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg p-2.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
              >
                <option value="approved">Aprovado (aparece na home)</option>
                <option value="pending">Pendente</option>
                <option value="hidden">Oculto</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Selo verificado</label>
              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.verified}
                  onChange={(e) => setForm(p => ({ ...p, verified: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-xs font-semibold text-slate-600">Exibir selo "✓ BR"</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary hover:bg-purple-700 disabled:opacity-60 text-white font-bold text-xs py-3 px-5 rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 shadow-md"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar Depoimento'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- LIST ---
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-display font-black text-xl text-slate-900">Depoimentos</h3>
          <p className="text-slate-500 text-xs font-semibold">
            Modere os depoimentos enviados pelos visitantes e gerencie os exibidos na home.
            {pendingCount > 0 && <span className="text-amber-600 font-bold"> {pendingCount} aguardando aprovação.</span>}
          </p>
        </div>
        <button
          onClick={startNew}
          className="bg-primary hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 shadow-md shrink-0"
        >
          <Plus className="h-4 w-4" /> Novo Depoimento
        </button>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-1.5">
        {(['all', 'pending', 'approved', 'hidden'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              filter === f ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'all' ? 'Todos' : STATUS_LABEL[f]}
            {f === 'all' ? ` (${items.length})` : ` (${items.filter(i => i.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm font-semibold">Nenhum depoimento nesta categoria.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex gap-4">
              <img
                src={t.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                alt={t.name}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-800 text-sm">{t.name}</h4>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${STATUS_BADGE[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-slate-50 border border-slate-200 text-slate-400 px-2 py-0.5 rounded font-mono">
                    {t.platformUsed}
                  </span>
                  <span className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < t.rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                    ))}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-semibold">{t.role}</p>
                <p className="text-xs text-slate-600 font-medium italic mt-1.5 flex gap-1">
                  <Quote className="h-3 w-3 text-slate-300 shrink-0 mt-0.5" />
                  <span className="line-clamp-3">{t.text}</span>
                </p>
                <p className="text-[10px] text-slate-300 font-semibold mt-1">{formatDateTime(t.createdAt)}</p>

                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {t.status !== 'approved' && (
                    <button onClick={() => changeStatus(t.id, 'approved')} className="flex items-center gap-1 text-[11px] font-bold text-green-600 hover:bg-green-50 border border-green-200 rounded px-2 py-1 transition-colors">
                      <Check className="h-3 w-3" /> Aprovar
                    </button>
                  )}
                  {t.status !== 'hidden' && (
                    <button onClick={() => changeStatus(t.id, 'hidden')} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 transition-colors">
                      <EyeOff className="h-3 w-3" /> Ocultar
                    </button>
                  )}
                  {t.status !== 'pending' && (
                    <button onClick={() => changeStatus(t.id, 'pending')} className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:bg-amber-50 border border-amber-200 rounded px-2 py-1 transition-colors">
                      <Clock className="h-3 w-3" /> Pendente
                    </button>
                  )}
                  <button onClick={() => startEdit(t)} className="flex items-center gap-1 text-[11px] font-bold text-primary hover:bg-purple-50 border border-purple-200 rounded px-2 py-1 transition-colors">
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                  <button onClick={() => remove(t.id)} className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:bg-red-50 border border-red-200 rounded px-2 py-1 transition-colors">
                    <Trash2 className="h-3 w-3" /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
