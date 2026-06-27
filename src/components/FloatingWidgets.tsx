import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, X, Send, Sparkles, Shield, Clock, 
  HelpCircle, Check, ArrowRight, Bot, MessageSquare, Flame 
} from 'lucide-react';
import { ChatMessage } from '../types';
import { CompanySettings } from '../utils/storage';

interface FloatingWidgetsProps {
  onNavigate: (sectionId: string) => void;
  ordersCalculatedStat: number;
  homeContent: {
    heroTitle: string;
    heroSubtitle: string;
    alertBannerText: string;
    companyWhatsApp: string;
    companyEmail: string;
  } | null;
  company?: CompanySettings | null;
}

export default function FloatingWidgets({ onNavigate, ordersCalculatedStat, homeContent, company }: FloatingWidgetsProps) {
  
  // Sticky Top Promo Countdown State
  const [promoTime, setPromoTime] = useState(899); // 14 min 59 sec
  
  // Chat Bot States
  const [showChat, setShowChat] = useState(false);
  const [typing, setTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'agent',
      text: 'Olá! Sou a Sofia, especialista de suporte na ImpulsioneGram. Estou aqui para te ajudar a escolher o melhor plano de crescimento para o seu perfil. Qual é a sua dúvida hoje?',
      timestamp: 'Agora mesmo',
      suggestedQuestions: [
        'Quanto tempo leva a entrega?',
        'Preciso dar minha senha?',
        'Os seguidores somem?',
        'Quais formas de pagamento?',
        'Como funciona a reposição?'
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Cookie Consent banner
  const [showCookie, setShowCookie] = useState(true);

  // Promo Timer counting down
  useEffect(() => {
    const timer = setInterval(() => {
      setPromoTime((prev) => (prev <= 0 ? 899 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPromoTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Scroll chat to bottom on updates
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, typing]);

  // AI Chat Bot Auto Answers Engine (Fully offline & extremely fast!)
  const handleBotResponse = (userQuery: string) => {
    setTyping(true);

    const query = userQuery.toLowerCase();
    let responseText = '';
    let suggestions: string[] = [];

    // Smart intent mapping triggers
    if (query.includes('tempo') || query.includes('demora') || query.includes('hora') || query.includes('entrega')) {
      responseText = 'Nossa entrega é super rápida! O processamento começa automaticamente em até 10 minutos após o pagamento (no Pix é imediato). Configuramos o envio de forma natural e gradativa (algumas horas) para garantir total segurança contra o algoritmo das redes sociais!';
      suggestions = ['Preciso fornecer a senha?', 'Garantia de reposição', 'Ver planos'];
    } else if (query.includes('senha') || query.includes('seguro') || query.includes('bloqueio') || query.includes('banido') || query.includes('risco')) {
      responseText = 'Esqueça senhas! Nós nunca pediremos sua senha ou login em hipótese alguma. Todo o nosso sistema de envio é externo, o que torna o processo 100% seguro e livre de qualquer risco de bloqueio ou banimento do seu perfil.';
      suggestions = ['Como comprar?', 'Os seguidores são reais?'];
    } else if (query.includes('sumir') || query.includes('queda') || query.includes('queda de seguidores') || query.includes('reposição') || query.includes('some')) {
      responseText = 'Damos garantia exclusiva de reposição de 30 dias! Se qualquer seguidor deixar de seguir voluntariamente, nosso sistema detecta ou você pode acionar nosso reabastecimento inteligente com apenas um clique! Usamos perfis muito estáveis.';
      suggestions = ['Qual o valor?', 'Quais as formas de pagamento?'];
    } else if (query.includes('pagamento') || query.includes('pix') || query.includes('cartão') || query.includes('parcela') || query.includes('parcelamento')) {
      responseText = 'Aceitamos pagamentos instantâneos por PIX (com desconto de 5% extra aplicado!), todos os cartões de crédito nacionais com parcelamento em até 12x e boleto bancário. Tudo é processado pelo ambiente criptografado certificado do Mercado Pago e ASAAS!';
      suggestions = ['Ver planos', 'Como falar com humano?'];
    } else if (query.includes('real') || query.includes('brasileiro') || query.includes('brasileiros') || query.includes('ativos')) {
      responseText = 'Sim! Trabalhamos com perfis 100% reais de pessoas brasileiras físicas e ativas nas redes sociais. Não utilizamos fakes sem foto ou fakes árabes/asiáticos, o que garante a máxima credibilidade estética do seu perfil!';
      suggestions = ['Ver planos', 'Como funciona a entrega?'];
    } else if (query.includes('valor') || query.includes('preco') || query.includes('preço') || query.includes('plano') || query.includes('quanto custa')) {
      responseText = 'Nossos preços são excelentes! Temos planos a partir de R$ 19,90 por 500 seguidores. Você também pode simular quantidades customizadas na nossa Calculadora de Planos, com descontos progressivos de até 30% em grandes pedidos!';
      suggestions = ['Ir para planos', 'Quais formas de pagamento?'];
    } else if (query.includes('humano') || query.includes('falar com atendente') || query.includes('atendente') || query.includes('suporte')) {
      responseText = 'Para falar com um atendente humano agora mesmo, você pode nos contactar pelo WhatsApp oficial no topo do site ou deixar seus dados no formulário da seção "Fale Conosco". Respondemos rapidinho!';
      suggestions = ['WhatsApp de vendas', 'Mandar e-mail'];
    } else {
      responseText = 'Legal! Oferecemos os melhores pacotes de engajamento estável no Brasil para Instagram, TikTok e YouTube. Recomendo simular suas quantidades direto na nossa calculadora automática para obter até 30% de desconto!';
      suggestions = ['Ir para a Calculadora', 'Quanto tempo leva?', 'Como comprar?'];
    }

    setTimeout(() => {
      setTyping(false);
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'msg-reply-' + Date.now(),
          sender: 'agent',
          text: responseText,
          timestamp: 'Agora mesmo',
          suggestedQuestions: suggestions
        }
      ]);
    }, 1200);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        id: 'user-msg-' + Date.now(),
        sender: 'user',
        text: text,
        timestamp: 'Agora mesmo'
      }
    ]);
    setChatInput('');
    handleBotResponse(text);
  };

  const handleSuggestedClick = (quest: string) => {
    // Intercept redirect suggestions
    if (quest.includes('planos') || quest.includes('Calculadora') || quest.includes('plano')) {
      onNavigate('calculadora');
      setShowChat(false);
      return;
    }
    if (quest.includes('WhatsApp')) {
      const waPhone = company?.whatsappNumber || homeContent?.companyWhatsApp || '5511999999999';
      window.open(`https://api.whatsapp.com/send?phone=${waPhone}&text=Falar+com+atendente`, '_blank');
      return;
    }

    handleSendMessage(quest);
  };

  const handleCloseCookie = () => {
    setShowCookie(false);
  };

  const waPhone = company?.whatsappNumber || homeContent?.companyWhatsApp || '5511999999999';

  return (
    <>
      {/* 1. STICKY TOP FLASH PROMO COUNTDOWN BAR */}
      <div className="fixed top-0 left-0 right-0 min-h-[3rem] py-2 sm:py-0 sm:h-12 bg-slate-900 text-white z-50 flex items-center justify-center px-4 font-bold text-[10px] sm:text-xs shadow-md border-b border-primary/30">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 text-center">
          <Clock className="h-3.5 w-3.5 animate-pulse text-accent shrink-0" />
          <span className="text-slate-100 uppercase tracking-wide">
            {homeContent?.alertBannerText || "OFERTA RELÂMPAGO DE INVERNO: 20% OFF EXTRA NO PIX"}
          </span>
          <span className="text-accent font-mono tracking-wider tabular-nums font-black whitespace-nowrap">
            Termina em: {formatPromoTimer(promoTime)}
          </span>
          <button 
            onClick={() => onNavigate('calculadora')}
            className="bg-accent hover:bg-yellow-400 text-slate-900 px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition-all shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Aproveitar
          </button>
        </div>
      </div>

      {/* 2. FLOATING WHATSAPP BUTTON */}
      <a
        href={`https://api.whatsapp.com/send?phone=${waPhone}&text=Ol%C3%A1%21+Vim+do+site+e+gostaria+de+saber+mais+sobre+os+pacotes.`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-40 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center animate-bounce duration-1000 cursor-pointer"
        title="Falar no WhatsApp"
        id="floating-whatsapp-trigger"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 animate-pulse">
          Online
        </span>
      </a>

      {/* 3. INTERACTIVE AI CUSTOMER SERVICE CHAT SPECIALIST */}
      <div className="fixed bottom-6 right-6 z-40 text-slate-800" id="ai-chat-bubble-container">
        {showChat ? (
          /* expanded Chat Wrapper */
          <div className="bg-white rounded-lg shadow-xl border-2 border-slate-900 w-80 sm:w-96 overflow-hidden flex flex-col justify-between animate-scale-up h-[420px] sm:h-[480px]">
            
            {/* Bot Header */}
            <div className="bg-slate-900 text-white p-4 border-b border-slate-800 relative flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-primary text-white rounded flex items-center justify-center font-bold relative shrink-0">
                  <Bot className="h-5.5 w-5.5" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-slate-900 animate-ping" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-slate-900" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    Sofia AI Assistente
                    <span className="font-semibold text-[8px] uppercase tracking-wider bg-blue-500/20 text-blue-400 px-1.5 rounded">Especialista</span>
                  </h4>
                  <p className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                    <span>● Online</span>
                    {ordersCalculatedStat > 0 && <span className="text-slate-500 font-medium font-semibold pl-1">({ordersCalculatedStat} pedidos processados)</span>}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowChat(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                id="close-chat-widget-btn"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Log Window */}
            <div className="p-4 flex-grow overflow-y-auto space-y-3.5 bg-slate-50/70" id="chat-messages-log">
              {chatMessages.map((msg, index) => {
                const isAgent = msg.sender === 'agent';
                return (
                  <div key={msg.id || index} className={`flex ${isAgent ? 'justify-start' : 'justify-end'} text-xs font-semibold`}>
                    <div className={`p-3 max-w-[85%] rounded leading-normal ${
                      isAgent 
                        ? 'bg-white text-slate-700 border border-slate-200 rounded-tl-none pr-4' 
                        : 'bg-primary text-white rounded-tr-none'
                    }`}>
                      
                      {/* Text */}
                      <p className="text-slate-800 font-semibold">{msg.text}</p>

                      {/* Pill Suggestions */}
                      {isAgent && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                        <div className="mt-3.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5">
                          {msg.suggestedQuestions.map((quest) => (
                            <button
                              key={quest}
                              onClick={() => handleSuggestedClick(quest)}
                              className="bg-slate-50 hover:bg-blue-55 text-[10px] text-primary border border-slate-200 font-bold px-2 py-1 rounded text-left inline-block cursor-pointer transition-all leading-tight"
                            >
                              💡 {quest}
                            </button>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

              {/* Typing indicator simulator */}
              {typing && (
                <div className="flex justify-start text-xs font-semibold">
                  <div className="bg-white border border-slate-200 p-3 rounded rounded-tl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-450 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-450 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-slate-450 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Action dispatching panel */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatInput); }}
              className="bg-white border-t border-slate-200 p-3 flex gap-2"
            >
              <input
                type="text"
                placeholder="Pergunte sobre preços, prazos..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded py-2 px-3 focus:outline-none focus:border-primary text-xs font-semibold text-slate-800"
                id="chatbot-text-entry"
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-primary text-white rounded p-2.5 cursor-pointer transition-colors"
                id="chatbot-submit-btn"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

          </div>
        ) : (
          /* collapsed circular layout icon */
          <button
            onClick={() => setShowChat(true)}
            className="bg-slate-900 hover:bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer animate-pulse"
            title="Dúvidas? Sofia AI"
            id="chat-collapsed-bubble"
          >
            <Bot className="h-6.5 w-6.5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </button>
        )}
      </div>

    </>
  );
}
