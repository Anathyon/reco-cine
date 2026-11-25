/* Somente servidor (getStaticProps). */
import type { MediaDetails, MediaType } from '../types';
import { animeDetails } from './malServer';
import { mangaDetails } from './mangaServer';
import { getTmdbDetailsServer } from './tmdbServer';

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Tempo esgotado (${ms} ms)`)), ms)),
  ]);
}

/**
 * Detalhes para renderizar no servidor. Retorna `null` quando o título não existe
 * (404) e lança erro em falhas temporárias, para a página cair no carregamento do cliente.
 */
export async function getDetailsServer(type: MediaType, id: number): Promise<MediaDetails | null> {
  try {
    const load = type === 'anime' ? animeDetails(id) : type === 'manga' ? mangaDetails(id) : getTmdbDetailsServer(type, id);
    return await withTimeout(load, 8000);
  } catch (err) {
    const status = (err as { status?: number }).status;
    const message = err instanceof Error ? err.message : '';
    if (status === 404 || /\b404\b/.test(message)) return null;
    throw err;
  }
}

/** URL pública do site, para links absolutos (Open Graph). */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : 'http://localhost:3000';
}
