import { useState, useMemo } from 'react';
import { FAQS } from '../data';
import { FAQItem } from '../types';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, AlertTriangle } from 'lucide-react';
import { CompanySettings } from '../utils/storage';

interface FAQAccordionProps {
  onNavigate: (sectionId: string) => void;
  company?: CompanySettings | null;
}

export default function FAQAccordion({ onNavigate, company }: FAQAccordionProps) {
  const waPhone = company?.whatsappNumber || '5511999999999';
  const [activeId, setActiveId] = useState<string | null>('faq-1'); // Keep first one open by default!
  const [activeCategory, setActiveCategory] = useState<'todos' | 'geral' | 'seguranca' | 'entrega' | 'pagamento'>('todos');

  // Filter FAQs
  const filteredFaqs = useMemo(() => {
    if (activeCategory === 'todos') return FAQS;
    return FAQS.filter(f => f.category === activeCategory);
  }, [activeCategory]);

  const toggleAccordion = (id: string) => {
    setActiveId(activeId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 bg-slate-50 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase font-black bg-purple-50 border border-primary/20 text-primary px-3 py-1.5 rounded-full tracking-wider">
            Painel de Tira-Dúvidas
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-4">
            Perguntas Frequentes
          </h2>
          <p className="text-slate-500 mt-3 text-sm font-semibold max-w-xl mx-auto">
            Esclarecemos de forma objetiva as principais preocupações de segurança e prazos de entrega dos seguidores brasileiros premium.
          </p>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-8">
            <button
              onClick={() => setActiveCategory('todos')}
              className={`px-4 py-2 rounded text-xs font-bold border transition-all cursor-pointer ${
                activeCategory === 'todos'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveCategory('geral')}
              className={`px-4 py-2 rounded text-xs font-bold border transition-all cursor-pointer ${
                activeCategory === 'geral'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              💼 Geral
            </button>
            <button
              onClick={() => setActiveCategory('seguranca')}
              className={`px-4 py-2 rounded text-xs font-bold border transition-all cursor-pointer ${
                activeCategory === 'seguranca'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              🛡️ Segurança
            </button>
            <button
              onClick={() => setActiveCategory('entrega')}
              className={`px-4 py-2 rounded text-xs font-bold border transition-all cursor-pointer ${
                activeCategory === 'entrega'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ⚡ Entrega
            </button>
            <button
              onClick={() => setActiveCategory('pagamento')}
              className={`px-4 py-2 rounded text-xs font-bold border transition-all cursor-pointer ${
                activeCategory === 'pagamento'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              💳 Pagamento
            </button>
          </div>
        </div>

        {/* Accordions list */}
        <div className="space-y-3 max-w-3xl mx-auto" id="faqs-accordion-panel">
          {filteredFaqs.map((faq) => {
            const isOpen = activeId === faq.id;
            
            return (
              <div 
                key={faq.id}
                className={`bg-white border rounded transition-all duration-200 overflow-hidden shadow-sm ${
                  isOpen ? 'border-primary' : 'border-slate-200'
                }`}
              >
                {/* Accordion Toggle Bar */}
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full flex justify-between items-center p-4.5 text-left font-display font-bold text-slate-800 text-xs sm:text-sm focus:outline-none cursor-pointer"
                  id={`faq-btn-${faq.id}`}
                >
                  <span className="flex items-start gap-2.5">
                    <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-primary shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-4" />
                  )}
                </button>

                {/* Expanded content panel */}
                {isOpen && (
                  <div className="px-4.5 pb-4.5 pt-0 text-slate-500 text-xs leading-relaxed font-semibold">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions banner */}
        <div className="mt-14 max-w-xl mx-auto text-center space-y-4 pt-4">
          <p className="text-sm font-semibold text-slate-500">
            Ainda possui alguma dúvida específica sobre o envio?
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => onNavigate('contato')}
              className="bg-transparent hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold px-5 py-3 rounded transition-all cursor-pointer"
              id="faq-nav-contact-btn"
            >
              Fale Conosco E-mail
            </button>
            <a
              href={`https://api.whatsapp.com/send?phone=${waPhone}&text=Ol%C3%A1%21+Estou+com+uma+d%C3%BAvida+sobre+o+pedido+de+seguidores.`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-5 py-3 rounded flex items-center justify-center gap-1.5 shadow-sm"
              id="faq-whatsapp-btn"
            >
              <MessageCircle className="h-4.5 w-4.5 shrink-0" />
              WhatsApp Direto
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
