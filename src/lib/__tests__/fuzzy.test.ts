import { createFuzzyIndex, didYouMean, editDistance, normalize, type IndexEntry } from '../fuzzy';

const ENTRIES: IndexEntry[] = [
  { k: 'tv', id: 1402, t: 'The Walking Dead' },
  { k: 'movie', id: 671, t: 'Harry Potter e a Pedra Filosofal', o: "Harry Potter and the Philosopher's Stone" },
  { k: 'tv', id: 1429, t: 'Ataque dos Titãs', o: '進撃の巨人' },
  { k: 'anime', id: 16498, t: 'Attack on Titan', o: 'Shingeki no Kyojin' },
  { k: 'person', id: 6193, t: 'Leonardo DiCaprio', d: 'Titanic, A Origem' },
  { k: 'movie', id: 557, t: 'Homem-Aranha', o: 'Spider-Man' },
  { k: 'movie', id: 155, t: 'Batman: O Cavaleiro das Trevas', o: 'The Dark Knight' },
  { k: 'movie', id: 597, t: 'Titanic' },
  { k: 'tv', id: 1396, t: 'Breaking Bad' },
  { k: 'anime', id: 20, t: 'Naruto' },
  { k: 'anime', id: 1735, t: 'Naruto: Shippuden', o: 'Naruto: Shippuuden' },
  { k: 'person', id: 287, t: 'Brad Pitt' },
  { k: 'movie', id: 129, t: 'A Viagem de Chihiro', o: '千と千尋の神隠し' },
];

const index = createFuzzyIndex(ENTRIES);
const top = (q: string) => index.search(q)[0];

describe('normalize', () => {
  it('ignora acentos, maiúsculas e pontuação', () => {
    expect(normalize('Ataque dos Titãs!')).toBe('ataque dos titas');
    expect(normalize("Harry Potter and the Philosopher's Stone")).toBe('harry potter and the philosophers stone');
  });
});

it('editDistance conta trocas, faltas, sobras e inversões', () => {
  expect(editDistance('potter', 'poter')).toBe(1);
  expect(editDistance('walking', 'wolking')).toBe(1);
  expect(editDistance('dead', 'daed')).toBe(1); // inversão
  expect(editDistance('abc', 'xyz', 1)).toBe(2); // corte
});

it.each([
  ['the wolking ded', 'The Walking Dead'],
  ['harry poter e a pedra filosofal', 'Harry Potter e a Pedra Filosofal'],
  ['atake dos titans', 'Ataque dos Titãs'],
  ['leonardo dicapro', 'Leonardo DiCaprio'],
  ['leonardo di caprio', 'Leonardo DiCaprio'],
  ['spiderman', 'Homem-Aranha'],
  ['braking bad', 'Breaking Bad'],
  ['naruto shipuden', 'Naruto: Shippuden'],
  ['titanik', 'Titanic'],
  ['brad pit', 'Brad Pitt'],
  ['shingeki no kyojim', 'Attack on Titan'],
  ['viagem de chiriro', 'A Viagem de Chihiro'],
])('"%s" → %s', (query, title) => {
  expect(top(query)?.entry.t).toBe(title);
});

it('completa enquanto a pessoa digita', () => {
  expect(top('harry pott')).toMatchObject({ kind: 'prefix', entry: { id: 671 } });
  expect(top('breaking b')?.entry.t).toBe('Breaking Bad');
});

it('completa com um erro enquanto digita', () => {
  expect(top('harry pottr')?.entry.id).toBe(671);
});

it('não inventa correspondências para palavras sem relação', () => {
  expect(createFuzzyIndex([{ k: 'anime', id: 1, t: 'Gatchaman Crowds' }]).search('gotham')).toEqual([]);
  expect(index.search('xyzabc')).toEqual([]);
  expect(index.search('a')).toEqual([]);
});

it('filtra por tipo', () => {
  expect(index.search('titanic', { kinds: ['person'] })).toEqual([]);
});

describe('didYouMean', () => {
  it('sugere quando houve erro de digitação', () => {
    expect(didYouMean(index, 'the wolking ded')?.name).toBe('The Walking Dead');
  });

  it('não sugere quando a busca já está certa ou é só incompleta', () => {
    expect(didYouMean(index, 'Breaking Bad')).toBeNull();
    expect(didYouMean(index, 'breaking')).toBeNull();
    expect(didYouMean(index, 'harry pott')).toBeNull();
  });
});
