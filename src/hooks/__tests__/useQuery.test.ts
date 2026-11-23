import { act, renderHook, waitFor } from '@testing-library/react';
import { errorMessage, useQuery } from '../useQuery';

// O cache é global ao módulo: cada teste usa chaves próprias.
let n = 0;
const key = () => `teste-${++n}`;

it('carrega e devolve os dados', async () => {
  const k = key();
  const { result } = renderHook(() => useQuery(k, async () => 'dados'));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.data).toBe('dados'));
  expect(result.current.loading).toBe(false);
});

it('não busca nada com chave nula', () => {
  const fetcher = jest.fn();
  const { result } = renderHook(() => useQuery(null, fetcher));
  expect(fetcher).not.toHaveBeenCalled();
  expect(result.current.loading).toBe(false);
});

it('reaproveita o cache entre componentes (sem nova requisição)', async () => {
  const k = key();
  const fetcher = jest.fn().mockResolvedValue([1, 2, 3]);
  const first = renderHook(() => useQuery(k, fetcher));
  await waitFor(() => expect(first.result.current.data).toEqual([1, 2, 3]));

  const second = renderHook(() => useQuery(k, fetcher));
  expect(second.result.current.data).toEqual([1, 2, 3]);
  expect(second.result.current.loading).toBe(false);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('deduplica requisições simultâneas com a mesma chave', async () => {
  const k = key();
  let resolve!: (v: string) => void;
  const fetcher = jest.fn(() => new Promise<string>((r) => (resolve = r)));
  const a = renderHook(() => useQuery(k, fetcher));
  const b = renderHook(() => useQuery(k, fetcher));
  await act(async () => resolve('ok'));
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(a.result.current.data).toBe('ok');
  expect(b.result.current.data).toBe('ok');
});

it('expõe o erro e permite tentar de novo', async () => {
  const k = key();
  const fetcher = jest.fn().mockRejectedValueOnce(new Error('Falhou')).mockResolvedValueOnce('recuperado');
  const { result } = renderHook(() => useQuery(k, fetcher));
  await waitFor(() => expect(result.current.error).toBe('Falhou'));

  act(() => result.current.retry());
  await waitFor(() => expect(result.current.data).toBe('recuperado'));
  expect(result.current.error).toBeUndefined();
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('ignora respostas de uma chave antiga após trocar de chave', async () => {
  const [k1, k2] = [key(), key()];
  let resolveOld!: (v: string) => void;
  const fetchers: Record<string, () => Promise<string>> = {
    [k1]: () => new Promise((r) => (resolveOld = r)),
    [k2]: async () => 'novo',
  };
  const { result, rerender } = renderHook(({ k }) => useQuery(k, fetchers[k]), { initialProps: { k: k1 } });
  rerender({ k: k2 });
  await waitFor(() => expect(result.current.data).toBe('novo'));
  await act(async () => resolveOld('velho'));
  expect(result.current.data).toBe('novo');
});

it('errorMessage tem uma mensagem padrão para erros sem texto', () => {
  expect(errorMessage(new Error('x'))).toBe('x');
  expect(errorMessage('string solta')).toMatch(/Algo deu errado/);
});

describe('initialData (dados do servidor)', () => {
  it('renderiza direto com os dados e não busca de novo', () => {
    const k = key();
    const fetcher = jest.fn();
    const { result } = renderHook(() => useQuery(k, fetcher, { initialData: ['ssr'] }));
    expect(result.current).toMatchObject({ data: ['ssr'], loading: false });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('dados já em cache no cliente têm prioridade', async () => {
    const k = key();
    const first = renderHook(() => useQuery(k, async () => 'do cliente'));
    await waitFor(() => expect(first.result.current.data).toBe('do cliente'));
    const second = renderHook(() => useQuery(k, jest.fn(), { initialData: 'do servidor' }));
    expect(second.result.current.data).toBe('do cliente');
  });
});
