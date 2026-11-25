import { useEffect, useState } from 'react';
import { useQuery } from '../../hooks/useQuery';
import { getTranslation, languageLabel, userLanguage } from '../../lib/translate';

interface Props {
  type: 'movie' | 'tv' | 'anime' | 'manga' | 'person';
  id: number;
  /** Texto já disponível (ex.: sinopse do MAL em inglês). Vazio = buscar o original no servidor. */
  text: string;
  /** Idioma conhecido do texto (ex.: "en" para animes); evita traduzir o que já está no idioma da pessoa. */
  textLanguage?: string;
  /** Texto quando não há nada em nenhum idioma. */
  emptyText: string;
  className?: string;
}

/**
 * Mostra um texto traduzido automaticamente para o idioma da pessoa, com a
 * opção de ver o original. Enquanto traduz, mostra o original.
 */
export default function TranslatedText({ type, id, text, textLanguage, emptyText, className = '' }: Props) {
  // O idioma do navegador só é conhecido no cliente.
  const [lang, setLang] = useState<string | null>(null);
  useEffect(() => setLang(userLanguage()), []);

  const alreadyInLanguage = Boolean(text && textLanguage && lang && textLanguage === lang);
  const wanted = lang !== null && !alreadyInLanguage;
  const translation = useQuery(wanted ? `translate:${type}-${id}:${lang}` : null, () => getTranslation(type, id, lang!));
  const [showOriginal, setShowOriginal] = useState(false);

  const t = translation.data;
  const translatedText = t?.translated ? t.text : null;
  const original = text || t?.original || '';
  const shown = showOriginal ? original : translatedText || original;
  const fromLabel = languageLabel(t?.from) ?? (textLanguage ? languageLabel(textLanguage) : null);

  if (!shown) {
    return <p className={`leading-relaxed text-zinc-400 ${className}`}>{translation.loading ? 'Carregando…' : emptyText}</p>;
  }

  return (
    <div className={className}>
      <p className="whitespace-pre-line leading-relaxed text-zinc-300">{shown}</p>
      <p className="mt-2 text-xs text-zinc-500" aria-live="polite">
        {translation.loading && wanted ? (
          'Traduzindo…'
        ) : translatedText ? (
          <>
            {showOriginal ? `Texto original${fromLabel ? ` (em ${fromLabel})` : ''}.` : `Traduzido automaticamente${fromLabel ? ` do ${fromLabel}` : ''}.`}{' '}
            <button type="button" onClick={() => setShowOriginal((v) => !v)} className="-my-1.5 inline-block py-1.5 font-medium text-zinc-300 underline-offset-2 hover:text-white hover:underline">
              {showOriginal ? 'Ver tradução' : 'Ver original'}
            </button>
          </>
        ) : text && fromLabel && !alreadyInLanguage ? (
          `Texto original em ${fromLabel}.`
        ) : null}
      </p>
    </div>
  );
}
