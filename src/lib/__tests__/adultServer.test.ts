/**
 * @jest-environment node
 */
import { bearer, checkAdult, clearAdultCache, readToken } from '../adultServer';
import { jsonResponse } from '../../test/utils';

const NOW = Date.parse('2026-11-25T12:00:00Z');
const PROJECT = 'reco-cine';

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = (claims: Record<string, unknown> = {}) =>
  `${b64({ alg: 'RS256' })}.${b64({
    user_id: 'uid123',
    aud: PROJECT,
    iss: `https://securetoken.google.com/${PROJECT}`,
    exp: NOW / 1000 + 3600,
    ...claims,
  })}.assinatura`;
const req = (t?: string) => ({ headers: t ? { authorization: `Bearer ${t}` } : {} });
const firestoreDoc = (birthDate: string) => jsonResponse({ fields: { birthDate: { stringValue: birthDate } } });

const ENV = { ...process.env };
let fetchMock: jest.Mock;
beforeEach(() => {
  process.env = { ...ENV, NEXT_PUBLIC_FIREBASE_PROJECT_ID: PROJECT };
  clearAdultCache();
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterAll(() => {
  process.env = ENV;
});

it('lê o token do cabeçalho e o uid do JWT', () => {
  const t = token();
  expect(bearer(req(t))).toBe(t);
  expect(bearer({ headers: { authorization: 'Basic abc' } })).toBeNull();
  expect(readToken(t)).toMatchObject({ uid: 'uid123', aud: PROJECT });
  expect(readToken('nao.e.jwt')).toBeNull();
});

it('libera maior de idade, lendo o Firestore com o próprio token', async () => {
  fetchMock.mockResolvedValue(firestoreDoc('2000-05-10'));
  const t = token();
  expect(await checkAdult(req(t), NOW)).toBe('ok');
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toContain(`/projects/${PROJECT}/databases/(default)/documents/users/uid123`);
  expect(init.headers.Authorization).toBe(`Bearer ${t}`);
});

it('recusa menor de idade e quem não informou a data', async () => {
  fetchMock.mockResolvedValueOnce(firestoreDoc('2008-11-26')).mockResolvedValueOnce(jsonResponse({}, 404));
  expect(await checkAdult(req(token()), NOW)).toBe('underage');
  expect(await checkAdult(req(token({ user_id: 'outro' })), NOW)).toBe('noBirthDate');
});

it('sem login, token vencido ou de outro projeto: nem consulta o Firestore', async () => {
  expect(await checkAdult(req(), NOW)).toBe('signedOut');
  expect(await checkAdult(req(token({ exp: NOW / 1000 - 1 })), NOW)).toBe('signedOut');
  expect(await checkAdult(req(token({ aud: 'outro-projeto' })), NOW)).toBe('signedOut');
  expect(fetchMock).not.toHaveBeenCalled();
});

it('token falso (o Firestore recusa) não passa', async () => {
  fetchMock.mockResolvedValue(jsonResponse({ error: {} }, 401));
  expect(await checkAdult(req(token()), NOW)).toBe('signedOut');
});

it('guarda o resultado por token, mas não guarda falhas', async () => {
  fetchMock.mockRejectedValueOnce(new Error('rede')).mockResolvedValue(firestoreDoc('2000-05-10'));
  const t = token();
  expect(await checkAdult(req(t), NOW)).toBe('error');
  expect(await checkAdult(req(t), NOW)).toBe('ok');
  expect(await checkAdult(req(t), NOW + 1000)).toBe('ok');
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
