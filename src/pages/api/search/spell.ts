import type { NextApiRequest, NextApiResponse } from 'next';
import { spellSuggestion } from '../../../lib/translateServer';

/** Sugestão de grafia ("Você quis dizer…") para buscas que não acharam nada. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido' });
  }
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  if (q.length < 2) return res.status(400).json({ error: 'Busca muito curta' });

  try {
    const suggestion = await spellSuggestion(q);
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ suggestion });
  } catch {
    // Sem sugestão não é erro para quem busca.
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.status(200).json({ suggestion: null });
  }
}
