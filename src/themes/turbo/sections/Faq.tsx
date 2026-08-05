// Acordeão de perguntas frequentes do tema "Turbo".
//
// Segue a referência no comportamento: só um item fica aberto por vez e o
// chevron NÃO gira ao abrir. Como isso deixa o estado sem sinal nenhum, o item
// aberto ganha fundo #E1D9F5 e o chevron fica roxo — é o mesmo par de estados
// que a referência usa nos cards de etapa, então não inventa vocabulário novo.

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FaqEntryLike {
  id: string;
  question: string;
  answer: string;
}

interface FaqProps {
  faqs: FaqEntryLike[];
  title?: string;
  subtitle?: string;
  kicker?: string;
}

export default function TurboFaq({ faqs, title, subtitle, kicker }: FaqProps) {
  const usable = faqs.filter(f => f.question && f.answer);
  const [openId, setOpenId] = useState<string>(usable[0]?.id || '');

  if (usable.length === 0) return null;

  return (
    <section id="faq" className="tb-wrap py-12 md:py-20">
      <div className="text-center max-w-2xl mx-auto">
        <span className="tb-kicker">{kicker || 'Dúvidas'}</span>
        <h2 className="tb-title mt-2.5">{title || 'Perguntas frequentes'}</h2>
        <p className="tb-lead mt-3.5">
          {subtitle || 'As dúvidas que mais recebemos sobre entrega, segurança e pagamento.'}
        </p>
      </div>

      <div className="max-w-[860px] mx-auto mt-10 space-y-3">
        {usable.map(f => {
          const open = openId === f.id;
          return (
            <div
              key={f.id}
              className="tb-card-sm overflow-hidden"
              style={open ? { background: 'var(--tb-active)' } : undefined}
            >
              <h3>
                <button
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 cursor-pointer font-black"
                  style={{ color: 'var(--tb-ink)' }}
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? '' : f.id)}
                >
                  {f.question}
                  <ChevronDown
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                    style={{ color: open ? 'var(--tb-brand)' : 'var(--tb-muted)' }}
                  />
                </button>
              </h3>
              {open && (
                <p className="px-5 pb-5 whitespace-pre-line" style={{ color: 'var(--tb-body)', lineHeight: 1.65 }}>
                  {f.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
