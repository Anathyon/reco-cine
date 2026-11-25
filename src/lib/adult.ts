/*
 * Navegador: token de login enviado nas buscas +18. O servidor (adultServer.ts)
 * é quem confere a idade; isto só identifica quem está pedindo.
 */
export async function adultAuthHeader(): Promise<Record<string, string>> {
  const { loadFirebase } = await import('./firebase');
  const { auth } = await loadFirebase();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Entre na sua conta para ver resultados +18');
  return { Authorization: `Bearer ${token}` };
}
