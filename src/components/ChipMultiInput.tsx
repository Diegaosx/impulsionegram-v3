import { useMemo, useRef, useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface ChipMultiInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  allowCreate?: boolean;
}

export default function ChipMultiInput({
  value,
  onChange,
  suggestions,
  placeholder = 'Digite e pressione Enter...',
  allowCreate = true
}: ChipMultiInputProps) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = (name: string) => value.some(v => v.toLowerCase() === name.toLowerCase());

  // Suggestions matching the typed text and not already selected.
  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    return suggestions
      .filter(s => !hasValue(s))
      .filter(s => (q ? s.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [text, suggestions, value]);

  const exactExists = suggestions.some(s => s.toLowerCase() === text.trim().toLowerCase());

  const addValue = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (hasValue(t)) { setText(''); return; }
    // Reuse the canonical casing of an existing suggestion (avoids duplicates).
    const canonical = suggestions.find(s => s.toLowerCase() === t.toLowerCase()) || t;
    onChange([...value, canonical]);
    setText('');
  };

  const removeValue = (name: string) => {
    onChange(value.filter(v => v !== name));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (text.trim()) addValue(text);
    } else if (e.key === 'Backspace' && !text && value.length > 0) {
      removeValue(value[value.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div
        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-wrap gap-1.5 items-center focus-within:ring-2 focus-within:ring-primary focus-within:bg-white transition-all min-h-[42px]"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(v => (
          <span key={v} className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold py-1 px-2 rounded-lg flex items-center gap-1.5">
            {v}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeValue(v); }}
              className="hover:bg-primary/20 rounded p-0.5 text-primary/70 hover:text-primary"
              title="Remover"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-xs font-semibold text-slate-800 outline-none py-1 px-1"
        />
      </div>

      {open && (filtered.length > 0 || (allowCreate && text.trim() && !exactExists)) && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-56 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addValue(s); }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors flex items-center justify-between"
            >
              <span>{s}</span>
              <span className="text-[9px] text-slate-400 uppercase font-black">existente</span>
            </button>
          ))}
          {allowCreate && text.trim() && !exactExists && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addValue(text); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-primary hover:bg-purple-50 transition-colors flex items-center gap-1.5 border-t border-slate-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Criar "{text.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
