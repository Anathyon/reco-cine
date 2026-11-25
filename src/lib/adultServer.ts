/*
 * Confere, SOMENTE no servidor, se quem pede resultados +18 está logado e tem 18 anos ou mais.
 *
 * O navegador manda o token de login do Firebase (Authorization: Bearer …). O servidor
 * lê users/{uid} no Firestore usando esse mesmo token: o Google valida a assinatura e
 * as regras do Firestore garantem que o token é do dono do documento. Assim não é
 * preciso chave de serviço, e um token falso ou de outra pessoa não passa.
 */
import type { IncomingMessage } from 'http';
import { isAdult } from './age';

export type AdultCheck = 'ok' | 'signedOut' | 'noBirthDate' | 'underage' | 'error';

const projectId = () => process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';

/** Lê o conteúdo do JWT sem validar a assinatura (quem valida é o Firestore). */
export function readToken(token: string): { uid: string; exp: number; aud: string; iss: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'));
    const uid = payload.user_id || payload.sub;
    if (typeof uid !== 'string' || !/^[\w-]{1,128}$/.test(uid) || typeof payload.exp !== 'number') return null;
    return { uid, exp: payload.exp, aud: String(payload.aud), iss: String(payload.iss) };
  } catch {
    return null;
  }
}

export function bearer(req: Pick<IncomingMessage, 'headers'>): string | null {
  const header = req.headers?.authorization;
  const m = typeof header === 'string' ? /^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/.exec(header) : null;
  return m ? m[1] : null;
}

/** Resultado por token por alguns minutos, para não ler o Firestore a cada página. */
const cache = new Map<string, { result: AdultCheck; until: number }>();
const CACHE_MS = 5 * 60 * 1000;
const CACHE_MAX = 1000;

export function clearAdultCache() {
  cache.clear();
}

export async function checkAdult(req: Pick<IncomingMessage, 'headers'>, now = Date.now()): Promise<AdultCheck> {
  const token = bearer(req);
  const project = projectId();
  if (!token || !project) return 'signedOut';

  const claims = readToken(token);
  if (
    !claims ||
    claims.aud !== project ||
    claims.iss !== `https://securetoken.google.com/${project}` ||
    claims.exp * 1000 <= now
  ) {
    return 'signedOut';
  }

  const hit = cache.get(token);
  if (hit && hit.until > now) return hit.result;

  let result: AdultCheck;
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/users/${claims.uid}?mask.fieldPaths=birthDate`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) },
    );
    if (res.status === 404) result = 'noBirthDate';
    else if (res.status === 401 || res.status === 403) result = 'signedOut';
    else if (!res.ok) return 'error';
    else {
      const doc = await res.json();
      const birthDate = doc?.fields?.birthDate?.stringValue;
      result = !birthDate ? 'noBirthDate' : isAdult(birthDate, new Date(now)) ? 'ok' : 'underage';
    }
  } catch {
    return 'error';
  }

  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(token, { result, until: Math.min(now + CACHE_MS, claims.exp * 1000) });
  return result;
}

export const ADULT_ERRORS: Record<Exclude<AdultCheck, 'ok'>, { status: number; error: string }> = {
  signedOut: { status: 401, error: 'Entre na sua conta para ver resultados +18' },
  noBirthDate: { status: 403, error: 'Confirme sua data de nascimento para ver resultados +18' },
  underage: { status: 403, error: 'Resultados +18 são só para maiores de 18 anos' },
  error: { status: 503, error: 'Não foi possível confirmar sua idade agora. Tente de novo.' },
};
