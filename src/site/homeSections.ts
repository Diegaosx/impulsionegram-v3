// Ordem das seções da home, controlada pelo painel e compartilhada pelos temas.
//
// O vocabulário aqui é PROPOSITALMENTE genérico: cada id descreve o *papel* de
// uma seção ("prova social", "como funciona"), não a marcação de um tema. Assim
// o painel edita uma lista só e cada tema renderiza o subconjunto que
// implementa, na ordem escolhida — sem que o admin precise saber qual tema tem
// qual bloco.
//
// A primeira seção (herói) não entra na lista: ela é fixa em todos os temas.

import { useEffect, useState } from 'react';
import { fetchGeneralSettings } from '../utils/storage';

export interface HomeSectionInfo {
  id: string;
  label: string;
  hint: string;
}

// Catálogo mostrado no painel. A ordem daqui é a ordem padrão.
export const HOME_SECTIONS: HomeSectionInfo[] = [
  { id: 'servicos', label: 'Serviços', hint: 'Grid do catálogo com preço a partir de.' },
  { id: 'beneficios', label: 'Vantagens', hint: 'Blocos de benefícios/compromisso.' },
  { id: 'calculadora', label: 'Calculadora', hint: 'Simulador de pedido com preço ao vivo.' },
  { id: 'planos', label: 'Planos', hint: 'Pacotes pré-modelados. Some se a seção estiver desativada.' },
  { id: 'como-funciona', label: 'Como funciona', hint: 'Passo a passo do pedido.' },
  { id: 'depoimentos', label: 'Depoimentos', hint: 'Avaliações aprovadas no painel.' },
  { id: 'redes', label: 'Redes atendidas', hint: 'Atalho visual por rede social.' },
  { id: 'faq', label: 'Perguntas frequentes', hint: 'Acordeão de dúvidas.' },
  { id: 'contato', label: 'Contato', hint: 'Formulário de atendimento.' },
  { id: 'blog', label: 'Chamada do blog', hint: 'Convite para os artigos.' },
  { id: 'newsletter', label: 'Newsletter', hint: 'Captura de e-mail.' }
];

export const DEFAULT_HOME_ORDER: string[] = HOME_SECTIONS.map(s => s.id);

const KNOWN = new Set(DEFAULT_HOME_ORDER);

/**
 * Limpa a ordem vinda do banco: descarta ids que não existem mais, remove
 * repetições e — o ponto importante — acrescenta no fim as seções que a lista
 * salva não conhece. Sem isso, uma seção nova criada depois da última gravação
 * simplesmente nunca apareceria.
 */
export function normalizeHomeOrder(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
  const seen = new Set<string>();
  const order: string[] = [];
  for (const id of list) {
    if (KNOWN.has(id) && !seen.has(id)) { seen.add(id); order.push(id); }
  }
  for (const id of DEFAULT_HOME_ORDER) {
    if (!seen.has(id)) order.push(id);
  }
  return order;
}

export interface HomeLayout {
  /** Ordem das seções, já normalizada. */
  order: string[];
  /** Seção "Nossos Planos" visível? */
  plansEnabled: boolean;
}

/**
 * Layout da home vindo das configurações gerais.
 *
 * Começa no padrão e com os planos visíveis, para a home não piscar nem
 * reordenar enquanto a chamada não volta.
 */
export function useHomeLayout(): HomeLayout {
  const [layout, setLayout] = useState<HomeLayout>({ order: DEFAULT_HOME_ORDER, plansEnabled: true });

  useEffect(() => {
    let alive = true;
    fetchGeneralSettings()
      .then(g => {
        if (!alive) return;
        setLayout({
          order: normalizeHomeOrder(g?.homeSections),
          plansEnabled: g?.plansEnabled !== false
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return layout;
}

/**
 * Aplica a ordem a um mapa de blocos. Ids que o tema não implementa (ou que ele
 * decidiu esconder, devolvendo null) são simplesmente pulados.
 */
export function orderedSections<T>(order: string[], blocks: Record<string, T | null | undefined>): { id: string; node: T }[] {
  return order
    .map(id => ({ id, node: blocks[id] }))
    .filter((s): s is { id: string; node: T } => s.node !== null && s.node !== undefined);
}
