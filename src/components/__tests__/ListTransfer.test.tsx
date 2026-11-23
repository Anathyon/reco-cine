import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import { ListToolbar, resolveRefs, SharedListBanner } from '../ListTransfer';
import { getDetails } from '../../lib/media';
import { buildExport } from '../../lib/listTransfer';
import { useFavoritesStore } from '../../store/favoritesStore';
import { useToastStore } from '../../store/toastStore';
import { makeItem, makeRouter } from '../../test/utils';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../lib/media', () => ({ ...jest.requireActual('../../lib/media'), getDetails: jest.fn() }));

const details = (id: number, type: 'movie' | 'tv' | 'anime' = 'movie') => ({
  ...makeItem({ id, type, title: `Título ${id}` }),
  genres: ['Drama'],
  cast: [],
  facts: [],
  originalTitle: null,
  tagline: null,
  trailerKey: null,
  providers: [],
  providersLink: null,
  externalUrl: '',
  externalLabel: '',
});

const lastToast = () => useToastStore.getState().toasts.at(-1)?.message;

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue(makeRouter({ pathname: '/favorites' }));
  useFavoritesStore.setState({ items: {} });
  useToastStore.setState({ toasts: [] });
  (getDetails as jest.Mock).mockReset();
});

describe('resolveRefs', () => {
  it('busca os detalhes mantendo a ordem e ignora os que falham', async () => {
    (getDetails as jest.Mock).mockImplementation(async (type: string, id: number) => {
      if (id === 2) throw new Error('removido');
      return details(id, type as 'movie');
    });
    const items = await resolveRefs([
      { type: 'movie', id: 1 },
      { type: 'movie', id: 2 },
      { type: 'tv', id: 3 },
    ]);
    expect(items.map((i) => `${i.type}-${i.id}`)).toEqual(['movie-1', 'tv-3']);
    expect(items[0]).not.toHaveProperty('genres');
  });

  it('respeita o limite de requisições simultâneas', async () => {
    let active = 0;
    let peak = 0;
    (getDetails as jest.Mock).mockImplementation(async (_t: string, id: number) => {
      peak = Math.max(peak, ++active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return details(id);
    });
    await resolveRefs(Array.from({ length: 10 }, (_, i) => ({ type: 'movie' as const, id: i + 1 })), 3);
    expect(peak).toBe(3);
  });
});

describe('SharedListBanner', () => {
  it('mostra os títulos compartilhados e adiciona todos à lista', async () => {
    (getDetails as jest.Mock).mockImplementation(async (type: string, id: number) => details(id, type as 'movie'));
    const onClose = jest.fn();
    render(<SharedListBanner refs={[{ type: 'movie', id: 101 }, { type: 'anime', id: 102 }]} onClose={onClose} />);

    expect(screen.getByRole('heading', { name: 'Lista compartilhada com 2 títulos' })).toBeInTheDocument();
    expect(await screen.findByText('Título 101')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar à minha lista' }));
    expect(Object.keys(useFavoritesStore.getState().items).sort()).toEqual(['anime-102', 'movie-101']);
    expect(lastToast()).toBe('2 títulos adicionados à sua lista');
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ListToolbar', () => {
  it('sem itens, só oferece importar', () => {
    render(<ListToolbar items={[]} />);
    expect(screen.queryByRole('button', { name: /Compartilhar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Importar arquivo/ })).toBeInTheDocument();
  });

  it('copia o link da lista quando o navegador não tem compartilhamento nativo', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText }, share: undefined });
    render(<ListToolbar items={[makeItem({ id: 550 }), makeItem({ id: 7, type: 'tv' })]} />);

    await act(async () => fireEvent.click(screen.getByRole('button', { name: /Compartilhar lista/ })));
    expect(writeText).toHaveBeenCalledWith('http://localhost/favorites?lista=m550.t7');
    expect(lastToast()).toMatch(/Link da lista copiado/);
  });

  it('importa um backup válido', async () => {
    render(<ListToolbar items={[]} />);
    const file = new File([buildExport([makeItem({ id: 1 }), makeItem({ id: 2 })])], 'lista.json', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText('Arquivo da lista para importar'), { target: { files: [file] } });

    await waitFor(() => expect(lastToast()).toBe('2 títulos importados'));
    expect(Object.keys(useFavoritesStore.getState().items)).toHaveLength(2);
  });

  it('avisa quando o arquivo é inválido', async () => {
    render(<ListToolbar items={[]} />);
    const file = new File(['isso não é json'], 'x.json');
    fireEvent.change(screen.getByLabelText('Arquivo da lista para importar'), { target: { files: [file] } });
    await waitFor(() => expect(lastToast()).toBe('O arquivo não é um JSON válido.'));
  });
});
