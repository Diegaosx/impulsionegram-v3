// Estrelas de avaliação: só leitura ou clicáveis.
//
// Aparece na página do serviço, no formulário do cliente e na moderação do
// painel — três lugares, um comportamento.

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  /** Sem isto, as estrelas são apenas um indicador. */
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-7 w-7' };

export default function StarRating({ value, onChange, size = 'md', className = '' }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const editable = typeof onChange === 'function';
  const shown = hover || value;

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} role={editable ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map(n => {
        const filled = n <= shown;
        const icon = (
          <Star
            className={`${SIZES[size]} ${filled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          />
        );
        if (!editable) return <span key={n}>{icon}</span>;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
            onClick={() => onChange!(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="cursor-pointer p-0.5 transition-transform hover:scale-110"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
