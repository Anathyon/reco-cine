import { normalizePerson, toPersonSummary } from '../people';

it('resumo da pessoa traduz a área e lista por quais títulos é conhecida', () => {
  expect(
    toPersonSummary({
      id: 6193,
      name: 'Leonardo DiCaprio',
      profile_path: '/leo.jpg',
      known_for_department: 'Acting',
      known_for: [{ title: 'Titanic' }, { title: 'A Origem' }, { name: 'Série X' }, { title: 'Outro' }],
    }),
  ).toEqual({
    id: 6193,
    name: 'Leonardo DiCaprio',
    photo: 'https://image.tmdb.org/t/p/w185/leo.jpg',
    department: 'Atuação',
    knownFor: 'Titanic, A Origem, Série X',
  });
});

describe('normalizePerson', () => {
  const raw = {
    id: 1,
    name: 'Fulana',
    known_for_department: 'Directing',
    birthday: '1970-05-01',
    biography: '',
    combined_credits: {
      cast: [
        { id: 10, media_type: 'movie', title: 'Pequeno', popularity: 1, vote_count: 10, character: 'Ana' },
        { id: 11, media_type: 'movie', title: 'Grande', popularity: 90, vote_count: 9000, character: 'Bia' },
        { id: 12, media_type: 'tv', name: 'Talk Show', popularity: 99, genre_ids: [10767], character: 'Self' },
        { id: 13, media_type: 'tv', name: 'Série', popularity: 50, character: 'Self - Guest' },
      ],
      crew: [
        { id: 20, media_type: 'movie', title: 'Dirigido', popularity: 40, job: 'Director' },
        { id: 20, media_type: 'movie', title: 'Dirigido', popularity: 40, job: 'Screenplay' },
        { id: 21, media_type: 'movie', title: 'Iluminado', popularity: 80, job: 'Gaffer' },
      ],
    },
  };

  it('ordena por relevância e tira aparições como "ela mesma"', () => {
    const p = normalizePerson(raw);
    expect(p.acting.map((c) => c.title)).toEqual(['Grande', 'Pequeno']);
    expect(p.acting[0].role).toBe('Bia');
  });

  it('junta as funções da mesma obra e ignora funções técnicas menores', () => {
    const p = normalizePerson(raw);
    expect(p.crew).toEqual([expect.objectContaining({ id: 20, role: 'Direção, Roteiro' })]);
  });

  it('ficha e "conhecida por" seguem a área principal', () => {
    const p = normalizePerson(raw);
    expect(p.department).toBe('Direção');
    expect(p.knownFor).toBe('Dirigido');
    expect(p.facts).toEqual(expect.arrayContaining([{ label: 'Conhecido(a) por', value: 'Direção' }]));
    expect(p.externalUrl).toBe('https://www.themoviedb.org/person/1');
  });
});
