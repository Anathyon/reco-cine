/*
 * Idade mínima para resultados +18. Funções puras, usadas no navegador e no servidor.
 * A data de nascimento é guardada como texto "AAAA-MM-DD" (users/{uid}.birthDate).
 */
export const ADULT_AGE = 18;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Data real (recusa 2001-02-30), a partir de 1900 e não no futuro. */
export function isValidBirthDate(value: unknown, today = new Date()): value is string {
  if (typeof value !== 'string') return false;
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return false;
  return y >= 1900 && value <= today.toISOString().slice(0, 10);
}

/** Idade completa em `today` (aniversário conta no próprio dia). */
export function ageOn(birthDate: string, today = new Date()): number {
  const [y, m, d] = birthDate.split('-').map(Number);
  const ty = today.getUTCFullYear();
  const tm = today.getUTCMonth() + 1;
  const td = today.getUTCDate();
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}

export const isAdult = (birthDate: unknown, today = new Date()) =>
  isValidBirthDate(birthDate, today) && ageOn(birthDate, today) >= ADULT_AGE;
