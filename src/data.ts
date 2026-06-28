import { ServiceItem, PlanItem, Testimonial, FAQItem } from './types';

export const SOCIAL_PLATFORMS = [
  { id: 'instagram' as const, name: 'Instagram', color: 'from-pink-500 via-rose-500 to-amber-500', icon: 'Instagram' },
  { id: 'tiktok' as const, name: 'TikTok', color: 'from-black via-slate-900 to-cyan-500', icon: 'TikTok' },
  { id: 'youtube' as const, name: 'YouTube', color: 'from-red-600 to-rose-700', icon: 'Youtube' },
  { id: 'twitter' as const, name: 'Twitter/X', color: 'from-slate-900 to-zinc-700', icon: 'Twitter' },
  { id: 'facebook' as const, name: 'Facebook', color: 'from-blue-600 to-indigo-700', icon: 'Facebook' },
  { id: 'kwai' as const, name: 'Kwai', color: 'from-orange-500 to-amber-600', icon: 'Flame' },
];

export const SERVICES: ServiceItem[] = [
  // Instagram Services
  {
    id: 'ig-followers',
    platform: 'instagram',
    type: 'followers',
    label: 'Seguidores Brasileiros',
    pricePerItem: 0.029, // R$ 29 per 1000
    minQuantity: 100,
    maxQuantity: 100000,
    deliverySpeed: 'Início imediato, entrega natural (100-500/dia)',
    benefits: ['Perfis reais com fotos e publicações', 'Sem queda com reposição de 30 dias', 'Segurança total para o seu perfil']
  },
  {
    id: 'ig-likes',
    platform: 'instagram',
    type: 'likes',
    label: 'Curtidas Premium',
    pricePerItem: 0.012, // R$ 12 per 1000
    minQuantity: 50,
    maxQuantity: 50000,
    deliverySpeed: 'Entrega instantânea (5-15 min)',
    benefits: ['Impulsiona o algoritmo de recomendação', 'Contas brasileiras ativas', 'Divididas em até 5 fotos']
  },
  {
    id: 'ig-views',
    platform: 'instagram',
    type: 'views',
    label: 'Visualizações de Reels/Vídeos',
    pricePerItem: 0.005, // R$ 5 per 1000
    minQuantity: 500,
    maxQuantity: 1000000,
    deliverySpeed: 'Velocidade turbo (alta retenção)',
    benefits: ['Aumenta o alcance orgânico', 'Atrai novos seguidores', 'Entrega 100% segura']
  },
  {
    id: 'ig-stories',
    platform: 'instagram',
    type: 'stories',
    label: 'Visualizações de Stories',
    pricePerItem: 0.045, // R$ 45 per 1000
    minQuantity: 100,
    maxQuantity: 20000,
    deliverySpeed: 'Entregues ao longo das 24 horas',
    benefits: ['Simula engajamento orgânico', 'Ajuda no fechamento de publis', 'Entrega sigilosa e segura']
  },

  // TikTok Services
  {
    id: 'tt-followers',
    platform: 'tiktok',
    type: 'followers',
    label: 'Seguidores TikTok',
    pricePerItem: 0.035, // R$ 35 per 1000
    minQuantity: 100,
    maxQuantity: 50000,
    deliverySpeed: 'Processamento imediato (até 24h)',
    benefits: ['Desbloqueia lives e monetização', 'Perfis estáveis', 'Reposicionamento garantido']
  },
  {
    id: 'tt-likes',
    platform: 'tiktok',
    type: 'likes',
    label: 'Curtidas TikTok',
    pricePerItem: 0.015, // R$ 15 per 1000
    minQuantity: 100,
    maxQuantity: 30000,
    deliverySpeed: 'Entrega super rápida',
    benefits: ['Rápido alcance no "Para Você"', 'Mais relevância para o vídeo', 'Curtidas estáveis']
  },
  {
    id: 'tt-views',
    platform: 'tiktok',
    type: 'views',
    label: 'Visualizações de Vídeos',
    pricePerItem: 0.002, // R$ 2 per 1000
    minQuantity: 1000,
    maxQuantity: 5000000,
    deliverySpeed: 'Instantâneo (alta performance)',
    benefits: ['Viralize seus vídeos', 'Impulsiona métricas estruturais', 'Garantia antirruído']
  },

  // YouTube Services
  {
    id: 'yt-followers',
    platform: 'youtube',
    type: 'followers',
    label: 'Inscritos de Alta Qualidade',
    pricePerItem: 0.18, // R$ 180 per 1000
    minQuantity: 50,
    maxQuantity: 10000,
    deliverySpeed: 'Entrega segura contra exclusão (gradual)',
    benefits: ['Inscritos ativos permanentes', 'Segurança total para canal parceiro', 'Ideal para monetização rápida']
  },
  {
    id: 'yt-views',
    platform: 'youtube',
    type: 'views',
    label: 'Visualizações de Alta Retenção',
    pricePerItem: 0.022, // R$ 22 per 1000
    minQuantity: 500,
    maxQuantity: 200000,
    deliverySpeed: 'Entrega segura, tempo de tela',
    benefits: ['Tempo de exibição real (Watch Time)', 'Evita purgas do YouTube', 'Excelente taxa de engajamento']
  },
  {
    id: 'yt-likes',
    platform: 'youtube',
    type: 'likes',
    label: 'Likes em Vídeos/Shorts',
    pricePerItem: 0.03, // R$ 30 per 1000
    minQuantity: 100,
    maxQuantity: 25000,
    deliverySpeed: 'Entrega rápida e permanente',
    benefits: ['Melhora posicionamento do vídeo', 'Uso livre de senhas', '100% de satisfação']
  },

  // Twitter/X Services
  {
    id: 'tw-followers',
    platform: 'twitter',
    type: 'followers',
    label: 'Seguidores Twitter/X',
    pricePerItem: 0.065, // R$ 65 per 1000
    minQuantity: 100,
    maxQuantity: 10000,
    deliverySpeed: 'Processamento imediato e gradual',
    benefits: ['Fortalece identidade corporativa', 'Perfis ativos com biografias reais', 'Reposição integrada de 30 dias']
  },
  {
    id: 'tw-likes',
    platform: 'twitter',
    type: 'likes',
    label: 'Curtidas em Posts/Tweets',
    pricePerItem: 0.032, // R$ 32 per 1000
    minQuantity: 50,
    maxQuantity: 15000,
    deliverySpeed: 'Entrega instantânea',
    benefits: ['Impulsiona o alcance algorítmico', 'Preserva privacidade total', 'Gera prova social de valor']
  },

  // Facebook Services
  {
    id: 'fb-followers',
    platform: 'facebook',
    type: 'followers',
    label: 'Seguidores de Páginas/Perfil',
    pricePerItem: 0.045, // R$ 45 per 1000
    minQuantity: 100,
    maxQuantity: 50000,
    deliverySpeed: 'Entrega rápida',
    benefits: ['Crescimento seguro da fã-page', 'Atrai novos clientes', 'Totalmente livre de bloqueios']
  },
  {
    id: 'fb-likes',
    platform: 'facebook',
    type: 'likes',
    label: 'Curtidas em Publicações',
    pricePerItem: 0.025, // R$ 25 per 1000
    minQuantity: 50,
    maxQuantity: 20000,
    deliverySpeed: 'Entrega rápida',
    benefits: ['Impulsiona publicações orgânicas', 'Melhora o índice de engajamento', 'Contas brasileiras']
  },

  // Kwai Services
  {
    id: 'kw-followers',
    platform: 'kwai',
    type: 'followers',
    label: 'Seguidores Kwai',
    pricePerItem: 0.038, // R$ 38 per 1000
    minQuantity: 100,
    maxQuantity: 50000,
    deliverySpeed: 'Entrega rápida agilizada',
    benefits: ['Estabilidade de contas', 'Crescimento de relevância', 'Apoio à monetização do Kwai']
  },
  {
    id: 'kw-views',
    platform: 'kwai',
    type: 'views',
    label: 'Visualizações Kwai',
    pricePerItem: 0.003, // R$ 3 per 1000
    minQuantity: 1000,
    maxQuantity: 1000000,
    deliverySpeed: 'Entrega imediata contínua',
    benefits: ['Viralize seus vídeos no Kwai', 'Impulsione visualizações no perfil', 'Público ativo']
  }
];

