import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  User,
  Clock,
  ArrowLeft,
  ArrowRight,
  Search,
  ChevronRight,
  MessageSquare,
  Plus,
  Send,
  Bookmark,
  Check,
  X,
  TrendingUp,
  Flame,
  AlertCircle
} from 'lucide-react';

// --- TYPE DEFINITIONS ---
export interface BlogComment {
  id: string;
  author: string;
  email: string;
  content: string;
  date: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string[]; // Content paragraphs or markdown sections
  category: 'Instagram' | 'TikTok' | 'Marketing Digital' | 'Dicas';
  image: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
}

// --- SEO HELPER FUNCTION ---
const updateSEO = (title: string, description: string, image?: string) => {
  document.title = `${title} | Blog ImpulsioneGram`;

  // Meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', description);

  // OG Title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', title);

  // OG Description
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    document.head.appendChild(ogDesc);
  }
  ogDesc.setAttribute('content', description);

  // OG Image
  if (image) {
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (!ogImg) {
      ogImg = document.createElement('meta');
      ogImg.setAttribute('property', 'og:image');
      document.head.appendChild(ogImg);
    }
    ogImg.setAttribute('content', image);
  }
};

// --- MOCK ARTICLES DATA ---
const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'como-funciona-algoritmo-instagram-2026',
    title: 'Como o Algoritmo do Instagram Funciona em 2026: Guia Completo de Alcance',
    description: 'Descubra os segredos por trás do algoritmo do Instagram e aprenda estratégias valiosas para multiplicar o alcance das suas publicações de forma orgânica neste ano.',
    category: 'Instagram',
    image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=800&q=80',
    author: 'Felipe Santana',
    date: '24 Jun 2026',
    readTime: '6 min',
    tags: ['Instagram', 'Algoritmo', 'Marketing de Conteúdo', 'Alcance Orgânico'],
    content: [
      'O Instagram passou por transformações drásticas recentemente. Esqueça as velhas teorias de "shadowban automático" ou "melhores hashtags mágicas". Em 2026, o algoritmo do Instagram funciona como uma inteligência artificial de recomendação hiper-personalizada, focada em duas métricas cruciais: Tempo de Retenção Ativo e Sinais de Compartilhamento Direto (DM).',
      'Atualmente, o algoritmo não é apenas um único código unificado. Existem algoritmos diferentes trabalhando em paralelo para o Feed, para os Stories, para a aba Explorar e para o Reels. Cada aba prioriza gatilhos psicológicos distintos.',
      'No Reels, o fator número 1 de ranqueamento é a porcentagem de conclusão do vídeo. Se a sua audiência assiste até o fim, e de preferência reassiste (loop), o Instagram entende que o conteúdo é magnético e o distribui para não-seguidores de interesses semelhantes.',
      'Para os Stories, a métrica de ouro é a Interação Direta. Respostas em caixas de perguntas, enquetes e cliques em stickers são os maiores sinais de que a relação do seguidor com a sua conta é de proximidade ("amigo próximo"). Contas que utilizam stickers de interação diariamente experimentam um alcance de 35% a 50% maior em seus posts de feed subsequentes.',
      'Dica Prática para Destravar seu Alcance hoje: Foque nos primeiros 2 segundos de qualquer Reels. Use uma legenda provocativa ou um elemento visual dinâmico antes de introduzir o assunto principal. Além disso, incentive salvamentos e compartilhamentos diretos nas DMs, pois eles valem até 10 vezes mais do que curtidas tradicionais.',
    ]
  },
  {
    slug: 'segredo-video-viral-tiktok-regra-dos-3-segundos',
    title: 'O Segredo do Vídeo Viral no TikTok: A Regra dos 3 Primeiros Segundos',
    description: 'Aprenda a prender a atenção do público de forma instantânea e domine as métricas fundamentais que fazem o algoritmo do TikTok impulsionar seus vídeos para milhões.',
    category: 'TikTok',
    image: 'https://images.unsplash.com/photo-1598257006458-087169a1f08d?auto=format&fit=crop&w=800&q=80',
    author: 'Mariana Costa',
    date: '18 Jun 2026',
    readTime: '4 min',
    tags: ['TikTok', 'Viralização', 'Criação de Vídeo', 'Engajamento'],
    content: [
      'No ecossistema do TikTok, a moeda de troca mais valiosa é a atenção imediata. Os primeiros 3 segundos do seu vídeo determinam se ele atingirá o topo da aba "For You" (Para Você) ou se será enterrado no esquecimento.',
      'O algoritmo do TikTok pontua os vídeos com base em uma pontuação de atrito. Se o usuário arrasta o dedo para cima imediatamente (menos de 2 segundos), o vídeo recebe uma penalidade de atrito severa. Se ele permanece pelos primeiros 3 segundos, o algoritmo abre a torneira de distribuição para o primeiro grupo de teste (cerca de 200 a 500 pessoas).',
      'Como dominar o Hook (Gancho) Inicial:',
      '1. Hook Visual Ativo: Nunca comece com silêncio ou olhando estático para a tela. Comece já se movimentando, segurando um objeto misterioso, ou apontando para um texto intrigante.',
      '2. Hook de Promessa/Quebra de Padrão: Diga uma frase de impacto nos primeiros segundos que instigue curiosidade, como: "Eu passei meses cometendo este erro grave no meu perfil, e você provavelmente está fazendo a mesma coisa hoje..."',
      'Além disso, o TikTok prioriza áudios em alta velocidade de crescimento. Use músicas e vozes que estão em rápida ascensão na aba comercial de áudios para pegar carona nas tendências globais. Lembre-se: no TikTok, ser autêntico e espontâneo sempre supera produções exageradamente perfeitas.',
    ]
  },
  {
    slug: 'como-transformar-seguidores-em-clientes-reais',
    title: 'Como Transformar Seguidores em Clientes de Forma Consistente',
    description: 'Ter uma grande base de seguidores é apenas o primeiro passo. Descubra as estratégias mais eficazes de funis de vendas que convertem sua audiência em faturamento real.',
    category: 'Marketing Digital',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    author: 'Carlos Eduardo',
    date: '12 Jun 2026',
    readTime: '5 min',
    tags: ['Marketing', 'Vendas', 'Conversão', 'Funil de Vendas'],
    content: [
      'Seguidores são ótimos para o ego e para a autoridade de marca, mas curtidas não pagam as contas da sua empresa. A grande dúvida de 9 entre 10 criadores e marcas é: "Tenho milhares de seguidores, mas por que minhas vendas continuam baixas?"',
      'A resposta curta é que você não possui um Funil de Conteúdo Direcionado. Se você apenas posta dicas gerais gratuitas, você atrai pessoas interessadas em consumo gratuito, e não compradores qualificados.',
      'Para resolver isso, divida seu calendário editorial na estrutura 60/30/10:',
      '• 60% Conteúdo de Atração (Topo de Funil): Reels curtos, memes inteligentes da sua área, dicas rápidas. Serve para ganhar novos seguidores e criar conexão inicial.',
      '• 30% Conteúdo de Nutrição/Autoridade (Meio de Funil): Carrosséis densos, tutoriais passo a passo profundos, bastidores reais, estudos de caso de sucesso. Mostra que você realmente domina o assunto.',
      '• 10% Conteúdo de Conversão (Fundo de Funil): Ofertas diretas, depoimentos de clientes satisfeitos, escassez de vagas, chamadas para ação (CTA) claras de vendas ("Clique no link da bio para reservar").',
      'Outra ferramenta poderosa é o uso de automações de Direct. Quando você posta um Reels de alto valor e diz: "Comente QUERO que eu te envio o link exclusivo", você gera engajamento em massa que dispara as impressões orgânicas do post e, simultaneamente, inicia uma conversa de vendas privada, íntima e altamente propensa à conversão nas DMs.',
    ]
  },
  {
    slug: '5-erros-graves-que-flopam-seu-perfil-sociais',
    title: '5 Erros Graves que Flopam o seu Perfil e Como Evitá-los Hoje',
    description: 'Identifique e corrija imediatamente os erros mais frequentes na criação de conteúdo que estão destruindo o engajamento e a visibilidade do seu perfil.',
    category: 'Dicas',
    image: 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80',
    author: 'Ana Carolina',
    date: '05 Jun 2026',
    readTime: '5 min',
    tags: ['Erros Sociais', 'Flop', 'Engajamento', 'Dicas Práticas'],
    content: [
      'Muitas vezes, você se esforça gravando vídeos, escolhendo imagens e escrevendo legendas incríveis, mas os números continuam estagnados. É frustrante ver perfis concorrentes crescendo rápido enquanto o seu parece travado. Se isso está acontecendo com você, é provável que você esteja cometendo um desses 5 erros graves:',
      'Erro 1: Não focar em um nicho específico. Se em um dia você fala sobre culinária, no outro sobre finanças e no terceiro sobre viagem, o algoritmo não consegue entender qual é o público-alvo ideal da sua conta, resultando em recomendações erradas e baixo engajamento.',
      'Erro 2: Ignorar as métricas da primeira hora de publicação. Postar e sair do aplicativo imediatamente é péssimo. Interaja com outras contas de seu nicho e responda aos comentários iniciais logo na primeira hora para sinalizar atividade imediata na plataforma.',
      'Erro 3: Estética desalinhada e sem contraste. Imagens escuras, com fontes difíceis de ler ou textos poluídos causam fadiga visual rápida. O usuário simplesmente arrasta para longe em fração de segundos.',
      'Erro 4: Ausência de legendas nos vídeos. Cerca de 75% dos usuários assistem a vídeos de redes sociais no silencioso (no trabalho, transporte, etc.). Vídeos sem legendas dinâmicas perdem mais da metade do público em potencial instantaneamente.',
      'Erro 5: Não ter consistência estruturada. Publicar 5 vezes em uma semana e passar 15 dias sumido deseduca o algoritmo e esfria a conexão com sua audiência. Estabeleça uma frequência realista de 3 a 4 publicações de alto valor por semana e cumpra à risca.',
    ]
  },
  {
    slug: 'guia-definitivo-de-reels-tendencias-horarios-postagem',
    title: 'Guia de Reels: Tendências e Melhores Horários para Postar',
    description: 'Saiba exatamente quais formatos de Reels estão performando melhor e conheça a metodologia para identificar os horários mais rentáveis do seu perfil.',
    category: 'Instagram',
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=800&q=80',
    author: 'Felipe Santana',
    date: '28 Mai 2026',
    readTime: '4 min',
    tags: ['Reels', 'Horários para Postar', 'Tendências', 'Guia Instagram'],
    content: [
      'O Reels continua sendo a ferramenta mais expressiva para captação de novos seguidores no Instagram. Enquanto o feed foca em fidelização, o Reels foca puramente em descoberta viral externa.',
      'Atualmente, as grandes tendências de Reels de sucesso giram em torno de "Aesthetics" (estética relaxante, rotinas produtivas com áudios ASMR), "B-Roll com Frase" (vídeos bonitos de você trabalhando ou caminhando com um texto provocativo centralizado, estático) e "Tutoriais Narrados de Tela Inteira". Formatos super elaborados e dancinhas caíram em desuso comercial, abrindo espaço para autoridade conversacional clara.',
      'Sobre horários ideais para postagem: Não existe uma regra única e universal! O "melhor horário" padrão da internet (como 12h ou 18h) geralmente gera um pico instantâneo de concorrência massiva de publicações.',
      'Como descobrir o seu melhor horário real:',
      'Vá em Insights -> Público -> Períodos Mais Ativos. Observe as horas de maior atividade nos dias úteis e poste cerca de 30 minutos a 1 hora ANTES desse pico. Isso dá tempo útil para o algoritmo indexar seu vídeo, coletar as primeiras curtidas do público inicial e prepará-lo para quando a maior fatia dos seus seguidores ficar online.',
    ]
  }
];

