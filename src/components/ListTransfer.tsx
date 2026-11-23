import { useRef, useState } from 'react';
import type { MediaItem } from '../types';
import { useQuery } from '../hooks/useQuery';
import { getDetails } from '../lib/media';
import { buildExport, encodeRefs, MAX_SHARED, parseExport, shareUrl, type Ref } from '../lib/listTransfer';
import { useFavoritesStore } from '../store/favoritesStore';
import { toast } from '../store/toastStore';
import MediaGrid from './media/MediaGrid';
import { DownloadIcon, ShareIcon } from './ui/Icons';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// FileReader em vez de file.text(): funciona também em navegadores mais antigos.
const readText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsText(file);
  });

/** Ações para levar a lista a outro aparelho. */
export function ListToolbar({ items }: { items: MediaItem[] }) {
  const importItems = useFavoritesStore((s) => s.importItems);
  const fileInput = useRef<HTMLInputElement>(null);

  const share = async () => {
    const url = shareUrl(window.location.origin, items);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Minha lista no Reco Cine', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast(
          items.length > MAX_SHARED
            ? `Link copiado (com os ${MAX_SHARED} títulos mais recentes)`
            : 'Link da lista copiado — abra no outro aparelho',
        );
      }
    } catch {
      /* usuário cancelou */
    }
  };

  const exportFile = () => {
    const blob = new Blob([buildExport(items)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reco-cine-lista-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = parseExport(await readText(file));
      const added = importItems(parsed);
      toast(added ? `${plural(added, 'título importado', 'títulos importados')}` : 'Todos esses títulos já estavam na sua lista');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Não foi possível importar o arquivo.');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {items.length > 0 && (
        <>
          <button onClick={share} className="btn-ghost h-10 px-4">
            <ShareIcon size={16} /> Compartilhar lista
          </button>
          <button onClick={exportFile} className="btn-ghost h-10 px-4">
            <DownloadIcon size={16} /> Exportar
          </button>
        </>
      )}
      <button onClick={() => fileInput.current?.click()} className="btn-ghost h-10 px-4">
        <DownloadIcon size={16} className="rotate-180" /> Importar arquivo
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Arquivo da lista para importar"
        onChange={(e) => importFile(e.target.files?.[0])}
      />
    </div>
  );
}

/** Busca os detalhes de uma lista de referências, com no máximo 4 requisições simultâneas. */
export async function resolveRefs(refs: Ref[], concurrency = 4): Promise<MediaItem[]> {
  const results: (MediaItem | null)[] = new Array(refs.length).fill(null);
  let next = 0;
  const worker = async () => {
    while (next < refs.length) {
      const index = next++;
      const { type, id } = refs[index];
      try {
        const d = await getDetails(type, id);
        results[index] = {
          id: d.id,
          type: d.type,
          title: d.title,
          poster: d.poster,
          backdrop: d.backdrop,
          year: d.year,
          rating: d.rating,
          overview: d.overview,
        };
      } catch {
        /* título removido ou API indisponível: ignora */
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, refs.length) }, worker));
  return results.filter((i): i is MediaItem => i !== null);
}

/** Aviso exibido ao abrir um link de lista compartilhada. */
export function SharedListBanner({ refs, onClose }: { refs: Ref[]; onClose: () => void }) {
  const importItems = useFavoritesStore((s) => s.importItems);
  const shared = useQuery(`shared-list:${encodeRefs(refs)}`, () => resolveRefs(refs));
  const [busy, setBusy] = useState(false);

  const addAll = () => {
    if (!shared.data) return;
    setBusy(true);
    const added = importItems(shared.data);
    toast(added ? `${plural(added, 'título adicionado', 'títulos adicionados')} à sua lista` : 'Você já tinha todos esses títulos');
    onClose();
  };

  return (
    <section
      aria-label="Lista compartilhada"
      className="mt-6 rounded-3xl border border-brand-400/30 bg-brand-500/10 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">
            Lista compartilhada com {plural(refs.length, 'título', 'títulos')}
          </h2>
          <p className="mt-1 text-sm text-zinc-300">
            {shared.loading ? 'Carregando os títulos…' : 'Confira e adicione tudo à sua lista neste aparelho.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost">
            Dispensar
          </button>
          <button onClick={addAll} disabled={!shared.data?.length || busy} className="btn-brand">
            Adicionar à minha lista
          </button>
        </div>
      </div>
      <div className="mt-6">
        <MediaGrid
          items={shared.data ?? []}
          loading={shared.loading}
          error={shared.error}
          onRetry={shared.retry}
          skeletonCount={Math.min(refs.length, 7)}
          showType
        />
      </div>
    </section>
  );
}
