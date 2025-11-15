import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window === 'undefined') return;

    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    
    if (isInstalled) return;

    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowInstall(true), 3000);
    };

    const appInstalledHandler = () => {
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
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
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

  if (!mounted || !showInstall) return null;

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
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
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
            cursor: 'pointer'
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
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}