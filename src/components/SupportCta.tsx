// Convite ao atendimento por ticket, no lugar do formulário aberto.
//
// O formulário anônimo sumiu do site: uma mensagem sem conta não dá para
// responder dentro do sistema, não tem histórico e não se liga a um pedido.
// Este bloco é o que fica no lugar dele nos quatro temas — explica o que muda,
// leva para o login/cadastro e, para quem já entrou, direto ao formulário de
// abertura dentro da conta.
//
// Ele não decide o visual da seção: os temas continuam donos do enquadramento
// (título, fundo, colunas). Aqui é só o miolo.

import { Link } from 'react-router-dom';
import { LifeBuoy, LogIn, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react';
import { AuthUser } from '../utils/storage';
import { getCachedUser } from '../utils/authFetch';
import { TICKET_CATEGORIES } from '../utils/tickets';

interface SupportCtaProps {
  /** Quando omitido, vale a sessão em cache (o bloco aparece em páginas sem auth). */
  user?: AuthUser | null;
  /** Compacto: sem a lista de categorias (usado dentro da página de ajuda). */
  compact?: boolean;
  className?: string;
}

export default function SupportCta({ user, compact = false, className = '' }: SupportCtaProps) {
  const current = user !== undefined ? user : getCachedUser<AuthUser>();
  const logged = !!current;

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="bg-purple-50 text-primary p-2.5 rounded-xl shrink-0">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
            Atendimento por ticket
          </h3>
          <p className="text-slate-500 text-xs font-semibold mt-1 leading-relaxed">
            {logged
              ? 'Abra um ticket pela sua conta: você acompanha a resposta, o histórico fica salvo e o atendimento enxerga os seus pedidos.'
              : 'As mensagens agora passam pela sua conta. Assim você acompanha a resposta no painel, o histórico fica salvo e quem atende já vê os seus pedidos.'}
          </p>
        </div>
      </div>

      {!compact && (
        <ul className="grid grid-cols-2 gap-2">
          {TICKET_CATEGORIES.map(c => (
            <li key={c.value} className={`border rounded-xl px-3 py-2 ${c.badge}`}>
              <span className="text-[11px] font-black uppercase tracking-wider block">{c.label}</span>
              <span className="text-[10px] font-semibold opacity-80 block leading-tight mt-0.5">{c.hint}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2.5">
        {logged ? (
          <Link
            to="/minha-conta?aba=tickets"
            className="inline-flex items-center gap-2 bg-primary hover:bg-purple-700 text-white text-xs font-bold rounded-xl px-4 py-3 transition-colors"
          >
            <LifeBuoy className="h-4 w-4" /> Abrir um ticket
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-primary hover:bg-purple-700 text-white text-xs font-bold rounded-xl px-4 py-3 transition-colors"
            >
              <LogIn className="h-4 w-4" /> Entrar na minha conta
            </Link>
            <Link
              to="/cadastro"
              className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-primary/40 text-slate-700 hover:text-primary text-xs font-bold rounded-xl px-4 py-3 transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Criar conta grátis <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </>
        )}
      </div>

      <p className="flex items-start gap-2 text-[11px] font-semibold text-slate-400 leading-relaxed">
        <ShieldCheck className="h-4 w-4 shrink-0 mt-px" />
        Cada ticket fica ligado ao seu perfil, com categoria e prioridade. Para dúvidas rápidas,
        o WhatsApp e o e-mail continuam nos canais acima.
      </p>
    </div>
  );
}
