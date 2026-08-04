// Acordeão de perguntas frequentes.
//
// Segue a referência no essencial: <details>/<summary> nativos, coluna de
// 820px, filete separando os itens, primeiro item aberto e acordeão NÃO
// exclusivo (vários podem ficar abertos).
//
// Três coisas que a referência não faz e que fazem falta: não há indicador
// visual de aberto/fechado (ela remove o marcador nativo e não põe nada no
// lugar), as perguntas não são headings, e não há transição.

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

export default function GlassFaq({ faqs, title, subtitle, bare }: FaqProps) {
  const usable = faqs.filter(f => f.question && f.answer);
  if (usable.length === 0) return null;

  const list = (
    <div className="max-w-[820px] mx-auto" style={{ borderTop: '1px solid var(--gl-line)' }}>
      {usable.map((f, i) => (
        <details key={f.id} open={i === 0} className="group py-5" style={{ borderBottom: '1px solid var(--gl-line)' }}>
          <summary
            className="flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden"
          >
            <h3 className="text-lg font-black" style={{ color: 'var(--gl-ink)' }}>{f.question}</h3>
            <span className="shrink-0" style={{ color: 'var(--gl-pink)' }} aria-hidden="true">
              <Plus className="h-5 w-5 group-open:hidden" />
              <Minus className="h-5 w-5 hidden group-open:block" />
            </span>
          </summary>
          <p className="mt-3 whitespace-pre-line" style={{ color: 'var(--gl-body)', lineHeight: 1.6 }}>{f.answer}</p>
        </details>
      ))}
    </div>
  );

  if (bare) return list;

  return (
    <section id="faq" className="gl-wrap py-8 md:py-16">
      <div className="text-center max-w-2xl mx-auto mb-9">
        <h2 className="font-bold" style={{ color: 'var(--gl-ink)', fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.1 }}>
          {title || <>Perguntas <span className="gl-accent">frequentes</span></>}
        </h2>
        <p className="mt-3 text-lg" style={{ color: 'var(--gl-body)', lineHeight: 1.55 }}>
          {subtitle || 'As dúvidas que mais recebemos sobre entrega, segurança e pagamento.'}
        </p>
      </div>
      {list}
    </section>
  );
}
