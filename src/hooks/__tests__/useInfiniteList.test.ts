import { act, renderHook, waitFor } from '@testing-library/react';
import { useInfiniteList } from '../useInfiniteList';
import { makeItem } from '../../test/utils';
import type { MediaItem, Page } from '../../types';

let n = 0;
const key = () => `lista-${++n}`;
const pageOf = (ids: number[], page: number, hasMore = true): Page<MediaItem> => ({
  items: ids.map((id) => makeItem({ id })),
  page,
  hasMore,
});

it('carrega a primeira página ao montar', async () => {
  const fetchPage = jest.fn().mockResolvedValue(pageOf([1, 2], 1));
  const k = key();
  const { result } = renderHook(() => useInfiniteList(k, fetchPage));
  await waitFor(() => expect(result.current.items).toHaveLength(2));
  expect(fetchPage).toHaveBeenCalledWith(1);
  expect(result.current.hasMore).toBe(true);
});

it('acrescenta a próxima página sem duplicar itens', async () => {
  const fetchPage = jest
    .fn()
    .mockResolvedValueOnce(pageOf([1, 2], 1))
    .mockResolvedValueOnce(pageOf([2, 3], 2, false));
  const k = key();
  const { result } = renderHook(() => useInfiniteList(k, fetchPage));
  await waitFor(() => expect(result.current.items).toHaveLength(2));

  act(() => result.current.loadMore());
  await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual([1, 2, 3]));
  expect(fetchPage).toHaveBeenLastCalledWith(2);
  expect(result.current.hasMore).toBe(false);
});

it('não dispara loadMore duplicado enquanto carrega, nem após o fim', async () => {
  let resolve!: (p: Page<MediaItem>) => void;
  const fetchPage = jest
    .fn()
    .mockResolvedValueOnce(pageOf([1], 1))
    .mockImplementationOnce(() => new Promise((r) => (resolve = r)));
  const k = key();
  const { result } = renderHook(() => useInfiniteList(k, fetchPage));
  await waitFor(() => expect(result.current.items).toHaveLength(1));

  act(() => {
    result.current.loadMore();
    result.current.loadMore();
  });
  expect(fetchPage).toHaveBeenCalledTimes(2);

  await act(async () => resolve(pageOf([2], 2, false)));
  act(() => result.current.loadMore());
  expect(fetchPage).toHaveBeenCalledTimes(2);
});

it('recomeça do zero quando os filtros (chave) mudam', async () => {
  const [a, b] = [key(), key()];
  const fetchPage = jest.fn((page: number) => Promise.resolve(pageOf([page * 10], page)));
  const { result, rerender } = renderHook(({ k, offset }) => useInfiniteList(k, (p) => fetchPage(p + offset)), {
    initialProps: { k: a, offset: 0 },
  });
  await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual([10]));

  rerender({ k: b, offset: 4 });
  await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual([50]));
});

it('restaura a lista do cache ao voltar para a mesma chave', async () => {
  const k = key();
  const fetchPage = jest.fn().mockResolvedValue(pageOf([1, 2, 3], 1));
  const first = renderHook(() => useInfiniteList(k, fetchPage));
  await waitFor(() => expect(first.result.current.items).toHaveLength(3));
  first.unmount();

  const second = renderHook(() => useInfiniteList(k, fetchPage));
  expect(second.result.current.items).toHaveLength(3);
  expect(fetchPage).toHaveBeenCalledTimes(1);
});

it('mostra o erro e tenta a mesma página de novo', async () => {
  const fetchPage = jest.fn().mockRejectedValueOnce(new Error('Sem conexão')).mockResolvedValueOnce(pageOf([1], 1));
  const k = key();
  const { result } = renderHook(() => useInfiniteList(k, fetchPage));
  await waitFor(() => expect(result.current.error).toBe('Sem conexão'));

  act(() => result.current.retry());
  await waitFor(() => expect(result.current.items).toHaveLength(1));
  expect(fetchPage).toHaveBeenNthCalledWith(2, 1);
  expect(result.current.error).toBeNull();
});

it('o primeiro desenho já é "carregando" (igual ao HTML do servidor, sem erro de hidratação)', () => {
  const fetchPage = jest.fn(() => new Promise<Page<MediaItem>>(() => undefined));
  const states: boolean[] = [];
  renderHook(() => {
    const list = useInfiniteList(key(), fetchPage);
    states.push(list.loading);
    return list;
  });
  expect(states[0]).toBe(true);
});

it('sem chave, não fica "carregando"', () => {
  const { result } = renderHook(() => useInfiniteList(null, jest.fn()));
  expect(result.current.loading).toBe(false);
});
