// A conversa de um ticket: linha do tempo e caixa de resposta.
//
// É a mesma peça nos dois lados. O que muda é quem está falando (`side`), e
// isso decide só o alinhamento e a cor do balão — a lógica de quem pode
// responder o quê é do servidor, não daqui.

import { FormEvent, ReactNode, useState } from 'react';
import { Send, Lock } from 'lucide-react';
import { Ticket } from '../utils/storage';
import { formatDateTime } from '../utils/datetime';
import { TICKET_LIMITS, isTicketClosed, ticketCategory, ticketPriority, ticketStatus } from '../utils/tickets';

interface TicketConversationProps {
  ticket: Ticket;
  /** Quem está lendo. Define o alinhamento dos balões e o rótulo do autor. */
  side: 'cliente' | 'admin';
  onReply: (message: string) => Promise<{ ok: boolean; error?: string }>;
  /** Controles extras no cabeçalho (o admin muda status e prioridade). */
  headerExtra?: ReactNode;
  /** Texto do aviso quando o ticket está encerrado. */
  closedNotice?: string;
}

export default function TicketConversation({
  ticket, side, onReply, headerExtra, closedNotice
}: TicketConversationProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const closed = isTicketClosed(ticket.status);
  const cat = ticketCategory(ticket.category);
  const pri = ticketPriority(ticket.priority);
  const st = ticketStatus(ticket.status);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const body = message.trim();
    if (!body) return;
    setSending(true);
    setError('');
    const res = await onReply(body);
    setSending(false);
    if (res.ok) setMessage('');
    else setError(res.error || 'Não foi possível enviar.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-black text-lg text-slate-900 leading-tight">{ticket.subject}</h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[10px] font-mono font-bold text-slate-400">#{ticket.id}</span>
            <span className={`text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${cat.badge}`}>{cat.label}</span>
            <span className={`text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${pri.badge}`}>Prioridade {pri.label}</span>
            <span className={`text-[9px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${st.badge}`}>{st.label}</span>
            {ticket.orderId && (
              <span className="text-[9px] font-black uppercase tracking-wider border border-slate-200 bg-slate-50 text-slate-500 rounded-full px-2 py-0.5">
                Pedido #{ticket.orderId}
              </span>
            )}
          </div>
        </div>
        {headerExtra}
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {(ticket.replies || []).map(reply => {
          const mine = reply.author === side;
          return (
            <div key={reply.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 border ${
                  reply.author === 'admin'
                    ? 'bg-purple-50 border-primary/20'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-black text-slate-700">
                    {reply.author === 'admin' ? (reply.authorName || 'Atendimento') : (reply.authorName || 'Cliente')}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">{formatDateTime(reply.createdAt)}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed mt-1.5 whitespace-pre-wrap break-words">
                  {reply.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {closed ? (
        <p className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-500">
          <Lock className="h-4 w-4 shrink-0" />
          {closedNotice || 'Este ticket está encerrado. Uma nova resposta reabre a conversa.'}
        </p>
      ) : null}

      <form onSubmit={submit} className="space-y-2">
        {error && (
          <p className="bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold rounded-lg px-3 py-2">{error}</p>
        )}
        <textarea
          rows={3}
          value={message}
          maxLength={TICKET_LIMITS.body}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={side === 'admin' ? 'Escreva a resposta ao cliente...' : 'Escreva a sua mensagem...'}
          className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold text-slate-400">{message.length}/{TICKET_LIMITS.body}</span>
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="inline-flex items-center gap-2 bg-primary hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl px-4 py-2.5 transition-colors cursor-pointer"
          >
            <Send className="h-4 w-4" /> {sending ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
