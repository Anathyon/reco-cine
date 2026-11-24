/* Tradução automática de sinopses/biografias, vista pelo navegador. */
import { ApiError } from './tmdb';

export interface Translation {
  text: string;
  original: string;
  from: string | null;
  to: string;
  translated: boolean;
  unavailable?: boolean;
}

/** Idioma do navegador da pessoa ("pt-BR" → "pt"). A interface é em português, então esse é o padrão. */
export function userLanguage(): string {
  if (typeof navigator === 'undefined') return 'pt';
  const lang = (navigator.languages?.[0] || navigator.language || 'pt').toLowerCase();
  // O tradutor distingue os dois chineses; nos demais idiomas basta a parte principal.
  if (lang.startsWith('zh')) return lang.includes('tw') || lang.includes('hk') || lang.includes('hant') ? 'zh-TW' : 'zh-CN';
  return lang.split('-')[0];
}

/** Nome do idioma em português ("en" → "inglês"). */
export function languageLabel(code: string | null | undefined): string | null {
  if (!code || code === 'auto') return null;
  try {
    return new Intl.DisplayNames(['pt-BR'], { type: 'language' }).of(code)?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export async function getTranslation(type: 'movie' | 'tv' | 'anime' | 'person', id: number, to = userLanguage()): Promise<Translation> {
  const res = await fetch(`/api/translate/${type}/${id}?to=${encodeURIComponent(to)}`);
  if (!res.ok) throw new ApiError('Não foi possível traduzir agora.');
  return res.json();
}
