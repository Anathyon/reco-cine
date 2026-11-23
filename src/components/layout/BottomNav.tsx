import Link from 'next/link';
import { useRouter } from 'next/router';
import { NAV_ITEMS } from './nav';

/** Barra de navegação inferior no celular (alcance fácil com o polegar). */
export default function BottomNav() {
  const router = useRouter();

  return (
    <nav
      aria-label="Navegação"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-white/5 bg-ink-950/90 backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = router.pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
                  active ? 'text-white' : 'text-zinc-500 active:text-zinc-300'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
