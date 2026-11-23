import type { MediaItem, MediaType } from '../types';

/*
 * Transferência da "Minha lista" entre aparelhos, sem servidor:
 *  - link compartilhável com os IDs compactados na URL (?lista=m550.t1396.a52991);
 *  - backup em arquivo JSON, com os dados completos de cada item.
 */

const TYPE_CODE: Record<MediaType, string> = { movie: 'm', tv: 't', anime: 'a' };
const CODE_TYPE: Record<string, MediaType> = { m: 'movie', t: 'tv', a: 'anime' };
export const MAX_SHARED = 100;

export type Ref = Pick<MediaItem, 'type' | 'id'>;

export function encodeRefs(items: Ref[]): string {
  return items
    .slice(0, MAX_SHARED)
    .map((i) => `${TYPE_CODE[i.type]}${i.id}`)
    .join('.');
}

export function decodeRefs(raw: unknown): Ref[] {
  if (typeof raw !== 'string') return [];
  const seen = new Set<string>();
  const refs: Ref[] = [];
  for (const part of raw.split('.')) {
    const match = part.match(/^([mta])(\d{1,9})$/);
    if (!match || seen.has(part)) continue;
    seen.add(part);
    refs.push({ type: CODE_TYPE[match[1]], id: Number(match[2]) });
    if (refs.length >= MAX_SHARED) break;
  }
  return refs;
}

export function shareUrl(origin: string, items: Ref[]): string {
  return `${origin}/favorites?lista=${encodeRefs(items)}`;
}

/* ---------- arquivo ---------- */

interface ExportFile {
  app: 'reco-cine';
  version: 1;
  exportedAt: string;
  items: MediaItem[];
}

export function buildExport(items: MediaItem[]): string {
  const file: ExportFile = {
    app: 'reco-cine',
    version: 1,
    exportedAt: new Date().toISOString(),
    items: items.map(({ id, type, title, poster, backdrop, year, rating, overview }) => ({
      id,
      type,
      title,
      poster,
      backdrop,
      year,
      rating,
      overview,
    })),
  };
  return JSON.stringify(file, null, 2);
}

const str = (v: unknown) => (typeof v === 'string' ? v : null);

function toMediaItem(raw: any): MediaItem | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!(raw.type in TYPE_CODE) || !Number.isInteger(raw.id) || raw.id <= 0 || typeof raw.title !== 'string') return null;
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title.slice(0, 300),
    poster: str(raw.poster),
    backdrop: str(raw.backdrop),
    year: str(raw.year),
    rating: typeof raw.rating === 'number' ? raw.rating : null,
    overview: (str(raw.overview) ?? '').slice(0, 5000),
  };
}

/** Lê um backup. Lança erro com mensagem amigável se o arquivo não for válido. */
export function parseExport(text: string): MediaItem[] {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('O arquivo não é um JSON válido.');
  }
  const list = Array.isArray(data) ? data : data?.items;
  if (!Array.isArray(list)) throw new Error('Este arquivo não parece ser uma lista do Reco Cine.');
  const items = list.map(toMediaItem).filter((i): i is MediaItem => i !== null);
  if (!items.length && list.length) throw new Error('Nenhum título válido encontrado no arquivo.');
  return items;
}
