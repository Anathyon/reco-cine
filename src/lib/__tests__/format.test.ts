import { formatDate, formatRating, formatRuntime, languageName, ratingColor, uniqueBy, yearOf } from '../format';

describe('yearOf', () => {
  it('extrai o ano de uma data ISO', () => {
    expect(yearOf('1999-10-15')).toBe('1999');
  });

  it.each([undefined, null, '', 'sem data'])('retorna null para %p', (value) => {
    expect(yearOf(value)).toBeNull();
  });
});

describe('formatDate', () => {
  it('formata em pt-BR sem deslocar o dia por fuso horário', () => {
    const formatted = formatDate('1999-10-15');
    expect(formatted).toContain('15');
    expect(formatted).toContain('1999');
    expect(formatted?.toLowerCase()).toContain('out');
  });

  it('retorna null para datas vazias ou inválidas', () => {
    expect(formatDate('')).toBeNull();
    expect(formatDate('não é data')).toBeNull();
  });
});

describe('formatRuntime', () => {
  it.each([
    [139, '2h 19min'],
    [120, '2h'],
    [45, '45 min'],
  ])('%i minutos → %s', (minutes, expected) => {
    expect(formatRuntime(minutes)).toBe(expected);
  });

  it.each([0, -5, null, undefined])('retorna null para %p', (value) => {
    expect(formatRuntime(value)).toBeNull();
  });
});

describe('formatRating', () => {
  it('usa uma casa decimal', () => {
    expect(formatRating(8.438)).toBe('8.4');
    expect(formatRating(7)).toBe('7.0');
  });

  it('esconde notas inexistentes ou zeradas', () => {
    expect(formatRating(0)).toBeNull();
    expect(formatRating(null)).toBeNull();
  });
});

describe('ratingColor', () => {
  it('classifica por faixa de nota', () => {
    expect(ratingColor(8)).toBe('text-emerald-400');
    expect(ratingColor(6.5)).toBe('text-amber-400');
    expect(ratingColor(4)).toBe('text-rose-400');
    expect(ratingColor(null)).toBe('text-zinc-400');
  });
});

describe('uniqueBy', () => {
  it('mantém a primeira ocorrência de cada chave, preservando a ordem', () => {
    const items = [
      { id: 1, v: 'a' },
      { id: 2, v: 'b' },
      { id: 1, v: 'c' },
    ];
    expect(uniqueBy(items, (i) => i.id)).toEqual([
      { id: 1, v: 'a' },
      { id: 2, v: 'b' },
    ]);
  });
});

describe('languageName', () => {
  it('traduz códigos conhecidos e cai para o código em maiúsculas', () => {
    expect(languageName('ja')).toBe('Japonês');
    expect(languageName('xx')).toBe('XX');
    expect(languageName(undefined)).toBeNull();
  });
});
