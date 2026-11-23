/**
 * @jest-environment node
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/tmdb/[...path]';
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
  process.env = { ...ENV, TMDB_API_KEY: 'chave-secreta' };
  delete process.env.NEXT_PUBLIC_TMDB_API_KEY;
  fetchMock = jest.fn().mockResolvedValue(jsonResponse({ results: [] }));
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterAll(() => {
  process.env = ENV;
});

it('repassa a chamada ao TMDB com a chave do servidor e idioma pt-BR', async () => {
  const res = await call(req(['movie', '550'], { append_to_response: 'credits' }));

  const url = new URL(fetchMock.mock.calls[0][0]);
  expect(url.origin + url.pathname).toBe('https://api.themoviedb.org/3/movie/550');
  expect(url.searchParams.get('api_key')).toBe('chave-secreta');
  expect(url.searchParams.get('language')).toBe('pt-BR');
  expect(url.searchParams.get('append_to_response')).toBe('credits');
  expect(res.statusCode).toBe(200);
  expect(res.headers['cache-control']).toContain('s-maxage');
});

it('aceita NEXT_PUBLIC_TMDB_API_KEY por compatibilidade', async () => {
  delete process.env.TMDB_API_KEY;
  process.env.NEXT_PUBLIC_TMDB_API_KEY = 'chave-antiga';
  await call(req(['trending', 'all', 'week']));
  expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('api_key')).toBe('chave-antiga');
});

it('não deixa o cliente trocar a chave nem o idioma escolhido ser sobrescrito', async () => {
  await call(req(['movie', 'popular'], { api_key: 'chave-do-atacante', language: 'en-US' }));
  const params = new URL(fetchMock.mock.calls[0][0]).searchParams;
  expect(params.getAll('api_key')).toEqual(['chave-secreta']);
  expect(params.get('language')).toBe('en-US');
});

it('suporta caminhos com barra no append (watch/providers)', async () => {
  await call(req(['movie', '550', 'watch', 'providers']));
  expect(fetchMock.mock.calls[0][0]).toContain('/movie/550/watch/providers?');
});

it.each([
  [['account']],
  [['authentication', 'token', 'new']],
  [['movie', '..', 'account']],
  [['list', '1']],
])('bloqueia rotas fora da lista permitida: %p', async (path) => {
  const res = await call(req(path));
  expect(res.statusCode).toBe(400);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('aceita apenas GET', async () => {
  const res = await call(req(['movie', '550'], {}, 'POST'));
  expect(res.statusCode).toBe(405);
  expect(res.headers.allow).toBe('GET');
});

it('avisa quando a chave não está configurada', async () => {
  delete process.env.TMDB_API_KEY;
  const res = await call(req(['movie', '550']));
  expect(res.statusCode).toBe(500);
  expect(fetchMock).not.toHaveBeenCalled();
});

it('repassa o status de erro do TMDB sem cachear', async () => {
  fetchMock.mockResolvedValue(jsonResponse({ status_message: 'not found' }, 404));
  const res = await call(req(['movie', '999999999']));
  expect(res.statusCode).toBe(404);
  expect(res.headers['cache-control']).toBeUndefined();
});

it('responde 502 quando o TMDB está fora do ar', async () => {
  fetchMock.mockRejectedValue(new Error('ECONNRESET'));
  const res = await call(req(['movie', '550']));
  expect(res.statusCode).toBe(502);
});
