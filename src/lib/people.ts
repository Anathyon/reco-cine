/*
 * Pessoas (atores, diretores...) do TMDB: busca e página com a filmografia.
 * A normalização é usada no navegador e no servidor (página /person/[id]).
 */
import type { MediaItem, Page } from '../types';
import { formatDate, uniqueBy } from './format';
import { request, tmdbImage, toItem } from './tmdb';

export interface PersonSummary {
  id: number;
  name: string;
  photo: string | null;
  department: string | null;
  /** Títulos pelos quais é conhecida (ex.: "Titanic, A Origem"). */
  knownFor: string;
}

export interface Credit extends MediaItem {
  /** Personagem ou função (ex.: "Jack Dawson", "Direção"). */
  role: string;
}

export interface PersonDetails extends PersonSummary {
  biography: string;
  facts: { label: string; value: string }[];
  acting: Credit[];
  crew: Credit[];
  externalUrl: string;
}

const DEPARTMENTS: Record<string, string> = {
  Acting: 'Atuação',
  Directing: 'Direção',
  Writing: 'Roteiro',
  Production: 'Produção',
  Sound: 'Som',
  Camera: 'Fotografia',
  Editing: 'Edição',
  Art: 'Arte',
  Crew: 'Equipe técnica',
  'Visual Effects': 'Efeitos visuais',
  'Costume & Make-Up': 'Figurino e maquiagem',
  Lighting: 'Iluminação',
  Creator: 'Criação',
};

const JOBS: Record<string, string> = {
  Director: 'Direção',
  Screenplay: 'Roteiro',
  Writer: 'Roteiro',
  Story: 'Argumento',
  Novel: 'Livro original',
  Producer: 'Produção',
  'Executive Producer': 'Produção executiva',
  Creator: 'Criação',
  'Original Music Composer': 'Trilha sonora',
  'Director of Photography': 'Direção de fotografia',
};

export const departmentName = (dep?: string | null) => (dep ? DEPARTMENTS[dep] ?? dep : null);

export function toPersonSummary(raw: any): PersonSummary {
  return {
    id: raw.id,
    name: raw.name,
    photo: tmdbImage(raw.profile_path, 'w185'),
    department: departmentName(raw.known_for_department),
    knownFor: (raw.known_for || [])
      .map((w: any) => w.title || w.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(', '),
  };
}

/** Talk shows, jornais e reality shows em que a pessoa aparece como ela mesma. */
const APPEARANCE_GENRES = new Set([10763, 10764, 10767]);
const SELF = /\b(self|himself|herself|themselves|host|narrator|apresentador|ele mesmo|ela mesma)\b/i;

function credits(list: any[], role: (c: any) => string, keepAppearances: boolean): Credit[] {
  const items = list
    .filter((c) => c.media_type === 'movie' || c.media_type === 'tv')
    .filter((c) => keepAppearances || !(c.genre_ids || []).some((g: number) => APPEARANCE_GENRES.has(g)))
    .filter((c) => keepAppearances || !SELF.test(c.character || ''))
    .sort((a, b) => (b.vote_count || 0) * 0.3 + (b.popularity || 0) - ((a.vote_count || 0) * 0.3 + (a.popularity || 0)))
    .map((c) => {
      const item = toItem(c);
      return item ? { ...item, role: role(c) } : null;
    })
    .filter(Boolean) as Credit[];

  // A mesma obra aparece várias vezes (um registro por função/temporada): junta as funções.
  const merged = new Map<string, Credit>();
  for (const c of items) {
    const key = `${c.type}-${c.id}`;
    const prev = merged.get(key);
    if (!prev) merged.set(key, c);
    else if (c.role && !prev.role.split(', ').includes(c.role)) prev.role = [prev.role, c.role].filter(Boolean).join(', ');
  }
  return [...merged.values()];
}

export function normalizePerson(raw: any): PersonDetails {
  const summary = toPersonSummary({ ...raw, known_for: [] });
  const cast: any[] = raw.combined_credits?.cast || [];
  const crew: any[] = raw.combined_credits?.crew || [];

  const acting = credits(cast, (c) => c.character || '', false);
  const crewCredits = credits(
    crew.filter((c) => JOBS[c.job]),
    (c) => JOBS[c.job],
    true,
  );

  const facts: { label: string; value: string }[] = [];
  const push = (label: string, value: string | null | undefined) => value && facts.push({ label, value });
  push('Conhecido(a) por', summary.department);
  push('Nascimento', formatDate(raw.birthday));
  push('Local de nascimento', raw.place_of_birth);
  push('Falecimento', formatDate(raw.deathday));

  const best = (summary.department === 'Atuação' ? acting : crewCredits.length ? crewCredits : acting).slice(0, 3);
  return {
    ...summary,
    photo: tmdbImage(raw.profile_path, 'w500'),
    knownFor: best.map((c) => c.title).join(', '),
    biography: (raw.biography || '').trim(),
    facts,
    acting,
    crew: uniqueBy(crewCredits, (c) => `${c.type}-${c.id}`),
    externalUrl: `https://www.themoviedb.org/person/${raw.id}`,
  };
}

export const PERSON_PARAMS = { append_to_response: 'combined_credits' };

export async function searchPeople(query: string, page = 1, adult = false): Promise<Page<PersonSummary>> {
  const data = await request('search/person', { query, page }, undefined, adult);
  return {
    items: uniqueBy((data.results || []).map(toPersonSummary), (p: PersonSummary) => p.id),
    page: data.page || 1,
    hasMore: (data.page || 1) < Math.min(data.total_pages || 1, 500),
  };
}

export async function getPerson(id: number): Promise<PersonDetails> {
  return normalizePerson(await request(`person/${id}`, PERSON_PARAMS));
}

export const personHref = (id: number) => `/person/${id}`;
