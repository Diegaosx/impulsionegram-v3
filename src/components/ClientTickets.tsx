// Tickets na área do cliente: abrir, listar e conversar.
//
// É para onde foi o "Fale Conosco". A diferença que importa não é visual: a
// mensagem passa a ter dono, então o cliente vê o que respondeu, em que pé
// está e pode retomar dias depois — coisas que um formulário anônimo por
// e-mail nunca deu.

import { FormEvent, useEffect, useState } from 'react';
import { LifeBuoy, Plus, ArrowLeft, MessageSquare, CheckCircle2, RotateCcw } from 'lucide-react';
import {
  AdminOrder, Ticket, createMyTicket, fetchMyTicket, fetchMyTickets, replyMyTicket, setMyTicketStatus
} from '../utils/storage';
import { formatDateTime } from '../utils/datetime';
import {
  TICKET_CATEGORIES, TICKET_LIMITS, TICKET_PRIORITIES,
  isTicketClosed, ticketCategory, ticketPriority, ticketStatus
} from '../utils/tickets';
import TicketConversation from './TicketConversation';

interface ClientTicketsProps {
  /** Pedidos do cliente, para amarrar o ticket a um deles. */
  orders?: AdminOrder[];
}

export default function ClientTickets({ orders = [] }: ClientTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Ticket | null>(null);
  const [creating, setCreating] = useState(false);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('duvida');
  const [priority, setPriority] = useState('normal');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setTickets(await fetchMyTickets());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openTicket = async (id: string) => {
    const full = await fetchMyTicket(id);
    if (full) {
      setOpen(full);
      // A lista guarda o "não lido"; abrir a conversa já o consumiu no servidor.
      setTickets(prev => prev.map(t => (t.id === id ? { ...t, unreadClient: false } : t)));
    }
  };

  const submitNew = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!subject.trim() || !message.trim()) {
      setError('Informe o assunto e a mensagem.');
      return;
    }
    setSaving(true);
    const res = await createMyTicket({
      subject: subject.trim(), message: message.trim(), category, priority, orderId
    });
    setSaving(false);
    if (!res.ok) { setError(res.error || 'Não foi possível abrir o ticket.'); return; }
    setSubject(''); setMessage(''); setCategory('duvida'); setPriority('normal'); setOrderId('');
    setCreating(false);
    await load();
    if (res.ticket) setOpen(res.ticket);
  };

  const reply = async (body: string) => {
    if (!open) return { ok: false, error: 'Ticket não encontrado.' };
    const res = await replyMyTicket(open.id, body);
    if (res.ok && res.ticket) { setOpen(res.ticket); load(); }
    return { ok: res.ok, error: res.error };
  };

  const toggleStatus = async () => {
    if (!open) return;
    const next = isTicketClosed(open.status) ? 'aberto' : 'fechado';
    const res = await setMyTicketStatus(open.id, next);
    if (res.ok && res.ticket) { setOpen(res.ticket); load(); }
  };

  // --- Conversa aberta ---
  if (open) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setOpen(null); load(); }}
          className="text-xs font-bold text-slate-500 hover:text-primary inline-flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar aos meus tickets
        </button>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <TicketConversation
            ticket={open}
            side="cliente"
            onReply={reply}
            closedNotice="Este ticket foi encerrado. Se ainda precisar de ajuda, escreva abaixo que ele volta para a fila."
            headerExtra={
              <button
                onClick={toggleStatus}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-primary border border-slate-200 rounded-lg px-3 py-2 cursor-pointer transition-colors"
              >
                {isTicketClosed(open.status)
                  ? (<><RotateCcw className="h-3.5 w-3.5" /> Reabrir</>)
                  : (<><CheckCircle2 className="h-3.5 w-3.5" /> Encerrar</>)}
              </button>
            }
          />
        </div>
      </div>
    );
  }

  // --- Formulário de abertura ---
  if (creating) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setCreating(false)}
          className="text-xs font-bold text-slate-500 hover:text-primary inline-flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <form onSubmit={submitNew} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-display font-black text-lg text-slate-900">Abrir um ticket</h2>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">
              Conte o que aconteceu. Você acompanha a resposta por aqui mesmo.
            </p>
          </div>

          {error && (
            <p className="bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {TICKET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <span className="text-[10px] text-slate-400 font-semibold block">{ticketCategory(category).hint}</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {TICKET_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <span className="text-[10px] text-slate-400 font-semibold block">{ticketPriority(priority).hint}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Assunto</label>
            <input
              type="text"
              value={subject}
              maxLength={TICKET_LIMITS.subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Pedido pago e não entregue"
              className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
            />
          </div>

          {orders.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Pedido relacionado (opcional)</label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg py-2.5 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="">Nenhum</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    #{o.id} · {o.serviceLabel} · {formatDateTime(o.date, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Mensagem</label>
            <textarea
              rows={5}
              value={message}
              maxLength={TICKET_LIMITS.body}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva com detalhes: o que você esperava, o que aconteceu e, se for o caso, o link do perfil ou da publicação."
              className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y"
            />
            <span className="text-[10px] text-slate-400 font-bold block text-right">{message.length}/{TICKET_LIMITS.body}</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl px-5 py-3 transition-colors cursor-pointer"
          >
            <LifeBuoy className="h-4 w-4" /> {saving ? 'Abrindo...' : 'Abrir ticket'}
          </button>
        </form>
      </div>
    );
  }

  // --- Lista ---
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-xl text-slate-900">Atendimento</h1>
          <p className="text-slate-500 text-xs font-semibold mt-0.5">
            Seus tickets ficam aqui, com todo o histórico de respostas.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-purple-700 text-white text-xs font-bold rounded-xl px-4 py-2.5 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Abrir ticket
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <MessageSquare className="h-9 w-9 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">Nenhum ticket ainda</h3>
          <p className="text-slate-500 text-xs font-semibold mt-1">
            Precisa de ajuda com um pedido, quer sugerir algo ou registrar um retorno? Abra o primeiro.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tickets.map(t => {
            const cat = ticketCategory(t.category);
            const st = ticketStatus(t.status);
            const pri = ticketPriority(t.priority);
            return (
              <button
                key={t.id}
                onClick={() => openTicket(t.id)}
                className="w-full text-left bg-white border border-slate-200 hover:border-primary/40 rounded-2xl p-4 shadow-sm transition-colors cursor-pointer"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">{t.subject}</span>
                      {t.unreadClient && (
                        <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 shrink-0">
                          Nova resposta
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      #{t.id} · atualizado em {formatDateTime(t.updatedAt)}
                      {t.repliesCount ? ` · ${t.repliesCount} ${t.repliesCount === 1 ? 'mensagem' : 'mensagens'}` : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    <span className={`text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${cat.badge}`}>{cat.label}</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${pri.badge}`}>{pri.label}</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${st.badge}`}>{st.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
