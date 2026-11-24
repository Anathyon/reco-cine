/*
 * Busca aproximada (tolerante a erros de digitação), no estilo "Você quis dizer…".
 *
 * Roda no navegador sobre o índice de títulos e pessoas populares
 * (/api/search/catalog). Compara palavra por palavra com a distância de
 * Damerau-Levenshtein (letra trocada, faltando, sobrando ou invertida),
 * ignorando acentos, maiúsculas e palavras como "o", "de", "the".
 */

export type IndexKind = 'movie' | 'tv' | 'anime' | 'person';

/** Entrada do índice (chaves curtas: o arquivo inteiro vai para o navegador). */
export interface IndexEntry {
  /** tipo */
  k: IndexKind;
  id: number;
  /** título (em português quando existe) ou nome da pessoa */
  t: string;
  /** título original / alternativo */
  o?: string;
  /** ano */
  y?: string;
  /** pôster ou foto (caminho do TMDB, ou URL completa no caso de anime) */
  p?: string;
  /** nota */
  r?: number;
  /** pessoa: por quais títulos é conhecida */
  d?: string;
}

export type MatchKind = 'exact' | 'prefix' | 'fuzzy';

export interface FuzzyMatch {
  entry: IndexEntry;
  /** 0 a 1 */
  score: number;
  /** exact/prefix: o que foi digitado está certo; fuzzy: houve correção. */
  kind: MatchKind;
  /** Qual nome casou (título ou original). */
  name: string;
}

const STOPWORDS = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas',
  'the', 'of', 'and', 'an', 'in', 'on', 'to', 'no', 'wo', 'ga', 'el', 'la', 'los', 'las', 'le', 'les', 'y',
]);

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/['’`´]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const tokensOf = (norm: string) => {
  const all = norm.split(' ').filter(Boolean);
  const content = all.filter((t) => !STOPWORDS.has(t));
  return content.length ? content : all;
};

// Buffers reaproveitados entre chamadas (a busca roda a cada tecla).
let rowA = new Int32Array(64);
let rowB = new Int32Array(64);
let rowC = new Int32Array(64);

/** Distância de Damerau-Levenshtein (versão "optimal string alignment"), com corte. */
export function editDistance(a: string, b: string, max = Infinity): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const n = b.length + 1;
  if (rowA.length < n) {
    rowA = new Int32Array(n * 2);
    rowB = new Int32Array(n * 2);
    rowC = new Int32Array(n * 2);
  }
  let prevPrev = rowA;
  let prev = rowB;
  let curr = rowC;
  for (let j = 0; j < n; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = i;
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j < n; j++) {
      const bj = b.charCodeAt(j - 1);
      let v = prev[j - 1] + (ai === bj ? 0 : 1);
      if (prev[j] + 1 < v) v = prev[j] + 1;
      if (curr[j - 1] + 1 < v) v = curr[j - 1] + 1;
      if (i > 1 && j > 1 && ai === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === bj && prevPrev[j - 2] + 1 < v) v = prevPrev[j - 2] + 1;
      curr[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    const t = prevPrev;
    prevPrev = prev;
    prev = curr;
    curr = t;
  }
  return prev[b.length];
}

/** Quantos erros aceitar numa palavra, pelo tamanho dela. */
const allowedEdits = (len: number) => (len <= 2 ? 0 : len <= 4 ? 1 : len <= 8 ? 2 : 3);

/** Semelhança de uma palavra digitada com uma palavra do título (0 a 1). */
function wordSimilarity(typed: string, word: string, isLast: boolean): { sim: number; exact: boolean } {
  if (typed === word) return { sim: 1, exact: true };
  // Última palavra ainda sendo digitada: "pott" → "potter".
  if (isLast && typed.length >= 2 && word.startsWith(typed)) return { sim: 0.9 + 0.1 * (typed.length / word.length), exact: true };
  // O limite segue o tamanho do que foi digitado: "gotham" não vira "gatchaman".
  const max = allowedEdits(typed.length);
  if (!max) return { sim: 0, exact: false };
  const dist = editDistance(typed, word, max);
  if (dist <= max) return { sim: 1 - dist / Math.max(typed.length, word.length, 1), exact: false };
  // Começo da palavra com erro, enquanto digita: "pottr" → "potter" (no máximo 1 erro).
  if (isLast && typed.length >= 4 && word.length > typed.length) {
    const prefixDist = editDistance(typed, word.slice(0, typed.length), 1);
    if (prefixDist <= 1) return { sim: 0.85 - 0.1 * prefixDist, exact: false };
  }
  return { sim: 0, exact: false };
}

interface Prepared {
  entry: IndexEntry;
  names: { raw: string; norm: string; compact: string; tokens: string[] }[];
}

/** Pares de letras ("harry" → ha, ar, rr, ry), para pré-selecionar candidatos. */
function bigrams(text: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < text.length - 1; i++) out.add(text.slice(i, i + 2));
  return out;
}

