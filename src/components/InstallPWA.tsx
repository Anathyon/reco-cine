import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_PROMPT_DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      return isStandalone || isInWebAppiOS;
    };

    if (checkIfInstalled()) {
      setIsInstalled(true);
      return;
    }

    // Verificar se foi dispensado recentemente
    const dismissedTime = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY);
    if (dismissedTime && Date.now() - parseInt(dismissedTime) < DISMISS_DURATION) {
      return;
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostrar após um delay para melhor UX
      setTimeout(() => setShowInstall(true), 3000);
    };

    const appInstalledHandler = () => {
      setIsInstalled(true);
      setShowInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    window.addEventListener('appinstalled', appInstalledHandler);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, Date.now().toString());
    setShowInstall(false);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstall(false);
      } else {
        handleDismiss();
      }
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    }
  }, [deferredPrompt, handleDismiss]);

  if (!showInstall || isInstalled) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderRadius: '0.5rem',
        backgroundColor: '#2563eb',
        padding: '0.75rem 1rem',
        color: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        animation: 'slideInUp 0.3s ease-out',
        maxWidth: '320px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>📱</span>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Instalar Reco Cine</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Acesso rápido e offline</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleInstall}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '0.25rem',
            padding: '0.375rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'white',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          INSTALAR
        </button>
        
        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '50%',
            width: '1.5rem',
            height: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            color: 'white',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  );
}