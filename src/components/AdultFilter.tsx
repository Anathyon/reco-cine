import { useState, type FormEvent, type ReactNode } from 'react';
import { ADULT_AGE, isValidBirthDate } from '../lib/age';
import { loadBirthDate, saveBirthDate, setAdultEnabled, useAdultAccess } from '../store/adultStore';
import { useAuthStore } from '../store/authStore';
import { SignInButton } from './layout/AccountButton';

/**
 * Chave "Mostrar resultados +18" da busca. Só liga para quem está logado e tem
 * 18 anos ou mais; nos outros casos explica o que falta (entrar, informar a idade).
 */
export default function AdultFilter() {
  const { access, enabled } = useAdultAccess();
  const [open, setOpen] = useState(false);

  if (access === 'unavailable') return null;

  const onToggle = () => {
    if (access === 'allowed') {
      setAdultEnabled(!enabled);
      setOpen(false);
    } else {
      setOpen((v) => !v);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        disabled={access === 'loading'}
        className="-my-1 inline-flex items-center gap-2.5 py-1 text-sm text-zinc-400 hover:text-white disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className={`relative h-5 w-9 shrink-0 rounded-full transition ${enabled ? 'bg-brand-500' : 'bg-white/15'}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${enabled ? 'left-[18px]' : 'left-0.5'}`} />
        </span>
        Mostrar resultados +18
      </button>

      {open && access !== 'allowed' && access !== 'loading' && (
        <div className="mt-3 max-w-lg rounded-2xl border border-white/10 bg-ink-850 p-4 text-sm text-zinc-300">
          {access === 'signedOut' && (
            <Panel text={`Resultados +18 são só para quem entra na conta e tem ${ADULT_AGE} anos ou mais.`}>
              <SignInButton compact />
            </Panel>
          )}
          {access === 'needsBirthDate' && <BirthDateForm />}
          {access === 'underage' && <p>Resultados +18 são só para maiores de {ADULT_AGE} anos.</p>}
          {access === 'error' && <RetryPanel />}
        </div>
      )}
    </div>
  );
}

function Panel({ text, children }: { text: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="min-w-0 flex-1 basis-56">{text}</p>
      {children}
    </div>
  );
}

function RetryPanel() {
  const uid = useAuthStore((s) => s.user?.uid);
  return (
    <Panel text="Não foi possível conferir sua conta agora.">
      <button type="button" onClick={() => uid && loadBirthDate(uid, true)} className="btn-ghost h-9 px-3 text-sm">
        Tentar de novo
      </button>
    </Panel>
  );
}

/** Maior de idade: a chave liga e o painel some. Menor: o painel passa a explicar. */
function BirthDateForm() {
  const [value, setValue] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidBirthDate(value)) return setError('Informe uma data de nascimento válida.');
    setBusy(true);
    setError(null);
    try {
      await saveBirthDate(value);
    } catch {
      setError('Não foi possível salvar agora. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p>
        Para ver resultados +18, informe sua data de nascimento. Ela fica salva na sua conta e{' '}
        <strong className="text-white">não pode ser alterada depois</strong>.
      </p>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-zinc-400">Data de nascimento</span>
        <input
          type="date"
          required
          min="1900-01-01"
          max={today}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input h-11 max-w-56 py-2 [color-scheme:dark]"
        />
      </label>
      <label className="flex items-start gap-2">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 accent-brand-500" />
        <span>Declaro que a data informada é verdadeira.</span>
      </label>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      <button type="submit" disabled={!value || !confirmed || busy} className="btn-brand h-10 px-4">
        {busy ? 'Salvando…' : 'Confirmar'}
      </button>
    </form>
  );
}
