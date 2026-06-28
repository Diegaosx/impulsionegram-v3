import React, { useState, useMemo, useEffect } from 'react';
import { SocialPlatform } from '../types';
import { TestimonialItem, fetchTestimonials, submitTestimonial } from '../utils/storage';
import { getRecaptchaToken } from '../utils/recaptcha';
import { Star, Plus, CheckCircle2 } from 'lucide-react';

// Fallback avatar for testimonials without a custom photo.
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

export default function Testimonials() {
  const [reviewsList, setReviewsList] = useState<TestimonialItem[]>([]);
  const [filterPlatform, setFilterPlatform] = useState<SocialPlatform | 'todos'>('todos');

  // Submit review states
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState('');
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('instagram');
  const [submittedReview, setSubmittedReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Load approved testimonials from the API.
  useEffect(() => {
    fetchTestimonials().then(setReviewsList).catch(() => {});
  }, []);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    if (filterPlatform === 'todos') return reviewsList;
    return reviewsList.filter(r => r.platformUsed === filterPlatform);
  }, [reviewsList, filterPlatform]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (!newName.trim() || !newText.trim() || !newRole.trim()) {
      setValidationError('Favor preencher todos os campos do depoimento.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getRecaptchaToken('testimonial');
      const result = await submitTestimonial(
        { name: newName.trim(), role: newRole.trim(), rating: newRating, text: newText.trim(), platformUsed: newPlatform },
        token
      );
      if (!result.ok) {
        setValidationError(result.error || 'Falha ao enviar depoimento.');
        return;
      }
      setSubmittedReview(true);
      // Reset form states
      setNewName('');
      setNewRole('');
      setNewRating(5);
      setNewText('');
      setTimeout(() => {
        setSubmittedReview(false);
        setShowForm(false);
      }, 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="depoimentos" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase font-black bg-purple-50 border border-primary/20 text-primary px-3 py-1.5 rounded-full tracking-wider">
            Opinião Realizada de Clientes
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-4">
            O Que Nossos Clientes Dizem
          </h2>
          <p className="text-slate-500 mt-3 text-sm font-semibold max-w-xl mx-auto leading-relaxed">
            Confira histórias reais de influencers, lojistas e criadores de conteúdo que impulsionaram sua imagem digital conosco.
          </p>

          {/* Social Filters */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-8 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterPlatform('todos')}
              className={`px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer border ${
                filterPlatform === 'todos'
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
              id="review-filter-all"
            >
              ⭐ Todos ({reviewsList.length})
            </button>
            <button
              onClick={() => setFilterPlatform('instagram')}
              className={`px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer border ${
                filterPlatform === 'instagram'
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
              id="review-filter-ig"
            >
              📸 Instagram
            </button>
            <button
              onClick={() => setFilterPlatform('tiktok')}
              className={`px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer border ${
                filterPlatform === 'tiktok'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
              id="review-filter-tt"
            >
              🎵 TikTok
            </button>
            <button
              onClick={() => setFilterPlatform('youtube')}
              className={`px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer border ${
                filterPlatform === 'youtube'
                  ? 'bg-red-600 border-red-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
              id="review-filter-yt"
            >
              🎥 YouTube
            </button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-slate-50 rounded-lg p-6 border border-slate-200 flex flex-col justify-between hover:border-primary/40 transition-all duration-200 relative group h-full"
            >
              <div>
                {/* Estrelas */}
                <div className="flex gap-0.5 text-accent mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4.5 w-4.5 ${i < rev.rating ? 'fill-current' : 'text-slate-200'}`} />
                  ))}
                </div>

                {/* Comment Text */}
                <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6 font-medium italic">
                  "{rev.text}"
                </p>
              </div>

              {/* Reviewer Details Footer */}
              <div className="flex items-center gap-3 border-t border-slate-200 pt-4 mt-auto">
                <img
                  src={rev.avatar || DEFAULT_AVATAR}
                  alt={rev.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    {rev.name}
                    {rev.verified && (
                      <span className="inline-flex bg-primary/10 text-primary text-[9px] font-black uppercase px-2 py-0.5 rounded" title="Compra Verificada">
                        ✓ BR
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-400">{rev.role}</p>
                </div>
              </div>

              {/* Network badge tag */}
              <span className="absolute top-6 right-6 text-[9px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-400 px-2.5 py-0.5 rounded font-mono">
                {rev.platformUsed}
              </span>
            </div>
          ))}
        </div>

        {/* --- DYNAMIC ADD TESTIMONIAL TRIGGER --- */}
        <div className="mt-12 text-center" id="reviews-form-injector-panel">
          {showForm ? (
            <div className="bg-slate-50 rounded-xl p-6 sm:p-8 border border-slate-200 shadow-md text-left max-w-xl mx-auto animate-scale-up">

              {submittedReview ? (
                <div className="text-center py-6 space-y-3">
                  <div className="mx-auto bg-green-50 text-green-600 p-2 rounded-full inline-block">
                    <CheckCircle2 className="h-10 w-10 text-green-500 fill-current text-white rounded-full" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg">Depoimento Enviado!</h4>
                  <p className="text-slate-500 text-xs font-semibold">Obrigado! Seu depoimento foi enviado e aparecerá no site após a aprovação da nossa equipe.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <h3 className="font-display font-bold text-slate-900 text-sm">Escreva Seu Depoimento</h3>
                    <button type="button" onClick={() => setShowForm(false)} className="text-xs text-slate-500 underline font-semibold cursor-pointer">Cancelar</button>
                  </div>

                  {validationError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded p-2.5 font-bold">
                      ⚠ {validationError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block">Seu Nome completo</label>
                      <input
                        type="text"
                        placeholder="Ex: Amanda Santos"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs font-semibold rounded py-2 px-3 focus:outline-none focus:border-primary text-slate-800"
                        id="new-rev-name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block">Sua Profissão ou @ da rede</label>
                      <input
                        type="text"
                        placeholder="Ex: @amanda ou Empreendedora"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs font-semibold rounded py-2 px-3 focus:outline-none focus:border-primary text-slate-800"
                        id="new-rev-role"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block">Rede Social Utilizada</label>
                      <select
                        value={newPlatform}
                        onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
                        className="w-full bg-white border border-slate-200 text-xs font-bold rounded py-2.5 px-3 focus:outline-none focus:border-primary text-slate-600"
                      >
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="youtube">YouTube</option>
                        <option value="facebook">Facebook</option>
                        <option value="twitter">Twitter/X</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase block">Avaliação</label>
                      <div className="flex gap-1.5 items-center pt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => setNewRating(i + 1)}
                            className="p-1 focus:outline-none"
                            title={`Star ${i+1}`}
                          >
                            <Star className={`h-5 w-5 cursor-pointer ${i < newRating ? 'text-accent fill-current' : 'text-slate-250'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase block">Sua Opinião sincera</label>
                    <textarea
                      placeholder="Conte para nós como foi sua experiência com a entrega dos seguidores e o crescimento do perfil..."
                      rows={3}
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs font-semibold rounded py-2 px-3 focus:outline-none focus:border-primary text-slate-800"
                      id="new-rev-text"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 text-xs uppercase tracking-wider cursor-pointer rounded"
                    id="submit-custom-review-btn"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Meu Depoimento'}
                  </button>

                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    Protegido por reCAPTCHA. Seu depoimento passa por moderação antes de ser publicado.
                  </p>
                </form>
              )}

            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 font-bold text-slate-700 text-xs rounded py-3 px-6 cursor-pointer transition-all active:scale-95 shadow-sm"
              id="active-review-form-btn"
            >
              <Plus className="h-4 w-4 text-primary" />
              Deixar Meu Depoimento Verificado
            </button>
          )}
        </div>

      </div>
    </section>
  );
}
