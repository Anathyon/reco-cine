export function yearOf(date?: string | null): string | null {
  if (!date) return null;
  const year = date.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

export function formatDate(date?: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function formatRuntime(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export function formatRating(rating?: number | null): string | null {
  if (rating == null || rating <= 0) return null;
  return rating.toFixed(1);
}

export function ratingColor(rating?: number | null): string {
  if (rating == null) return 'text-zinc-400';
  if (rating >= 7.5) return 'text-emerald-400';
  if (rating >= 6) return 'text-amber-400';
  return 'text-rose-400';
}

export function uniqueBy<T>(items: T[], key: (item: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const LANGUAGES: Record<string, string> = {
  en: 'Inglês', pt: 'Português', es: 'Espanhol', fr: 'Francês', ja: 'Japonês', ko: 'Coreano',
  zh: 'Chinês', de: 'Alemão', it: 'Italiano', hi: 'Hindi', ru: 'Russo', sv: 'Sueco', da: 'Dinamarquês',
  no: 'Norueguês', tr: 'Turco', th: 'Tailandês', pl: 'Polonês', nl: 'Holandês',
};

export function languageName(code?: string | null): string | null {
  if (!code) return null;
  return LANGUAGES[code] ?? code.toUpperCase();
}
