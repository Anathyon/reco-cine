import { act, fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import MediaCard from '../media/MediaCard';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useToastStore } from '../../store/toastStore';
import { makeItem, makeRouter } from '../../test/utils';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

let router: ReturnType<typeof makeRouter>;
beforeEach(() => {
  router = makeRouter({ pathname: '/movies' });
  (useRouter as jest.Mock).mockReturnValue(router);
  useFavoritesStore.setState({ items: {} });
  useToastStore.setState({ toasts: [] });
});

it('mostra título, ano e nota', () => {
  render(<MediaCard item={makeItem()} />);
  expect(screen.getByRole('heading', { name: 'Clube da Luta' })).toBeInTheDocument();
  expect(screen.getByText('1999')).toBeInTheDocument();
  expect(screen.getByText('8.4')).toBeInTheDocument();
});

it('mostra o tipo quando pedido (listas mistas)', () => {
  render(<MediaCard item={makeItem({ type: 'anime' })} showType />);
  expect(screen.getByText('1999 · Anime')).toBeInTheDocument();
});

it('não mostra nota quando não existe', () => {
  render(<MediaCard item={makeItem({ rating: null })} />);
  expect(screen.queryByText('8.4')).not.toBeInTheDocument();
});

const cardLink = () => screen.getByRole('link', { name: /Clube da Luta \(1999\) — ver detalhes/ });

it('é um link real para a página do título', () => {
  render(<MediaCard item={makeItem()} />);
  expect(cardLink()).toHaveAttribute('href', '/title/movie/550');
});

it('clique normal abre o modal (detalhes na URL) sem sair da página', () => {
  render(<MediaCard item={makeItem()} />);
  const notPrevented = fireEvent.click(cardLink());
  expect(notPrevented).toBe(false);
  expect(router.push).toHaveBeenCalledWith(
    { pathname: '/movies', query: { view: 'movie-550' } },
    undefined,
    expect.anything(),
  );
});

it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }])(
  'com modificador (%p) deixa o navegador abrir em nova aba',
  (modifier) => {
    render(<MediaCard item={makeItem()} />);
    expect(fireEvent.click(cardLink(), modifier)).toBe(true);
    expect(router.push).not.toHaveBeenCalled();
  },
);

it('favoritar não abre os detalhes, alterna o estado e oferece "Desfazer"', () => {
  render(<MediaCard item={makeItem()} />);
  const heart = screen.getByRole('button', { name: 'Adicionar Clube da Luta à sua lista' });

  fireEvent.click(heart);
  expect(router.push).not.toHaveBeenCalled();
  expect(useFavoritesStore.getState().items['movie-550']).toBeDefined();
  expect(screen.getByRole('button', { name: 'Remover Clube da Luta da sua lista' })).toHaveAttribute('aria-pressed', 'true');

  const [t] = useToastStore.getState().toasts;
  expect(t.message).toBe('Adicionado à sua lista');
  act(() => t.action!.onClick());
  expect(useFavoritesStore.getState().items['movie-550']).toBeUndefined();
});

it('mostra um substituto quando não há pôster', () => {
  render(<MediaCard item={makeItem({ poster: null })} />);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getAllByText('Clube da Luta')).toHaveLength(2);
});

it('troca para o substituto se a imagem quebrar', () => {
  render(<MediaCard item={makeItem()} />);
  fireEvent.error(screen.getByRole('img', { name: 'Clube da Luta' }));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
