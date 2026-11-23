/**
 * @jest-environment node
 */
import { getStaticProps as homeProps } from '../../pages/index';
import { getStaticProps as titleProps } from '../../pages/title/[type]/[id]';
import { getDetailsServer, siteUrl, withTimeout } from '../../lib/mediaServer';
import { getTrendingServer, tmdbServer, upstreamUrl } from '../../lib/tmdbServer';
import { jsonResponse } from '../../test/utils';

const ENV = { ...process.env };
let fetchMock: jest.Mock;

beforeEach(() => {
  process.env = { ...ENV, TMDB_API_KEY: 'chave-secreta' };
  delete process.env.NEXT_PUBLIC_TMDB_API_KEY;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.VERCEL_URL;
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterAll(() => {
  process.env = ENV;
});

const movie = { id: 550, title: 'Clube da Luta', poster_path: '/p.jpg', vote_average: 8.4, vote_count: 10, release_date: '1999-10-15' };

describe('tmdbServer', () => {
  it('monta a URL com a chave do servidor e pt-BR, ignorando api_key vinda de fora', () => {
    const url = new URL(upstreamUrl('movie/550', { api_key: 'outra', page: 2 }));
    expect(url.searchParams.getAll('api_key')).toEqual(['chave-secreta']);
    expect(url.searchParams.get('language')).toBe('pt-BR');
    expect(url.searchParams.get('page')).toBe('2');
  });

  it('falha cedo, sem chamar a rede, quando não há chave', async () => {
    delete process.env.TMDB_API_KEY;
    await expect(tmdbServer('movie/550')).rejects.toThrow('não configurada');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('expõe o status HTTP do erro', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404));
    await expect(tmdbServer('movie/1')).rejects.toMatchObject({ status: 404 });
  });

  it('normaliza tendências como o cliente', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ page: 1, total_pages: 1, results: [{ ...movie, media_type: 'movie' }] }));
    expect(await getTrendingServer('all', 'week')).toEqual([expect.objectContaining({ id: 550, type: 'movie', year: '1999' })]);
  });
});

describe('mediaServer', () => {
  it('retorna null para título inexistente (vira 404)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404));
    expect(await getDetailsServer('movie', 999999999)).toBeNull();
  });

  it('propaga falhas temporárias', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 503));
    await expect(getDetailsServer('movie', 1)).rejects.toThrow('503');
  });

  it('withTimeout rejeita quando demora demais', async () => {
    jest.useFakeTimers();
    const slow = withTimeout(new Promise(() => undefined), 100);
    const assertion = expect(slow).rejects.toThrow('Tempo esgotado');
    await jest.advanceTimersByTimeAsync(100);
    await assertion;
    jest.useRealTimers();
  });

  it.each([
    [{ NEXT_PUBLIC_SITE_URL: 'https://meusite.com/' }, 'https://meusite.com'],
    [{ VERCEL_PROJECT_PRODUCTION_URL: 'reco-cine.vercel.app' }, 'https://reco-cine.vercel.app'],
    [{}, 'http://localhost:3000'],
  ])('siteUrl com %p', (env, expected) => {
    Object.assign(process.env, env);
    expect(siteUrl()).toBe(expected);
  });
});

describe('getStaticProps da página inicial', () => {
  it('entrega banner e "Em alta hoje" prontos e revalida a cada hora', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ page: 1, total_pages: 1, results: [{ ...movie, media_type: 'movie' }] }));
    const result = (await homeProps({})) as { props: any; revalidate: number };
    expect(result.props.heroItems).toHaveLength(1);
    expect(result.props.todayItems).toHaveLength(1);
    expect(result.revalidate).toBe(3600);
  });

  it('sem chave ou com o TMDB fora do ar, não quebra o build: o navegador carrega depois', async () => {
    delete process.env.TMDB_API_KEY;
    const result = (await homeProps({})) as { props: any; revalidate: number };
    expect(result.props).toEqual({ heroItems: null, todayItems: null });
    expect(result.revalidate).toBe(60);
  });
});

describe('getStaticProps da página do título', () => {
  const details = { ...movie, genres: [], credits: { cast: [], crew: [] }, videos: { results: [] } };

  it.each([
    [{ type: 'person', id: '1' }],
    [{ type: 'movie', id: 'abc' }],
    [{ type: 'movie', id: '-5' }],
  ])('404 para parâmetros inválidos: %p', async (params) => {
    expect(await titleProps({ params })).toEqual({ notFound: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renderiza os detalhes no servidor com cache de um dia', async () => {
    fetchMock.mockResolvedValue(jsonResponse(details));
    process.env.NEXT_PUBLIC_SITE_URL = 'https://reco.app';
    const result = (await titleProps({ params: { type: 'movie', id: '550' } })) as { props: any; revalidate: number };
    expect(result.props).toMatchObject({ type: 'movie', id: 550, siteUrl: 'https://reco.app' });
    expect(result.props.details.title).toBe('Clube da Luta');
    expect(result.revalidate).toBe(86400);
  });

  it('título inexistente vira 404', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404));
    expect(await titleProps({ params: { type: 'movie', id: '1' } })).toMatchObject({ notFound: true });
  });

  it('falha temporária ainda renderiza a página (dados vêm do navegador)', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));
    const result = (await titleProps({ params: { type: 'tv', id: '1396' } })) as { props: any; revalidate: number };
    expect(result.props.details).toBeNull();
    expect(result.revalidate).toBe(60);
  });
});
