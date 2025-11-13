'use client';

import { usePWAInstall } from '../../usePWAInstall';

export const PWAInstallButton = () => {
  const { canInstall, handleInstall } = usePWAInstall();

  if (!canInstall) {
    return null;
  }

  return (
    <button onClick={handleInstall} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
      Instalar App
    </button>
  );
};