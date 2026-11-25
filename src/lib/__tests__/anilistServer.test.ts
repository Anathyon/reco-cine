/**
 * @jest-environment node
 */
import { anilistLinks, clearAnilistCache, mergeProviders, toProviders } from '../anilistServer';
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

describe('anilistLinks', () => {
  it('consulta pelo ID do MyAnimeList e guarda em memória', async () => {
    const fetch = mockFetch(jsonResponse({ data: { Media: { externalLinks: [link('VIZ', 'English')] } } }));
    expect(await anilistLinks(13, 'MANGA')).toHaveLength(1);
    expect(await anilistLinks(13, 'MANGA')).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://graphql.anilist.co');
    expect(JSON.parse(init.body).variables).toEqual({ id: 13, type: 'MANGA' });
  });

  it('título que a AniList não tem: lista vazia', async () => {
    mockFetch(jsonResponse({ errors: [{ message: 'Not Found.' }], data: { Media: null } }, 404));
    expect(await anilistLinks(1, 'ANIME')).toEqual([]);
  });

  it('falha ou demora da AniList não quebra nada e não fica guardada', async () => {
    const fetch = mockFetch(jsonResponse({}, 500));
    fetch.mockRejectedValueOnce(new Error('timeout'));
    expect(await anilistLinks(2, 'MANGA')).toEqual([]);
    fetch.mockResolvedValueOnce(jsonResponse({ data: { Media: { externalLinks: [link('VIZ', 'English')] } } }));
    expect(await anilistLinks(2, 'MANGA')).toEqual([]); // a rejeição
    expect(await anilistLinks(2, 'MANGA')).toHaveLength(1);
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
