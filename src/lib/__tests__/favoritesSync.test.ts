import { makeItem } from '../../test/utils';
import { useFavoritesStore, type FavoriteItem } from '../../store/favoritesStore';
import type { FirebaseServices } from '../firebase';
import { diffItems, fromDoc, mergeOnLogin, startFavoritesSync, toDoc } from '../favoritesSync';

/* ---------- Firestore em memória ---------- */

type Listener = (snap: { docs: { data: () => Record<string, unknown> }[] }) => void;
const remoteDb = new Map<string, Record<string, unknown>>();
const listeners = new Set<Listener>();
const commits: { set: string[]; delete: string[] }[] = [];
let failCommits = false;

const snapshot = () => ({ docs: [...remoteDb.values()].map((d) => ({ data: () => d })) });
const emit = () => listeners.forEach((l) => l(snapshot()));

jest.mock('firebase/firestore', () => ({
  collection: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  doc: (col: { path: string }, id: string) => ({ path: `${col.path}/${id}`, id }),
  getDocs: async () => snapshot(),
  onSnapshot: (_col: unknown, next: Listener) => {
    listeners.add(next);
    return () => listeners.delete(next);
  },
  writeBatch: () => {
    const ops: (() => void)[] = [];
    const record = { set: [] as string[], delete: [] as string[] };
    return {
      set: (ref: { id: string }, data: Record<string, unknown>) => {
        record.set.push(ref.id);
        ops.push(() => remoteDb.set(ref.id, data));
      },
      delete: (ref: { id: string }) => {
        record.delete.push(ref.id);
        ops.push(() => remoteDb.delete(ref.id));
      },
      commit: async () => {
        if (failCommits) throw new Error('offline');
        ops.forEach((op) => op());
        commits.push(record);
        emit();
      },
    };
  },
}));

const services = { db: {} } as unknown as FirebaseServices;
const fav = (overrides: Partial<FavoriteItem> = {}): FavoriteItem => ({ ...makeItem(overrides), addedAt: 1000, ...overrides });
const store = () => useFavoritesStore.getState();
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  remoteDb.clear();
  listeners.clear();
  commits.length = 0;
  failCommits = false;
  useFavoritesStore.setState({ items: {}, hydrated: true });
});

/* ---------- funções puras ---------- */

describe('toDoc / fromDoc', () => {
  it('troca undefined por null e corta textos enormes', () => {
    const doc = toDoc({ ...fav(), poster: undefined as unknown as null, overview: 'x'.repeat(9000) });
    expect(doc.poster).toBeNull();
    expect(doc.overview).toHaveLength(5000);
    expect(Object.values(doc)).not.toContain(undefined);
  });

  it('ignora documentos inválidos', () => {
    expect(fromDoc({ id: 'abc', type: 'movie' })).toBeNull();
    expect(fromDoc({ id: 1, type: 'podcast' })).toBeNull();
    expect(fromDoc(toDoc(fav({ id: 7, type: 'anime' })))).toMatchObject({ id: 7, type: 'anime' });
  });
});

it('mergeOnLogin soma a lista do aparelho, e a versão da conta vence', () => {
  const local = { 'movie-1': fav({ id: 1, title: 'Local' }), 'movie-2': fav({ id: 2 }) };
  const remote = { 'movie-1': fav({ id: 1, title: 'Conta' }), 'tv-3': fav({ id: 3, type: 'tv' }) };
  const { merged, toUpload } = mergeOnLogin(local, remote);
  expect(Object.keys(merged).sort()).toEqual(['movie-1', 'movie-2', 'tv-3']);
  expect(merged['movie-1'].title).toBe('Conta');
  expect(toUpload.map((i) => i.id)).toEqual([2]);
});

it('diffItems encontra adições, alterações e remoções', () => {
  const a = fav({ id: 1 });
  const prev = { 'movie-1': a, 'movie-2': fav({ id: 2 }) };
  const next = { 'movie-1': a, 'movie-3': fav({ id: 3 }) };
  expect(diffItems(prev, next)).toEqual({ upserts: [next['movie-3']], deletes: ['movie-2'] });
});

/* ---------- sincronização ---------- */

describe('startFavoritesSync', () => {
  it('ao entrar, envia à conta o que só existia no aparelho', async () => {
    remoteDb.set('tv-9', toDoc(fav({ id: 9, type: 'tv', title: 'Da conta' })));
    store().toggle(makeItem({ id: 1, title: 'Do aparelho' }));

    const sync = await startFavoritesSync(services, 'u1', jest.fn());
    expect(sync.uploaded).toBe(1);
    expect([...remoteDb.keys()].sort()).toEqual(['movie-1', 'tv-9']);
    expect(Object.keys(store().items).sort()).toEqual(['movie-1', 'tv-9']);
    sync.stop();
  });

  it('com mergeLocal = false, a lista da conta substitui a cópia do aparelho', async () => {
    remoteDb.set('tv-9', toDoc(fav({ id: 9, type: 'tv' })));
    store().toggle(makeItem({ id: 1 })); // apagado em outro aparelho

    const sync = await startFavoritesSync(services, 'u1', jest.fn(), false);
    expect(sync.uploaded).toBe(0);
    expect(Object.keys(store().items)).toEqual(['tv-9']);
    expect(remoteDb.has('movie-1')).toBe(false);
    sync.stop();
  });

  it('favoritar e remover no aparelho vira escrita no Firestore', async () => {
    const sync = await startFavoritesSync(services, 'u1', jest.fn());
    store().toggle(makeItem({ id: 5 }));
    await flush();
    expect(remoteDb.get('movie-5')).toMatchObject({ id: 5, type: 'movie', title: 'Clube da Luta' });

    store().remove({ id: 5, type: 'movie' });
    await flush();
    expect(remoteDb.has('movie-5')).toBe(false);
    sync.stop();
  });

  it('mudanças de outro aparelho chegam sem serem reenviadas', async () => {
    const sync = await startFavoritesSync(services, 'u1', jest.fn());
    const before = commits.length;
    remoteDb.set('anime-7', toDoc(fav({ id: 7, type: 'anime', title: 'Frieren' })));
    emit();
    await flush();
    expect(store().items['anime-7']).toMatchObject({ title: 'Frieren' });
    expect(commits.length).toBe(before);
    sync.stop();
  });

  it('depois de parar, nada mais é sincronizado', async () => {
    const sync = await startFavoritesSync(services, 'u1', jest.fn());
    sync.stop();
    store().toggle(makeItem({ id: 8 }));
    await flush();
    expect(remoteDb.has('movie-8')).toBe(false);
    expect(listeners.size).toBe(0);
  });

  it('avisa falhas de escrita sem quebrar a lista local', async () => {
    const onError = jest.fn();
    const sync = await startFavoritesSync(services, 'u1', onError);
    failCommits = true;
    store().toggle(makeItem({ id: 4 }));
    await flush();
    expect(onError).toHaveBeenCalled();
    expect(store().items['movie-4']).toBeDefined();
    sync.stop();
  });
});
