export const debugPWA = async () => {
  console.log('🔍 PWA Debug Information:');
  console.log('========================');
  
  // Browser info
  console.log('Browser:', navigator.userAgent);
  console.log('Protocol:', window.location.protocol);
  console.log('Host:', window.location.host);
  
  // Service Worker
  if ('serviceWorker' in navigator) {
    console.log('✅ Service Worker API available');
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('Registered SWs:', registrations.length);
      
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log('✅ SW registered at:', registration.scope);
        console.log('SW state:', registration.active?.state);
      } else {
        console.log('❌ No SW registration found');
      }
    } catch (error) {
      console.log('❌ SW error:', error);
    }
  } else {
    console.log('❌ Service Worker not supported');
  }
  
  // Cache API
  if ('caches' in window) {
    console.log('✅ Cache API available');
    try {
      const cacheNames = await caches.keys();
      console.log('Cache names:', cacheNames);
    } catch (error) {
      console.log('❌ Cache API error:', error);
    }
  } else {
    console.log('❌ Cache API not available');
  }
  
  // Manifest
  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (manifestLink) {
    console.log('✅ Manifest link found:', manifestLink.href);
    try {
      const response = await fetch(manifestLink.href);
      const manifest = await response.json();
      console.log('Manifest data:', manifest);
    } catch (error) {
      console.log('❌ Manifest fetch error:', error);
    }
  } else {
    console.log('❌ No manifest link found');
  }
  
  // Install prompt
  console.log('BeforeInstallPromptEvent support:', 'BeforeInstallPromptEvent' in window);
  console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
  
  // HTTPS check
  console.log('HTTPS:', window.location.protocol === 'https:');
  console.log('Localhost:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
};