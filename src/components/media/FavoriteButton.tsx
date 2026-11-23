import type { MediaItem } from '../../types';
import { useFavoritesStore, useIsFavorite } from '../../store/favoritesStore';
import { toast } from '../../store/toastStore';
import { HeartIcon } from '../ui/Icons';

interface Props {
  item: MediaItem;
  variant?: 'card' | 'button';
  className?: string;
}

export default function FavoriteButton({ item, variant = 'button', className = '' }: Props) {
  const isFavorite = useIsFavorite(item);
  const toggle = useFavoritesStore((s) => s.toggle);

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggle(item);
    toast(added ? 'Adicionado à sua lista' : 'Removido da sua lista', {
      label: 'Desfazer',
      onClick: () => useFavoritesStore.getState().toggle(item),
    });
  };

  const label = isFavorite ? `Remover ${item.title} da sua lista` : `Adicionar ${item.title} à sua lista`;

  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={isFavorite}
        className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition active:scale-90 ${
          isFavorite ? 'bg-rose-500 text-white' : 'bg-black/55 text-white hover:bg-black/75'
        } ${className}`}
      >
        <HeartIcon size={17} filled={isFavorite} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isFavorite}
      className={`btn ${isFavorite ? 'bg-rose-500 text-white hover:bg-rose-400' : 'bg-white/10 text-white backdrop-blur hover:bg-white/20'} ${className}`}
    >
      <HeartIcon size={18} filled={isFavorite} />
      {isFavorite ? 'Na sua lista' : 'Minha lista'}
    </button>
  );
}
