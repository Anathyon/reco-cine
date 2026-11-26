import { makeItem } from '../../test/utils';

type AuthModule = typeof import('../authStore');
type FavModule = typeof import('../favoritesStore');

const mockConfigured = { value: true };
const mockAuthCallback: { fn: ((user: unknown) => Promise<void>) | null } = { fn: null };
const mockPopup = jest.fn();
const mockRedirect = jest.fn();
const mockRedirectResult = jest.fn();
const mockSignOut = jest.fn();
const mockStartSync = jest.fn();
const mockToast = jest.fn();

jest.mock('../../lib/firebase', () => ({
  isFirebaseConfigured: () => mockConfigured.value,
  loadFirebase: async () => ({ auth: { name: 'auth' }, db: {} }),
}));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (user: unknown) => Promise<void>) => {
    mockAuthCallback.fn = cb;
    return () => undefined;
  },
  GoogleAuthProvider: class {
    setCustomParameters() {}
  },
  signInWithPopup: (...args: unknown[]) => mockPopup(...args),
  signInWithRedirect: (...args: unknown[]) => mockRedirect(...args),
  getRedirectResult: (...args: unknown[]) => mockRedirectResult(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));
jest.mock('../../lib/favoritesSync', () => ({ startFavoritesSync: (...args: unknown[]) => mockStartSync(...args) }));
jest.mock('../toastStore', () => ({ toast: (...args: unknown[]) => mockToast(...args) }));

let auth: AuthModule;
let fav: FavModule;
const stop = jest.fn();

beforeEach(async () => {
  jest.resetModules();
  jest.clearAllMocks();
  localStorage.clear();
  mockConfigured.value = true;
  mockAuthCallback.fn = null;
  mockStartSync.mockResolvedValue({ uploaded: 0, stop });
  mockRedirectResult.mockResolvedValue(null);
  fav = await import('../favoritesStore');
  auth = await import('../authStore');
  fav.useFavoritesStore.setState({ items: {}, hydrated: true });
});

const state = () => auth.useAuthStore.getState();
const googleUser = { uid: 'u1', displayName: 'Ana', email: 'ana@exemplo.com', photoURL: null };

async function start() {
  await auth.initAuth();
  expect(mockAuthCallback.fn).not.toBeNull();
}

it('sem Firebase configurado, fica desativado e não carrega nada', async () => {
  mockConfigured.value = false;
  await auth.initAuth();
  expect(state().status).toBe('disabled');
  expect(mockAuthCallback.fn).toBeNull();
});

it('ao entrar, guarda o usuário e liga a sincronização somando a lista do aparelho', async () => {
  await start();
  await mockAuthCallback.fn!(googleUser);
  expect(state()).toMatchObject({ status: 'signedIn', sync: 'synced', user: { uid: 'u1', name: 'Ana', email: 'ana@exemplo.com' } });
  expect(mockStartSync).toHaveBeenCalledWith(expect.anything(), 'u1', expect.any(Function), true);
});

it('avisa quantos títulos do aparelho foram para a conta', async () => {
  mockStartSync.mockResolvedValue({ uploaded: 3, stop });
  await start();
  await mockAuthCallback.fn!(googleUser);
  expect(mockToast).toHaveBeenCalledWith('3 títulos deste aparelho foram salvos na sua conta');
});

it('ao recarregar já logado, a cópia local não é somada de novo', async () => {
  await start();
  await mockAuthCallback.fn!(googleUser);

  // Nova visita: módulos recarregados, mesmo localStorage.
  jest.resetModules();
  fav = await import('../favoritesStore');
  auth = await import('../authStore');
  fav.useFavoritesStore.setState({ items: {}, hydrated: true });
  await start();
  await mockAuthCallback.fn!(googleUser);
  expect(mockStartSync).toHaveBeenLastCalledWith(expect.anything(), 'u1', expect.any(Function), false);
});

it('ao sair, para a sincronização e limpa a lista da conta do aparelho', async () => {
  await start();
  await mockAuthCallback.fn!(googleUser);
  fav.useFavoritesStore.getState().toggle(makeItem());

  await mockAuthCallback.fn!(null);
  expect(stop).toHaveBeenCalled();
  expect(state()).toMatchObject({ status: 'signedOut', user: null });
  expect(fav.useFavoritesStore.getState().items).toEqual({});
});

it('visitante sem login mantém a lista do aparelho', async () => {
  await start();
  fav.useFavoritesStore.getState().toggle(makeItem());
  await mockAuthCallback.fn!(null);
  expect(state().status).toBe('signedOut');
  expect(Object.keys(fav.useFavoritesStore.getState().items)).toEqual(['movie-550']);
});

it('falha na sincronização vira aviso, sem derrubar o login', async () => {
  mockStartSync.mockRejectedValue(new Error('permission-denied'));
  await start();
  await mockAuthCallback.fn!(googleUser);
  expect(state()).toMatchObject({ status: 'signedIn', sync: 'error' });
  expect(mockToast).toHaveBeenCalledWith('Não foi possível sincronizar sua lista agora.');
});

it('erro na volta do login pela própria aba vira aviso', async () => {
  mockRedirectResult.mockRejectedValue({ code: 'auth/unauthorized-domain' });
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  await start();
  await new Promise((r) => setTimeout(r, 0));
  expect(mockToast).toHaveBeenCalledWith('Não foi possível entrar. Tente de novo.');
});

describe('signIn', () => {
  it('usa o popup do Google', async () => {
    mockPopup.mockResolvedValue({});
    await state().signIn();
    expect(mockPopup).toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('fechar o popup não é erro', async () => {
    mockPopup.mockRejectedValue({ code: 'auth/popup-closed-by-user' });
    await state().signIn();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('popup bloqueado: faz o login na própria aba', async () => {
    mockPopup.mockRejectedValue({ code: 'auth/popup-blocked' });
    await state().signIn();
    expect(mockRedirect).toHaveBeenCalled();
  });

  it('se o login na própria aba também falhar, mostra aviso em vez de estourar', async () => {
    mockPopup.mockRejectedValue({ code: 'auth/popup-blocked' });
    mockRedirect.mockRejectedValue({ code: 'auth/unauthorized-domain' });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(state().signIn()).resolves.toBeUndefined();
    expect(mockToast).toHaveBeenCalledWith('Não foi possível entrar. Tente de novo.');
  });

  it('outros erros mostram aviso', async () => {
    mockPopup.mockRejectedValue({ code: 'auth/network-request-failed' });
    await state().signIn();
    expect(mockToast).toHaveBeenCalledWith('Sem conexão. Tente entrar de novo.');
  });
});
