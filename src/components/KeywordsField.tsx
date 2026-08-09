// Campo de palavras-chave de SEO.
//
// É o mesmo campo em três lugares (configurações gerais, página de serviço e
// artigo do blog), então mora aqui: rótulo, dica e contador iguais, e um só
// ponto para mudar o teto se ele mudar. As fichas em si são o ChipMultiInput,
// o mesmo componente de categorias e tags.

import ChipMultiInput from './ChipMultiInput';
import { MAX_KEYWORDS, normalizeKeywords } from '../utils/keywords';

interface KeywordsFieldProps {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  /** Palavras já usadas em outro lugar, oferecidas enquanto se digita. */
  suggestions?: string[];
  hint?: string;
  placeholder?: string;
}

export default function KeywordsField({
  value,
  onChange,
  label = 'Palavras-chave (SEO)',
  suggestions = [],
  hint,
  placeholder = 'Digite uma palavra-chave e Enter (ou cole separadas por vírgula)...'
}: KeywordsFieldProps) {
  const full = value.length >= MAX_KEYWORDS;

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">{label}</label>
      <ChipMultiInput
        value={value}
        onChange={(next) => onChange(normalizeKeywords(next))}
        suggestions={suggestions}
        placeholder={full ? `Limite de ${MAX_KEYWORDS} palavras-chave atingido.` : placeholder}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] text-slate-400">
          {hint || 'Separe por vírgula ou Enter. Uma lista curta e específica funciona melhor do que uma longa.'}
        </span>
        <span className={`text-[10px] font-bold shrink-0 ${full ? 'text-amber-600' : 'text-slate-400'}`}>
          {value.length}/{MAX_KEYWORDS}
        </span>
      </div>
    </div>
  );
}
