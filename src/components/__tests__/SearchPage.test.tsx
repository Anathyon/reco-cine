import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import SearchPage from '../../pages/search';
import { searchTmdb, getTrending } from '../../lib/tmdb';
import { searchAnime } from '../../lib/anime';
import { searchPeople } from '../../lib/people';
import { fetchSpellSuggestion } from '../../lib/searchIndex';
import { makeItem, makeRouter } from '../../test/utils';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../hooks/useDetailsRoute', () => ({ useDetailsRoute: () => ({ open: jest.fn() }) }));
jest.mock('../../lib/tmdb', () => ({ ...jest.requireActual('../../lib/tmdb'), searchTmdb: jest.fn(), getTrending: jest.fn() }));
jest.mock('../../lib/anime', () => ({ searchAnime: jest.fn() }));
jest.mock('../../lib/people', () => ({ ...jest.requireActual('../../lib/people'), searchPeople: jest.fn() }));
jest.mock('../../lib/searchIndex', () => ({
  ...jest.requireActual('../../lib/searchIndex'),
  loadSearchIndex: () =>
    Promise.resolve(
      jest.requireActual('../../lib/fuzzy').createFuzzyIndex([
        { k: 'tv', id: 1402, t: 'The Walking Dead', y: '2010', p: '/twd.jpg' },
        { k: 'movie', id: 597, t: 'Titanic', y: '1997' },
        { k: 'person', id: 287, t: 'Brad Pitt' },
      ]),
    ),
  fetchSpellSuggestion: jest.fn(),
}));

const page = (items: unknown[]) => ({ items, page: 1, hasMore: false });
const twd = makeItem({ id: 1402, type: 'tv', title: 'The Walking Dead' });

// Cada teste usa um termo diferente: o cache de buscas é global.
function renderSearch(q: string) {
  const router = makeRouter({ pathname: '/search', query: { q } });
  (useRouter as jest.Mock).mockReturnValue(router);
  render(<SearchPage />);
  return router;
}

beforeEach(() => {
  jest.clearAllMocks();
  window.scrollTo = jest.fn();
  (getTrending as jest.Mock).mockResolvedValue(page([]));
  (searchAnime as jest.Mock).mockResolvedValue(page([]));
  (searchPeople as jest.Mock).mockResolvedValue(page([]));
  (fetchSpellSuggestion as jest.Mock).mockResolvedValue(null);
});

it('sem resultados, corrige a grafia sozinho e busca de novo', async () => {
  (searchTmdb as jest.Mock).mockImplementation((_t: string, q: string) =>
    Promise.resolve(page(q === 'The Walking Dead' ? [twd] : [])),
  );
  renderSearch('the wolking ded');

  expect(await screen.findByText(/Nenhum resultado para “the wolking ded”. Mostrando resultados para/)).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: /The Walking Dead/ })).toBeInTheDocument();
});

it('com resultados, sugere "Você quis dizer" e troca a busca ao clicar', async () => {
  (searchTmdb as jest.Mock).mockResolvedValue(page([makeItem({ id: 5, title: 'Titanik: o documentário' })]));
  const router = renderSearch('titanik');

  const suggestion = await screen.findByRole('button', { name: 'Titanic' });
  expect(suggestion.parentElement).toHaveTextContent('Você quis dizer Titanic?');
  fireEvent.click(suggestion);
  expect(router.replace).toHaveBeenCalledWith({ pathname: '/search', query: { q: 'Titanic' } }, undefined, expect.anything());
});

it('usa a sugestão do Google quando o índice não sabe corrigir', async () => {
  (fetchSpellSuggestion as jest.Mock).mockResolvedValue('harry potter e a pedra filosofal');
  (searchTmdb as jest.Mock).mockImplementation((_t: string, q: string) =>
    Promise.resolve(page(q.startsWith('harry potter') ? [makeItem({ id: 671, title: 'Harry Potter e a Pedra Filosofal' })] : [])),
  );
  renderSearch('hary poter pedra');

  expect(await screen.findByText(/Mostrando resultados para/)).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: /Harry Potter e a Pedra Filosofal/ })).toBeInTheDocument();
});

it('nada encontrado: mostra títulos parecidos do índice', async () => {
  (searchTmdb as jest.Mock).mockResolvedValue(page([]));
  renderSearch('walking dead xyzw');
  expect(await screen.findByText('Nada encontrado para “walking dead xyzw”')).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'Talvez você esteja procurando' })).toBeInTheDocument();
});

it('pessoas aparecem primeiro quando o nome bate com a busca', async () => {
  (searchTmdb as jest.Mock).mockResolvedValue(page([makeItem({ id: 1, title: 'Clube da Luta' })]));
  (searchPeople as jest.Mock).mockResolvedValue(
    page([{ id: 287, name: 'Brad Pitt', photo: null, department: 'Atuação', knownFor: 'Clube da Luta' }]),
  );
  renderSearch('brad pitt');

  const person = await screen.findByRole('link', { name: 'Brad Pitt — ver filmografia' });
  expect(person).toHaveAttribute('href', '/person/287');
  const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(headings.indexOf('Pessoas')).toBeLessThan(headings.indexOf('Filmes'));
});
