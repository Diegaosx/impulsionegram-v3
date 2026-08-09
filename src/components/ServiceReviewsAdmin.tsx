// Moderação das avaliações de serviço.
//
// Fica ao lado dos depoimentos porque as duas coisas são a mesma tarefa do
// ponto de vista de quem modera — só que a avaliação já vem com um pedido
// entregue atrás dela, então o que se decide aqui é publicar ou não, e não se
// a pessoa é real.

import { useEffect, useMemo, useState } from 'react';
import { Check, EyeOff, Clock, Trash2, Star, Filter, Reply, Save } from 'lucide-react';
import {
  ServiceReview, fetchAllServiceReviews, updateServiceReviewOnServer, deleteServiceReviewOnServer
} from '../utils/storage';
import { ServiceItem } from '../types';
import { formatDateTime } from '../utils/datetime';
import StarRating from './StarRating';
import AdminPagination, { clampPage, pageSlice } from './AdminPagination';

interface ServiceReviewsAdminProps {
  services: ServiceItem[];
  triggerSuccess: (msg: string) => void;
  triggerError: (msg: string) => void;
}

const STATUS_BADGE: Record<string, string> = {
  approved: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  hidden: 'bg-slate-100 text-slate-500 border-slate-200'
};
const STATUS_LABEL: Record<string, string> = {
  approved: 'Publicada',
  pending: 'Pendente',
  hidden: 'Oculta'
};

export default function ServiceReviewsAdmin({ services, triggerSuccess, triggerError }: ServiceReviewsAdminProps) {
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [serviceFilter, setServiceFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const load = async () => {
    setLoading(true);
    setReviews(await fetchAllServiceReviews());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [statusFilter, serviceFilter]);

  const serviceName = (id: string) => services.find(s => s.id === id)?.label || id;

  const filtered = useMemo(() => reviews.filter(r => {
    if (statusFilter !== 'todos' && r.status !== statusFilter) return false;
    if (serviceFilter !== 'todos' && r.serviceId !== serviceFilter) return false;
    return true;
  }), [reviews, statusFilter, serviceFilter]);

  const pendentes = reviews.filter(r => r.status === 'pending').length;

  const patch = async (id: string, fields: { status?: string; reply?: string }) => {
    const res = await updateServiceReviewOnServer(id, fields);
    if (!res.ok || !res.review) { triggerError(res.error || 'Falha ao atualizar a avaliação.'); return; }
    setReviews(prev => prev.map(r => (r.id === id ? res.review! : r)));
    triggerSuccess('Avaliação atualizada.');
  };

  const remove = async (id: string) => {
    if (!window.confirm('Excluir esta avaliação permanentemente?')) return;
    if (await deleteServiceReviewOnServer(id)) {
      setReviews(prev => prev.filter(r => r.id !== id));
      triggerSuccess('Avaliação excluída.');
    } else {
      triggerError('Falha ao excluir a avaliação.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-500">
          {pendentes > 0
            ? <><span className="text-primary">{pendentes}</span> aguardando conferência</>
            : 'Nada aguardando conferência'}
        </span>
        <div className="flex-1" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <option value="pending">Pendentes</option>
          <option value="approved">Publicadas</option>
          <option value="hidden">Ocultas</option>
          <option value="todos">Todas</option>
        </select>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <option value="todos">Todos os serviços</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-semibold">
          <Filter className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          {reviews.length === 0
            ? 'Nenhuma avaliação recebida ainda. Elas aparecem quando um cliente avalia um pedido entregue.'
            : 'Nenhuma avaliação neste filtro.'}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {pageSlice<ServiceReview>(filtered, page, perPage).map(r => (
              <div key={r.id} className="p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StarRating value={r.rating} size="sm" />
                      <span className="font-bold text-slate-900 text-sm">{r.authorName || 'Cliente'}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${STATUS_BADGE[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {serviceName(r.serviceId)} · pedido #{r.orderId} · {r.accountEmail || ''} · {formatDateTime(r.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {r.status !== 'approved' && (
                      <button
                        onClick={() => patch(r.id, { status: 'approved' })}
                        className="flex items-center gap-1 text-[11px] font-bold text-green-600 hover:bg-green-50 border border-green-200 rounded px-2 py-1 transition-colors cursor-pointer"
                      >
                        <Check className="h-3 w-3" /> Publicar
                      </button>
                    )}
                    {r.status !== 'hidden' && (
                      <button
                        onClick={() => patch(r.id, { status: 'hidden' })}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 transition-colors cursor-pointer"
                      >
                        <EyeOff className="h-3 w-3" /> Ocultar
                      </button>
                    )}
                    {r.status !== 'pending' && (
                      <button
                        onClick={() => patch(r.id, { status: 'pending' })}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:bg-amber-50 border border-amber-200 rounded px-2 py-1 transition-colors cursor-pointer"
                        title="Voltar para a fila de conferência"
                      >
                        <Clock className="h-3 w-3" /> Pendente
                      </button>
                    )}
                    <button
                      onClick={() => remove(r.id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:bg-red-50 border border-red-200 rounded px-2 py-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <p className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                  {r.comment}
                </p>

                {r.reply && replyingId !== r.id && (
                  <div className="border-l-2 border-primary/30 pl-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-primary block">Resposta da loja</span>
                    <p className="text-xs font-semibold text-slate-600 whitespace-pre-wrap">{r.reply}</p>
                  </div>
                )}

                {replyingId === r.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Resposta pública, exibida abaixo da avaliação na página do serviço."
                      className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => { await patch(r.id, { reply: replyText.trim() }); setReplyingId(null); }}
                        className="flex items-center gap-1 text-[11px] font-bold text-white bg-primary hover:bg-purple-700 rounded px-3 py-1.5 transition-colors cursor-pointer"
                      >
                        <Save className="h-3 w-3" /> Salvar resposta
                      </button>
                      <button
                        onClick={() => setReplyingId(null)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-700 px-2 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setReplyingId(r.id); setReplyText(r.reply || ''); }}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-primary cursor-pointer"
                  >
                    <Reply className="h-3 w-3" /> {r.reply ? 'Editar resposta' : 'Responder publicamente'}
                  </button>
                )}
              </div>
            ))}
          </div>
          <AdminPagination
            total={filtered.length}
            page={clampPage(page, filtered.length, perPage)}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            itemLabel="avaliações"
          />
        </div>
      )}
    </div>
  );
}
