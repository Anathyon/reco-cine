/*
 * Tradução automática de sinopses e biografias. SOMENTE no servidor.
 *
 * Usa o endpoint público (não oficial e sem chave) do Google Tradutor. Ele pode
 * ficar indisponível ou limitar requisições: por isso tudo é cacheado (memória
 * e CDN) e, se falhar, a interface mostra o texto original.
 */
import { cleanSynopsis, mal } from './malServer';
import { tmdbServer } from './tmdbServer';

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
/** Tamanho máximo de cada pedaço enviado ao tradutor. */
const CHUNK = 4000;
const MAX_TEXT = 12000;

export interface Translation {
  text: string;
  /** Idioma detectado do original (ex.: "en"). */
  from: string;
  to: string;
  original: string;
  /** false quando o original já está no idioma pedido. */
  translated: boolean;
}

/** Idiomas aceitos: "pt", "en", "es", "pt-BR", "zh-CN"... */
export const isLanguage = (lang: string) => /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(lang);

/** Divide em pedaços sem cortar parágrafos ou frases no meio. */
export function splitText(text: string, size = CHUNK): string[] {
  if (text.length <= size) return [text];
  const parts: string[] = [];
  let current = '';
  for (const sentence of text.match(/[^.!?\n]+[.!?]*\s*|\n+/g) ?? [text]) {
    if (current.length + sentence.length > size && current) {
      parts.push(current);
      current = '';
    }
    // Frase gigante sem pontuação: corta no tamanho máximo.
    for (let i = 0; i < sentence.length; i += size) {
      const piece = sentence.slice(i, i + size);
      if (current.length + piece.length > size && current) {
        parts.push(current);
        current = '';
      }
      current += piece;
    }
  }
  if (current) parts.push(current);
  return parts;
}

async function translateChunk(text: string, to: string): Promise<{ text: string; from: string }> {
  const params = new URLSearchParams({ client: 'gtx', sl: 'auto', tl: to, dt: 't' });
  const res = await fetch(`${ENDPOINT}?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ q: text }).toString(),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Tradutor respondeu ${res.status}`);
  const data = await res.json();
  const segments: unknown[] = Array.isArray(data?.[0]) ? data[0] : [];
  const out = segments.map((s) => (Array.isArray(s) && typeof s[0] === 'string' ? s[0] : '')).join('');
  if (!out) throw new Error('Tradução vazia');
  return { text: out, from: typeof data?.[2] === 'string' ? data[2] : 'auto' };
}

const memory = new Map<string, Translation>();
const MEMORY_MAX = 2000;

const sameLanguage = (a: string, b: string) => a.split('-')[0].toLowerCase() === b.split('-')[0].toLowerCase();

export async function translateText(text: string, to: string): Promise<Translation> {
  const original = text.slice(0, MAX_TEXT);
  const key = `${to}:${original}`;
  const hit = memory.get(key);
  if (hit) return hit;

  const parts = await Promise.all(splitText(original).map((p) => translateChunk(p, to)));
  const from = parts[0]?.from ?? 'auto';
  const result: Translation = sameLanguage(from, to)
    ? { text: original, from, to, original, translated: false }
    : { text: parts.map((p) => p.text).join(''), from, to, original, translated: true };

  if (memory.size >= MEMORY_MAX) memory.delete(memory.keys().next().value as string);
  memory.set(key, result);
  return result;
}

export type TranslatableType = 'movie' | 'tv' | 'anime' | 'manga' | 'person';

/**
 * Busca o texto original no servidor (o navegador nunca manda texto livre,
 * então a rota não vira um tradutor aberto) e traduz.
 */
export async function sourceText(type: TranslatableType, id: number): Promise<string> {
  if (type === 'anime' || type === 'manga') {
    const raw = await mal(`${type}/${id}`, { fields: 'synopsis' });
    return cleanSynopsis(raw.synopsis);
  }
  // TMDB: quando falta em português, usa o inglês ou qualquer outro idioma disponível.
  const data = await tmdbServer(`${type}/${id}/translations`);
  const list: any[] = data.translations || [];
  const field = type === 'person' ? 'biography' : 'overview';
  const pick = (lang: string) => list.find((t) => t.iso_639_1 === lang && t.data?.[field]?.trim())?.data[field];
  return (pick('pt') || pick('en') || list.find((t) => t.data?.[field]?.trim())?.data[field] || '').trim();
}

/* ---------- "Você quis dizer" de reserva (sugestões do Google) ---------- */

const NOISE =
  /\s+(filme|filmes|serie|série|series|séries|anime|dublado|legendado|elenco|trailer|netflix|temporada.*|online|completo|assistir.*|torrent|wiki.*|personagens|imdb|onde assistir.*)$/i;

/** Sugestão de grafia para buscas que não acharam nada. */
export async function spellSuggestion(query: string): Promise<string | null> {
  const params = new URLSearchParams({ client: 'firefox', hl: 'pt-BR', ie: 'utf-8', oe: 'utf-8', q: query });
  const res = await fetch(`https://suggestqueries.google.com/complete/search?${params}`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const list: string[] = Array.isArray(data?.[1]) ? data[1] : [];
  const clean = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const typed = clean(query);
  for (const s of list) {
    const candidate = clean(s).replace(NOISE, '').trim();
    if (candidate && candidate !== typed && candidate.length >= 2) return candidate;
  }
  return null;
}
