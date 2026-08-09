// Central de atendimento do painel: tickets vinculados a contas.
//
// Substitui a caixa de "Mensagens de Contato", que era uma lista de e-mails
// soltos sem resposta dentro do sistema. As mensagens recebidas antes da
// mudança não têm conta e não viram ticket — ficam num histórico à parte, em
// vez de serem inventadas como se pertencessem a alguém.

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Inbox, LifeBuoy, Mail, MailOpen, RotateCcw, Search, Trash2, Filter, Archive
} from 'lucide-react';
import {
  ContactMessage, Ticket,
  fetchContactMessages, setContactMessageStatus, deleteContactMessage,
  fetchTickets, fetchTicket, replyTicket, updateTicketFields, deleteTicket
} from '../utils/storage';
import { formatDateTime } from '../utils/datetime';
import {
  TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES,
  ticketCategory, ticketPriority, ticketStatus
} from '../utils/tickets';
import TicketConversation from './TicketConversation';
import AdminPagination, { clampPage, pageSlice } from './AdminPagination';

interface TicketsAdminProps {
  triggerSuccess: (msg: string) => void;
  triggerError: (msg: string) => void;
}

export default function TicketsAdmin({ triggerSuccess, triggerError }: TicketsAdminProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Ticket | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [priorityFilter, setPriorityFilter] = useState('todos');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  // Histórico anterior aos tickets (sem conta vinculada).
  const [legacy, setLegacy] = useState<ContactMessage[]>([]);
  const [showLegacy, setShowLegacy] = useState(false);
  const [legacyOpenId, setLegacyOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [list, old] = await Promise.all([fetchTickets(), fetchContactMessages()]);
    setTickets(list);
    setLegacy(old);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter, priorityFilter, unreadOnly]);

  const filtered = useMemo(() => {
    const termo = search.trim().toLowerCase();
    return tickets.filter(t => {
      if (termo) {
        const alvo = [t.id, t.subject, t.accountName, t.accountEmail, t.orderId]
          .map(v => String(v || '').toLowerCase()).join(' ');
        if (!alvo.includes(termo)) return false;
      }
      if (statusFilter !== 'todos' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'todos' && t.category !== categoryFilter) return false;
      if (priorityFilter !== 'todos' && t.priority !== priorityFilter) return false;
      if (unreadOnly && !t.unreadAdmin) return false;
      return true;
    });
  }, [tickets, search, statusFilter, categoryFilter, priorityFilter, unreadOnly]);

  const unreadCount = tickets.filter(t => t.unreadAdmin).length;
  const filtrosLigados = search.trim() !== '' || statusFilter !== 'todos' ||
    categoryFilter !== 'todos' || priorityFilter !== 'todos' || unreadOnly;

  const openTicket = async (id: string) => {
    const full = await fetchTicket(id);
    if (!full) { triggerError('Ticket não encontrado.'); return; }
    setOpen(full);
    setTickets(prev => prev.map(t => (t.id === id ? { ...t, unreadAdmin: false } : t)));
  };

  const reply = async (body: string) => {
    if (!open) return { ok: false, error: 'Ticket não encontrado.' };
    const res = await replyTicket(open.id, body);
    if (res.ok && res.ticket) { setOpen(res.ticket); load(); }
    return { ok: res.ok, error: res.error };
  };

  const patch = async (fields: { status?: string; priority?: string; category?: string }) => {
    if (!open) return;
    const res = await updateTicketFields(open.id, fields);
    if (res.ok && res.ticket) { setOpen(res.ticket); load(); triggerSuccess('Ticket atualizado.'); }
    else triggerError(res.error || 'Falha ao atualizar o ticket.');
  };

  const remove = async (id: string) => {
    if (!window.confirm('Excluir este ticket e toda a conversa? A ação não pode ser desfeita.')) return;
    const res = await deleteTicket(id);
    if (res.ok) { setOpen(null); load(); triggerSuccess('Ticket excluído.'); }
    else triggerError(res.error || 'Falha ao excluir o ticket.');
  };

  // --- Conversa aberta ---
  if (open) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setOpen(null); load(); }}
          className="text-xs font-bold text-slate-500 hover:text-primary inline-flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos tickets
        </button>

        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Cliente</span>
              <span className="font-bold text-slate-900 text-sm">{open.accountName || '(sem nome)'}</span>
              <span className="text-[11px] text-slate-400 font-mono block">{open.accountEmail}</span>
            </div>
            <button
              onClick={() => remove(open.id)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-500 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-2 cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir ticket
            </button>
          </div>

          <TicketConversation
            ticket={open}
            side="admin"
            onReply={reply}
            closedNotice="Ticket encerrado. Responder aqui reabre a conversa para o cliente."
            headerExtra={
              <div className="flex flex-wrap gap-2">
                <select
                  value={open.status}
                  onChange={(e) => patch({ status: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-lg py-2 px-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  title="Status do ticket"
                >
                  {TICKET_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select
                  value={open.priority}
                  onChange={(e) => patch({ priority: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-lg py-2 px-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  title="Prioridade"
                >
                  {TICKET_PRIORITIES.map(p => <option key={p.value} value={p.value}>Prioridade {p.label}</option>)}
                </select>
                <select
                  value={open.category}
                  onChange={(e) => patch({ category: e.target.value })}
                  className="bg-slate-50 border border-slate-200 text-[11px] font-bold rounded-lg py-2 px-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  title="Categoria"
                >
                  {TICKET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  // --- Lista ---
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-black text-xl text-slate-900">Tickets de Atendimento</h3>
        <p className="text-slate-500 text-xs font-semibold">
          Cada ticket pertence a uma conta, com categoria, prioridade e histórico de respostas.
          {unreadCount > 0 && <span className="text-primary font-bold"> {unreadCount} aguardando você.</span>}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ticket, assunto, cliente ou pedido..."
            className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 pl-9 pr-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <option value="todos">Todos os status</option>
          {TICKET_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <option value="todos">Todas as categorias</option>
          {TICKET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <option value="todos">Todas as prioridades</option>
          {TICKET_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="accent-primary cursor-pointer"
          />
          Só não lidos
        </label>
        {filtrosLigados && (
          <button
            type="button"
            onClick={() => {
              setSearch(''); setStatusFilter('todos'); setCategoryFilter('todos');
              setPriorityFilter('todos'); setUnreadOnly(false);
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary px-2 py-2.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Limpar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-semibold">
          <LifeBuoy className="h-8 w-8 text-slate-300 mx-auto mb-2" /> Nenhum ticket aberto até agora.
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs font-semibold">
          <Filter className="h-8 w-8 text-slate-300 mx-auto mb-2" /> Nenhum ticket corresponde aos filtros.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {pageSlice<Ticket>(filtered, page, perPage).map(t => {
              const cat = ticketCategory(t.category);
              const pri = ticketPriority(t.priority);
              const st = ticketStatus(t.status);
              return (
                <button
                  key={t.id}
                  onClick={() => openTicket(t.id)}
                  className="w-full text-left p-4 hover:bg-slate-50/60 transition-colors cursor-pointer flex flex-wrap items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm truncate ${t.unreadAdmin ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                        {t.subject}
                      </span>
                      {t.unreadAdmin && (
                        <span className="text-[9px] font-black uppercase bg-primary text-white px-1.5 py-0.5 rounded-full shrink-0">Novo</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                      {t.accountName || '(sem nome)'} <span className="text-slate-400 font-mono">{t.accountEmail}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      #{t.id} · {formatDateTime(t.updatedAt)}
                      {t.orderId ? ` · pedido #${t.orderId}` : ''}
                      {t.repliesCount ? ` · ${t.repliesCount} ${t.repliesCount === 1 ? 'mensagem' : 'mensagens'}` : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <span className={`text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${cat.badge}`}>{cat.label}</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${pri.badge}`}>{pri.label}</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${st.badge}`}>{st.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <AdminPagination
            total={filtered.length}
            page={clampPage(page, filtered.length, perPage)}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            itemLabel="tickets"
          />
        </div>
      )}

      {/* Histórico: mensagens recebidas antes dos tickets, sem conta vinculada. */}
      {legacy.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowLegacy(v => !v)}
            className="w-full flex items-center justify-between gap-3 p-4 text-left cursor-pointer hover:bg-slate-50/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-slate-400" />
              <span className="font-bold text-slate-800 text-sm">Mensagens antigas (sem conta)</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{legacy.length}</span>
            </span>
            <span className="text-[11px] font-bold text-primary">{showLegacy ? 'Ocultar' : 'Ver'}</span>
          </button>

          {showLegacy && (
            <div className="border-t border-slate-100 divide-y divide-slate-100">
              <p className="px-4 py-3 text-[11px] font-semibold text-slate-400">
                Recebidas pelo formulário aberto, antes do atendimento por ticket. Não têm conta vinculada,
                então a resposta continua sendo por e-mail.
              </p>
              {legacy.map(m => (
                <div key={m.id}>
                  <button
                    onClick={async () => {
                      const next = legacyOpenId === m.id ? null : m.id;
                      setLegacyOpenId(next);
                      if (next && m.status === 'unread') {
                        try {
                          await setContactMessageStatus(m.id, 'read');
                          setLegacy(prev => prev.map(x => (x.id === m.id ? { ...x, status: 'read' } : x)));
                        } catch { /* silencioso: só o marcador de leitura */ }
                      }
                    }}
                    className="w-full flex items-center gap-3 p-4 text-left cursor-pointer hover:bg-slate-50/60 transition-colors"
                  >
                    <span className={`shrink-0 p-2 rounded-lg ${m.status === 'unread' ? 'bg-purple-50 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                      {m.status === 'unread' ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm ${m.status === 'unread' ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{m.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{m.email}</span>
                      </span>
                      <span className="text-xs text-slate-500 font-semibold truncate block">{m.subject || '(sem assunto)'}</span>
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono shrink-0 hidden sm:block">{formatDateTime(m.createdAt)}</span>
                  </button>
                  {legacyOpenId === m.id && (
                    <div className="px-4 pb-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">
                        {m.message}
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                        <a
                          href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Sua mensagem'))}`}
                          className="flex items-center gap-1 text-[11px] font-bold text-primary hover:bg-purple-50 border border-purple-200 rounded px-2 py-1 transition-colors"
                        >
                          <Mail className="h-3 w-3" /> Responder por e-mail
                        </a>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Excluir esta mensagem permanentemente?')) return;
                            try {
                              await deleteContactMessage(m.id);
                              setLegacy(prev => prev.filter(x => x.id !== m.id));
                              triggerSuccess('Mensagem excluída.');
                            } catch { triggerError('Falha ao excluir a mensagem.'); }
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:bg-red-50 border border-red-200 rounded px-2 py-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" /> Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && tickets.length === 0 && legacy.length === 0 && (
        <p className="text-center text-[11px] font-semibold text-slate-400">
          <Inbox className="h-4 w-4 inline-block mr-1 -mt-0.5" />
          Nada por aqui ainda.
        </p>
      )}
    </div>
  );
}
