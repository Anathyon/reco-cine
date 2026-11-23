import { act, renderHook } from '@testing-library/react';
import { useFavoritesStore, useIsFavorite } from '../favoritesStore';
import { makeItem } from '../../test/utils';

const STORAGE_KEY = 'reco-cine:favorites';

beforeEach(() => {
  localStorage.clear();
  useFavoritesStore.setState({ items: {}, hydrated: false });
});

const store = () => useFavoritesStore.getState();

it('adiciona e remove com toggle, informando o resultado', () => {
  const movie = makeItem();
  expect(store().toggle(movie)).toBe(true);
  expect(store().items['movie-550']).toMatchObject({ title: 'Clube da Luta', type: 'movie' });
  expect(store().toggle(movie)).toBe(false);
  expect(store().items).toEqual({});
});

it('não confunde filme, série e anime com o mesmo id', () => {
  store().toggle(makeItem({ id: 1, type: 'movie' }));
  store().toggle(makeItem({ id: 1, type: 'tv' }));
  store().toggle(makeItem({ id: 1, type: 'anime' }));
  expect(Object.keys(store().items).sort()).toEqual(['anime-1', 'movie-1', 'tv-1']);

  store().remove({ id: 1, type: 'tv' });
  expect(Object.keys(store().items).sort()).toEqual(['anime-1', 'movie-1']);
});

it('guarda só os campos necessários e a data em que foi adicionado', () => {
  jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
  const extra = { ...makeItem(), genres: ['Drama'], cast: [] } as ReturnType<typeof makeItem>;
  store().toggle(extra);
  expect(store().items['movie-550']).toEqual({ ...makeItem(), addedAt: 1_700_000_000_000 });
  jest.restoreAllMocks();
});

it('persiste no localStorage e recupera após recarregar', async () => {
  store().toggle(makeItem());
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
  expect(saved.state.items['movie-550'].title).toBe('Clube da Luta');
  expect(saved.state).not.toHaveProperty('hydrated');

  // Simula recarregar a página: memória zerada, localStorage intacto.
  const raw = localStorage.getItem(STORAGE_KEY)!;
  useFavoritesStore.setState({ items: {}, hydrated: false });
  localStorage.setItem(STORAGE_KEY, raw);
  await useFavoritesStore.persist.rehydrate();
  expect(store().items['movie-550']).toBeDefined();
  expect(store().hydrated).toBe(true);
});

it('marca como hidratado mesmo sem nada salvo', async () => {
  await useFavoritesStore.persist.rehydrate();
  expect(store().hydrated).toBe(true);
});

it('limpa a lista', () => {
  store().toggle(makeItem());
  store().clear();
  expect(store().items).toEqual({});
});

it('useIsFavorite reage às mudanças', () => {
  const item = makeItem();
  const { result } = renderHook(() => useIsFavorite(item));
  expect(result.current).toBe(false);
  act(() => {
    store().toggle(item);
  });
  expect(result.current).toBe(true);
});

describe('importItems', () => {
  it('junta sem duplicar e informa quantos eram novos', () => {
    store().toggle(makeItem({ id: 1 }));
    const added = store().importItems([makeItem({ id: 1 }), makeItem({ id: 2 }), makeItem({ id: 2, type: 'tv' })]);
    expect(added).toBe(2);
    expect(Object.keys(store().items).sort()).toEqual(['movie-1', 'movie-2', 'tv-2']);
  });

  it('preserva a ordem: o primeiro importado fica como o mais recente', () => {
    store().importItems([makeItem({ id: 10 }), makeItem({ id: 20 })]);
    expect(store().items['movie-10'].addedAt).toBeGreaterThan(store().items['movie-20'].addedAt);
  });

  it('não altera nada quando tudo já existe', () => {
    store().toggle(makeItem());
    const before = store().items;
    expect(store().importItems([makeItem()])).toBe(0);
    expect(store().items).toBe(before);
  });
});
