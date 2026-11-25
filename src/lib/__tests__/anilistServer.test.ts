/**
 * @jest-environment node
 */
import { anilistInfo, clearAnilistCache, mergeProviders, toProviders, youtubeId } from '../anilistServer';
import { jsonResponse, mockFetch } from '../../test/utils';

const link = (site: string, language: string | null, extra: Record<string, unknown> = {}) => ({
  site,
  url: `https://${site.toLowerCase().replace(/\s/g, '')}.com/x`,
  type: 'STREAMING',
  language,
  isDisabled: false,
  ...extra,
});

beforeEach(() => clearAnilistCache());

describe('toProviders', () => {
  it('português primeiro, depois inglês e espanhol; sem idioma antes dos demais', () => {
    const out = toProviders([
      link('Piccoma', 'Japanese'),
      link('VIZ', 'English'),
      link('Crunchyroll', null),
      link('MANGA Plus', 'Portuguese'),
      link('ONO', 'French'),
      link('MANGA Plus', 'Spanish'),
    ]);
    expect(out.map((p) => `${p.name}|${p.language ?? ''}`)).toEqual([
      'MANGA Plus|Português',
      'VIZ|Inglês',
      'MANGA Plus|Espanhol',
      'Crunchyroll|',
      'Piccoma|Japonês',
      'ONO|Francês',
    ]);
  });

  it('ignora redes sociais, sites informativos, links desativados ou sem https, e repetidos', () => {
    const out = toProviders([
      link('Twitter', 'Japanese', { type: 'SOCIAL' }),
      link('Official Site', 'Japanese', { type: 'INFO' }),
      link('Velho', 'English', { isDisabled: true }),
      link('Inseguro', 'English', { url: 'http://inseguro.com' }),
      link('Perigoso', 'English', { url: 'javascript:alert(1)' }),
      link('VIZ', 'English'),
      link('VIZ', 'English', { url: 'https://viz.com/outro' }),
    ]);
    expect(out).toEqual([{ name: 'VIZ', logo: null, url: 'https://viz.com/x', language: 'Inglês' }]);
  });

  it('no máximo 10 links', () => {
    const many = Array.from({ length: 15 }, (_, i) => link(`Site ${i}`, 'English'));
    expect(toProviders(many)).toHaveLength(10);
  });
});

describe('anilistInfo', () => {
  it('consulta pelo ID do MyAnimeList e guarda em memória', async () => {
    const fetch = mockFetch(jsonResponse({ data: { Media: { externalLinks: [link('VIZ', 'English')] } } }));
    expect((await anilistInfo(13, 'MANGA')).links).toHaveLength(1);
    expect((await anilistInfo(13, 'MANGA')).links).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://graphql.anilist.co');
    expect(JSON.parse(init.body).variables).toEqual({ id: 13, type: 'MANGA' });
  });

  it('título que a AniList não tem: lista vazia', async () => {
    mockFetch(jsonResponse({ errors: [{ message: 'Not Found.' }], data: { Media: null } }, 404));
    expect(await anilistInfo(1, 'ANIME')).toEqual({ links: [], trailerKey: null });
  });

  it('falha ou demora da AniList não quebra nada e não fica guardada', async () => {
    const fetch = mockFetch(jsonResponse({}, 500));
    fetch.mockRejectedValueOnce(new Error('timeout'));
    expect((await anilistInfo(2, 'MANGA')).links).toEqual([]);
    fetch.mockResolvedValueOnce(jsonResponse({ data: { Media: { externalLinks: [link('VIZ', 'English')] } } }));
    expect((await anilistInfo(2, 'MANGA')).links).toEqual([]); // a rejeição
    expect((await anilistInfo(2, 'MANGA')).links).toHaveLength(1);
  });

  it('traz o trailer do anime (reserva quando a Jikan está fora do ar)', async () => {
    mockFetch(jsonResponse({ data: { Media: { externalLinks: [], trailer: { id: 'LHtdKWJdif4\t', site: 'youtube' } } } }));
    expect((await anilistInfo(16498, 'ANIME')).trailerKey).toBe('LHtdKWJdif4');
  });
});

it('mergeProviders junta sem repetir o mesmo serviço', () => {
  const jikan = [{ name: 'Crunchyroll', logo: null, url: 'https://crunchyroll.com/a' }];
  const anilist = [
    { name: 'crunchyroll', logo: null, url: 'https://crunchyroll.com/b' },
    { name: 'Netflix', logo: null, url: 'https://netflix.com/b' },
  ];
  expect(mergeProviders(jikan, anilist).map((p) => p.url)).toEqual(['https://crunchyroll.com/a', 'https://netflix.com/b']);
});

it.each([
  [{ id: 'tR8YH0G67Rk', site: 'youtube' }, 'tR8YH0G67Rk'],
  [{ id: ' LHtdKWJdif4\t', site: 'youtube' }, 'LHtdKWJdif4'],
  [{ id: 'x2abcd', site: 'dailymotion' }, null],
  [{ id: 'curto', site: 'youtube' }, null],
  [{ id: '"><script>', site: 'youtube' }, null],
  [null, null],
])('youtubeId(%p) = %p', (trailer, expected) => {
  expect(youtubeId(trailer)).toBe(expected);
});
