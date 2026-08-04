// Acordeão de perguntas frequentes.
//
// Segue o padrão da referência: seção em duas colunas a partir de 992px, com o
// texto à esquerda e o acordeão à direita, abrindo um item por vez, divisor
// fino e ícone de mais/menos em laranja.

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export interface FaqEntryLike {
  id: string;
  question: string;
  answer: string;
}

interface FaqProps {
  faqs: FaqEntryLike[];
  title?: string;
  subtitle?: string;
  /** Sem a seção externa — usado dentro da página de serviço. */
  bare?: boolean;
}

export default function JapFaq({ faqs, title, subtitle, bare }: FaqProps) {
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);
  const usable = faqs.filter(f => f.question && f.answer);
  if (usable.length === 0) return null;

  const list = (
    <div className="jap-card-tint p-5 md:p-10">
      {usable.map((f, i) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--jap-border-soft)' }}>
            <button
              onClick={() => setOpen(isOpen ? null : f.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 py-6 text-left cursor-pointer"
            >
              <b className="text-base" style={{ color: 'var(--jap-ink)' }}>{f.question}</b>
              <span className="shrink-0" style={{ color: 'var(--jap-orange)' }}>
                {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </span>
            </button>
            {isOpen && (
              <p className="pb-6 text-base whitespace-pre-line" style={{ color: 'var(--jap-body)' }}>{f.answer}</p>
            )}
          </div>
        );
      })}
    </div>
  );

  if (bare) return list;

  return (
    <section id="faq" className="py-[30px] md:py-[50px] lg:py-[70px]" style={{ background: 'var(--jap-surface-tint)' }}>
      <div className="max-w-[1320px] mx-auto px-6 lg:px-3 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div>
          <h2 className="font-bold" style={{ color: 'var(--jap-ink)', fontSize: 'clamp(24px, 3vw, 48px)', lineHeight: 1.2 }}>
            {title || 'Perguntas frequentes'}
          </h2>
          <p className="mt-4 text-base" style={{ color: 'var(--jap-body)' }}>
            {subtitle || 'As dúvidas que mais recebemos sobre entrega, segurança e pagamento.'}
          </p>
        </div>
        <div style={{ background: 'var(--jap-surface)', borderRadius: 'var(--jap-r-card)' }}>{list}</div>
      </div>
    </section>
  );
}
