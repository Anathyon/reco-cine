import { buildExport, decodeRefs, encodeRefs, MAX_SHARED, parseExport, shareUrl } from '../listTransfer';
import { makeItem } from '../../test/utils';

describe('link de compartilhamento', () => {
  const refs = [
    { type: 'movie' as const, id: 550 },
    { type: 'tv' as const, id: 1396 },
    { type: 'anime' as const, id: 52991 },
  ];

  it('codifica de forma compacta e decodifica de volta', () => {
    const encoded = encodeRefs(refs);
    expect(encoded).toBe('m550.t1396.a52991');
    expect(decodeRefs(encoded)).toEqual(refs);
  });

  it('monta a URL da página Minha lista', () => {
    expect(shareUrl('https://reco.app', refs)).toBe('https://reco.app/favorites?lista=m550.t1396.a52991');
  });

  it('ignora partes inválidas, repetidas e valores que não são texto', () => {
    expect(decodeRefs('m550.x12.t.m550.a-1.<script>.t7')).toEqual([
      { type: 'movie', id: 550 },
      { type: 'tv', id: 7 },
    ]);
    expect(decodeRefs(undefined)).toEqual([]);
    expect(decodeRefs('g2')).toEqual([{ type: 'manga', id: 2 }]);
    expect(decodeRefs(['m1'])).toEqual([]);
  });

  it(`limita a ${MAX_SHARED} títulos para a URL não ficar gigante`, () => {
    const many = Array.from({ length: 150 }, (_, i) => ({ type: 'movie' as const, id: i + 1 }));
    expect(decodeRefs(encodeRefs(many))).toHaveLength(MAX_SHARED);
  });
});

describe('arquivo de backup', () => {
  it('exporta e importa sem perder dados (e sem campos extras)', () => {
    const items = [makeItem(), makeItem({ id: 1, type: 'anime', title: 'Frieren', rating: null })];
    const withExtra = items.map((i) => ({ ...i, addedAt: 123 }));
    const text = buildExport(withExtra);
    expect(JSON.parse(text)).toMatchObject({ app: 'reco-cine', version: 1 });
    expect(parseExport(text)).toEqual(items);
  });

  it('aceita também um array puro', () => {
    expect(parseExport(JSON.stringify([makeItem()]))).toEqual([makeItem()]);
  });

  it('descarta itens malformados e limpa tipos errados', () => {
    const text = JSON.stringify({
      items: [
        makeItem(),
        { id: 'abc', type: 'movie', title: 'id inválido' },
        { id: 2, type: 'podcast', title: 'tipo inválido' },
        { id: 3, type: 'tv', title: 'Ok', poster: 42, rating: '9' },
      ],
    });
    const items = parseExport(text);
    expect(items.map((i) => i.id)).toEqual([550, 3]);
    expect(items[1]).toMatchObject({ poster: null, rating: null, overview: '' });
  });

  it.each([
    ['não é JSON', 'O arquivo não é um JSON válido.'],
    ['{"foo": 1}', 'Este arquivo não parece ser uma lista do Reco Cine.'],
    ['[{"id": "x"}]', 'Nenhum título válido encontrado no arquivo.'],
  ])('rejeita %s com mensagem clara', (text, message) => {
    expect(() => parseExport(text)).toThrow(message);
  });
});
