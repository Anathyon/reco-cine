import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DownloadIcon, LogoMark, XIcon } from './ui/Icons';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'reco-cine:install-dismissed';
const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;

/** Convite discreto para instalar o app (só aparece quando o navegador permite). */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (standalone || Date.now() - dismissedAt < DISMISS_FOR_MS) return;

    let timer: ReturnType<typeof setTimeout>;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      timer = setTimeout(() => setVisible(true), 20000);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === 'accepted') setVisible(false);
    else dismiss();
  }, [deferred, dismiss]);

  return (
    <AnimatePresence>
      {visible && deferred && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed inset-x-3 bottom-20 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-ink-800/95 p-3 shadow-2xl backdrop-blur-xl md:bottom-6 md:left-auto md:right-6"
          role="dialog"
          aria-label="Instalar aplicativo"
        >
          <LogoMark size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Instale o Reco Cine</p>
            <p className="text-xs text-zinc-400">Abra direto da tela inicial, como um app.</p>
          </div>
          <button onClick={install} className="btn-brand px-4 py-2">
            <DownloadIcon size={16} />
            Instalar
          </button>
          <button onClick={dismiss} aria-label="Agora não" className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white">
            <XIcon size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
