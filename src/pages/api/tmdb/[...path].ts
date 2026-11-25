import type { NextApiRequest, NextApiResponse } from 'next';
import { ADULT_ERRORS, checkAdult } from '../../../lib/adultServer';
import { ALLOWED_PATH, tmdbApiKey, upstreamUrl } from '../../../lib/tmdbServer';

/**
 * Proxy para a API do TMDB.
 * A chave fica apenas no servidor (não vai para o bundle do navegador) e
 * as respostas são cacheadas na CDN da Vercel.
 *
 * Aceita TMDB_API_KEY ou, por compatibilidade, NEXT_PUBLIC_TMDB_API_KEY.
 *
 * Conteúdo adulto: quem decide é o servidor, não o navegador. As buscas só
 * incluem títulos +18 com `adult=1` E login de alguém com 18 anos ou mais
 * (ver adultServer.ts); essas respostas não ficam no cache público.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido' });
  }

  if (!tmdbApiKey()) {
    return res.status(500).json({ error: 'Chave do TMDB não configurada no servidor' });
  }

  const segments = req.query.path;
  const path = Array.isArray(segments) ? segments.join('/') : segments ?? '';
  if (!ALLOWED_PATH.test(path)) {
    return res.status(400).json({ error: 'Rota não permitida' });
  }

  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path' && key !== 'adult' && key !== 'include_adult' && typeof value === 'string') params[key] = value;
  }

  const adult = req.query.adult === '1' && path.startsWith('search/');
  if (adult) {
    const check = await checkAdult(req);
    if (check !== 'ok') return res.status(ADULT_ERRORS[check].status).json({ error: ADULT_ERRORS[check].error });
  }
  if (/^(search|discover)\//.test(path)) params.include_adult = adult ? 'true' : 'false';

  try {
    const upstream = await fetch(upstreamUrl(path, params), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (adult) res.setHeader('Cache-Control', 'private, no-store');
    else if (upstream.ok) res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.send(body);
  } catch {
    return res.status(502).json({ error: 'Falha ao contatar o TMDB' });
  }
}
