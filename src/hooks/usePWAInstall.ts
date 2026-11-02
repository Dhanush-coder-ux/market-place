import { useState, useEffect, useCallback } from 'react';

// Global reference so any component accessing the hook shares the prompt
let deferredInstallPrompt: any =
  typeof window !== 'undefined' ? (window as any).__deferredPwaPrompt || null : null;

// Module-level listeners to catch events regardless of React render timing
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    (window as any).__deferredPwaPrompt = e;
  });

  window.addEventListener('pwa-prompt-ready', (e: any) => {
    if (e.detail) {
      deferredInstallPrompt = e.detail;
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    (window as any).__deferredPwaPrompt = null;
  });
}

/**
 * Triggers direct download of an internet shortcut file (.url) for Windows and macOS desktop
 */
export function downloadDesktopShortcut() {
  if (typeof window === 'undefined') return;

  const origin = window.location.origin;
  const shortcutContent = [
    '[InternetShortcut]',
    `URL=${origin}/`,
    'IconIndex=0',
    `IconFile=${origin}/pwa-192x192.png`,
    'HotKey=0',
    '[{000214A0-0000-0000-C000-000000000046}]',
    'Prop3=19,11',
    '',
  ].join('\r\n');

  const blob = new Blob([shortcutContent], { type: 'application/internet-shortcut' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'inventQ Desktop.url';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

export function usePWAInstall() {
  const [isPromptReady, setIsPromptReady] = useState<boolean>(() =>
    Boolean(deferredInstallPrompt || (typeof window !== 'undefined' && (window as any).__deferredPwaPrompt))
  );

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
    // Check if prompt was captured early
    if ((window as any).__deferredPwaPrompt && !deferredInstallPrompt) {
      deferredInstallPrompt = (window as any).__deferredPwaPrompt;
      setIsPromptReady(true);
    }

    // Check standalone mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      (window as any).__deferredPwaPrompt = e;
      setIsPromptReady(true);
    };

    const handlePromptReady = (e: any) => {
      if (e.detail) {
        deferredInstallPrompt = e.detail;
      }
      setIsPromptReady(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsPromptReady(false);
      deferredInstallPrompt = null;
      (window as any).__deferredPwaPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const activePrompt = deferredInstallPrompt || (typeof window !== 'undefined' && (window as any).__deferredPwaPrompt);

    if (activePrompt) {
      try {
        console.log('[PWA] Triggering native browser install prompt...');
        activePrompt.prompt();
        const choiceResult = await activePrompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted installation.');
          setIsInstalled(true);
          setIsPromptReady(false);
        } else {
          console.log('[PWA] User dismissed install prompt.');
        }
        deferredInstallPrompt = null;
        if (typeof window !== 'undefined') (window as any).__deferredPwaPrompt = null;
      } catch (err) {
        console.error('[PWA] Error invoking native install prompt:', err);
        setIsModalOpen(true);
      }
    } else {
      // Fallback: show instructions modal with direct shortcut download
      console.log('[PWA] Native prompt not available. Opening install guide / direct download modal.');
      setIsModalOpen(true);
    }
  }, []);

  return {
    isInstallable: isPromptReady && !isInstalled,
    isPromptReady,
    isInstalled,
    promptInstall,
    downloadDesktopShortcut,
    isModalOpen,
    setIsModalOpen,
  };
}
