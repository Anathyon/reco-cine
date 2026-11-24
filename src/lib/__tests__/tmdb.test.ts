import { ApiError, discover, getStreamingProviders, getTmdbDetails, getTrending, searchTmdb, tmdbImage } from '../tmdb';
import { calledUrl, jsonResponse, mockFetch } from '../../test/utils';

const rawMovie = {
  id: 550,
  title: 'Clube da Luta',
  overview: 'Um homem insone...',
  poster_path: '/poster.jpg',
  backdrop_path: '/backdrop.jpg',
  release_date: '1999-10-15',
  vote_average: 8.4,
  vote_count: 30000,
};

describe('tmdbImage', () => {
  it('monta a URL da imagem com o tamanho pedido', () => {
    expect(tmdbImage('/a.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/a.jpg');
  });

  it('retorna null sem caminho', () => {
    expect(tmdbImage(null)).toBeNull();
  });
});

describe('listas', () => {
  it('chama o proxy interno, nunca a API do TMDB diretamente', async () => {
    const fetch = mockFetch(jsonResponse({ page: 1, total_pages: 1, results: [] }));
    await getTrending('movie', 'day');
    const { path } = calledUrl(fetch);
    expect(path).toBe('/api/tmdb/trending/movie/day');
    expect(String(fetch.mock.calls[0][0])).not.toContain('api_key');
  });

  it('normaliza itens, ignora pessoas na busca multi e remove duplicados', async () => {
    mockFetch(
      jsonResponse({
        page: 1,
        total_pages: 3,
        results: [
          { ...rawMovie, media_type: 'movie' },
          { id: 1, name: 'Breaking Bad', first_air_date: '2008-01-20', vote_average: 8.9, vote_count: 10, media_type: 'tv' },
          { id: 2, name: 'Uma Pessoa', media_type: 'person' },
          { ...rawMovie, media_type: 'movie' },
        ],
      }),
    );

    const page = await searchTmdb('multi', 'clube');

    expect(page.items).toHaveLength(2);
    expect(page.items[0]).toEqual({
      id: 550,
      type: 'movie',
      title: 'Clube da Luta',
      poster: 'https://image.tmdb.org/t/p/w342/poster.jpg',
      backdrop: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
      year: '1999',
      rating: 8.4,
      overview: 'Um homem insone...',
    });
    expect(page.items[1]).toMatchObject({ type: 'tv', title: 'Breaking Bad', year: '2008', poster: null });
    expect(page.hasMore).toBe(true);
  });

  it('a busca é completa: inclui títulos adultos', async () => {
    const fetch = mockFetch(jsonResponse({ page: 1, total_pages: 1, results: [] }));
    await searchTmdb('movie', 'qualquer');
    expect(calledUrl(fetch).params.include_adult).toBe('true');
  });

  it('não exibe nota quando o título não tem votos', async () => {
    mockFetch(jsonResponse({ page: 1, total_pages: 1, results: [{ ...rawMovie, vote_count: 0, vote_average: 0 }] }));
    const page = await getTrending('movie');
    expect(page.items[0].rating).toBeNull();
    expect(page.hasMore).toBe(false);
  });

  it('respeita o limite de 500 páginas do TMDB', async () => {
    mockFetch(jsonResponse({ page: 500, total_pages: 9000, results: [rawMovie] }));
    const page = await getTrending('movie');
    expect(page.hasMore).toBe(false);
  });

  it('propaga a mensagem de erro do servidor', async () => {
    mockFetch(jsonResponse({ error: 'Chave do TMDB não configurada no servidor' }, 500));
    const promise = getTrending('all');
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toThrow('Chave do TMDB não configurada no servidor');
  });
});

describe('discover', () => {
  const empty = () => jsonResponse({ page: 1, total_pages: 1, results: [] });

  it('ordena por popularidade por padrão e aplica o gênero', async () => {
    const fetch = mockFetch(empty());
    await discover('movie', { genre: 28 });
    expect(calledUrl(fetch).params).toMatchObject({ sort_by: 'popularity.desc', with_genres: '28', page: '1' });
  });

  it('"mais bem avaliados" exige um mínimo de votos (evita notas 10 com 2 votos)', async () => {
    const fetch = mockFetch(empty(), empty());
    await discover('movie', { sort: 'top' });
    await discover('tv', { sort: 'top' });
    expect(calledUrl(fetch, 0).params).toMatchObject({ sort_by: 'vote_average.desc', 'vote_count.gte': '1000' });
    expect(calledUrl(fetch, 1).params).toMatchObject({ sort_by: 'vote_average.desc', 'vote_count.gte': '300' });
  });

  it('"lançamentos" usa o campo de data certo e não inclui datas futuras', async () => {
    const fetch = mockFetch(empty(), empty());
    await discover('movie', { sort: 'recent' });
    await discover('tv', { sort: 'recent' });
    const today = new Date().toISOString().slice(0, 10);
    expect(calledUrl(fetch, 0).params).toMatchObject({
      sort_by: 'primary_release_date.desc',
      'primary_release_date.lte': today,
    });
    expect(calledUrl(fetch, 1).params).toMatchObject({ sort_by: 'first_air_date.desc', 'first_air_date.lte': today });
  });

  it('omite o gênero quando não há filtro', async () => {
    const fetch = mockFetch(empty());
    await discover('tv', {});
    expect(calledUrl(fetch).params).not.toHaveProperty('with_genres');
  });
});

describe('getTmdbDetails', () => {
  const details = {
    ...rawMovie,
    original_title: 'Fight Club',
    tagline: 'Mischief. Mayhem. Soap.',
    runtime: 139,
    status: 'Released',
    original_language: 'en',
    genres: [{ id: 18, name: 'Drama' }],
    credits: {
      cast: [{ id: 1, name: 'Edward Norton', character: 'Narrador', profile_path: '/en.jpg' }],
      crew: [
        { name: 'David Fincher', job: 'Director' },
        { name: 'Outra Pessoa', job: 'Producer' },
      ],
    },
    videos: {
      results: [
        { site: 'YouTube', type: 'Teaser', key: 'teaser', iso_639_1: 'en' },
        { site: 'YouTube', type: 'Trailer', key: 'trailer-en', iso_639_1: 'en' },
        { site: 'YouTube', type: 'Trailer', key: 'trailer-pt', iso_639_1: 'pt' },
      ],
    },
    'watch/providers': {
      results: {
        BR: {
          link: 'https://www.themoviedb.org/movie/550/watch?locale=BR',
          flatrate: [
            { provider_id: 8, provider_name: 'Netflix', logo_path: '/nf.jpg' },
            { provider_id: 8, provider_name: 'Netflix', logo_path: '/nf.jpg' },
          ],
          rent: [{ provider_id: 2, provider_name: 'Apple TV', logo_path: '/a.jpg' }],
        },
      },
    },
  };

  it('pede créditos, vídeos e provedores em uma única requisição', async () => {
    const fetch = mockFetch(jsonResponse(details));
    await getTmdbDetails('movie', 550);
    expect(calledUrl(fetch).path).toBe('/api/tmdb/movie/550');
    expect(calledUrl(fetch).params.append_to_response).toBe('credits,videos,watch/providers');
  });

  it('monta os detalhes no formato da interface', async () => {
    mockFetch(jsonResponse(details));
    const d = await getTmdbDetails('movie', 550);

    expect(d.originalTitle).toBe('Fight Club');
    expect(d.genres).toEqual(['Drama']);
    expect(d.cast).toEqual([{ id: 1, name: 'Edward Norton', role: 'Narrador', photo: 'https://image.tmdb.org/t/p/w185/en.jpg' }]);
    expect(d.facts).toEqual(
      expect.arrayContaining([
        { label: 'Duração', value: '2h 19min' },
        { label: 'Direção', value: 'David Fincher' },
        { label: 'Status', value: 'Lançado' },
        { label: 'Idioma original', value: 'Inglês' },
      ]),
    );
    expect(d.externalUrl).toBe('https://www.themoviedb.org/movie/550');
  });

  it('prefere o trailer dublado/legendado em português', async () => {
    mockFetch(jsonResponse(details));
    expect((await getTmdbDetails('movie', 550)).trailerKey).toBe('trailer-pt');
  });

  it('mostra streaming no Brasil antes de aluguel, sem repetir provedores', async () => {
    mockFetch(jsonResponse(details));
    const d = await getTmdbDetails('movie', 550);
    expect(d.providers).toEqual([{ name: 'Netflix', logo: 'https://image.tmdb.org/t/p/w92/nf.jpg' }]);
    expect(d.providersLink).toContain('locale=BR');
  });

  it('lida com títulos sem vídeos, provedores ou título original diferente', async () => {
    mockFetch(jsonResponse({ ...rawMovie, original_title: 'Clube da Luta', genres: [] }));
    const d = await getTmdbDetails('movie', 550);
    expect(d.trailerKey).toBeNull();
    expect(d.providers).toEqual([]);
    expect(d.originalTitle).toBeNull();
    expect(d.cast).toEqual([]);
  });

  it('usa os campos de série (temporadas, criadores, emissora)', async () => {
    mockFetch(
      jsonResponse({
        id: 1396,
        name: 'Breaking Bad',
        first_air_date: '2008-01-20',
        number_of_seasons: 5,
        number_of_episodes: 62,
        created_by: [{ name: 'Vince Gilligan' }],
        networks: [{ name: 'AMC' }],
        status: 'Ended',
        vote_average: 8.9,
        vote_count: 15000,
      }),
    );
    const d = await getTmdbDetails('tv', 1396);
    expect(d.type).toBe('tv');
    expect(d.facts).toEqual(
      expect.arrayContaining([
        { label: 'Temporadas', value: '5' },
        { label: 'Criação', value: 'Vince Gilligan' },
        { label: 'Emissora', value: 'AMC' },
        { label: 'Status', value: 'Finalizada' },
      ]),
    );
  });
});

describe('filtros de ano e streaming', () => {
  const empty = () => jsonResponse({ page: 1, total_pages: 1, results: [] });

  it('usa o campo de ano certo para filme e série', async () => {
    const fetch = mockFetch(empty(), empty());
    await discover('movie', { year: 1999 });
    await discover('tv', { year: 2008 });
    expect(calledUrl(fetch, 0).params.primary_release_year).toBe('1999');
    expect(calledUrl(fetch, 1).params.first_air_date_year).toBe('2008');
  });

  it('filtra por serviço de streaming no Brasil (só assinatura/grátis, não aluguel)', async () => {
    const fetch = mockFetch(empty());
    await discover('movie', { provider: 8 });
    expect(calledUrl(fetch).params).toMatchObject({
      with_watch_providers: '8',
      watch_region: 'BR',
      with_watch_monetization_types: 'flatrate|free|ads',
    });
  });

  it('afrouxa o mínimo de votos de "mais bem avaliados" quando há filtro de ano', async () => {
    const fetch = mockFetch(empty());
    await discover('movie', { sort: 'top', year: 2020 });
    expect(calledUrl(fetch).params['vote_count.gte']).toBe('100');
  });

  it('lista os serviços do Brasil na ordem de destaque, sem o agregador JustWatch', async () => {
    const fetch = mockFetch(
      jsonResponse({
        results: [
          { provider_id: 2, provider_name: 'Apple TV', logo_path: '/a.jpg', display_priorities: { BR: 5 } },
          { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.jpg', display_priorities: { BR: 1 } },
          { provider_id: 99, provider_name: 'Só nos EUA', logo_path: '/x.jpg', display_priorities: { US: 1 } },
          { provider_id: 3, provider_name: 'JustWatch TV Beta', logo_path: '/j.jpg', display_priorities: { BR: 2 } },
        ],
      }),
    );
    const providers = await getStreamingProviders('movie');
    expect(calledUrl(fetch).path).toBe('/api/tmdb/watch/providers/movie');
    expect(providers.map((p) => p.name)).toEqual(['Netflix', 'Apple TV']);
    expect(providers[0]).toEqual({ id: 8, name: 'Netflix', logo: 'https://image.tmdb.org/t/p/w92/n.jpg' });
  });
});
