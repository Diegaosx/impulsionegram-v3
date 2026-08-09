// Avaliação de um pedido entregue.
//
// Só aparece para pedido entregue e só uma vez por pedido — é isso que faz a
// nota da página do serviço valer alguma coisa: cada estrela veio de uma
// entrega, não de um formulário aberto.
//
// A avaliação entra como pendente; quem publica é o admin.

import { FormEvent, useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import { AdminOrder, submitServiceReview } from '../utils/storage';
import StarRating from './StarRating';

interface ReviewOrderModalProps {
  order: AdminOrder;
  onClose: () => void;
  onSaved: () => void;
}

const MAX_COMMENT = 1500;

export default function ReviewOrderModal({ order, onClose, onSaved }: ReviewOrderModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!comment.trim()) { setError('Escreva um comentário sobre o serviço.'); return; }
    setSaving(true);
    const res = await submitServiceReview({ orderId: order.id, rating, comment: comment.trim() });
    setSaving(false);
    if (!res.ok) { setError(res.error || 'Falha ao enviar a avaliação.'); return; }
    setDone(true);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100">
          <div>
            <h4 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" /> Avalie o serviço
            </h4>
            <p className="text-slate-500 text-xs font-semibold mt-0.5">
              {order.serviceLabel} · pedido #{order.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <Send className="h-5 w-5" />
            </div>
            <h3 className="font-display font-black text-lg text-slate-900">Avaliação enviada!</h3>
            <p className="text-slate-500 text-xs font-semibold">
              Ela passa por uma conferência antes de aparecer na página do serviço.
            </p>
            <button
              onClick={onClose}
              className="text-primary text-xs font-bold hover:underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            {error && (
              <p className="bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Sua nota</label>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Comentário</label>
              <textarea
                rows={5}
                value={comment}
                maxLength={MAX_COMMENT}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Como foi a entrega? O resultado foi o esperado? O que outra pessoa deveria saber antes de comprar?"
                className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white resize-y"
              />
              <span className="text-[10px] text-slate-400 font-bold block text-right">{comment.length}/{MAX_COMMENT}</span>
            </div>

            <p className="text-[10px] font-semibold text-slate-400">
              A avaliação aparece com o seu nome e o selo de compra verificada, depois de conferida.
            </p>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl px-5 py-3 transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" /> {saving ? 'Enviando...' : 'Enviar avaliação'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
