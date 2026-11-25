import { renderHook } from '@testing-library/react';
import { useRouter } from 'next/router';
import { parseView, useDetailsRoute } from '../useDetailsRoute';
import { makeRouter, type MockRouter } from '../../test/utils';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

let router: MockRouter;
const setRouter = (overrides: Partial<MockRouter> = {}) => {
  router = makeRouter(overrides);
  (useRouter as jest.Mock).mockReturnValue(router);
};

describe('parseView', () => {
  it.each([
    ['movie-550', { type: 'movie', id: 550 }],
    ['tv-1396', { type: 'tv', id: 1396 }],
    ['anime-52991', { type: 'anime', id: 52991 }],
    ['manga-2', { type: 'manga', id: 2 }],
  ])('%s', (raw, expected) => {
    expect(parseView(raw)).toEqual(expected);
  });

  it.each(['person-1', 'movie-', 'movie-abc', 'movie-1-2', '', undefined, ['movie-1']])('rejeita %p', (raw) => {
    expect(parseView(raw)).toBeNull();
  });
});

describe('useDetailsRoute', () => {
  it('lê o título aberto da URL', () => {
    setRouter({ query: { view: 'tv-1396' } });
    const { result } = renderHook(() => useDetailsRoute());
    expect(result.current.view).toEqual({ type: 'tv', id: 1396 });
  });

  it('abre com push (o "voltar" fecha) preservando os outros parâmetros', () => {
    setRouter({ pathname: '/search', query: { q: 'duna' } });
    const { result } = renderHook(() => useDetailsRoute());
    result.current.open({ type: 'movie', id: 438631 });

    expect(router.push).toHaveBeenCalledWith(
      { pathname: '/search', query: { q: 'duna', view: 'movie-438631' } },
      undefined,
      { shallow: true, scroll: false },
    );
  });

  it('fecha com "voltar" quando foi aberto pelo app', () => {
    setRouter();
    const { result } = renderHook(() => useDetailsRoute());
    result.current.open({ type: 'movie', id: 1 });
    result.current.close();
    expect(router.back).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('ao navegar entre recomendações, substitui o histórico em vez de empilhar', () => {
    setRouter({ query: { view: 'movie-1' } });
    const { result } = renderHook(() => useDetailsRoute());
    result.current.open({ type: 'movie', id: 2 });
    expect(router.replace).toHaveBeenCalledWith(
      { pathname: '/', query: { view: 'movie-2' } },
      undefined,
      expect.objectContaining({ shallow: true }),
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it('quem chegou por um link compartilhado fecha sem sair do site', () => {
    setRouter({ pathname: '/movies', query: { view: 'movie-1', genre: '28' } });
    const { result } = renderHook(() => useDetailsRoute());
    result.current.close();
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith(
      { pathname: '/movies', query: { genre: '28' } },
      undefined,
      expect.objectContaining({ shallow: true }),
    );
  });
});
