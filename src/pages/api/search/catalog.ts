import type { NextApiRequest, NextApiResponse } from 'next';
import { getSearchIndex } from '../../../lib/searchIndexServer';

/**
 * Índice de títulos e pessoas populares, usado pela busca tolerante a erros.
 * É montado uma vez e fica um dia em cache na CDN.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido' });
  }
  try {
    const entries = await getSearchIndex();
    res.setHeader(
      'Cache-Control',
      entries.length ? 'public, s-maxage=86400, stale-while-revalidate=604800' : 'public, s-maxage=60',
    );
    return res.status(200).json(entries);
  } catch {
    return res.status(502).json({ error: 'Não foi possível montar o índice de busca' });
  }
}