// --- DEFAULT COMMENTS DATABASE FOR INITIAL STATE ---
const INITIAL_COMMENTS: Record<string, BlogComment[]> = {
  'como-funciona-algoritmo-instagram-2026': [
    { id: 'c1', author: 'Roberto Alencar', email: 'roberto@gmail.com', content: 'Incrível! Eu realmente notei que quando as pessoas enviam meus posts por DM, o engajamento dispara nos dias seguintes. Esse post confirmou minhas suspeitas.', date: '25 Jun 2026' },
    { id: 'c2', author: 'Fernanda Lima', email: 'fernanda.mkt@yahoo.com', content: 'Esse guia é de utilidade pública. Já salvei aqui para estruturar meu próximo cronograma de conteúdos baseando no tempo de retenção.', date: '25 Jun 2026' }
  ],
  'segredo-video-viral-tiktok-regra-dos-3-segundos': [
    { id: 'c3', author: 'Lucas Martins', email: 'lucas.videos@gmail.com', content: 'A regra do gancho nos primeiros 3 segundos mudou meu jogo no TikTok. Tive um vídeo com 120k visualizações aplicando exatamente isso!', date: '19 Jun 2026' }
  ],
  'como-transformar-seguidores-em-clientes-reais': [
    { id: 'c4', author: 'Juliana Neves', email: 'juliana.decor@outlook.com', content: 'Estava cometendo o erro de só postar conteúdo técnico gratuito e nunca fazer CTAs de vendas diretas. Vou aplicar a proporção 60/30/10 já amanhã.', date: '13 Jun 2026' },
    { id: 'c5', author: 'Marcos Silveira', email: 'contato@msmodas.com.br', content: 'Uso a automação do ManyChat respondendo comentários e mandando Direct. A taxa de conversão em clientes reais do site cresceu muito.', date: '14 Jun 2026' }
  ]
};

