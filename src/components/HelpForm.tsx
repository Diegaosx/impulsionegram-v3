import { Mail, MessageCircle, HelpCircle } from 'lucide-react';
import { HomeContent, CompanySettings, AuthUser } from '../utils/storage';
import SupportCta from './SupportCta';

interface HelpFormProps {
  homeContent: HomeContent | null;
  company?: CompanySettings | null;
  onGoFaq?: () => void;
  /** Passado pela área do cliente, onde a sessão já é conhecida. */
  user?: AuthUser | null;
}

// Bloco de ajuda compartilhado (canais rápidos + atendimento), usado pela
// página pública de ajuda dos quatro temas e pela área do cliente.
//
// O formulário aberto que existia aqui saiu do ar: mensagem sem conta não tem
// como ser respondida dentro do sistema nem ligada a um pedido. No lugar dele
// fica o caminho para o ticket, que é onde a conversa passa a acontecer.
export default function HelpForm({ homeContent, company, onGoFaq, user }: HelpFormProps) {
  const whats = company?.whatsappNumber || homeContent?.companyWhatsApp || '5511999999999';
  const mail = company?.contactEmail || homeContent?.companyEmail || 'contato@impulsionegram.com.br';

  return (
    <div className="space-y-6">
      {/* Quick channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a href={`https://api.whatsapp.com/send?phone=${whats}`} target="_blank" rel="noopener noreferrer"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-green-300 transition-colors text-center">
          <div className="inline-flex p-2.5 rounded-xl bg-green-50 text-green-600"><MessageCircle className="h-5 w-5" /></div>
          <h3 className="font-bold text-slate-800 text-sm mt-3">WhatsApp</h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Atendimento rápido</p>
        </a>
        <a href={`mailto:${mail}`}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-colors text-center">
          <div className="inline-flex p-2.5 rounded-xl bg-purple-50 text-primary"><Mail className="h-5 w-5" /></div>
          <h3 className="font-bold text-slate-800 text-sm mt-3">E-mail</h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5 break-all">{mail}</p>
        </a>
        <button onClick={() => onGoFaq && onGoFaq()}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-colors text-center">
          <div className="inline-flex p-2.5 rounded-xl bg-sky-50 text-sky-600"><HelpCircle className="h-5 w-5" /></div>
          <h3 className="font-bold text-slate-800 text-sm mt-3">Perguntas frequentes</h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Ver o FAQ</p>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <SupportCta user={user} />
      </div>
    </div>
  );
}