function prepare(entry: IndexEntry): Prepared {
  const names = [entry.t, entry.o]
    .filter((n): n is string => Boolean(n))
    .map((raw) => {
      const norm = normalize(raw);
      return { raw, norm, compact: norm.replace(/ /g, ''), tokens: tokensOf(norm) };
    })
    .filter((n, i, all) => n.norm && all.findIndex((m) => m.norm === n.norm) === i);
  return { entry, names };
}

function scoreName(q: { norm: string; compact: string; tokens: string[] }, name: Prepared['names'][number]): { score: number; kind: MatchKind } {
  if (name.norm === q.norm) return { score: 1, kind: 'exact' };
  if (name.norm.startsWith(q.norm) && q.norm.length >= 2) return { score: 0.9 + 0.08 * (q.norm.length / name.norm.length), kind: 'prefix' };

  // Palavra por palavra: cada palavra digitada procura a melhor no título.
  let total = 0;
  let allExact = true;
  const used = new Set<number>();
  q.tokens.forEach((typed, i) => {
    let best = { sim: 0, exact: false, at: -1 };
    name.tokens.forEach((word, j) => {
      if (used.has(j)) return;
      const s = wordSimilarity(typed, word, i === q.tokens.length - 1);
      if (s.sim > best.sim) best = { ...s, at: j };
    });
    if (best.at >= 0) used.add(best.at);
    total += best.sim;
    if (!best.exact) allExact = false;
  });
  let tokenScore = q.tokens.length ? total / q.tokens.length : 0;
  // Títulos com muitas palavras a mais que a busca contam menos ("batman" ≠ "lego batman o filme").
  const extra = Math.max(0, name.tokens.length - q.tokens.length);
  tokenScore *= 1 - Math.min(0.25, extra * 0.06);

  // Palavras grudadas ou separadas: "spiderman" ≈ "spider man".
  let compactScore = 0;
  const maxLen = Math.max(q.compact.length, name.compact.length);
  if (q.compact.length >= 4 && Math.abs(q.compact.length - name.compact.length) <= allowedEdits(maxLen)) {
    const dist = editDistance(q.compact, name.compact, allowedEdits(maxLen));
    if (dist <= allowedEdits(maxLen)) compactScore = (1 - dist / maxLen) * 0.97;
  }

  if (compactScore > tokenScore) return { score: compactScore, kind: compactScore >= 0.97 && q.compact === name.compact ? 'exact' : 'fuzzy' };
  return { score: tokenScore, kind: allExact ? 'prefix' : 'fuzzy' };
}

export interface FuzzyIndex {
  search: (query: string, options?: { limit?: number; minScore?: number; kinds?: IndexKind[] }) => FuzzyMatch[];
  size: number;
}

/** Prepara o índice uma vez; cada busca leva poucos milissegundos. */
export function createFuzzyIndex(entries: IndexEntry[]): FuzzyIndex {
  const prepared = entries.map(prepare);
  const total = prepared.length || 1;

  // Índice invertido: par de letras → entradas que o contêm.
  const postings = new Map<string, number[]>();
  prepared.forEach(({ names }, i) => {
    const grams = new Set<string>();
    for (const n of names) bigrams(n.compact).forEach((g) => grams.add(g));
    grams.forEach((g) => {
      const list = postings.get(g);
      if (list) list.push(i);
      else postings.set(g, [i]);
    });
  });
  const hits = new Uint16Array(prepared.length);

  return {
    size: prepared.length,
    search(query, { limit = 10, minScore = 0.72, kinds } = {}) {
      const norm = normalize(query);
      if (norm.length < 2) return [];
      const q = { norm, compact: norm.replace(/ /g, ''), tokens: tokensOf(norm) };

      // Só pontua quem tem uma boa parte dos pares de letras em comum (cada erro estraga uns dois pares).
      const grams = bigrams(q.compact);
      const needed = grams.size <= 3 ? 1 : Math.ceil(grams.size * 0.35);
      hits.fill(0);
      const candidates: number[] = [];
      grams.forEach((g) => {
        for (const i of postings.get(g) ?? []) {
          if (++hits[i] === needed) candidates.push(i);
        }
      });

      const matches: FuzzyMatch[] = [];
      for (const rank of candidates) {
        const { entry, names } = prepared[rank];
        if (kinds && !kinds.includes(entry.k)) continue;
        let best: { score: number; kind: MatchKind; name: string } | null = null;
        for (const name of names) {
          const s = scoreName(q, name);
          if (!best || s.score > best.score) best = { ...s, name: name.raw };
        }
        if (!best || best.score < minScore) continue;
        // Desempate pela popularidade (o índice já vem ordenado do mais popular).
        matches.push({ entry, kind: best.kind, name: best.name, score: Math.min(1, best.score + 0.03 * (1 - rank / total)) });
      }

      return matches.sort((a, b) => b.score - a.score).slice(0, limit);
    },
  };
}

/**
 * Correção para "Você quis dizer…": só quando houve erro de digitação e a
 * correção é bem mais provável que o que foi digitado.
 */
export function didYouMean(index: FuzzyIndex, query: string): FuzzyMatch | null {
  const [best] = index.search(query, { limit: 3, minScore: 0.75 });
  if (!best || best.kind !== 'fuzzy') return null;
  if (normalize(best.name) === normalize(query)) return null;
  return best;
}