interface BlogViewProps {
  // Navigate to a landing-page section (the blog lives on its own route).
  onNavigate: (sectionId: string) => void;
}

export default function BlogView({ onNavigate }: BlogViewProps) {
  // Routing is driven by react-router:
  // - /blog (main page, optional ?q= search)
  // - /blog/artigo/:slug (individual article)
  // - /blog/categoria/:categoria (category page)
  const navigate = useNavigate();
  const { slug, categoria } = useParams<{ slug?: string; categoria?: string }>();
  const [searchParams] = useSearchParams();

  const currentSlug = slug || null;
  const currentCategory = categoria ? decodeURIComponent(categoria) : null;
  const activeSearchFilter = searchParams.get('q') || '';

  // Sidebar Search input (kept in sync with the URL ?q= param)
  const [searchQuery, setSearchQuery] = useState(activeSearchFilter);

  // Local comments state (synced with localStorage)
  const [commentsMap, setCommentsMap] = useState<Record<string, BlogComment[]>>(() => {
    const saved = localStorage.getItem('impulsionegram_blog_comments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_COMMENTS; }
    }
    return INITIAL_COMMENTS;
  });

  // Modal comments state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Scroll to top whenever the blog route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, categoria, activeSearchFilter]);

  // Keep the search input in sync when the URL ?q= changes
  useEffect(() => {
    setSearchQuery(activeSearchFilter);
  }, [activeSearchFilter]);

  // Sync comments to localStorage
  useEffect(() => {
    localStorage.setItem('impulsionegram_blog_comments', JSON.stringify(commentsMap));
  }, [commentsMap]);

  // Find the selected article if slug is active
  const activePost = useMemo(() => {
    if (!currentSlug) return null;
    return BLOG_POSTS.find(p => p.slug === currentSlug) || null;
  }, [currentSlug]);

  // Compute navigation (prev & next posts)
  const prevNextPosts = useMemo(() => {
    if (!activePost) return { prev: null, next: null };
    const currentIndex = BLOG_POSTS.findIndex(p => p.slug === activePost.slug);
    const prev = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : null;
    const next = currentIndex < BLOG_POSTS.length - 1 ? BLOG_POSTS[currentIndex + 1] : null;
    return { prev, next };
  }, [activePost]);

  // SEO Update Trigger
  useEffect(() => {
    if (activePost) {
      updateSEO(activePost.title, activePost.description, activePost.image);
    } else if (currentCategory) {
      updateSEO(
        `Artigos sobre ${currentCategory}`,
        `Confira os melhores artigos de marketing e crescimento social na categoria ${currentCategory} do nosso Blog.`
      );
    } else {
      updateSEO(
        'Blog de Marketing de Redes Sociais e Engajamento',
        'Dicas, estratégias, guias práticos e tendências de Instagram, TikTok e Marketing Digital no Blog oficial ImpulsioneGram.'
      );
    }
  }, [activePost, currentCategory]);

  // Filter posts based on Category or Search queries
  const filteredPosts = useMemo(() => {
    let list = BLOG_POSTS;

    if (currentCategory) {
      list = list.filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());
    }

    if (activeSearchFilter) {
      const q = activeSearchFilter.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [currentCategory, activeSearchFilter]);

  // Count posts per category for the sidebar
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    BLOG_POSTS.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Handle category clicks
  const navigateToCategory = (catName: string) => {
    navigate(`/blog/categoria/${encodeURIComponent(catName)}`);
  };

  // Handle article clicks
  const navigateToArticle = (postSlug: string) => {
    navigate(`/blog/artigo/${postSlug}`);
  };

  // Handle search submission (drives the ?q= URL param)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/blog?q=${encodeURIComponent(q)}` : '/blog');
  };

  // Clear search filter
  const handleClearSearch = () => {
    setSearchQuery('');
    navigate('/blog');
  };

  // Handle adding comments via Modal
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentEmail.trim() || !commentText.trim() || !currentSlug) return;

    setIsSubmittingComment(true);

    setTimeout(() => {
      const newComment: BlogComment = {
        id: `c_${Date.now()}`,
        author: commentName.trim(),
        email: commentEmail.trim(),
        content: commentText.trim(),
        date: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
      };

      setCommentsMap(prev => {
        const list = prev[currentSlug] || [];
        return {
          ...prev,
          [currentSlug]: [...list, newComment]
        };
      });

      setIsSubmittingComment(false);
      setCommentSuccess(true);
      setCommentText('');

      // Clean success message after a few seconds and close modal
      setTimeout(() => {
        setCommentSuccess(false);
        setIsCommentModalOpen(false);
      }, 2000);

    }, 1000);
  };

  // Clean form and open modal
  const openNewCommentModal = () => {
    setCommentSuccess(false);
    setIsCommentModalOpen(true);
  };

  // Static items list for Sidebar
  const recentPopularPosts = useMemo(() => {
    return BLOG_POSTS.slice(0, 3);
  }, []);

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen py-24 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto mt-6">

        {/* Blog Breadcrumbs & Header Banner */}
        <div className="mb-10 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-slate-500 mb-3 bg-white border border-slate-200/60 inline-flex px-3 py-1.5 rounded-full shadow-sm">
            <button onClick={() => onNavigate('inicio')} className="hover:text-primary transition-colors cursor-pointer">Início</button>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <button onClick={() => navigate('/blog')} className="hover:text-primary transition-colors cursor-pointer">Blog</button>

            {currentCategory && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="text-primary font-bold">Categoria: {currentCategory}</span>
              </>
            )}

            {activePost && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <button onClick={() => navigateToCategory(activePost.category)} className="hover:text-primary transition-colors cursor-pointer">{activePost.category}</button>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="text-primary font-bold max-w-xs truncate hidden md:inline">{activePost.title}</span>
              </>
            )}
          </div>

          {!activePost && (
            <div className="mt-4">
              <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-none">
                Blog <span className="text-primary">ImpulsioneGram</span>
              </h1>
              <p className="mt-3 text-slate-600 font-medium text-sm sm:text-base max-w-2xl">
                O seu portal completo para dominar o algoritmo, engajar sua audiência, explodir seu alcance e faturar mais com as redes sociais.
              </p>
            </div>
          )}
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: MAIN CONTENT (8 columns) */}
          <main className="lg:col-span-8 space-y-8">

            {activePost ? (
              /* --- ARTICLE DETAIL PAGE --- */
              <article className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-fade-in" id="individual-article-view">
                {/* Header Image */}
                <div className="relative h-64 sm:h-96 w-full overflow-hidden">
                  <img
                    src={activePost.image}
                    alt={activePost.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary/95 text-white font-black text-xs uppercase px-3.5 py-1.5 rounded-full shadow-md tracking-wider">
                      {activePost.category}
                    </span>
                  </div>
                </div>

                {/* Meta details */}
                <div className="p-6 sm:p-8 lg:p-10">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 mb-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" />
                      <span>{activePost.author}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{activePost.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{activePost.readTime} de leitura</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-950 tracking-tight leading-tight mb-6">
                    {activePost.title}
                  </h1>

                  {/* Paragraphs of content */}
                  <div className="space-y-5 text-slate-700 leading-relaxed font-medium text-sm sm:text-base">
                    {activePost.content.map((para, idx) => {
                      // Check if it's a heading list or simple bullet item
                      if (para.startsWith('1.') || para.startsWith('2.') || para.startsWith('3.')) {
                        return (
                          <div key={idx} className="pl-4 border-l-2 border-primary/40 my-3 font-semibold text-slate-900">
                            {para}
                          </div>
                        );
                      }
                      if (para.startsWith('•')) {
                        return (
                          <li key={idx} className="list-none pl-6 relative before:content-[''] before:absolute before:left-2 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-primary before:rounded-full my-2">
                            {para.replace('•', '').trim()}
                          </li>
                        );
                      }
                      return (
                        <p key={idx} className="indent-0">
                          {para}
                        </p>
                      );
                    })}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100">
                    {activePost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        onClick={() => navigate(`/blog?q=${encodeURIComponent(tag)}`)}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Previous & Next Article Navigation Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 pt-8 border-t border-slate-150">

                    {/* Previous Button Card */}
                    {prevNextPosts.prev ? (
                      <button
                        onClick={() => navigateToArticle(prevNextPosts.prev!.slug)}
                        className="text-left p-4 rounded-2xl border border-slate-100 hover:border-primary/20 hover:bg-slate-50/50 transition-all cursor-pointer group flex items-start gap-3"
                        id="prev-article-nav"
                      >
                        <ArrowLeft className="h-5 w-5 text-slate-400 mt-1 group-hover:-translate-x-1 transition-transform" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Artigo Anterior</span>
                          <span className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 group-hover:text-primary transition-colors">
                            {prevNextPosts.prev.title}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200/60 bg-slate-50/30 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        Primeiro artigo do blog
                      </div>
                    )}

                    {/* Next Button Card */}
                    {prevNextPosts.next ? (
                      <button
                        onClick={() => navigateToArticle(prevNextPosts.next!.slug)}
                        className="text-right p-4 rounded-2xl border border-slate-100 hover:border-primary/20 hover:bg-slate-50/50 transition-all cursor-pointer group flex items-start justify-end gap-3"
                        id="next-article-nav"
                      >
                        <div className="order-1 sm:order-none">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Próximo Artigo</span>
                          <span className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 group-hover:text-primary transition-colors">
                            {prevNextPosts.next.title}
                          </span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 mt-1 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200/60 bg-slate-50/30 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        Último artigo do blog
                      </div>
                    )}

                  </div>

                  {/* --- COMMENTS SECTION --- */}
                  <div className="mt-12 pt-8 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <h3 className="font-display font-black text-xl text-slate-950">
                          Comentários ({commentsMap[activePost.slug]?.length || 0})
                        </h3>
                      </div>

                      <button
                        onClick={openNewCommentModal}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        id="open-comment-modal-btn"
                      >
                        <Plus className="h-4 w-4" />
                        Comentar
                      </button>
                    </div>

                    {/* Comments List */}
                    {(!commentsMap[activePost.slug] || commentsMap[activePost.slug].length === 0) ? (
                      <div className="text-center py-10 px-4 bg-slate-50/80 rounded-2xl border border-slate-200/40">
                        <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 font-semibold text-xs">Seja o primeiro a deixar um comentário sobre este artigo!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {commentsMap[activePost.slug].map((comment) => (
                          <div key={comment.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-5 rounded-2xl transition-all">
                            <div className="flex justify-between items-center mb-2.5">
                              <span className="font-bold text-sm text-slate-900">{comment.author}</span>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100/80 px-2 py-1 rounded">{comment.date}</span>
                            </div>
                            <p className="text-slate-600 font-medium text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </article>
            ) : (
              /* --- GRID LIST VIEW PAGE & CATEGORIES --- */
              <div className="space-y-6">

                {/* Search query tag helper */}
                {(activeSearchFilter || currentCategory) && (
                  <div className="flex items-center justify-between bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                      <span>Exibindo resultados para:</span>
                      {currentCategory && (
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                          Categoria: {currentCategory}
                        </span>
                      )}
                      {activeSearchFilter && (
                        <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full font-bold">
                          Busca: "{activeSearchFilter}"
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleClearSearch}
                      className="text-slate-400 hover:text-red-500 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Limpar Filtros
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {filteredPosts.length === 0 ? (
                  <div className="text-center py-16 px-6 bg-white border border-slate-100 rounded-3xl shadow-md">
                    <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-display font-black text-xl text-slate-950 mb-1">Nenhum artigo encontrado</h3>
                    <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto">
                      Não encontramos artigos que correspondam aos filtros ativos. Tente pesquisar por outros termos.
                    </p>
                    <button
                      onClick={handleClearSearch}
                      className="mt-4 bg-primary text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors cursor-pointer"
                    >
                      Ver Todos os Artigos
                    </button>
                  </div>
                ) : (
                  /* Grid of Posts */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="blog-articles-grid">
                    {filteredPosts.map((post) => (
                      <article
                        key={post.slug}
                        className="bg-white rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group h-full"
                      >
                        <div>
                          {/* Card Image */}
                          <div className="relative h-48 w-full overflow-hidden cursor-pointer" onClick={() => navigateToArticle(post.slug)}>
                            <img
                              src={post.image}
                              alt={post.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3">
                              <span className="bg-white/95 text-slate-900 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded shadow">
                                {post.category}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 sm:p-6">
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 mb-2.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {post.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {post.readTime}
                              </span>
                            </div>

                            <h3
                              className="font-display font-black text-base sm:text-lg text-slate-950 tracking-tight leading-snug mb-2 group-hover:text-primary transition-colors cursor-pointer line-clamp-2"
                              onClick={() => navigateToArticle(post.slug)}
                            >
                              {post.title}
                            </h3>

                            <p className="text-slate-500 font-medium text-xs leading-relaxed line-clamp-3">
                              {post.description}
                            </p>
                          </div>
                        </div>

                        {/* Footer Link */}
                        <div className="p-5 sm:p-6 pt-0">
                          <button
                            onClick={() => navigateToArticle(post.slug)}
                            className="w-full bg-slate-50 hover:bg-primary hover:text-white text-slate-800 font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Ler Artigo Completo
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

              </div>
            )}

          </main>

          {/* RIGHT COLUMN: SIDEBAR (4 columns) */}
          <aside className="lg:col-span-4 space-y-6">

            {/* 1. Search Widget */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-md">
              <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Search className="h-4 w-4 text-primary" />
                Buscar no Blog
              </h4>

              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs rounded-2xl py-3 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary font-semibold transition-all"
                  id="sidebar-search-input"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 p-1.5 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                  title="Pesquisar"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* 2. Categories Widget */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-md">
              <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <Bookmark className="h-4 w-4 text-primary" />
                Categorias
              </h4>

              <div className="flex flex-col gap-2">
                {Object.keys(categoryCounts).map((catName) => {
                  const count = categoryCounts[catName];
                  const isCurrent = currentCategory?.toLowerCase() === catName.toLowerCase();
                  return (
                    <button
                      key={catName}
                      onClick={() => navigateToCategory(catName)}
                      className={`flex justify-between items-center text-left text-xs sm:text-sm font-semibold p-2.5 rounded-xl transition-all cursor-pointer ${isCurrent ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:text-primary hover:bg-slate-50'}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <ChevronRight className="h-4 w-4 opacity-70" />
                        {catName}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Popular Posts */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-md">
              <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" />
                Artigos Recentes
              </h4>

              <div className="space-y-4">
                {recentPopularPosts.map((p) => (
                  <div
                    key={p.slug}
                    className="flex gap-3 group cursor-pointer"
                    onClick={() => navigateToArticle(p.slug)}
                  >
                    <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                      <img
                        src={p.image}
                        alt={p.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-primary block">{p.category}</span>
                      <h5 className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {p.title}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Sales CTA Widget ImpulsioneGram */}
            <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/20 rounded-full blur-xl"></div>

              <div className="relative z-10 space-y-4 text-center sm:text-left">
                <span className="bg-primary/25 border border-primary/40 text-primary-light text-[10px] font-black px-3 py-1.5 rounded-full inline-block uppercase tracking-wider">
                  Promoção Ativa
                </span>

                <h4 className="font-display font-black text-lg tracking-tight leading-snug">
                  Quer acelerar o crescimento das suas redes?
                </h4>

                <p className="text-slate-300 text-xs font-medium leading-relaxed">
                  Adquira seguidores, curtidas e visualizações estáveis com entrega imediata e contas 100% brasileiras e reais.
                </p>

                <button
                  onClick={() => onNavigate('servicos')}
                  className="w-full bg-white hover:bg-primary hover:text-white text-slate-950 font-black text-xs py-3 rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  <Flame className="h-4 w-4 animate-pulse" />
                  Impulsionar Perfil Agora
                </button>
              </div>
            </div>

          </aside>

        </div>

      </div>

      {/* --- WRITE COMMENT MODAL --- */}
      {isCommentModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 cursor-pointer"
          id="comment-modal-overlay"
          onClick={() => setIsCommentModalOpen(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden relative animate-fade-in cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 pb-5 relative flex items-center gap-3">
              <button
                onClick={() => setIsCommentModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer z-10 flex items-center justify-center"
                aria-label="Fechar Modal"
                id="close-comment-modal"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="bg-primary/20 p-2.5 rounded-xl text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-base tracking-tight">Deixe seu Comentário</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Sua opinião é muito importante</p>
              </div>
            </div>

            {/* Modal Body / Form */}
            <div className="p-6">
              {commentSuccess ? (
                <div className="text-center py-8 space-y-3">
                  <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="h-6 w-6" />
                  </div>
                  <h4 className="font-display font-black text-lg text-slate-900">Comentário Enviado!</h4>
                  <p className="text-slate-500 font-semibold text-xs">
                    Seu comentário foi registrado com sucesso e já está disponível para visualização.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAddComment} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="comment-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Nome Completo</label>
                      <input
                        type="text"
                        id="comment-name"
                        required
                        placeholder="Ex: Pedro Silva"
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-semibold transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="comment-email" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">E-mail</label>
                      <input
                        type="email"
                        id="comment-email"
                        required
                        placeholder="Ex: pedro@email.com"
                        value={commentEmail}
                        onChange={(e) => setCommentEmail(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-semibold transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="comment-text" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Seu Comentário</label>
                    <textarea
                      id="comment-text"
                      required
                      rows={4}
                      placeholder="Escreva aqui suas dúvidas, feedback ou opiniões sobre este artigo..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-xs rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary font-semibold transition-all"
                    ></textarea>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingComment}
                      className="w-full bg-primary hover:bg-purple-700 text-white font-black text-xs py-3 rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider disabled:opacity-50"
                    >
                      {isSubmittingComment ? (
                        <>Enviando...</>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Publicar Comentário
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCommentModalOpen(false)}
                      className="w-full text-[10px] font-bold text-slate-400 hover:text-red-500 py-2.5 text-center transition-colors cursor-pointer block mt-1"
                    >
                      Cancelar e fechar
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
