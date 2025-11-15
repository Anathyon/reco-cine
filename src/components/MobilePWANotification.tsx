import { useState, useEffect } from 'react';

export default function MobilePWANotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window === 'undefined') return;
    
    const mobile = window.innerWidth < 768;
    
    if (mobile && !localStorage.getItem('pwa-notification-shown')) {
      setTimeout(() => {
        setShowNotification(true);
        localStorage.setItem('pwa-notification-shown', 'true');
        
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }, 2000);
    }
  }, []);

  if (!mounted || !showNotification) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '12px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      maxWidth: '90vw'
    }}>
      <span style={{ fontSize: '20px' }}>📱</span>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600' }}>Instale o App!</div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>Acesso rápido e offline</div>
      </div>
    </div>
  );
}