import { useState, useEffect, useCallback } from 'react';

// Global reference so any component accessing the hook shares the prompt
let deferredInstallPrompt: any = null;

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState<boolean>(() => Boolean(deferredInstallPrompt));
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check standalone mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const choiceResult = await deferredInstallPrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
        }
        deferredInstallPrompt = null;
      } catch (err) {
        console.error('Error invoking install prompt:', err);
        setIsModalOpen(true);
      }
    } else {
      // Fallback: show instructions modal for desktop Chrome/Edge/Safari/Firefox
      setIsModalOpen(true);
    }
  }, []);

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    promptInstall,
    isModalOpen,
    setIsModalOpen,
  };
}
