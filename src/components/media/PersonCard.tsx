import Link from 'next/link';
import type { PersonSummary } from '../../lib/people';
import { personHref } from '../../lib/people';
import Poster from './Poster';

/** Cartão de pessoa (ator, diretor...) que leva à página com a filmografia. */
export default function PersonCard({ person }: { person: PersonSummary }) {
  return (
    <article className="group">
      <Link href={personHref(person.id)} className="block rounded-2xl text-center" aria-label={`${person.name} — ver filmografia`}>
        <div className="mx-auto aspect-square w-full max-w-[9rem] overflow-hidden rounded-full bg-ink-800 ring-1 ring-white/10 transition group-hover:ring-brand-400/60">
          <Poster src={person.photo} alt={person.name} className="h-full w-full transition duration-300 group-hover:scale-105" />
        </div>
        <h3 className="mt-2.5 line-clamp-1 text-sm font-medium text-zinc-100 group-hover:text-white">{person.name}</h3>
        {(person.department || person.knownFor) && (
          <p className="line-clamp-2 text-xs text-zinc-500">
            {[person.department, person.knownFor].filter(Boolean).join(' · ')}
          </p>
        )}
      </Link>
    </article>
  );
}

export function PersonCardSkeleton() {
  return (
    <div className="text-center">
      <div className="skeleton mx-auto aspect-square w-full max-w-[9rem] rounded-full" />
      <div className="skeleton mx-auto mt-2.5 h-4 w-3/4 rounded" />
    </div>
  );
}

export const PEOPLE_GRID = 'grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7';
