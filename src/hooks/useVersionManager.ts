import { useState, useEffect, useCallback, useRef } from 'react';
import { APP_VERSION } from '@/config/version';

interface VersionInfo {
  version: string;
  buildTime?: string;
  releaseNotes?: string;
}

export function useVersionManager() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  // Check version.json on server
  const checkVersionFile = useCallback(async () => {
    try {
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (res.ok) {
        const data: VersionInfo = await res.json();
        if (data.version && data.version !== APP_VERSION) {
          console.log(`[VersionManager] Remote version detected: ${data.version} (current: ${APP_VERSION})`);
          setRemoteVersion(data.version);
          if (data.releaseNotes) setReleaseNotes(data.releaseNotes);
          setIsUpdateAvailable(true);
          return true;
        } else {
          // Version is already up-to-date
          setIsUpdateAvailable(false);
          setRemoteVersion(null);
          return false;
        }
      }
    } catch (err) {
      console.warn('[VersionManager] Failed to fetch version.json:', err);
    }
    return false;
  }, []);

  // Check service worker for waiting updates
  const checkServiceWorkerUpdate = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;

      // If there is already a waiting worker
      const initialWaiting = reg.waiting as ServiceWorker | null;
      if (initialWaiting) {
        waitingWorkerRef.current = initialWaiting;
        // Verify with version.json first before prompting
        const hasNewVersion = await checkVersionFile();
        if (!hasNewVersion) {
          // Worker was waiting for same version, activate silently
          (initialWaiting as any).postMessage({ type: 'SKIP_WAITING' });
          setIsUpdateAvailable(false);
        }
        return;
      }

      // Trigger update check
      await reg.update();

      const postUpdateWaiting = reg.waiting as ServiceWorker | null;
      if (postUpdateWaiting) {
        waitingWorkerRef.current = postUpdateWaiting;
        const hasNewVersion = await checkVersionFile();
        if (!hasNewVersion) {
          (postUpdateWaiting as any).postMessage({ type: 'SKIP_WAITING' });
          setIsUpdateAvailable(false);
        }
      }
    } catch (err) {
      console.warn('[VersionManager] Service worker update check error:', err);
    }
  }, [checkVersionFile]);

  // Combined check
  const checkForUpdates = useCallback(async () => {
    const fileHasUpdate = await checkVersionFile();
    if (!fileHasUpdate) {
      await checkServiceWorkerUpdate();
    }
  }, [checkVersionFile, checkServiceWorkerUpdate]);

  useEffect(() => {
    // 1. Initial check after 3 seconds so initial page load isn't blocked
    const initialTimer = setTimeout(() => {
      checkForUpdates();
    }, 3000);

    // 2. Periodic check every 3 minutes
    const interval = setInterval(() => {
      checkForUpdates();
    }, 3 * 60 * 1000);

    // 3. Tab visibility change check (when user switches back to this tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Custom event from index.html SW registration
    const handleSwUpdateAvailable = async (e: any) => {
      console.log('[VersionManager] sw-update-available event received.');
      if (e.detail) {
        waitingWorkerRef.current = e.detail;
      }
      const hasNew = await checkVersionFile();
      if (!hasNew && waitingWorkerRef.current) {
        waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
      }
    };
    window.addEventListener('sw-update-available', handleSwUpdateAvailable);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('sw-update-available', handleSwUpdateAvailable);
    };
  }, [checkForUpdates]);

  // Apply update and reload
  const applyUpdate = useCallback(async () => {
    setIsRefreshing(true);

    try {
      // 1. Tell waiting service worker to skip waiting
      if (waitingWorkerRef.current) {
        waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
      } else if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }

      // 2. Clear caches to ensure 100% fresh bundles
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch (e) {
          console.warn('[VersionManager] Failed to clear caches:', e);
        }
      }

      // 3. Force hard reload bypassing cache
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      console.error('[VersionManager] Error applying update:', err);
      window.location.reload();
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setIsUpdateAvailable(false);
  }, []);

  const effectiveUpdateAvailable = Boolean(isUpdateAvailable && remoteVersion && remoteVersion !== APP_VERSION);

  return {
    currentVersion: APP_VERSION,
    remoteVersion: remoteVersion || APP_VERSION,
    releaseNotes,
    isUpdateAvailable: effectiveUpdateAvailable,
    isRefreshing,
    applyUpdate,
    dismissUpdate,
    checkForUpdates,
  };
}

