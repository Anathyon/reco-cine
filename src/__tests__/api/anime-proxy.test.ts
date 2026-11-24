/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/anime/[...path]';
import { jsonResponse } from '../../test/utils';

interface MockRes {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  status: jest.Mock<MockRes, [number]>;
  setHeader: jest.Mock<MockRes, [string, string]>;
  json: jest.Mock<MockRes, [unknown]>;
  send: jest.Mock<MockRes, [unknown]>;
}

function makeRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status: jest.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    setHeader: jest.fn((key: string, value: string) => {
      res.headers[key.toLowerCase()] = value;
      return res;
    }),
    json: jest.fn((body: unknown) => {
      res.body = body;
      return res;
    }),
    send: jest.fn((body: unknown) => {
      res.body = body;
      return res;
    }),
  };
  return res;
}

const req = (path: string[], query: Record<string, string> = {}, method = 'GET') =>
  ({ method, query: { path, ...query } }) as unknown as NextApiRequest;

async function call(request: NextApiRequest) {
  const res = makeRes();
  await handler(request, res as unknown as NextApiResponse);
  return res;
}

const ENV = { ...process.env };
let fetchMock: jest.Mock;

beforeEach(() => {
  process.env = { ...ENV, MAL_CLIENT_ID: 'client-id-secreto' };
  fetchMock = jest.fn().mockResolvedValue(jsonResponse({ data: [], paging: {} }));
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterAll(() => {
  process.env = ENV;
});

const upstream = (call = 0) => new URL(fetchMock.mock.calls[call][0]);

it('consulta o ranking do MAL e devolve os dados já normalizados, com cache', async () => {
  fetchMock.mockResolvedValue(jsonResponse({ data: [{ node: { id: 1, title: 'Cowboy Bebop' } }], paging: {} }));
  const res = await call(req(['top'], { page: '2', filter: 'airing' }));
  expect(upstream().pathname).toBe('/v2/anime/ranking');
  expect(upstream().searchParams.get('ranking_type')).toBe('airing');
  expect(res.statusCode).toBe(200);
  expect(res.body).toMatchObject({ page: 2, hasMore: false, items: [{ id: 1, type: 'anime', title: 'Cowboy Bebop' }] });
  expect(res.headers['cache-control']).toContain('s-maxage=3600');
});

it('ignora filtros e ordenações desconhecidos', async () => {
  await call(req(['top'], { filter: 'qualquer' }));
  expect(upstream().searchParams.get('ranking_type')).toBe('all');
  await call(req(['discover'], { sort: 'hack' }));
  expect(upstream(1).searchParams.get('ranking_type')).toBe('bypopularity');
});

it('cacheia por pouco tempo listas vazias (ex.: personagens com a Jikan fora)', async () => {
  fetchMock.mockRejectedValue(new Error('timeout'));
  const res = await call(req(['52991', 'characters']));
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual([]);
  expect(res.headers['cache-control']).toContain('s-maxage=300');
});

it.each([[[]], [['account']], [['52991', 'reviews']], [['abc']], [['..', 'anime']]])('recusa rotas desconhecidas: %p', async (path) => {
  const res = await call(req(path));
  expect(res.statusCode).toBe(400);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('aceita apenas GET', async () => {
  const res = await call(req(['top'], {}, 'POST'));
  expect(res.statusCode).toBe(405);
});

it('avisa quando o Client ID não está configurado', async () => {
  delete process.env.MAL_CLIENT_ID;
  const res = await call(req(['top']));
  expect(res.statusCode).toBe(500);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('responde 404 quando o anime não existe, sem cachear', async () => {
  fetchMock.mockResolvedValue(jsonResponse({ error: 'not_found' }, 404));
  const res = await call(req(['999999']));
  expect(res.statusCode).toBe(404);
  expect(res.headers['cache-control']).toBeUndefined();
});

it('responde 502 quando o MAL está fora do ar', async () => {
  fetchMock.mockRejectedValue(new Error('ECONNRESET'));
  const res = await call(req(['season']));
  expect(res.statusCode).toBe(502);
});
