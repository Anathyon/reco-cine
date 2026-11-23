import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import DetailsModal from '../media/DetailsModal';
import { getAnimeCharacters, getDetails, getSimilar } from '../../lib/media';
import { useFavoritesStore } from '../../store/favoritesStore';
import { makeItem, makeRouter } from '../../test/utils';
import type { MediaDetails } from '../../types';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../lib/media', () => ({
  ...jest.requireActual('../../lib/media'),
  getDetails: jest.fn(),
  getSimilar: jest.fn(),
  getAnimeCharacters: jest.fn(),
}));

const details: MediaDetails = {
  ...makeItem(),
  originalTitle: 'Fight Club',
  tagline: 'Mischief. Mayhem. Soap.',
  genres: ['Drama', 'Suspense'],
  facts: [
    { label: 'Duração', value: '2h 19min' },
    { label: 'Direção', value: 'David Fincher' },
  ],
  cast: [{ id: 1, name: 'Edward Norton', role: 'Narrador', photo: null }],
  trailerKey: 'abc123',
  providers: [{ name: 'Netflix', logo: null }],
  providersLink: 'https://www.themoviedb.org/movie/550/watch?locale=BR',
  externalUrl: 'https://www.themoviedb.org/movie/550',
  externalLabel: 'Ver no TMDB',
};

let router: ReturnType<typeof makeRouter>;
let idCounter = 1000;

function renderModal(overrides: Partial<MediaDetails> = {}) {
  // id único por teste: o hook de dados guarda cache por chave.
  const id = ++idCounter;
  (getDetails as jest.Mock).mockResolvedValue({ ...details, id, ...overrides });
  (getSimilar as jest.Mock).mockResolvedValue([makeItem({ id: 680, title: 'Pulp Fiction' })]);
  router = makeRouter({ pathname: '/movies', query: { view: `${overrides.type ?? 'movie'}-${id}`, genre: '18' } });
  (useRouter as jest.Mock).mockReturnValue(router);
  return render(<DetailsModal />);
}

beforeEach(() => useFavoritesStore.setState({ items: {} }));

it('não renderiza nada sem ?view na URL', () => {
  (useRouter as jest.Mock).mockReturnValue(makeRouter());
  render(<DetailsModal />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('mostra os detalhes completos do título', async () => {
  renderModal();
  expect(await screen.findByRole('heading', { name: 'Clube da Luta' })).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  expect(screen.getByText('Fight Club')).toBeInTheDocument();
  expect(screen.getByText('David Fincher')).toBeInTheDocument();
  expect(screen.getAllByText('Edward Norton').length).toBeGreaterThan(0);
  expect(screen.getByText('Narrador')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Netflix/ })).toHaveAttribute('href', details.providersLink);
  expect(await screen.findByText('Pulp Fiction')).toBeInTheDocument();
});

it('abre e fecha o trailer embutido', async () => {
  renderModal();
  fireEvent.click(await screen.findByRole('button', { name: 'Assistir trailer' }));
  expect(screen.getByTitle('Trailer de Clube da Luta')).toHaveAttribute(
    'src',
    expect.stringContaining('youtube-nocookie.com/embed/abc123'),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Fechar trailer' }));
  expect(screen.queryByTitle('Trailer de Clube da Luta')).not.toBeInTheDocument();
});

it('esconde o botão de trailer quando não existe', async () => {
  renderModal({ trailerKey: null });
  await screen.findByRole('heading', { name: 'Clube da Luta' });
  expect(screen.queryByRole('button', { name: 'Assistir trailer' })).not.toBeInTheDocument();
});

it('fecha com Esc e com o botão, mantendo os filtros da página', async () => {
  renderModal();
  await screen.findByRole('heading', { name: 'Clube da Luta' });

  fireEvent.keyDown(window, { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Fechar detalhes' }));
  expect(router.replace).toHaveBeenCalledTimes(2);
  expect(router.replace).toHaveBeenLastCalledWith(
    { pathname: '/movies', query: { genre: '18' } },
    undefined,
    expect.anything(),
  );
});

it('trava a rolagem da página enquanto está aberto', async () => {
  const { unmount } = renderModal();
  await screen.findByRole('heading', { name: 'Clube da Luta' });
  expect(document.documentElement.style.overflow).toBe('hidden');
  unmount();
  expect(document.documentElement.style.overflow).toBe('');
});

it('mostra o erro e permite tentar de novo', async () => {
  const id = ++idCounter;
  (getDetails as jest.Mock).mockRejectedValueOnce(new Error('TMDB fora do ar')).mockResolvedValueOnce({ ...details, id });
  (getSimilar as jest.Mock).mockResolvedValue([]);
  (useRouter as jest.Mock).mockReturnValue(makeRouter({ query: { view: `movie-${id}` } }));
  render(<DetailsModal />);

  fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByRole('heading', { name: 'Clube da Luta' })).toBeInTheDocument();
});

it('avisa que a sinopse de anime está em inglês', async () => {
  (getAnimeCharacters as jest.Mock).mockResolvedValue([]);
  renderModal({ type: 'anime', providersLink: null, cast: [] });
  expect(await screen.findByText(/Sinopse original do MyAnimeList/)).toBeInTheDocument();
});

it('em animes, carrega os personagens à parte', async () => {
  (getAnimeCharacters as jest.Mock).mockResolvedValue([{ id: 1, name: 'Frieren', role: 'Voz: Atsumi Tanezaki', photo: null }]);
  renderModal({ type: 'anime', cast: [] });
  expect(await screen.findByRole('heading', { name: 'Personagens' })).toBeInTheDocument();
  expect(screen.getByText('Voz: Atsumi Tanezaki')).toBeInTheDocument();
});

it('compartilha o link da página do título e oferece abri-la', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText }, share: undefined });
  renderModal();
  await screen.findByRole('heading', { name: 'Clube da Luta' });

  const id = idCounter;
  expect(screen.getByRole('link', { name: 'Abrir página do título' })).toHaveAttribute('href', `/title/movie/${id}`);
  fireEvent.click(screen.getByRole('button', { name: 'Compartilhar' }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(`http://localhost/title/movie/${id}`));
});
