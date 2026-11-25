/*
 * Sincroniza a lista (favoritesStore) com o Firestore enquanto há alguém logado.
 *
 *   users/{uid}/favorites/{tipo-id}   um documento por título
 *
 * Ao entrar, os títulos salvos no aparelho antes do login são somados à conta
 * (nada se perde). Depois disso, o Firestore é a fonte da verdade: mudanças
 * locais viram escritas, e mudanças vindas de outros aparelhos chegam em tempo real.
 */
import type { MediaType } from '../types';
import { mediaKey } from './media';
import { useFavoritesStore, type FavoriteItem } from '../store/favoritesStore';
import type { FirebaseServices } from './firebase';

type Items = Record<string, FavoriteItem>;

const TYPES = new Set<MediaType>(['movie', 'tv', 'anime', 'manga']);
/** Limite de operações por lote do Firestore. */
const BATCH_LIMIT = 450;

/* ---------- funções puras (testadas à parte) ---------- */

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Só os campos conhecidos, sem `undefined` (o Firestore recusa). */
export function toDoc(item: FavoriteItem) {
  return {
    id: item.id,
    type: item.type,
    title: str(item.title, 300) || 'Sem título',
    poster: str(item.poster, 500),
    backdrop: str(item.backdrop, 500),
    year: str(item.year, 10),
    rating: num(item.rating),
    overview: str(item.overview, 5000) || '',
    addedAt: Math.round(num(item.addedAt) ?? Date.now()),
  };
}

/** Lê um documento do Firestore; ignora dados inválidos em vez de quebrar a lista. */
export function fromDoc(data: Record<string, unknown>): FavoriteItem | null {
  const id = num(data.id);
  const type = data.type as MediaType;
  if (id === null || !Number.isInteger(id) || !TYPES.has(type)) return null;
  return {
    id,
    type,
    title: str(data.title, 300) || 'Sem título',
    poster: str(data.poster, 500),
    backdrop: str(data.backdrop, 500),
    year: str(data.year, 10),
    rating: num(data.rating),
    overview: str(data.overview, 5000) || '',
    addedAt: num(data.addedAt) ?? 0,
  };
}

/** Soma a lista do aparelho à da conta. A versão da conta vence quando o título está nas duas. */
export function mergeOnLogin(local: Items, remote: Items) {
  const toUpload = Object.keys(local).filter((key) => !remote[key]);
  const merged: Items = { ...remote };
  for (const key of toUpload) merged[key] = local[key];
  return { merged, toUpload: toUpload.map((key) => local[key]) };
}

/** O que mudou entre duas versões da lista. */
export function diffItems(prev: Items, next: Items) {
  const upserts = Object.keys(next)
    .filter((key) => prev[key] !== next[key])
    .map((key) => next[key]);
  const deletes = Object.keys(prev).filter((key) => !next[key]);
  return { upserts, deletes };
}

/* ---------- sincronização ---------- */

export interface SyncHandle {
  /** Quantos títulos do aparelho foram somados à conta ao entrar. */
  uploaded: number;
  stop: () => void;
}

export async function startFavoritesSync(
  { db }: FirebaseServices,
  uid: string,
  onError: (err: unknown) => void,
  /** Somar a lista do aparelho à conta? Só quando ela foi montada sem login. */
  mergeLocal = true,
): Promise<SyncHandle> {
  const { collection, doc, getDocs, onSnapshot, writeBatch } = await import('firebase/firestore');
  const col = collection(db, 'users', uid, 'favorites');

  async function write(upserts: FavoriteItem[], deletes: string[]) {
    const ops = [
      ...upserts.map((item) => (b: ReturnType<typeof writeBatch>) => b.set(doc(col, mediaKey(item)), toDoc(item))),
      ...deletes.map((key) => (b: ReturnType<typeof writeBatch>) => b.delete(doc(col, key))),
    ];
    for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      ops.slice(i, i + BATCH_LIMIT).forEach((op) => op(batch));
      await batch.commit();
    }
  }

  const readSnapshot = (docs: { data: () => Record<string, unknown> }[]) => {
    const items: Items = {};
    for (const d of docs) {
      const item = fromDoc(d.data());
      if (item) items[mediaKey(item)] = item;
    }
    return items;
  };

  // Mudanças aplicadas a partir do Firestore não devem voltar para ele.
  let applyingRemote = false;
  const applyRemote = (items: Items) => {
    applyingRemote = true;
    try {
      useFavoritesStore.setState({ items });
    } finally {
      applyingRemote = false;
    }
  };

  // 1. Junta a lista do aparelho com a da conta (ou só carrega a da conta).
  const remote = readSnapshot((await getDocs(col)).docs);
  const { merged, toUpload } = mergeOnLogin(mergeLocal ? useFavoritesStore.getState().items : {}, remote);
  await write(toUpload, []);
  applyRemote(merged);

  // 2. Mudanças locais → Firestore.
  const unsubscribeStore = useFavoritesStore.subscribe((state, prev) => {
    if (applyingRemote || state.items === prev.items) return;
    const { upserts, deletes } = diffItems(prev.items, state.items);
    if (upserts.length || deletes.length) write(upserts, deletes).catch(onError);
  });

  // 3. Firestore → aparelho (outros dispositivos, outra aba).
  const unsubscribeSnapshot = onSnapshot(col, (snap) => applyRemote(readSnapshot(snap.docs)), onError);

  return {
    uploaded: toUpload.length,
    stop: () => {
      unsubscribeStore();
      unsubscribeSnapshot();
    },
  };
}