export const PREBUILT_PLANS: PlanItem[] = [
  // Instagram Plans
  {
    id: 'plan-ig-basic',
    name: 'Instagram Start',
    price: 19.90,
    quantity: 500,
    platform: 'instagram',
    type: 'followers',
    features: [
      'Seguidores Brasileiros Reais',
      'Início em até 10 minutos',
      'Garantia de reposição automática',
      'Não precisa fornecer a senha',
      'Suporte prioritário por WhatsApp'
    ],
    savingsPercent: 15
  },
  {
    id: 'plan-ig-std',
    name: 'Instagram Popular',
    price: 49.90,
    quantity: 2000,
    platform: 'instagram',
    type: 'followers',
    features: [
      '2.000 Seguidores Premium BR',
      'Início imediato (entrega natural)',
      'Garantia Premium de Reabastecimento',
      'Não precisa de login/senha',
      'Acompanhamento de entrega',
      'Suporte VIP 24h'
    ],
    isPopular: true,
    savingsPercent: 30
  },
  {
    id: 'plan-ig-premium',
    name: 'Instagram Influencer',
    price: 99.90,
    quantity: 5000,
    platform: 'instagram',
    type: 'followers',
    features: [
      '5.000 Seguidores Brasileiros Ativos',
      'Bônus: 500 Curtidas inclusas!',
      'Painel de acompanhamento online',
      'Entrega estendida hiper-natural',
      'Suporte Executivo WhatsApp/E-mail',
      'Controle de velocidade opcional'
    ],
    savingsPercent: 45
  },

  // TikTok Plans
  {
    id: 'plan-tt-basic',
    name: 'TikTok Start',
    price: 24.90,
    quantity: 500,
    platform: 'tiktok',
    type: 'followers',
    features: [
      'Visualizações adicionais grátis',
      'Início rápido garantido',
      'Apoio técnico para novos perfis',
      'Não pede senha',
      'Reposição de 30 dias'
    ],
    savingsPercent: 10
  },
  {
    id: 'plan-tt-std',
    name: 'TikTok Viralizer',
    price: 59.90,
    quantity: 2000,
    platform: 'tiktok',
    type: 'followers',
    features: [
      'Seguidores de excelente retenção',
      'Desbloqueie lives do TikTok',
      'Ajuda na monetização',
      'Entrega estratégica',
      'Total proteção de dados',
      'Suporte Prioritário'
    ],
    isPopular: true,
    savingsPercent: 25
  },
  {
    id: 'plan-tt-premium',
    name: 'TikTok Creator Pro',
    price: 119.90,
    quantity: 5000,
    platform: 'tiktok',
    type: 'followers',
    features: [
      '5.000 Seguidores Reais TikTok',
      'Desbloqueio definitivo de recursos',
      'Segurança algorítmica total',
      'Divisão de curtidas grátis',
      'Gestor de conta dedicado',
      'Entrega natural customizada'
    ],
    savingsPercent: 35
  }
];

