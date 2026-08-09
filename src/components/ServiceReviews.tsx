// Avaliações publicadas de um serviço, no fim da página dele.
//
// É a mesma peça nos quatro temas. O bloco traz só o miolo (resumo da nota e a
// lista); o enquadramento — fundo, título da seção, largura — continua sendo de
// cada tema, que é onde a identidade visual mora.
//
// Não renderiza nada enquanto não há avaliação aprovada: uma seção vazia
// dizendo "ainda não há avaliações" só chama atenção para a falta delas.

import { useEffect, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { ServiceReview, fetchServiceReviews } from '../utils/storage';
import { formatDateTime } from '../utils/datetime';
import StarRating from './StarRating';

interface ServiceReviewsProps {
  serviceId: string;
  /** Classe do cartão de cada avaliação, para o tema ajustar o contraste. */
  cardClassName?: string;
  className?: string;
}

export default function ServiceReviews({
  serviceId,
  cardClassName = 'bg-white border border-slate-200',
  className = ''
}: ServiceReviewsProps) {
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    let alive = true;
    fetchServiceReviews(serviceId).then(r => {
      if (!alive) return;
      setReviews(r.reviews);
      setAverage(r.average);
      setCount(r.count);
    });
    return () => { alive = false; };
  }, [serviceId]);

  if (!count) return null;

  const visible = showAll ? reviews : reviews.slice(0, 6);

  return (
    <div className={className} data-testid="service-reviews">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="font-display font-black text-3xl text-slate-900">{average.toFixed(1).replace('.', ',')}</span>
        <div>
          <StarRating value={Math.round(average)} size="sm" />
          <span className="block text-[11px] font-bold text-slate-400">
            {count} {count === 1 ? 'avaliação de quem comprou' : 'avaliações de quem comprou'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map(r => (
          <article key={r.id} className={`rounded-2xl p-5 shadow-sm ${cardClassName}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-bold text-slate-900 text-sm block">{r.authorName || 'Cliente'}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                  <BadgeCheck className="h-3.5 w-3.5" /> Compra verificada
                </span>
              </div>
              <StarRating value={r.rating} size="sm" />
            </div>
            <p className="text-[13px] font-semibold text-slate-600 leading-relaxed mt-3 whitespace-pre-wrap break-words">
              {r.comment}
            </p>
            {r.reply && (
              <div className="mt-3 border-l-2 border-primary/30 pl-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary block">Resposta da loja</span>
                <p className="text-[12px] font-semibold text-slate-500 leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
                  {r.reply}
                </p>
              </div>
            )}
            <span className="text-[10px] font-mono text-slate-300 block mt-3">
              {formatDateTime(r.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </article>
        ))}
      </div>

      {reviews.length > visible.length && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-5 mx-auto block text-xs font-bold text-primary hover:underline cursor-pointer"
        >
          Ver todas as {reviews.length} avaliações
        </button>
      )}
    </div>
  );
}
