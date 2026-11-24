import type { NextApiRequest, NextApiResponse } from 'next';
import { isLanguage, sourceText, translateText, type TranslatableType } from '../../../../lib/translateServer';

const TYPES = new Set<TranslatableType>(['movie', 'tv', 'anime', 'person']);

/**
 * Sinopse (ou biografia) traduzida para o idioma pedido.
 *   /api/translate/anime/52991?to=pt
 * O texto original é buscado aqui no servidor; as traduções ficam 30 dias em cache.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const type = req.query.type as TranslatableType;
  const id = Number(req.query.id);
  const to = typeof req.query.to === 'string' && isLanguage(req.query.to) ? req.query.to : 'pt';
  if (!TYPES.has(type) || !Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Rota não permitida' });

  let original: string;
  try {
    original = await sourceText(type, id);
  } catch (err) {
    const status = (err as { status?: number }).status;
    return res.status(status === 404 ? 404 : 502).json({ error: 'Não foi possível obter o texto original' });
  }
  if (!original) {
    res.setHeader('Cache-Control', 'public, s-maxage=86400');
    return res.status(200).json({ text: '', original: '', from: null, to, translated: false });
  }

  try {
    const result = await translateText(original, to);
    res.setHeader('Cache-Control', 'public, s-maxage=2592000, stale-while-revalidate=2592000');
    return res.status(200).json(result);
  } catch {
    // Tradutor indisponível: devolve o original, com cache curto para tentar de novo logo.
    res.setHeader('Cache-Control', 'public, s-maxage=600');
    return res.status(200).json({ text: original, original, from: null, to, translated: false, unavailable: true });
  }
}
