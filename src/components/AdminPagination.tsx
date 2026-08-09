// Paginação das tabelas do painel.
//
// Pedidos e usuários crescem sem teto — com algumas centenas de linhas a página
// fica pesada e ninguém rola até o fim. Como as duas tabelas precisam do mesmo
// rodapé (quantos itens, qual faixa, quantas por página), ele mora aqui.
//
// O componente é só a barra: quem chama é dono da fatia dos dados, porque cada
// tabela filtra do seu jeito antes de paginar.

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminPaginationProps {
  /** Total de itens DEPOIS dos filtros. */
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** Nome do que está sendo listado, no plural ("pedidos", "usuários"). */
  itemLabel?: string;
  perPageOptions?: number[];
}

export const PER_PAGE_OPTIONS = [10, 25, 50, 100];

/** Página válida para um total que pode ter encolhido (filtro novo, exclusão). */
export function clampPage(page: number, total: number, perPage: number): number {
  const last = Math.max(1, Math.ceil(total / perPage));
  return Math.min(Math.max(1, page), last);
}

/** A fatia da lista que a página atual mostra. */
export function pageSlice<T>(items: T[], page: number, perPage: number): T[] {
  const safe = clampPage(page, items.length, perPage);
  return items.slice((safe - 1) * perPage, safe * perPage);
}

export default function AdminPagination({
  total,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  itemLabel = 'itens',
  perPageOptions = PER_PAGE_OPTIONS
}: AdminPaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const current = clampPage(page, total, perPage);
  const from = total === 0 ? 0 : (current - 1) * perPage + 1;
  const to = Math.min(current * perPage, total);

  // Janela curta em volta da página atual: com 40 páginas, listar todas é pior
  // do que não ter atalho nenhum.
  const numbers: number[] = [];
  const start = Math.max(1, Math.min(current - 2, lastPage - 4));
  for (let n = start; n <= Math.min(lastPage, start + 4); n++) numbers.push(n);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/60">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-slate-500">
          {total === 0
            ? `Nenhum resultado`
            : `Mostrando ${from}–${to} de ${total} ${itemLabel}`}
        </span>
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
          por página
          <select
            value={perPage}
            onChange={(e) => { onPerPageChange(Number(e.target.value)); onPageChange(1); }}
            className="border border-slate-200 rounded-lg px-1.5 py-1 bg-white text-slate-700 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      {lastPage > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(current - 1)}
            disabled={current <= 1}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {numbers.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              className={`min-w-[28px] h-7 px-2 rounded-lg text-[11px] font-black transition-colors cursor-pointer ${
                n === current
                  ? 'bg-primary text-white'
                  : 'text-slate-500 hover:bg-white hover:text-primary'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(current + 1)}
            disabled={current >= lastPage}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-white hover:text-primary disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
