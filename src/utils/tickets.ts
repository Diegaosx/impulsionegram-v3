// Vocabulário dos tickets de atendimento: categoria, prioridade e status.
//
// Mora num módulo só porque as três telas (área do cliente, painel do admin e
// as validações do servidor) precisam concordar. Se o rótulo vivesse em cada
// tela, o cliente veria "Em andamento" e o admin "Em atendimento" para o mesmo
// registro — e o servidor aceitaria um status que ninguém sabe exibir.

export type TicketCategory = 'duvida' | 'sugestao' | 'reclamacao' | 'elogio';
export type TicketPriority = 'baixa' | 'normal' | 'alta' | 'urgente';
export type TicketStatus = 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'resolvido' | 'fechado';
export type TicketAuthor = 'cliente' | 'admin';

export interface TicketOption<T extends string> {
  value: T;
  label: string;
  /** Classes de um selo (fundo + texto + borda). */
  badge: string;
  hint?: string;
}

export const TICKET_CATEGORIES: TicketOption<TicketCategory>[] = [
  { value: 'duvida', label: 'Dúvida', badge: 'bg-sky-50 text-sky-700 border-sky-200', hint: 'Não sei como fazer algo ou preciso de uma explicação.' },
  { value: 'sugestao', label: 'Sugestão', badge: 'bg-violet-50 text-violet-700 border-violet-200', hint: 'Uma ideia para melhorar o serviço.' },
  { value: 'reclamacao', label: 'Reclamação', badge: 'bg-red-50 text-red-700 border-red-200', hint: 'Algo deu errado e preciso de solução.' },
  { value: 'elogio', label: 'Elogio', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', hint: 'Quero registrar um retorno positivo.' }
];

export const TICKET_PRIORITIES: TicketOption<TicketPriority>[] = [
  { value: 'baixa', label: 'Baixa', badge: 'bg-slate-50 text-slate-600 border-slate-200', hint: 'Pode esperar.' },
  { value: 'normal', label: 'Normal', badge: 'bg-sky-50 text-sky-700 border-sky-200', hint: 'Atendimento na ordem de chegada.' },
  { value: 'alta', label: 'Alta', badge: 'bg-amber-50 text-amber-700 border-amber-200', hint: 'Está atrapalhando o uso do serviço.' },
  { value: 'urgente', label: 'Urgente', badge: 'bg-red-50 text-red-700 border-red-200', hint: 'Pedido pago sem entrega ou cobrança indevida.' }
];

export const TICKET_STATUSES: TicketOption<TicketStatus>[] = [
  { value: 'aberto', label: 'Aberto', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'em_andamento', label: 'Em andamento', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'aguardando_cliente', label: 'Aguardando você', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'resolvido', label: 'Resolvido', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'fechado', label: 'Fechado', badge: 'bg-slate-100 text-slate-600 border-slate-200' }
];

/** Status em que o ticket está encerrado: nada mais é esperado dos dois lados. */
export const CLOSED_TICKET_STATUSES: TicketStatus[] = ['resolvido', 'fechado'];

const fallback = <T extends string>(value: string): TicketOption<T> => ({
  value: value as T,
  label: value || '—',
  badge: 'bg-slate-100 text-slate-600 border-slate-200'
});

export const ticketCategory = (v: string) =>
  TICKET_CATEGORIES.find(c => c.value === v) || fallback<TicketCategory>(v);
export const ticketPriority = (v: string) =>
  TICKET_PRIORITIES.find(p => p.value === v) || fallback<TicketPriority>(v);
export const ticketStatus = (v: string) =>
  TICKET_STATUSES.find(s => s.value === v) || fallback<TicketStatus>(v);

export const isTicketClosed = (status: string) => CLOSED_TICKET_STATUSES.includes(status as TicketStatus);

// --- Saneamento (o servidor grava só o que está no vocabulário) ---

export function normalizeCategory(v: unknown): TicketCategory {
  return TICKET_CATEGORIES.some(c => c.value === v) ? (v as TicketCategory) : 'duvida';
}
export function normalizePriority(v: unknown): TicketPriority {
  return TICKET_PRIORITIES.some(p => p.value === v) ? (v as TicketPriority) : 'normal';
}
export function normalizeStatus(v: unknown): TicketStatus {
  return TICKET_STATUSES.some(s => s.value === v) ? (v as TicketStatus) : 'aberto';
}

/** Limites de tamanho, iguais no formulário e na gravação. */
export const TICKET_LIMITS = { subject: 140, body: 4000 };
