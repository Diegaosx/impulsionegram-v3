// Normalização do alvo do pedido: o perfil ou a publicação que vai receber a
// entrega.
//
// Este módulo é a ÚNICA fonte de verdade e é usado pelo cliente e pelo
// servidor. Se as duas pontas normalizassem por conta própria, o cliente
// mostraria um valor e o servidor gravaria outro — e ninguém perceberia até a
// entrega falhar.
//
// O problema que ele resolve: o cliente cola o que o botão "compartilhar" do
// aplicativo gera —
//
//   https://www.instagram.com/martins_decassia?igsh=MWQ2cTA3N3UzdTExaQ%3D%3D&utm_source=qr
//
// — e o painel SMM precisa receber um alvo limpo. Sem isso o pedido entra com
// um link inválido e a entrega nunca acontece.
//
// Nada aqui faz requisição de rede: são só regras de texto, para poder rodar
// na digitação, no submit e no servidor.

export type TargetKind = 'profile' | 'post';

export interface NormalizedTarget {
  ok: boolean;
  /** Valor canônico para gravar e exibir (username puro ou URL limpa do post). */
  value: string;
  /** Link exatamente como deve seguir para o painel SMM. */
  link: string;
  /** Mensagem em português quando não dá para resolver com segurança. */
  error?: string;
  /** Aviso quando o valor foi consertado, para o cliente conferir. */
  note?: string;
}

const fail = (error: string): NormalizedTarget => ({ ok: false, value: '', link: '', error });

// Tipos de serviço que agem sobre uma PUBLICAÇÃO, não sobre o perfil.
const POST_TYPES = ['likes', 'views', 'comments', 'shares', 'saves'];

export function targetKindFor(serviceType: string): TargetKind {
  const t = String(serviceType || '').toLowerCase();
  // "stories" é entregue no perfil: o cliente não tem link estável de story.
  if (t === 'stories') return 'profile';
  return POST_TYPES.includes(t) ? 'post' : 'profile';
}

// --- limpeza básica ---

