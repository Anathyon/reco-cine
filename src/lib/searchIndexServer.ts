/*
 * Índice de títulos e pessoas populares para a busca tolerante a erros.
 * SOMENTE no servidor. Montado sob demanda, guardado em memória e na CDN
 * (rota /api/search/index), e enviado ao navegador, que faz a busca aproximada.
 */
import type { IndexEntry, IndexKind } from './fuzzy';
import { mal, malClientId } from './malServer';
import { tmdbApiKey, tmdbServer } from './tmdbServer';

const TTL_MS = 12 * 60 * 60 * 1000;
let cached: { at: number; entries: IndexEntry[] } | null = null;
let building: Promise<IndexEntry[]> | null = null;

/** Executa tarefas com no máximo `limit` ao mesmo tempo (respeita o limite das APIs). */
async function pool<T>(tasks: (() => Promise<T>)[], limit = 8): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, async () => {
      while (next < tasks.length) {
        const i = next++;
        results[i] = await tasks[i]();
      }
    }),
  );
  return results;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const round1 = (n: unknown) => (typeof n === 'number' && n > 0 ? Math.round(n * 10) / 10 : undefined);
const yearOf = (date: unknown) => (typeof date === 'string' && date.length >= 4 ? date.slice(0, 4) : undefined);

function fromTmdb(raw: any, fallback?: IndexKind): IndexEntry | null {
  const k: IndexKind | undefined =
    raw.media_type === 'movie' || raw.media_type === 'tv' || raw.media_type === 'person' ? raw.media_type : fallback;
  if (!k || !raw.id) return null;

  if (k === 'person') {
    if (!raw.name) return null;
    const knownFor = (raw.known_for || [])
      .map((w: any) => w.title || w.name)
      .filter(Boolean)
      .slice(0, 2)
      .join(', ');
    return { k, id: raw.id, t: raw.name, p: raw.profile_path || undefined, d: knownFor || undefined };
  }

  const t = raw.title || raw.name;
  if (!t) return null;
  const o = raw.original_title || raw.original_name;
  return {
    k,
    id: raw.id,
    t,
    o: o && o !== t ? o : undefined,
    y: yearOf(raw.release_date || raw.first_air_date),
    p: raw.poster_path || undefined,
    r: raw.vote_count > 0 ? round1(raw.vote_average) : undefined,
  };
}

function fromMal(a: any): IndexEntry | null {
  if (!a?.id || !a.title) return null;
  const en = a.alternative_titles?.en;
  return {
    k: 'anime',
    id: a.id,
    t: en || a.title,
    o: en && en !== a.title ? a.title : undefined,
    y: a.start_season?.year ? String(a.start_season.year) : yearOf(a.start_date),
    p: a.main_picture?.large || a.main_picture?.medium || undefined,
    r: round1(a.mean),
  };
}

async function tmdbPages(path: string, pages: number, fallback?: IndexKind): Promise<IndexEntry[]> {
  const results = await pool(
    range(pages).map((page) => () => tmdbServer(path, { page }, 10000).catch(() => ({ results: [] }))),
  );
  return results.flatMap((data: any) => (data.results || []).map((r: any) => fromTmdb(r, fallback)).filter(Boolean));
}

async function malRanking(type: string, chunks: number): Promise<IndexEntry[]> {
  const results = await pool(
    range(chunks).map(
      (chunk) => () =>
        mal('anime/ranking', { ranking_type: type, offset: (chunk - 1) * 500, limit: 500, fields: 'alternative_titles,mean,start_season,start_date' }, 15000).catch(
          () => ({ data: [] }),
        ),
    ),
    3,
  );
  return results.flatMap((data: any) => (data.data || []).map((d: any) => fromMal(d.node)).filter(Boolean));
}

export async function buildSearchIndex(): Promise<IndexEntry[]> {
  const sources: Promise<IndexEntry[]>[] = [];
  if (tmdbApiKey()) {
    sources.push(
      tmdbPages('trending/all/week', 5),
      tmdbPages('movie/popular', 40, 'movie'),
      tmdbPages('tv/popular', 35, 'tv'),
      tmdbPages('person/popular', 25, 'person'),
      tmdbPages('movie/top_rated', 15, 'movie'),
      tmdbPages('tv/top_rated', 15, 'tv'),
    );
  }
  if (malClientId()) sources.push(malRanking('bypopularity', 3));

  // Intercala as fontes para manter os mais populares de cada uma no topo.
  const lists = await Promise.all(sources);
  const seen = new Set<string>();
  const entries: IndexEntry[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      const e = list[i];
      if (!e) continue;
      const key = `${e.k}-${e.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push(e);
    }
  }
  return entries;
}

export async function getSearchIndex(): Promise<IndexEntry[]> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.entries;
  if (!building) {
    building = buildSearchIndex()
      .then((entries) => {
        if (entries.length) cached = { at: Date.now(), entries };
        return entries;
      })
      .finally(() => {
        building = null;
      });
  }
  return building;
}
