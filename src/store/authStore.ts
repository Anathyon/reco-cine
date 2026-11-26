import { create } from 'zustand';
import { isFirebaseConfigured, loadFirebase } from '../lib/firebase';
import { startFavoritesSync, type SyncHandle } from '../lib/favoritesSync';
import { useFavoritesStore } from './favoritesStore';
import { toast } from './toastStore';

export interface AuthUser {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
}

/**
 * disabled  — Firebase não configurado: o app funciona só com a lista local.
 * loading   — verificando se há alguém logado.
 */
export type AuthStatus = 'disabled' | 'loading' | 'signedOut' | 'signedIn';
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  sync: SyncStatus;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/** Erros do popup que não são falhas (a pessoa só desistiu). */
const CANCELLED = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled']);

const errorCode = (err: unknown) => (err as { code?: string })?.code ?? '';

export const useAuthStore = create<AuthState>(() => ({
  status: 'loading',
  user: null,
  sync: 'idle',

  signIn: async () => {
    const { auth } = await loadFirebase();
    const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      let code = errorCode(err);
      if (CANCELLED.has(code)) return;
      // Navegadores que bloqueiam popups (alguns celulares/apps): faz o login na própria aba.
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          code = errorCode(redirectErr);
        }
      }
      if (code === 'auth/unauthorized-domain') {
        // Falta este domínio em Authentication → Configurações → Domínios autorizados.
        console.error(`[auth] Domínio não autorizado no Firebase: ${window.location.hostname}`);
      }
      toast(code === 'auth/network-request-failed' ? 'Sem conexão. Tente entrar de novo.' : 'Não foi possível entrar. Tente de novo.');
    }
  },

  signOut: async () => {
    const { auth } = await loadFirebase();
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  },
}));

/**
 * De quem é a lista guardada no aparelho. Sem dono, ela foi montada sem login e
 * é somada à conta ao entrar. Com dono, é só uma cópia da conta: a versão do
 * Firestore substitui (senão títulos apagados em outro aparelho voltariam).
 */
const OWNER_KEY = 'reco-cine:favorites-owner';
const owner = {
  get: () => {
    try {
      return localStorage.getItem(OWNER_KEY);
    } catch {
      return null;
    }
  },
  set: (uid: string | null) => {
    try {
      if (uid) localStorage.setItem(OWNER_KEY, uid);
      else localStorage.removeItem(OWNER_KEY);
    } catch {
      /* armazenamento indisponível (modo privado) */
    }
  },
};

let started = false;
let sync: SyncHandle | null = null;

const waitForFavorites = () =>
  new Promise<void>((resolve) => {
    if (useFavoritesStore.getState().hydrated) return resolve();
    const unsubscribe = useFavoritesStore.subscribe((s) => {
      if (s.hydrated) {
        unsubscribe();
        resolve();
      }
    });
  });

/** Liga o login e a sincronização. Chamado uma vez, no navegador (_app). */
export async function initAuth() {
  if (started) return;
  started = true;

  if (!isFirebaseConfigured()) {
    useAuthStore.setState({ status: 'disabled' });
    return;
  }

  try {
    const services = await loadFirebase();
    const { onAuthStateChanged } = await import('firebase/auth');
    await waitForFavorites();

    // undefined = ainda não sabemos; null = ninguém logado.
    let current: string | null | undefined = undefined;
    onAuthStateChanged(services.auth, async (fbUser) => {
      const uid = fbUser?.uid ?? null;
      if (uid === current) return;
      const wasSignedIn = typeof current === 'string';
      current = uid;

      sync?.stop();
      sync = null;

      if (!fbUser) {
        useAuthStore.setState({ status: 'signedOut', user: null, sync: 'idle' });
        // A lista da conta não fica no aparelho depois de sair (aparelhos compartilhados).
        if (wasSignedIn || owner.get()) {
          useFavoritesStore.setState({ items: {} });
          owner.set(null);
        }
        return;
      }

      useAuthStore.setState({
        status: 'signedIn',
        user: { uid: fbUser.uid, name: fbUser.displayName, email: fbUser.email, photo: fbUser.photoURL },
        sync: 'syncing',
      });

      try {
        const guestList = owner.get() === null;
        const handle = await startFavoritesSync(services, fbUser.uid, () => useAuthStore.setState({ sync: 'error' }), guestList);
        if (current !== fbUser.uid) return handle.stop(); // saiu enquanto sincronizava
        sync = handle;
        owner.set(fbUser.uid);
        useAuthStore.setState({ sync: 'synced' });
        if (handle.uploaded > 0) {
          toast(handle.uploaded === 1 ? '1 título deste aparelho foi salvo na sua conta' : `${handle.uploaded} títulos deste aparelho foram salvos na sua conta`);
        }
      } catch {
        useAuthStore.setState({ sync: 'error' });
        toast('Não foi possível sincronizar sua lista agora.');
      }
    });
  } catch {
    // Sem rede para baixar o SDK, por exemplo: segue só com a lista local.
    useAuthStore.setState({ status: 'disabled' });
  }
}
