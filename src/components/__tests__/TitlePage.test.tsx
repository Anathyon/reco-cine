import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import TitlePage from '../../pages/title/[type]/[id]';
import { getDetails, getSimilar } from '../../lib/media';
import { makeItem, makeRouter } from '../../test/utils';
import type { MediaDetails } from '../../types';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../lib/media', () => ({
  ...jest.requireActual('../../lib/media'),
  getDetails: jest.fn(),
  getSimilar: jest.fn().mockResolvedValue([]),
}));

const details: MediaDetails = {
  ...makeItem({ id: 1396, type: 'tv', title: 'Breaking Bad', year: '2008' }),
  originalTitle: null,
  tagline: null,
  genres: ['Drama'],
  facts: [],
  cast: [],
  trailerKey: null,
  providers: [],
  providersLink: null,
  externalUrl: 'https://www.themoviedb.org/tv/1396',
  externalLabel: 'Ver no TMDB',
};

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue(makeRouter({ pathname: '/title/[type]/[id]', query: { type: 'tv', id: '1396' } }));
});

it('renderiza os dados do servidor imediatamente, com o título como h1', () => {
  render(<TitlePage type="tv" id={1396} details={details} siteUrl="https://reco.app" />);
  expect(screen.getByRole('heading', { level: 1, name: 'Breaking Bad' })).toBeInTheDocument();
  expect(getDetails).not.toHaveBeenCalled();
  expect(screen.queryByRole('link', { name: 'Abrir página do título' })).not.toBeInTheDocument();
  return waitFor(() => expect(getSimilar).toHaveBeenCalled());
});

it('tem um atalho de volta para o catálogo do tipo', () => {
  render(<TitlePage type="tv" id={1396} details={details} siteUrl="https://reco.app" />);
  expect(screen.getByRole('link', { name: /Séries/ })).toHaveAttribute('href', '/series');
});

it('sem dados do servidor, busca no navegador', async () => {
  (getDetails as jest.Mock).mockResolvedValue({ ...details, id: 9999 });
  render(<TitlePage type="tv" id={9999} details={null} siteUrl="https://reco.app" />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Breaking Bad' })).toBeInTheDocument();
  expect(getDetails).toHaveBeenCalledWith('tv', 9999);
  expect(getSimilar).toHaveBeenCalled();
});
