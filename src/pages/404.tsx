import Head from 'next/head';
import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Página não encontrada — Reco Cine</title>
      </Head>
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="bg-gradient-to-br from-brand-300 to-pink-500 bg-clip-text font-display text-8xl font-bold text-transparent">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-white">Essa cena foi cortada</h1>
        <p className="mt-2 max-w-sm text-zinc-400">A página que você procura não existe ou mudou de lugar.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/" className="btn-primary">
            Ir para o início
          </Link>
          <Link href="/search" className="btn-ghost">
            Buscar um título
          </Link>
        </div>
      </div>
    </>
  );
}
