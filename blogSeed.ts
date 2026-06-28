// Seed data for the blog (used to populate PostgreSQL on first run).
export interface BlogPostData {
  slug: string;
  title: string;
  description: string;
  content: string[];
  category: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
}

export const BLOG_SEED_POSTS: BlogPostData[] = [
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

export interface BlogCommentSeed {
  id: string;
  postSlug: string;
  author: string;
  email: string;
  content: string;
}

export const BLOG_SEED_COMMENTS: BlogCommentSeed[] = [
  { id: 'c1', postSlug: 'como-funciona-algoritmo-instagram-2026', author: 'Roberto Alencar', email: 'roberto@gmail.com', content: 'Incrível! Eu realmente notei que quando as pessoas enviam meus posts por DM, o engajamento dispara nos dias seguintes. Esse post confirmou minhas suspeitas.' },
  { id: 'c2', postSlug: 'como-funciona-algoritmo-instagram-2026', author: 'Fernanda Lima', email: 'fernanda.mkt@yahoo.com', content: 'Esse guia é de utilidade pública. Já salvei aqui para estruturar meu próximo cronograma de conteúdos baseando no tempo de retenção.' },
  { id: 'c3', postSlug: 'segredo-video-viral-tiktok-regra-dos-3-segundos', author: 'Lucas Martins', email: 'lucas.videos@gmail.com', content: 'A regra do gancho nos primeiros 3 segundos mudou meu jogo no TikTok. Tive um vídeo com 120k visualizações aplicando exatamente isso!' },
  { id: 'c4', postSlug: 'como-transformar-seguidores-em-clientes-reais', author: 'Juliana Neves', email: 'juliana.decor@outlook.com', content: 'Estava cometendo o erro de só postar conteúdo técnico gratuito e nunca fazer CTAs de vendas diretas. Vou aplicar a proporção 60/30/10 já amanhã.' },
  { id: 'c5', postSlug: 'como-transformar-seguidores-em-clientes-reais', author: 'Marcos Silveira', email: 'contato@msmodas.com.br', content: 'Uso a automação do ManyChat respondendo comentários e mandando Direct. A taxa de conversão em clientes reais do site cresceu muito.' }
];
