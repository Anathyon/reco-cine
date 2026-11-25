/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/manga/[...path]';
import { checkAdult } from '../../lib/adultServer';
import { jsonResponse } from '../../test/utils';

jest.mock('../../lib/adultServer', () => ({ ...jest.requireActual('../../lib/adultServer'), checkAdult: jest.fn() }));
const checkAdultMock = checkAdult as jest.Mock;

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
  checkAdultMock.mockReset().mockResolvedValue('signedOut');
});
afterAll(() => {
  process.env = ENV;
});

const upstream = (call = 0) => new URL(fetchMock.mock.calls[call][0]);

it('catálogo pelo ranking de mangás, com cache na CDN', async () => {
  const res = await call(req(['discover'], { sort: 'top', page: '2' }));
  expect(upstream().pathname).toBe('/v2/manga/ranking');
  expect(upstream().searchParams.get('ranking_type')).toBe('all');
  expect(res.statusCode).toBe(200);
  expect(res.headers['cache-control']).toContain('s-maxage=3600');
});

it('ordenação desconhecida cai em "populares"', async () => {
  await call(req(['discover'], { sort: 'recent' }));
  expect(upstream().searchParams.get('ranking_type')).toBe('bypopularity');
});

it('detalhes e recomendações', async () => {
  fetchMock.mockResolvedValue(jsonResponse({ id: 2, title: 'Berserk', recommendations: [] }));
  const res = await call(req(['2']));
  expect(upstream().pathname).toBe('/v2/manga/2');
  expect(res.body).toMatchObject({ id: 2, type: 'manga', title: 'Berserk' });
  const recs = await call(req(['2', 'recommendations']));
  expect(recs.statusCode).toBe(200);
  expect(recs.body).toEqual([]);
});

it('404 do MAL vira "Mangá não encontrado"', async () => {
  fetchMock.mockResolvedValue(jsonResponse({ error: 'not_found' }, 404));
  const res = await call(req(['999999']));
  expect(res.statusCode).toBe(404);
});

it.each([[['season']], [['2', 'characters']], [['abc']]])('recusa rotas desconhecidas: %p', async (path) => {
  const res = await call(req(path));
  expect(res.statusCode).toBe(400);
});

it('busca +18 exige login de maior de idade e não vai para o cache público', async () => {
  checkAdultMock.mockResolvedValue('signedOut');
  expect((await call(req(['search'], { q: 'berserk', adult: '1' }))).statusCode).toBe(401);
  expect(fetchMock).not.toHaveBeenCalled();

  checkAdultMock.mockResolvedValue('ok');
  const res = await call(req(['search'], { q: 'berserk', adult: '1' }));
  expect(upstream().searchParams.get('nsfw')).toBe('true');
  expect(res.headers['cache-control']).toBe('private, no-store');
});
