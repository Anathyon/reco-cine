import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore, type AuthUser } from '../../store/authStore';
import { GoogleIcon, HeartIcon, LogOutIcon } from '../ui/Icons';

function Avatar({ user, size = 32 }: { user: AuthUser; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
  if (user.photo && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.photo}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center rounded-full bg-brand-500 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  );
}

/** Botão "Entrar com Google", reaproveitado no cabeçalho e na página da lista. */
export function SignInButton({ compact, className = '' }: { compact?: boolean; className?: string }) {
  const signIn = useAuthStore((s) => s.signIn);
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      await signIn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={onClick} disabled={busy} className={`${compact ? 'btn-ghost h-9 px-3 text-sm' : 'btn-primary'} ${className}`}>
      <GoogleIcon size={compact ? 16 : 18} />
      <span>{compact ? 'Entrar' : 'Entrar com Google'}</span>
    </button>
  );
}

export default function AccountButton() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (status === 'disabled') return null;
  if (status === 'loading') return <span className="skeleton h-9 w-9 shrink-0 rounded-full" aria-hidden="true" />;
  if (status === 'signedOut' || !user) return <SignInButton compact className="shrink-0" />;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Conta de ${user.name || user.email}`}
        className="flex rounded-full ring-2 ring-transparent transition hover:ring-white/20 focus-visible:ring-brand-400"
      >
        <Avatar user={user} size={34} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Conta"
          className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-ink-850/95 p-1.5 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar user={user} size={36} />
            <div className="min-w-0">
              {user.name && <p className="truncate text-sm font-semibold text-white">{user.name}</p>}
              {user.email && <p className="truncate text-xs text-zinc-400">{user.email}</p>}
            </div>
          </div>
          <div className="my-1 h-px bg-white/5" />
          <Link
            href="/favorites"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 hover:bg-white/5 hover:text-white"
          >
            <HeartIcon size={16} /> Minha lista
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/5 hover:text-white"
          >
            <LogOutIcon size={16} /> Sair
          </button>
        </div>
      )}
    </div>
  );
}
