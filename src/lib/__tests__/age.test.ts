import { ageOn, isAdult, isValidBirthDate } from '../age';

const today = new Date('2026-11-25T12:00:00Z');

it('calcula a idade, contando o aniversário no próprio dia', () => {
  expect(ageOn('2008-11-25', today)).toBe(18);
  expect(ageOn('2008-11-26', today)).toBe(17);
  expect(ageOn('2008-12-01', today)).toBe(17);
  expect(ageOn('1990-01-01', today)).toBe(36);
});

it('só é maior de idade a partir dos 18 anos completos', () => {
  expect(isAdult('2008-11-25', today)).toBe(true);
  expect(isAdult('2008-11-26', today)).toBe(false);
  expect(isAdult(null, today)).toBe(false);
  expect(isAdult('lixo', today)).toBe(false);
});

it.each(['2001-02-30', '2001-13-01', '1899-12-31', '2026-11-26', '01-01-2000', '2000-1-1', ''])(
  'recusa a data inválida %p',
  (value) => {
    expect(isValidBirthDate(value, today)).toBe(false);
  },
);

it('aceita datas reais até hoje', () => {
  expect(isValidBirthDate('2000-02-29', today)).toBe(true);
  expect(isValidBirthDate('2026-11-25', today)).toBe(true);
});