export const BENEFITS = [
  {
    title: 'Seguidores 100% Reais e Brasileiros',
    description: 'Nossa rede de fornecimento conta exclusivamente com perfis brasileiros reais que interagem e dão proveito autêntico às suas publicações.',
    icon: 'Users'
  },
  {
    title: 'Entrega Rápida e Segura',
    description: 'Nossa tecnologia de provimento se inicia imediatamente após a aprovação de pagamento, operando entrega simétrica para manter o crescimento estável.',
    icon: 'Zap'
  },
  {
    title: 'Suporte Humanizado 24/7',
    description: 'Nossa equipe de especialistas está apostos tanto por WhatsApp quanto por atendimento interno de live chat para tirar dúvidas a qualquer hora do dia ou da noite.',
    icon: 'MessageCircle'
  },
  {
    title: 'Garantia de Satisfação',
    description: 'Oferecemos 30 dias completos de reabastecimento garantido e gratuito se houver flutuação ou decréscimo nos quantitativos adquiridos.',
    icon: 'ShieldCheck'
  },
  {
    title: 'Nenhum Risco Para Sua Conta',
    description: 'Seguimos estritamente as diretrizes de segurança de cada plataforma social. Não necessitamos da sua senha em hipótese alguma.',
    icon: 'Lock'
  },
  {
    title: 'Pagamento Seguro por Pix',
    description: 'Infraestrutura blindada criptografada integrada com os principais processadores do país (Mercado Pago). Garantia de sigilo e devolução facilitada.',
    icon: 'CreditCard'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Juliana Vasconcelos',
    role: 'Influenciadora de Moda & Lifestyle',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    text: 'Eu estava travada com 8 mil seguidores por meses. Contratei o plano "Instagram Popular" e me deu um salto excelente de prova social. Fechei duas publis no mesmo mês porque meu perfil ficou com imagem de muito mais autoridade!',
    platformUsed: 'instagram',
    verified: true,
    date: 'Há 3 dias'
  },
  {
    id: 'test-2',
    name: 'Renan Albuquerque',
    role: 'Proprietário de Hamburgueria Gourmet',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    text: 'Impressionado com a velocidade! Comecei com 500 seguidores locais e o algoritmo do Instagram passou a entregar meus posts patrocinados para muito mais pessoas na minha região de delivery. Super recomendo a ImpulsioneGram!',
    platformUsed: 'instagram',
    verified: true,
    date: 'Há 1 semana'
  },
  {
    id: 'test-3',
    name: 'Letícia Becker',
    role: 'Criadora de Conteúdo Gamer no TikTok',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    text: 'Comprei o plano TikTok Creator com o único propósito de desbloquear a ferramenta de Live streaming. Deu super certo, os seguidores começaram a pingar logo nos primeiros 10 minutos. Recomendo de olhos fechados pela tranquilidade.',
    platformUsed: 'tiktok',
    verified: true,
    date: 'Há 2 dias'
  },
  {
    id: 'test-4',
    name: 'Felipe Sales',
    role: 'Cantor & Compositor Independente',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    text: 'Adquiri visualizações de alta retenção no YouTube para o clipe de lançamento da minha banda. O alcance orgânico subiu consideravelmente e caímos na aba de recomendados pela primeira vez na nossa história de lançamentos.',
    platformUsed: 'youtube',
    verified: true,
    date: 'Há 3 semanas'
  }
];

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Os seguidores entregues são reais?',
    answer: 'Sim, absolutamente! Trabalhamos exclusivamente com perfis brasileiros reais e ativos nas plataformas, garantindo que o seu perfil receba engajamento legítimo e orgânico.',
    category: 'geral'
  },
  {
    id: 'faq-2',
    question: 'Preciso fornecer a senha da minha conta?',
    answer: 'Nunca! Nós nunca solicitaremos suas credenciais ou senhas em nenhum momento. Para realizar o envio do serviço, precisamos apenas do nome de usuário (ex: @seu_usuario) ou do link da publicação correspondente.',
    category: 'seguranca'
  },
  {
    id: 'faq-3',
    question: 'Quanto tempo leva para a entrega do serviço?',
    answer: 'A grande maioria dos pedidos é processada em até 10 minutos após a confirmação do pagamento. O envio é estruturado para ocorrer de forma natural ao longo de algumas horas ou dias (dependendo da quantidade), evitando picos bruscos que impactem o algoritmo.',
    category: 'entrega'
  },
  {
    id: 'faq-4',
    question: 'Existe risco de bloqueio ou banimento da minha conta?',
    answer: 'Nenhum risco. Como trabalhamos usando métodos progressivos simulando atividade real, as redes sociais detectam o fluxo como um crescimento natural de interesse do público. Nosso método é 100% testado e seguro para sua conta.',
    category: 'seguranca'
  },
  {
    id: 'faq-5',
    question: 'Como funciona o sistema de suporte e reabastecimento?',
    answer: 'Oferecemos garantia de reabastecimento inteligente por 30 dias. Se alguma conta deixar de seguir seu perfil voluntariamente nesse período, nosso sistema recarrega a contagem automaticamente, sem custos. Nosso suporte atende 24h via WhatsApp.',
    category: 'geral'
  },
  {
    id: 'faq-6',
    question: 'Quais são as formas de pagamento aceitas?',
    answer: 'No momento aceitamos Pix, com aprovação e processamento instantâneo. O pagamento é assegurado pelo gateway Mercado Pago, com reembolso total em caso de não entrega.',
    category: 'pagamento'
  }
];

export const STEP_PROCESS = [
  {
    step: '01',
    title: 'Escolha o Serviço',
    description: 'Selecione a rede social desejada (como Instagram) e o tipo de engajamento (seguidores, curtidas, views) que busca.',
    icon: 'MousePointerClick'
  },
  {
    step: '02',
    title: 'Preencha os Dados',
    description: 'Insira apenas seu nome de usuário ou o link da publicação. Sem senhas, garantindo a privacidade total do seu login.',
    icon: 'UserCheck'
  },
  {
    step: '03',
    title: 'Pagamento Seguro',
    description: 'Realize o pagamento rapidamente através de Pix com os melhores e mais seguros intermediadores do Brasil.',
    icon: 'Shield'
  },
  {
    step: '04',
    title: 'Entrega Instantânea',
    description: 'Nossa inteligência artificial distribui o engajamento gradualmente de maneira 100% natural e imperceptível.',
    icon: 'TrendingUp'
  }
];
