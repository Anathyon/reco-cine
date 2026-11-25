/*
 * Links oficiais de onde ler (mangás) ou assistir (animes) e trailer dos animes,
 * pela API GraphQL pública da AniList (gratuita, sem chave). SOMENTE no servidor.
 *
 * A AniList guarda o ID do MyAnimeList de cada título (idMal), então dá para
 * consultar direto com os IDs que o site já usa. Se a AniList falhar ou demorar,
 * a lista vem vazia e o resto da página segue normal.
 */
import type { Provider } from '../types';

const ENDPOINT = 'https://graphql.anilist.co';

const QUERY = `query ($id: Int, $type: MediaType) {
  Media(idMal: $id, type: $type) {
    externalLinks { site url type language isDisabled }
    trailer { id site }
  }
}`;

/** Idiomas mais úteis para quem usa o site em português vêm primeiro. */
const LANGUAGES: Record<string, string> = {
  Portuguese: 'Português',
  English: 'Inglês',
  Spanish: 'Espanhol',
  Japanese: 'Japonês',
  Korean: 'Coreano',
  Chinese: 'Chinês',
  French: 'Francês',
  German: 'Alemão',
  Italian: 'Italiano',
  Thai: 'Tailandês',
  Indonesian: 'Indonésio',
  Vietnamese: 'Vietnamita',
};
const PRIORITY = ['Portuguese', 'English', 'Spanish', null, 'Japanese'];
const rank = (language: string | null) => {
  const i = PRIORITY.indexOf(language);
  return i === -1 ? PRIORITY.length : i;
};

export const MAX_LINKS = 10;

interface RawLink {
  site?: string;
  url?: string;
  type?: string;
  language?: string | null;
  isDisabled?: boolean;
}

/** Só links de leitura/streaming ativos e com https, sem repetir site e idioma. */
export function toProviders(links: RawLink[]): Provider[] {
  const seen = new Set<string>();
  return links
    .filter((l) => l.type === 'STREAMING' && !l.isDisabled && l.site && typeof l.url === 'string' && l.url.startsWith('https://'))
    .map((l, i) => ({ link: l, i, language: l.language && l.language !== 'None' ? l.language : null }))
    .sort((a, b) => rank(a.language) - rank(b.language) || a.i - b.i)
    .filter(({ link, language }) => {
      const key = `${link.site}|${language}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_LINKS)
    .map(({ link, language }) => ({
      name: link.site!,
      logo: null,
      url: link.url!,
      ...(language ? { language: LANGUAGES[language] ?? language } : {}),
    }));
}

/** ID de vídeo do YouTube (a AniList às vezes manda com espaço ou tab no fim). */
export function youtubeId(trailer: { id?: unknown; site?: unknown } | null | undefined): string | null {
  if (!trailer || trailer.site !== 'youtube' || typeof trailer.id !== 'string') return null;
  const id = trailer.id.trim();
  return /^[\w-]{11}$/.test(id) ? id : null;
}

export interface AnilistInfo {
  links: Provider[];
  trailerKey: string | null;
}

const EMPTY: AnilistInfo = { links: [], trailerKey: null };
const TTL_MS = 12 * 60 * 60 * 1000;
const MEMORY_MAX = 2000;
const memory = new Map<string, { at: number; info: AnilistInfo }>();

export function clearAnilistCache() {
  memory.clear();
}

export async function anilistInfo(idMal: number, type: 'ANIME' | 'MANGA', timeoutMs = 3500): Promise<AnilistInfo> {
  const key = `${type}-${idMal}`;
  const hit = memory.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.info;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { id: idMal, type } }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    // 404 = a AniList não tem o título: guarda como "sem links". Outras falhas não ficam guardadas.
    if (res.status !== 404 && !res.ok) return EMPTY;
    const media = res.ok ? (await res.json())?.data?.Media : null;
    const info: AnilistInfo = { links: toProviders(media?.externalLinks ?? []), trailerKey: youtubeId(media?.trailer) };
    if (memory.size >= MEMORY_MAX) memory.delete(memory.keys().next().value as string);
    memory.set(key, { at: Date.now(), info });
    return info;
  } catch {
    return EMPTY;
  }
}

/** Junta duas listas de links sem repetir o mesmo serviço (a primeira tem prioridade). */
export function mergeProviders(first: Provider[], second: Provider[], max = MAX_LINKS): Provider[] {
  const norm = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const seen = new Set(first.map((p) => `${norm(p.name)}|${p.language ?? ''}`));
  return [...first, ...second.filter((p) => !seen.has(`${norm(p.name)}|${p.language ?? ''}`))].slice(0, max);
}
