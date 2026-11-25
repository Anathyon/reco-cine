/*
 * Mangás (e manhwas, manhuas e light novels) pela API oficial do MyAnimeList.
 * SOMENTE no servidor (rota /api/manga e getStaticProps): lê o Client ID.
 */
import type { MediaDetails, MediaItem, Page, Provider } from '../types';
import { formatDate, uniqueBy } from './format';
import { anilistLinks } from './anilistServer';
import { PAGE_SIZE, SCAN_CHUNK, SCAN_MAX_CHUNKS, cleanSynopsis, genreName, isSafe, mal, nodes } from './malServer';

export type MangaSort = 'popular' | 'top';

const LIST_FIELDS = 'alternative_titles,mean,start_date,synopsis,genres,status,num_list_users,media_type';
const DETAILS_FIELDS = [
  LIST_FIELDS,
  'rank',
  'num_volumes',
  'num_chapters',
  'authors{first_name,last_name}',
  'serialization{name}',
  `recommendations{${LIST_FIELDS}}`,
].join(',');

/** Temas que o MAL usa só para organizar o site, sem sentido para quem lê. */
const HIDDEN_GENRES = new Set([84]);

export function toMangaItem(m: any): MediaItem {
  return {
    id: m.id,
    type: 'manga',
    title: m.alternative_titles?.en || m.title,
    poster: m.main_picture?.large || m.main_picture?.medium || null,
    backdrop: null,
    year: m.start_date ? String(m.start_date).slice(0, 4) : null,
    rating: m.mean || null,
    overview: cleanSynopsis(m.synopsis),
  };
}

const toItems = (raw: any[], { includeAdult = false } = {}) =>
  uniqueBy((includeAdult ? raw : raw.filter(isSafe)).map(toMangaItem), (i: MediaItem) => i.id);

/* ---------- listas ---------- */

const RANKING_FOR: Record<MangaSort, string> = { popular: 'bypopularity', top: 'all' };

async function ranking(type: string, offset: number, limit: number) {
  const data = await mal('manga/ranking', { ranking_type: type, offset, limit, fields: LIST_FIELDS });
  return { raw: nodes(data), hasNext: Boolean(data?.paging?.next) };
}

export async function discoverManga(opts: { genre?: number; sort?: MangaSort; page?: number }): Promise<Page<MediaItem>> {
  const type = RANKING_FOR[opts.sort || 'popular'];
  const page = Math.max(1, opts.page || 1);

  if (!opts.genre) {
    const { raw, hasNext } = await ranking(type, (page - 1) * PAGE_SIZE, PAGE_SIZE);
    return { items: toItems(raw), page, hasMore: hasNext };
  }

  // A API não filtra por gênero: lê o ranking em blocos e filtra aqui ("page" = bloco).
  const hasGenre = (m: any) => (m.genres || []).some((g: any) => g.id === opts.genre);
  const collected: any[] = [];
  let chunk = page;
  let hasNext = true;
  while (chunk <= SCAN_MAX_CHUNKS) {
    const res = await ranking(type, (chunk - 1) * SCAN_CHUNK, SCAN_CHUNK);
    collected.push(...res.raw.filter(hasGenre));
    hasNext = res.hasNext;
    if (!hasNext || collected.length >= 12 || chunk - page >= 2) break;
    chunk++;
  }
  return { items: toItems(collected), page: chunk, hasMore: hasNext && chunk < SCAN_MAX_CHUNKS };
}

export async function searchManga(q: string, page = 1, { adult = false } = {}): Promise<Page<MediaItem>> {
  // A API oficial recusa buscas com menos de 3 letras.
  if (q.trim().length < 3) return { items: [], page, hasMore: false };
  const data = await mal('manga', {
    q: q.trim().slice(0, 64),
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    fields: LIST_FIELDS,
    // Títulos +18 só para maiores de idade confirmados (a rota confere).
    nsfw: adult ? 'true' : undefined,
  });
  return { items: toItems(nodes(data), { includeAdult: adult }), page, hasMore: Boolean(data?.paging?.next) };
}

/* ---------- detalhes ---------- */

const STATUS: Record<string, string> = {
  currently_publishing: 'Em publicação',
  finished: 'Finalizado',
  on_hiatus: 'Em hiato',
  discontinued: 'Cancelado',
  not_yet_published: 'Ainda não publicado',
};

export const FORMAT: Record<string, string> = {
  manga: 'Mangá',
  manhwa: 'Manhwa (Coreia)',
  manhua: 'Manhua (China)',
  novel: 'Novel',
  light_novel: 'Light novel',
  one_shot: 'One-shot',
  doujinshi: 'Doujinshi',
  oel: 'Mangá ocidental',
};

const ROLES: Record<string, string> = { 'Story & Art': 'história e arte', Story: 'história', Art: 'arte' };

function authors(list: any[] = []): string {
  return list
    .slice(0, 3)
    .map((a) => {
      const name = [a.node?.first_name, a.node?.last_name].filter(Boolean).join(' ').trim();
      const role = ROLES[a.role];
      return name ? (role && list.length > 1 ? `${name} (${role})` : name) : null;
    })
    .filter(Boolean)
    .join(', ');
}

export function normalizeMangaDetails(id: number, m: any, readLinks: Provider[] = []): MediaDetails {
  const base = toMangaItem(m);
  const facts: { label: string; value: string }[] = [];
  const push = (label: string, value: string | null | undefined) => value && facts.push({ label, value });

  push('Formato', FORMAT[m.media_type] ?? null);
  push('Lançamento', formatDate(m.start_date));
  push('Volumes', m.num_volumes ? String(m.num_volumes) : null);
  push('Capítulos', m.num_chapters ? String(m.num_chapters) : null);
  push('Autoria', authors(m.authors));
  push('Revista', (m.serialization || []).map((s: any) => s.node?.name).filter(Boolean).join(', '));
  push('Status', STATUS[m.status] || m.status);
  push('Ranking', m.rank ? `#${m.rank}` : null);

  return {
    ...base,
    originalTitle: base.title !== m.title ? m.title : m.alternative_titles?.ja || null,
    tagline: null,
    genres: (m.genres || []).filter((g: any) => !HIDDEN_GENRES.has(g.id)).map((g: any) => genreName(g.name)),
    facts,
    cast: [],
    trailerKey: null,
    providers: readLinks,
    providersLink: null,
    externalUrl: `https://myanimelist.net/manga/${id}`,
    externalLabel: 'Ver no MyAnimeList',
  };
}

const rawDetails = (id: number) => mal(`manga/${id}`, { fields: DETAILS_FIELDS });

/** Detalhes do MAL + onde ler oficialmente (AniList; vazio se ela falhar). */
export async function mangaDetails(id: number): Promise<MediaDetails> {
  const [raw, links] = await Promise.all([rawDetails(id), anilistLinks(id, 'MANGA')]);
  return normalizeMangaDetails(id, raw, links);
}

export async function mangaRecommendations(id: number): Promise<MediaItem[]> {
  const raw = await rawDetails(id);
  return toItems((raw.recommendations || []).map((r: any) => r.node)).slice(0, 20);
}
