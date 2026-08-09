// Pedidos de um usuário, abertos pela coluna "Compras".
//
// A lista é o resumo do que o admin quer ver antes de decidir se abre o pedido
// inteiro: serviço, tipo de entrega, rede, data/hora, quantidade, valor e
// status.
//
// O vínculo entre pedido e conta repete o do servidor (accountId, ou o e-mail
// quando a compra foi feita sem login): se a regra aqui fosse outra, o modal
// mostraria um número diferente do que a própria coluna anuncia.

import { X, ShoppingBag } from 'lucide-react';
import { AdminOrder, AdminAccount } from '../utils/storage';
import { Catalog, platformName, serviceTypeLabel } from '../utils/catalog';
import { orderStatusInfo } from '../utils/orderStatus';
import { formatDateTime } from '../utils/datetime';

interface UserOrdersModalProps {
  user: AdminAccount;
  orders: AdminOrder[];
  catalog: Catalog;
  onClose: () => void;
}

/** Pedidos de uma conta, na mesma regra que o servidor usa para contar. */
export function ordersOfUser(orders: AdminOrder[], user: { id: string; email?: string }): AdminOrder[] {
  const email = (user.email || '').trim().toLowerCase();
  return orders.filter(o =>
    (o.accountId && o.accountId === user.id) ||
    (!!email && String(o.email || '').trim().toLowerCase() === email)
  );
}

const money = (v: number) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function UserOrdersModal({ user, orders, catalog, onClose }: UserOrdersModalProps) {
  const mine = ordersOfUser(orders, user)
    .slice()
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const total = mine.reduce((sum, o) => sum + (Number(o.price) || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100">
          <div>
            <h4 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Compras de {user.name || user.email}
            </h4>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">
              {mine.length} {mine.length === 1 ? 'pedido' : 'pedidos'} · {money(total)} no total
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto">
          {mine.length === 0 ? (
            <p className="p-10 text-center text-xs font-semibold text-slate-500">
              Este usuário ainda não tem pedidos.
            </p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-wider font-mono sticky top-0">
                <tr>
                  <th className="p-3">Pedido</th>
                  <th className="p-3">Serviço</th>
                  <th className="p-3">Qtd.</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                {mine.map(order => {
                  const info = orderStatusInfo(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60">
                      <td className="p-3 align-top">
                        <span className="font-mono font-bold text-slate-900 block">#{order.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {formatDateTime(order.date, {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="p-3 align-top">
                        <span className="font-bold text-slate-800 block">{order.serviceLabel}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                          {platformName(catalog, order.platform)}
                          {order.serviceType ? ` · ${serviceTypeLabel(catalog, order.serviceType)}` : ''}
                        </span>
                      </td>
                      <td className="p-3 align-top font-mono">{Number(order.quantity || 0).toLocaleString('pt-BR')}</td>
                      <td className="p-3 align-top font-mono font-bold text-slate-900">{money(order.price)}</td>
                      <td className="p-3 align-top">
                        <span className={`inline-block px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${info.badge}`}>
                          {info.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
