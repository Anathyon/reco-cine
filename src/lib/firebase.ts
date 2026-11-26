/*
 * Configuração do Firebase (login com Google + Firestore para a lista).
 *
 * Estas chaves são públicas por natureza: identificam o projeto, não dão acesso.
 * Quem protege os dados são as regras do Firestore (firestore.rules).
 *
 * O SDK é carregado sob demanda (import dinâmico), então não pesa no primeiro
 * carregamento das páginas.
 */
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// Referências literais: o Next só embute no bundle variáveis NEXT_PUBLIC_ escritas assim.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = () =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);

type Place = Pick<Location, 'hostname' | 'host' | 'protocol'>;

/**
 * Em produção o login passa pelo próprio domínio do site: o next.config.ts
 * repassa /__/auth/* para <projeto>.firebaseapp.com. Assim a sessão não depende
 * de cookies de terceiros, que vários navegadores bloqueiam. Em localhost
 * (desenvolvimento) usa o domínio do Firebase, que funciona sem configuração extra.
 */
export function authDomain(place: Place | undefined = typeof window === 'undefined' ? undefined : window.location): string | undefined {
  if (!place) return firebaseConfig.authDomain;
  const { hostname, host, protocol } = place;
  const local = hostname === 'localhost' || hostname === '127.0.0.1' || protocol !== 'https:';
  return local ? firebaseConfig.authDomain : host;
}

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let services: Promise<FirebaseServices> | null = null;

export function loadFirebase(): Promise<FirebaseServices> {
  if (!services) {
    services = (async () => {
      const [{ initializeApp, getApps }, { getAuth }, { getFirestore }] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ]);
      const app = getApps()[0] ?? initializeApp({ ...firebaseConfig, authDomain: authDomain() });
      return { app, auth: getAuth(app), db: getFirestore(app) };
    })();
    services.catch(() => {
      services = null;
    });
  }
  return services;
}
