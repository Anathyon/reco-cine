import type { NextApiRequest, NextApiResponse } from 'next';
import type { AnimeSort } from '../../../lib/anime';
import { ADULT_ERRORS, checkAdult } from '../../../lib/adultServer';
import {
  MalError,
  animeCast,
  animeDetails,
  animeRecommendations,
  discoverAnime,
  malClientId,
  searchAnime,
  seasonNow,
  topAnime,
} from '../../../lib/malServer';

/**
 * Animes via API oficial do MyAnimeList.
 * O Client ID fica apenas no servidor e as respostas são cacheadas na CDN da Vercel.
 *
 *   /api/anime/season?page=          temporada atual
 *   /api/anime/top?page=&filter=     ranking (airing | bypopularity)
 *   /api/anime/discover?genre=&sort=&year=&page=
 *   /api/anime/search?q=&page=&adult=1   (+18 só com login de maior de idade)
 *   /api/anime/:id                   detalhes
 *   /api/anime/:id/recommendations
 *   /api/anime/:id/characters
 */
const SORTS = new Set<AnimeSort>(['popular', 'top', 'recent']);

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
const int = (v: unknown, min = 1, max = 10000) => {
  const n = Number(str(v));
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
};

async function route(path: string[], q: NextApiRequest['query'], adult: boolean): Promise<unknown> {
  const page = int(q.page, 1, 500) ?? 1;
  const [head, sub] = path;

  if (path.length === 1) {
    if (head === 'season') return seasonNow(page);
    if (head === 'top') {
      const filter = str(q.filter);
      return topAnime(page, filter === 'airing' || filter === 'bypopularity' ? filter : undefined);
    }
    if (head === 'search') return searchAnime(str(q.q) || '', page, { adult });
    if (head === 'discover') {
      const sort = str(q.sort) as AnimeSort | undefined;
      return discoverAnime({
        page,
        genre: int(q.genre),
        year: int(q.year, 1900, 2100),
        sort: sort && SORTS.has(sort) ? sort : undefined,
      });
    }
  }

  const id = /^\d{1,9}$/.test(head ?? '') ? Number(head) : null;
  if (id) {
    if (path.length === 1) return animeDetails(id);
    if (path.length === 2 && sub === 'recommendations') return animeRecommendations(id);
    if (path.length === 2 && sub === 'characters') return animeCast(id);
  }
  return undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido' });
  }
  if (!malClientId()) {
    return res.status(500).json({ error: 'Client ID do MyAnimeList não configurado no servidor' });
  }

  const segments = req.query.path;
  const path = Array.isArray(segments) ? segments : segments ? [segments] : [];

  const adult = req.query.adult === '1' && path.length === 1 && path[0] === 'search';
  if (adult) {
    const check = await checkAdult(req);
    if (check !== 'ok') return res.status(ADULT_ERRORS[check].status).json({ error: ADULT_ERRORS[check].error });
  }

  try {
    const body = await route(path, req.query, adult);
    if (body === undefined) return res.status(400).json({ error: 'Rota não permitida' });
    // Listas vazias (ex.: personagens quando a Jikan está fora) ficam pouco tempo no cache.
    const empty = Array.isArray(body) && body.length === 0;
    res.setHeader(
      'Cache-Control',
      adult ? 'private, no-store' : `public, s-maxage=${empty ? 300 : 3600}, stale-while-revalidate=86400`,
    );
    return res.status(200).json(body);
  } catch (err) {
    if (err instanceof MalError && err.status === 404) return res.status(404).json({ error: 'Anime não encontrado' });
    return res.status(502).json({ error: 'Falha ao consultar o MyAnimeList' });
  }
}
