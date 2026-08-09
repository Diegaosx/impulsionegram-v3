// Catálogo de redes sociais e tipos de entrega, cadastrado no painel.
//
// Antes eram duas listas fixas em src/data.ts. Viraram cadastro porque entram
// redes novas e tipos de entrega que não existiam quando o código foi escrito.
//
// A leitura começa pelos padrões embutidos e é substituída quando a resposta do
// servidor chega: assim o grid e a calculadora não nascem vazios nem piscam.

import { useEffect, useState } from 'react';

export interface SocialPlatformItem {
  id: string;
  name: string;
  /** Gradiente Tailwind (tema padrão). */
  color: string;
  /** Nome do ícone do conjunto; 'Layers' é o genérico. */
  icon: string;
  /** Imagem própria, quando nenhum ícone do conjunto serve. */
  imageUrl?: string;
}

export interface ServiceTypeItem {
  id: string;
  label: string;
  /** Onde a entrega acontece: no perfil ou numa publicação. */
  target: 'profile' | 'post';
}

export interface Catalog {
  platforms: SocialPlatformItem[];
  serviceTypes: ServiceTypeItem[];
}

// Espelho de DEFAULT_SOCIAL_PLATFORMS/DEFAULT_SERVICE_TYPES em db.ts. Serve de
// valor inicial enquanto a chamada não volta e de rede de segurança se ela
// falhar — sem isso o site apareceria sem nenhuma rede.
export const DEFAULT_CATALOG: Catalog = {
  platforms: [
    { id: 'instagram', name: 'Instagram', color: 'from-pink-500 via-rose-500 to-amber-500', icon: 'Instagram' },
    { id: 'tiktok', name: 'TikTok', color: 'from-black via-slate-900 to-cyan-500', icon: 'TikTok' },
    { id: 'youtube', name: 'YouTube', color: 'from-red-600 to-rose-700', icon: 'Youtube' },
    { id: 'twitter', name: 'Twitter/X', color: 'from-slate-900 to-zinc-700', icon: 'Twitter' },
    { id: 'facebook', name: 'Facebook', color: 'from-blue-600 to-indigo-700', icon: 'Facebook' },
    { id: 'kwai', name: 'Kwai', color: 'from-orange-500 to-amber-600', icon: 'Flame' }
  ],
  serviceTypes: [
    { id: 'followers', label: 'Seguidores', target: 'profile' },
    { id: 'likes', label: 'Curtidas', target: 'post' },
    { id: 'views', label: 'Visualizações', target: 'post' },
    { id: 'comments', label: 'Comentários', target: 'post' },
    { id: 'stories', label: 'Views Stories', target: 'profile' }
  ]
};

export async function fetchCatalog(): Promise<Catalog> {
  try {
    const res = await fetch('/api/catalog');
    if (!res.ok) throw new Error('falha');
    const data = await res.json();
    return {
      platforms: Array.isArray(data?.platforms) && data.platforms.length ? data.platforms : DEFAULT_CATALOG.platforms,
      serviceTypes: Array.isArray(data?.serviceTypes) && data.serviceTypes.length ? data.serviceTypes : DEFAULT_CATALOG.serviceTypes
    };
  } catch {
    return DEFAULT_CATALOG;
  }
}

export async function saveCatalog(input: Partial<Catalog>): Promise<{ ok: boolean; error?: string; catalog?: Catalog }> {
  try {
    const res = await fetch('/api/catalog', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Falha ao salvar o catálogo.' };
    return { ok: true, catalog: { platforms: data.platforms, serviceTypes: data.serviceTypes } };
  } catch {
    return { ok: false, error: 'Erro de conexão.' };
  }
}

export async function fetchCatalogInUse(): Promise<{ platforms: string[]; types: string[] }> {
  try {
    const res = await fetch('/api/catalog/in-use');
    if (!res.ok) throw new Error('falha');
    const data = await res.json();
    return { platforms: data?.platforms || [], types: data?.types || [] };
  } catch {
    return { platforms: [], types: [] };
  }
}

// Cache de módulo: a mesma página monta grid, calculadora e página de serviço,
// e não há motivo para três chamadas iguais.
let cached: Catalog | null = null;
let inFlight: Promise<Catalog> | null = null;

export function primeCatalog(catalog: Catalog): void {
  cached = catalog;
}

export function useCatalog(): Catalog {
  const [catalog, setCatalog] = useState<Catalog>(cached || DEFAULT_CATALOG);

  useEffect(() => {
    if (cached) { setCatalog(cached); return; }
    let alive = true;
    inFlight = inFlight || fetchCatalog();
    inFlight.then(c => {
      cached = c;
      inFlight = null;
      if (alive) setCatalog(c);
    });
    return () => { alive = false; };
  }, []);

  return catalog;
}

// --- Auxiliares ---

export function platformName(catalog: Catalog, id: string): string {
  return catalog.platforms.find(p => p.id === id)?.name || id;
}

export function serviceTypeLabel(catalog: Catalog, id: string): string {
  return catalog.serviceTypes.find(t => t.id === id)?.label || id;
}

/** Redes que têm ao menos um serviço cadastrado, na ordem do catálogo. */
export function platformsWithServices(
  catalog: Catalog,
  services: { platform?: string }[]
): SocialPlatformItem[] {
  return catalog.platforms.filter(p => services.some(s => s.platform === p.id));
}
