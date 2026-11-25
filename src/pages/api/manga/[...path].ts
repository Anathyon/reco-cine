import type { NextApiRequest, NextApiResponse } from 'next';
import { ADULT_ERRORS, checkAdult } from '../../../lib/adultServer';
import { MalError, malClientId } from '../../../lib/malServer';
import { discoverManga, mangaDetails, mangaRecommendations, searchManga, type MangaSort } from '../../../lib/mangaServer';

/**
 * Mangás via API oficial do MyAnimeList (Client ID só no servidor, respostas na CDN).
 *
 *   /api/manga/discover?genre=&sort=&page=
 *   /api/manga/search?q=&page=&adult=1   (+18 só com login de maior de idade)
 *   /api/manga/:id
 *   /api/manga/:id/recommendations
 */
const SORTS = new Set<MangaSort>(['popular', 'top']);

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
const int = (v: unknown, min = 1, max = 10000) => {
  const n = Number(str(v));
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
};

async function route(path: string[], q: NextApiRequest['query'], adult: boolean): Promise<unknown> {
  const page = int(q.page, 1, 500) ?? 1;
  const [head, sub] = path;

  if (path.length === 1) {
    if (head === 'search') return searchManga(str(q.q) || '', page, { adult });
    if (head === 'discover') {
      const sort = str(q.sort) as MangaSort | undefined;
      return discoverManga({ page, genre: int(q.genre), sort: sort && SORTS.has(sort) ? sort : undefined });
    }
  }

  const id = /^\d{1,9}$/.test(head ?? '') ? Number(head) : null;
  if (id) {
    if (path.length === 1) return mangaDetails(id);
    if (path.length === 2 && sub === 'recommendations') return mangaRecommendations(id);
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
    res.setHeader('Cache-Control', adult ? 'private, no-store' : 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(body);
  } catch (err) {
    if (err instanceof MalError && err.status === 404) return res.status(404).json({ error: 'Mangá não encontrado' });
    return res.status(502).json({ error: 'Falha ao consultar o MyAnimeList' });
  }
}
