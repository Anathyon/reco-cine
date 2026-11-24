/* Índice de busca no navegador: baixado uma vez por visita e preparado para a busca aproximada. */
import type { MediaItem } from '../types';
import { createFuzzyIndex, type FuzzyIndex, type IndexEntry } from './fuzzy';
import { tmdbImage } from './tmdb';

let loading: Promise<FuzzyIndex> | null = null;

export function loadSearchIndex(): Promise<FuzzyIndex> {
  if (!loading) {
    loading = fetch('/api/search/catalog')
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => [])
      .then((entries: IndexEntry[]) => createFuzzyIndex(Array.isArray(entries) ? entries : []));
  }
  return loading;
}

/** Converte uma entrada de título do índice no formato dos cards. */
export function entryToItem(e: IndexEntry): MediaItem | null {
  if (e.k === 'person') return null;
  return {
    id: e.id,
    type: e.k,
    title: e.t,
    poster: e.p ? (e.p.startsWith('http') ? e.p : tmdbImage(e.p, 'w342')) : null,
    backdrop: null,
    year: e.y ?? null,
    rating: e.r ?? null,
    overview: '',
  };
}

export async function fetchSpellSuggestion(query: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/search/spell?q=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    return (await res.json()).suggestion ?? null;
  } catch {
    return null;
  }
}
