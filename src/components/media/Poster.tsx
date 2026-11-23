import { useEffect, useRef, useState } from 'react';
import { FilmIcon } from '../ui/Icons';

interface Props {
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}

/** Imagem com fade-in ao carregar e fallback quando não existe/quebra. */
export default function Poster({ src, alt, className = '', priority }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(src ? 'loading' : 'error');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setStatus(src ? 'loading' : 'error');
    // Imagens vindas do cache podem terminar de carregar antes da hidratação.
    if (src && imgRef.current?.complete && imgRef.current.naturalWidth > 0) setStatus('loaded');
  }, [src]);

  if (status === 'error' || !src) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-800 to-ink-850 p-3 text-center ${className}`}>
        <FilmIcon size={28} className="text-zinc-600" />
        <span className="line-clamp-3 text-xs font-medium text-zinc-500">{alt}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setStatus('loaded')}
      onError={() => setStatus('error')}
      className={`object-cover transition-opacity duration-500 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  );
}
