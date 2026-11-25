/*
 * Resultados +18 na busca: só para quem está logado e confirmou ter 18 anos ou mais.
 *
 * A data de nascimento fica em users/{uid} no Firestore e não pode ser trocada
 * depois de salva (regras em firestore.rules). Isto controla só a interface:
 * quem libera de fato os resultados é o servidor (adultServer.ts).
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import { isAdult } from '../lib/age';
import { useAuthStore } from './authStore';

/**
 * unavailable    — login desligado (Firebase não configurado).
 * signedOut      — precisa entrar na conta.
 * loading        — conferindo a conta.
 * needsBirthDate — logado, mas ainda não informou a data de nascimento.
 * underage       — menor de 18 anos.
 * allowed        — pode ligar os resultados +18.
 * error          — não foi possível ler a conta.
 */
export type AdultAccess = 'unavailable' | 'signedOut' | 'loading' | 'needsBirthDate' | 'underage' | 'allowed' | 'error';

interface AdultState {
  /** De quem é a data abaixo. */
  uid: string | null;
  /** undefined = ainda não lida; null = não informada. */
  birthDate: string | null | undefined;
  failed: boolean;
  /** Preferência de mostrar +18 (só vale para quem pode). */
  enabled: boolean;
}

const PREF_KEY = 'reco-cine:adult';

const readPref = () => {
  try {
    return localStorage.getItem(PREF_KEY) === '1';
  } catch {
    return false;
  }
};

export const useAdultStore = create<AdultState>(() => ({ uid: null, birthDate: undefined, failed: false, enabled: false }));

export function setAdultEnabled(enabled: boolean) {
  useAdultStore.setState({ enabled });
  try {
    if (enabled) localStorage.setItem(PREF_KEY, '1');
    else localStorage.removeItem(PREF_KEY);
  } catch {
    /* armazenamento indisponível */
  }
}

let loading: string | null = null;

export async function loadBirthDate(uid: string, force = false) {
  const state = useAdultStore.getState();
  if (!force && (loading === uid || (state.uid === uid && state.birthDate !== undefined))) return;
  loading = uid;
  useAdultStore.setState({ uid, birthDate: undefined, failed: false, enabled: false });
  try {
    const { loadFirebase } = await import('../lib/firebase');
    const { db } = await loadFirebase();
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(db, 'users', uid));
    if (useAdultStore.getState().uid !== uid) return; // trocou de conta no meio
    const birthDate = snap.exists() && typeof snap.data().birthDate === 'string' ? (snap.data().birthDate as string) : null;
    useAdultStore.setState({ birthDate, enabled: isAdult(birthDate) && readPref() });
  } catch {
    if (useAdultStore.getState().uid === uid) useAdultStore.setState({ failed: true });
  } finally {
    if (loading === uid) loading = null;
  }
}

/** Salva a data de nascimento (uma vez só) e liga os resultados +18 se a pessoa for maior. */
export async function saveBirthDate(birthDate: string) {
  const uid = useAuthStore.getState().user?.uid;
  if (!uid) throw new Error('Entre na sua conta primeiro.');
  const { loadFirebase } = await import('../lib/firebase');
  const { db } = await loadFirebase();
  const { doc, serverTimestamp, setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'users', uid), { birthDate, confirmedAt: serverTimestamp() });
  useAdultStore.setState({ uid, birthDate, failed: false });
  setAdultEnabled(isAdult(birthDate));
}

export function resetAdult() {
  loading = null;
  useAdultStore.setState({ uid: null, birthDate: undefined, failed: false, enabled: false });
}

/** Situação da pessoa em relação aos resultados +18 (carrega a conta quando preciso). */
export function useAdultAccess(): { access: AdultAccess; enabled: boolean } {
  const status = useAuthStore((s) => s.status);
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const { uid: loadedFor, birthDate, failed, enabled } = useAdultStore();

  useEffect(() => {
    if (uid) loadBirthDate(uid);
    else if (status === 'signedOut' || status === 'disabled') resetAdult();
  }, [uid, status]);

  let access: AdultAccess;
  if (status === 'disabled') access = 'unavailable';
  else if (status === 'signedOut') access = 'signedOut';
  else if (status === 'loading' || !uid || loadedFor !== uid) access = 'loading';
  else if (failed) access = 'error';
  else if (birthDate === undefined) access = 'loading';
  else if (birthDate === null) access = 'needsBirthDate';
  else access = isAdult(birthDate) ? 'allowed' : 'underage';

  return { access, enabled: access === 'allowed' && enabled };
}
