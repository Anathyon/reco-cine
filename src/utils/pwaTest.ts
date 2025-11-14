export const testPWAFeatures = async () => {
  const results = {
    serviceWorker: false,
    manifest: false,
    installable: false,
    offline: false
  };

  // Test Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        results.serviceWorker = true;
        console.log('✅ Service Worker registered and active');
      } else {
        console.log('⚠️ Service Worker supported but not registered');
      }
    } catch (error) {
      console.log('❌ Service Worker error:', error);
    }
  } else {
    console.log('❌ Service Worker not supported');
  }

  // Test Manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    results.manifest = true;
    console.log('✅ Manifest found');
  } else {
    console.log('❌ Manifest not found');
  }

  // Test Installability
  if ('BeforeInstallPromptEvent' in window || window.matchMedia('(display-mode: standalone)').matches) {
    results.installable = true;
    console.log('✅ PWA installable');
  } else {
    console.log('⚠️ PWA installability uncertain (may work on mobile)');
  }

  // Test Cache API
  if ('caches' in window && typeof caches !== 'undefined') {
    try {
      await caches.open('test-cache');
      await caches.delete('test-cache');
      results.offline = true;
      console.log('✅ Cache API supported and working');
    } catch (error) {
      console.log('❌ Cache API error:', error);
    }
  } else {
    console.log('❌ Cache API not supported');
  }

  console.log('PWA Test Results:', results);
  return results;
};