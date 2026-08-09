// Devolutiva do campo de perfil/publicação, logo abaixo do input.
//
// Existe por um motivo concreto: o cliente cola o endereço que o botão
// "compartilhar" do aplicativo gera e não tem como saber que aquilo não serve.
// Mostrar o que será realmente usado ("vamos usar: martins_decassia") resolve
// no ato, sem transformar o pedido num problema de suporte depois.
//
// Compartilhado pelos quatro temas e pela área do cliente para que a mensagem
// seja a mesma em todo lugar.

import { AlertCircle, Check } from 'lucide-react';
import { NormalizedTarget } from '../utils/socialTarget';

interface TargetHintProps {
  /** Resultado da normalização; null desliga a dica. */
  result?: NormalizedTarget | null;
  /** Texto cru do campo: com o campo vazio não há nada a dizer ainda. */
  raw: string;
  className?: string;
}

export default function TargetHint({ result, raw, className = '' }: TargetHintProps) {
  if (!result || !raw.trim()) return null;

  if (!result.ok) {
    return (
      <span className={`flex items-start gap-1 text-[11px] font-bold text-red-600 mt-1 ${className}`}>
        <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
        <span>{result.error}</span>
      </span>
    );
  }

  // Sem correção nenhuma, o valor já está à vista no campo: não repete.
  if (!result.note) return null;

  return (
    <span className={`flex items-start gap-1 text-[11px] font-bold text-emerald-600 mt-1 ${className}`}>
      <Check className="h-3 w-3 shrink-0 mt-0.5" />
      <span>
        Vamos usar: <strong className="font-black break-all">{result.value}</strong>
        <span className="font-semibold text-slate-400"> ({result.note})</span>
      </span>
    </span>
  );
}
