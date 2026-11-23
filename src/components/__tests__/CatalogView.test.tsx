import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import CatalogView, { type CatalogFilters } from '../CatalogView';
import { getStreamingProviders } from '../../lib/tmdb';
import { makeItem, makeRouter, type MockRouter } from '../../test/utils';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../lib/tmdb', () => ({ ...jest.requireActual('../../lib/tmdb'), getStreamingProviders: jest.fn() }));

let router: MockRouter;
let testId = 0;
const fetchPage = jest.fn();

function setup(query: Record<string, string> = {}, { withProviders = true } = {}) {
  const providerType = withProviders ? ('movie' as const) : undefined;
  // tipo único por teste: as listas ficam em cache por chave.
  const type = 'movie';
  router = makeRouter({ pathname: '/movies', query: { ...query, _t: String(++testId) } });
  (useRouter as jest.Mock).mockReturnValue(router);
  return render(
    <CatalogView
      type={type}
      title="Filmes"
      description="desc"
      genres={[
        { id: 28, name: 'Ação' },
        { id: 18, name: 'Drama' },
      ]}
      sortLabels={{ popular: 'Mais populares', top: 'Mais bem avaliados', recent: 'Lançamentos' }}
      fetchPage={(f) => fetchPage({ ...f, t: testId })}
      providerType={providerType}
    />,
  );
}

const lastFilters = (): CatalogFilters => fetchPage.mock.calls.at(-1)[0];
const lastQuery = () => router.replace.mock.calls.at(-1)[0].query;

beforeEach(() => {
  fetchPage.mockReset().mockResolvedValue({ items: [makeItem()], page: 1, hasMore: false });
  (getStreamingProviders as jest.Mock).mockResolvedValue([
    { id: 8, name: 'Netflix', logo: null },
    { id: 119, name: 'Prime Video', logo: null },
  ]);
});

it('lê os filtros da URL e busca com eles', async () => {
  setup({ genre: '28', sort: 'top', year: '1999', provider: '8' });
  await waitFor(() => expect(fetchPage).toHaveBeenCalled());
  expect(lastFilters()).toMatchObject({ genre: 28, sort: 'top', year: 1999, provider: 8, page: 1 });
  expect(screen.getByLabelText('Ano de lançamento')).toHaveValue('1999');
});

it('ignora valores inválidos na URL', async () => {
  setup({ sort: 'hackeado', year: '1700' });
  await waitFor(() => expect(fetchPage).toHaveBeenCalled());
  expect(lastFilters()).toMatchObject({ sort: 'popular', year: undefined });
});

it('escolher gênero, ano e streaming atualiza a URL', async () => {
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Drama' }));
  expect(lastQuery()).toEqual({ genre: '18' });

  fireEvent.change(screen.getByLabelText('Ano de lançamento'), { target: { value: '2020' } });
  expect(lastQuery()).toEqual({ year: '2020' });

  await screen.findByRole('option', { name: 'Netflix' });
  fireEvent.change(screen.getByLabelText('Onde assistir'), { target: { value: '8' } });
  expect(lastQuery()).toEqual({ provider: '8' });
});

it('"Limpar filtros" não aparece sem filtro ativo', async () => {
  setup();
  expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  await screen.findByRole('option', { name: 'Netflix' });
});

it('"Limpar filtros" remove todos os filtros', async () => {
  setup({ genre: '28', year: '2001' });
  fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  expect(router.replace).toHaveBeenLastCalledWith({ pathname: '/movies' }, undefined, expect.anything());
  await screen.findAllByRole('article');
});

it('sem providerType (animes) não mostra o filtro de streaming', async () => {
  setup({}, { withProviders: false });
  expect(screen.queryByLabelText('Onde assistir')).not.toBeInTheDocument();
  expect(getStreamingProviders).not.toHaveBeenCalled();
  await screen.findAllByRole('article');
});

it('mostra mensagem quando nada é encontrado', async () => {
  fetchPage.mockResolvedValue({ items: [], page: 1, hasMore: false });
  setup({ genre: '18' });
  expect(await screen.findByText('Nenhum título encontrado com esses filtros.')).toBeInTheDocument();
});