// Tira caracteres invisíveis que vêm de copiar/colar (zero-width, BOM) e
// normaliza espaços.
function clean(raw: string): string {
  return String(raw ?? '')
    .replace(/[​-‍﻿⁠]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface PlatformRules {
  hosts: string[];
  /** Caracteres e tamanho aceitos no nome de usuário. */
  username: RegExp;
  /** Monta o link do perfil que vai para o painel SMM. */
  profileLink: (u: string) => string;
  /** Caminhos que nunca são nome de usuário. */
  reserved?: string[];
  /** Caminhos de publicação aceitos, quando o serviço exige uma. */
  postPath?: RegExp;
  /**
   * Parâmetros de query que fazem PARTE do endereço e não podem ser removidos.
   * No YouTube o vídeo é identificado por ?v=, então limpar a query cegamente
   * transformaria o link em "youtube.com/watch" e o pedido nunca entregaria.
   */
  keepParams?: string[];
  label: string;
}

const RULES: Record<string, PlatformRules> = {
  instagram: {
    label: 'Instagram',
    hosts: ['instagram.com', 'instagr.am'],
    // 1–30, letras, números, ponto e sublinhado; não pode abrir nem fechar com ponto.
    username: /^(?!\.)(?!.*\.$)[A-Za-z0-9._]{1,30}$/,
    reserved: ['p', 'reel', 'reels', 'tv', 'stories', 'explore', 'accounts', 'direct', 'share'],
    postPath: /^\/(p|reel|reels|tv)\/[A-Za-z0-9_-]+/,
    profileLink: (u) => `https://www.instagram.com/${u}`
  },
  tiktok: {
    label: 'TikTok',
    hosts: ['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
    username: /^[A-Za-z0-9._]{2,24}$/,
    reserved: ['video', 'tag', 'music', 'discover', 'foryou', 'live'],
    postPath: /^\/@[A-Za-z0-9._]+\/video\/\d+/,
    profileLink: (u) => `https://www.tiktok.com/@${u}`
  },
  youtube: {
    label: 'YouTube',
    hosts: ['youtube.com', 'youtu.be', 'm.youtube.com'],
    username: /^(?:UC[A-Za-z0-9_-]{22}|[A-Za-z0-9._-]{3,30})$/,
    reserved: ['watch', 'shorts', 'playlist', 'results', 'feed', 'channel', 'c', 'user'],
    postPath: /^\/(watch|shorts)/,
    // O ?v= É o vídeo; sem ele o link não aponta para nada.
    keepParams: ['v', 't'],
    profileLink: (u) => (/^UC[A-Za-z0-9_-]{22}$/.test(u)
      ? `https://www.youtube.com/channel/${u}`
      : `https://www.youtube.com/@${u}`)
  },
  facebook: {
    label: 'Facebook',
    hosts: ['facebook.com', 'fb.com', 'fb.me', 'm.facebook.com'],
    username: /^(?:\d{5,}|[A-Za-z0-9.]{5,50})$/,
    reserved: ['posts', 'photo', 'photos', 'videos', 'watch', 'share', 'story.php', 'permalink.php', 'profile.php'],
    postPath: /^\/(.+\/(posts|videos|photos)\/|watch|photo|permalink\.php|story\.php)/,
    // O Facebook identifica publicação por query em vários formatos antigos.
    keepParams: ['story_fbid', 'fbid', 'id', 'v'],
    profileLink: (u) => (/^\d{5,}$/.test(u)
      ? `https://www.facebook.com/profile.php?id=${u}`
      : `https://www.facebook.com/${u}`)
  },
  twitter: {
    label: 'Twitter/X',
    hosts: ['twitter.com', 'x.com', 'mobile.twitter.com'],
    username: /^[A-Za-z0-9_]{1,15}$/,
    reserved: ['status', 'i', 'home', 'search', 'hashtag', 'intent'],
    postPath: /^\/[A-Za-z0-9_]+\/status\/\d+/,
    // Em serviços de enquete o voto vai na query.
    keepParams: ['vote'],
    profileLink: (u) => `https://twitter.com/${u}`
  },
  kwai: {
    label: 'Kwai',
    hosts: ['kwai.com', 'm.kwai.com', 'kw.ai'],
    username: /^[A-Za-z0-9._-]{2,30}$/,
    reserved: ['video', 'p'],
    postPath: /^\/.+/,
    profileLink: (u) => `https://www.kwai.com/@${u}`
  }
};

function rulesFor(platform: string): PlatformRules | null {
  return RULES[String(platform || '').toLowerCase()] || null;
}

/**
 * Desfaz o estrago do stripLinks(): antes desta correção o servidor passava o
 * perfil por uma função anti-spam feita para comentários, que troca pontos e
 * barras por espaços. Um perfil colado virava
 *
 *   "@instagram com martins_decassia?igsh=..."
 *
 * Pedidos assim já estão gravados no banco, e o link do painel é montado a
 * partir deles — então reconhecer esse formato não é luxo, é o que recupera os
 * pedidos antigos.
 */
function undoBrokenLink(value: string, hosts: string[]): string {
  let out = value;
  for (const host of hosts) {
    const spaced = host.replace(/\./g, ' ');
    const re = new RegExp(`(^|[@\\s])(?:www\\s)?${spaced.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i');
    if (re.test(out)) out = out.replace(re, `$1${host}/`);
  }
  return out;
}

// Separa o caminho de uma entrada que aparenta ser link daquela plataforma.
// Devolve null quando a entrada não menciona nenhum host conhecido.
function pathFromUrl(value: string, r: PlatformRules): string | null {
  const v = undoBrokenLink(value, r.hosts).replace(/\s+/g, '');
  for (const host of r.hosts) {
    const idx = v.toLowerCase().indexOf(host);
    if (idx === -1) continue;
    // Só conta como host se o que vem antes for começo, esquema, "@" ou "www."
    const before = v.slice(0, idx).toLowerCase();
    if (before && !/^(?:@?(?:https?:\/\/)?(?:[a-z0-9-]+\.)*)$/.test(before)) continue;
    const rest = v.slice(idx + host.length);
    return rest.startsWith('/') ? rest : '/' + rest;
  }
  return null;
}

function stripQuery(path: string): string {
  return path.split('#')[0].split('?')[0];
}

/**
 * Limpa a query preservando os parâmetros que fazem parte do endereço.
 *
 * Remover a query inteira parece seguro e não é: no YouTube o vídeo vive em
 * ?v=, e um "youtube.com/watch" pelado é um pedido que nunca entrega.
 */
function cleanQuery(path: string, keep?: string[]): { path: string; dropped: boolean } {
  const [beforeHash] = path.split('#');
  const qIndex = beforeHash.indexOf('?');
  if (qIndex === -1) return { path: beforeHash, dropped: path !== beforeHash };
  const base = beforeHash.slice(0, qIndex);
  const query = beforeHash.slice(qIndex + 1);
  if (!keep || keep.length === 0) return { path: base, dropped: !!query };

  const kept: string[] = [];
  let dropped = false;
  for (const pair of query.split('&')) {
    if (!pair) continue;
    const name = pair.split('=')[0];
    if (keep.includes(name)) kept.push(pair);
    else dropped = true;
  }
  return { path: kept.length ? `${base}?${kept.join('&')}` : base, dropped };
}

/** Normaliza um PERFIL para o nome de usuário puro (sem @, sem URL, sem query). */
export function normalizeProfile(platform: string, raw: string): NormalizedTarget {
  const r = rulesFor(platform);
  const input = clean(raw);
  if (!input) return fail('Informe o perfil de destino.');
  if (!r) {
    // Rede não catalogada: aceita o texto sem o @, sem inventar link.
    const bare = input.replace(/^@+/, '').trim();
    return { ok: !!bare, value: bare, link: bare, error: bare ? undefined : 'Informe o perfil de destino.' };
  }

  const changed = { url: false, at: false, query: false };
  let handle: string;

  const path = pathFromUrl(input, r);
  if (path !== null) {
    changed.url = true;
    if (path !== stripQuery(path)) changed.query = true;
    const cleanPath = stripQuery(path);
    const segments = cleanPath.split('/').filter(Boolean);
    if (segments.length === 0) {
      return fail(`Esse link abre a página inicial do ${r.label}, não um perfil. Informe o nome de usuário.`);
    }

    const first = segments[0].toLowerCase();
    // O YouTube identifica o canal por /channel/UC..., /c/nome e /user/nome —
    // precisa vir antes da checagem de caminho reservado, senão "channel" é
    // confundido com um caminho de publicação.
    const ytPrefix = r === RULES.youtube && ['channel', 'c', 'user'].includes(first);
    if (ytPrefix) {
      if (!segments[1]) return fail(`Esse link do ${r.label} não aponta para um canal. Confira e tente de novo.`);
      handle = segments[1];
    } else {
      // Um link de publicação não serve para um serviço de perfil. A checagem é
      // sobre o caminho inteiro: no Twitter o usuário vem primeiro
      // (/fulano/status/123), então olhar só o primeiro segmento deixaria passar.
      if (r.postPath && r.postPath.test(cleanPath)) {
        return fail(`Esse link é de uma publicação, não de um perfil. Informe o nome de usuário do ${r.label}.`);
      }
      if (r.reserved && r.reserved.includes(first)) {
        return fail(`Esse link é de uma publicação, não de um perfil. Informe o nome de usuário do ${r.label}.`);
      }
      handle = segments[0];
    }
  } else {
    handle = input;
  }

  if (handle.startsWith('@')) { changed.at = true; handle = handle.replace(/^@+/, ''); }
  // Texto solto com query colada ("martins_decassia?igsh=...").
  if (/[?#]/.test(handle)) { changed.query = true; handle = stripQuery(handle); }
  handle = handle.replace(/^\/+|\/+$/g, '').trim();

  if (!handle) return fail('Informe o perfil de destino.');
  if (/\s/.test(handle)) {
    return fail(`"${handle}" não parece um perfil do ${r.label}. Informe só o nome de usuário, sem espaços.`);
  }
  if (!r.username.test(handle)) {
    return fail(`"${handle}" não é um nome de usuário válido do ${r.label}. Confira e tente de novo.`);
  }

  const notes: string[] = [];
  if (changed.url) notes.push('link convertido para o nome de usuário');
  else if (changed.at) notes.push('@ removido');
  if (changed.query) notes.push('parâmetros de rastreamento removidos');

  return {
    ok: true,
    value: handle,
    link: r.profileLink(handle),
    note: notes.length ? notes.join(' · ') : undefined
  };
}

/** Normaliza o link de uma PUBLICAÇÃO (curtidas, visualizações, comentários). */
export function normalizePostUrl(platform: string, raw: string): NormalizedTarget {
  const r = rulesFor(platform);
  const input = clean(raw);
  if (!input) return fail('Informe o link da publicação.');
  if (!r) {
    const v = input.replace(/\s+/g, '');
    return { ok: true, value: v, link: v };
  }

  let path = pathFromUrl(input, r);
  if (path === null) {
    return fail(`Informe o link completo da publicação no ${r.label} (copie do botão "compartilhar" do aplicativo).`);
  }

  // youtu.be/ID é o mesmo vídeo que youtube.com/watch?v=ID, mas só o segundo
  // formato é o documentado pelos painéis.
  if (r === RULES.youtube && /youtu\.be/i.test(input)) {
    const id = stripQuery(path).split('/').filter(Boolean)[0];
    if (!id) return fail('Esse link do YouTube está sem o identificador do vídeo. Copie de novo pelo botão "compartilhar".');
    path = `/watch?v=${id}`;
  }

  const cleaned = cleanQuery(path, r.keepParams);
  const cleanPath = cleaned.path;
  const hadQuery = cleaned.dropped;

  // Um caminho que depende de query e ficou sem ela não aponta para nada.
  if (r === RULES.youtube && /^\/watch/.test(cleanPath) && !/[?&]v=/.test(cleanPath)) {
    return fail('Esse link do YouTube está sem o identificador do vídeo (?v=). Copie de novo pelo botão "compartilhar".');
  }

  // Link de perfil onde era preciso uma publicação.
  if (r.postPath && !r.postPath.test(cleanPath)) {
    const segments = cleanPath.split('/').filter(Boolean);
    if (segments.length <= 1) {
      return fail(`Esse link é de um perfil, não de uma publicação. Abra a publicação, toque em "compartilhar" e cole o link dela.`);
    }
    return fail(`Não reconhecemos esse link como uma publicação do ${r.label}. Confira e tente de novo.`);
  }

  // Encurtadores exigiriam resolver por rede; melhor recusar com instrução.
  if (/^(vm|vt)\.tiktok\.com$/i.test(r.hosts[0]) === false && /(vm|vt)\.tiktok\.com|fb\.me|youtu\.be\/?$/i.test(input) && !cleanPath.replace(/\//g, '')) {
    return fail('Esse link encurtado não pode ser conferido aqui. Abra-o e cole o endereço completo.');
  }

  // Sempre no host canônico: vários serviços recusam m.facebook.com e afins.
  const host = r.hosts[0];
  const link = `https://www.${host}${cleanPath.replace(/\/+(?=$|\?)/, '')}`;

  return {
    ok: true,
    value: link,
    link,
    note: hadQuery ? 'parâmetros de rastreamento removidos' : undefined
  };
}

export interface NormalizeTargetInput {
  platform: string;
  serviceType: string;
  profile: string;
  postUrl?: string;
}

export interface NormalizedOrderTarget {
  kind: TargetKind;
  profile: NormalizedTarget;
  post?: NormalizedTarget;
  /** Link final para o painel SMM. */
  link: string;
  ok: boolean;
}

/**
 * Normaliza o alvo inteiro do pedido de uma vez.
 *
 * O perfil é sempre exigido (é ele que identifica o cliente no painel e no
 * suporte); a publicação só quando o serviço age sobre uma.
 */
export function normalizeOrderTarget(input: NormalizeTargetInput): NormalizedOrderTarget {
  const kind = targetKindFor(input.serviceType);
  const profile = normalizeProfile(input.platform, input.profile);
  if (kind === 'profile') {
    return { kind, profile, link: profile.link, ok: profile.ok };
  }
  const post = normalizePostUrl(input.platform, input.postUrl || '');
  return { kind, profile, post, link: post.link, ok: profile.ok && post.ok };
}

/**
 * Link que vai para o painel SMM a partir de um pedido já gravado.
 *
 * Aceita o formato antigo (com @, com URL colada, ou já corrompido pelo
 * stripLinks) e devolve o alvo canônico.
 *
 * Devolve string vazia quando não dá para interpretar, e isso é deliberado: o
 * painel aceita qualquer texto no campo "link", cobra o pedido e simplesmente
 * não entrega — os próprios fornecedores avisam "no refund for wrong link".
 * Abortar o despacho e deixar o pedido visível para correção custa menos que
 * mandar um palpite.
 *
 * `linkFormat` vem do serviço: 'username' para os serviços que exigem o nome de
 * usuário puro, 'url' (padrão) para os que documentam a URL completa.
 */
export function orderTargetLink(
  order: { platform?: string; serviceType?: string; username?: string; postUrl?: string },
  linkFormat: 'url' | 'username' = 'url'
): string {
  const kind = targetKindFor(order.serviceType || '');
  if (kind === 'post') {
    // Serviço de publicação sem link de publicação não tem alvo válido: entregar
    // no perfil não é o que o cliente comprou.
    const post = normalizePostUrl(order.platform || '', order.postUrl || '');
    return post.ok ? post.link : '';
  }
  const profile = normalizeProfile(order.platform || '', order.username || '');
  if (!profile.ok) return '';
  return linkFormat === 'username' ? profile.value : profile.link;
}
