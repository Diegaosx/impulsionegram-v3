// Palavras-chave de SEO: uma lista, saneada do mesmo jeito no navegador e no
// servidor.
//
// O painel envia um array (o campo é de fichas), mas registros antigos e
// colagens vindas de outras ferramentas chegam como "curtidas, seguidores,
// instagram". Aceitar as duas formas aqui evita que cada ponto de entrada
// invente a sua regra — e que a meta tag saia com vírgulas soltas ou repetições
// que só atrapalham.

/** Teto por lista. Além disso a meta tag vira ruído e nenhum buscador lê. */
export const MAX_KEYWORDS = 20;
/** Teto por palavra-chave, para uma colagem acidental não virar uma frase. */
export const MAX_KEYWORD_LENGTH = 60;

/** Quebra um texto digitado/colado em palavras-chave (vírgula, ponto e vírgula ou quebra de linha). */
export function parseKeywords(text: string): string[] {
  return String(text || '').split(/[,;\n\r]+/);
}

/**
 * Devolve a lista limpa: sem vazios, sem espaços duplicados, sem repetição
 * (ignorando maiúsculas) e dentro dos tetos.
 *
 * Aceita array ou string separada por vírgulas.
 */
export function normalizeKeywords(raw: unknown): string[] {
  const parts: string[] = Array.isArray(raw)
    ? raw.flatMap(item => (typeof item === 'string' ? parseKeywords(item) : []))
    : typeof raw === 'string'
      ? parseKeywords(raw)
      : [];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const word = part.replace(/\s+/g, ' ').trim().slice(0, MAX_KEYWORD_LENGTH).trim();
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(word);
    if (out.length >= MAX_KEYWORDS) break;
  }
  return out;
}

/** Conteúdo da <meta name="keywords">. Vazio quando não há nada a declarar. */
export function keywordsContent(list: string[]): string {
  return normalizeKeywords(list).join(', ');
}
