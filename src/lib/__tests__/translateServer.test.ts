/**
 * @jest-environment node
 */
import { jsonResponse, mockFetch } from '../../test/utils';

type Mod = typeof import('../translateServer');
let t: Mod;
const ENV = { ...process.env };

beforeEach(async () => {
  jest.resetModules(); // o cache em memória é por módulo
  process.env = { ...ENV, MAL_CLIENT_ID: 'id', TMDB_API_KEY: 'chave' };
  t = await import('../translateServer');
});
afterAll(() => {
  process.env = ENV;
});

const google = (pairs: [string, string][], from = 'en') => jsonResponse([pairs.map(([tr, orig]) => [tr, orig]), null, from]);

describe('splitText', () => {
  it('não corta frases no meio', () => {
    const parts = t.splitText('Primeira frase. Segunda frase. Terceira frase.', 20);
    expect(parts.every((p) => p.length <= 20)).toBe(true);
    expect(parts.join('')).toBe('Primeira frase. Segunda frase. Terceira frase.');
  });

  it('corta frases gigantes sem pontuação', () => {
    const parts = t.splitText('a'.repeat(50), 20);
    expect(parts.map((p) => p.length)).toEqual([20, 20, 10]);
  });
});

describe('translateText', () => {
  it('junta os pedaços traduzidos e informa o idioma de origem', async () => {
    const fetch = mockFetch(google([['Olá mundo. ', 'Hello world. '], ['Como vai?', 'How are you?']]));
    const r = await t.translateText('Hello world. How are you?', 'pt');
    expect(r).toEqual({ text: 'Olá mundo. Como vai?', from: 'en', to: 'pt', original: 'Hello world. How are you?', translated: true });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain('tl=pt');
    expect(init.method).toBe('POST');
  });

  it('não "traduz" o que já está no idioma pedido', async () => {
    mockFetch(google([['Olá', 'Olá']], 'pt'));
    expect(await t.translateText('Olá', 'pt-BR')).toMatchObject({ text: 'Olá', translated: false });
  });

  it('guarda em cache e não chama o tradutor de novo', async () => {
    const fetch = mockFetch(google([['Oi', 'Hi']]));
    await t.translateText('Hi', 'pt');
    await t.translateText('Hi', 'pt');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('falha quando o tradutor está fora do ar', async () => {
    mockFetch(jsonResponse({}, 429));
    await expect(t.translateText('Hi', 'pt')).rejects.toThrow('429');
  });
});

describe('sourceText', () => {
  it('anime: sinopse do MyAnimeList, sem a assinatura', async () => {
    mockFetch(jsonResponse({ synopsis: 'An elf mage. [Written by MAL Rewrite]' }));
    expect(await t.sourceText('anime', 1)).toBe('An elf mage.');
  });

  it('TMDB: usa o inglês quando falta em português', async () => {
    mockFetch(
      jsonResponse({
        translations: [
          { iso_639_1: 'pt', data: { overview: '' } },
          { iso_639_1: 'es', data: { overview: 'En español' } },
          { iso_639_1: 'en', data: { overview: 'In English' } },
        ],
      }),
    );
    expect(await t.sourceText('movie', 1)).toBe('In English');
  });

  it('pessoa: usa a biografia', async () => {
    mockFetch(jsonResponse({ translations: [{ iso_639_1: 'en', data: { biography: 'Born in LA.' } }] }));
    expect(await t.sourceText('person', 1)).toBe('Born in LA.');
  });
});

describe('spellSuggestion', () => {
  it('limpa palavras como "filme" e ignora a própria busca', async () => {
    mockFetch(jsonResponse(['harry poter', ['harry poter', 'harry potter e a pedra filosofal filme']]));
    expect(await t.spellSuggestion('harry poter')).toBe('harry potter e a pedra filosofal');
  });

  it('sem sugestão, devolve null', async () => {
    mockFetch(jsonResponse(['xyz', []]));
    expect(await t.spellSuggestion('xyz')).toBeNull();
  });
});

it('isLanguage aceita só códigos de idioma', () => {
  expect(['pt', 'en', 'zh-CN', 'pt-BR'].every(t.isLanguage)).toBe(true);
  expect(['', 'portugues', '../x', 'pt BR'].some(t.isLanguage)).toBe(false);
});
