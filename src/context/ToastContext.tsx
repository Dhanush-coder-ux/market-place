import { createContext, useContext, useCallback, ReactNode } from "react";
import { Toaster, dynaura, type ToastOptions } from "dynaura";
import "dynaura/styles.css";

export type ToastType = "success" | "error" | "info" | "warning" | "loading" | "progress";

export interface ToastContextType {
  /**
   * Main toast function - backwards compatible with all existing showToast(msg, type) calls across the entire codebase.
   */
  showToast: (
    message: string | any,
    type?: ToastType,
    options?: Partial<ToastOptions>
  ) => string;

  /** Show a success toast with title, optional description, and extra options */
  showSuccess: (
    title: string | any,
    description?: string,
    options?: Partial<ToastOptions>
  ) => string;

  /** Show an error toast with title, optional description, and extra options */
  showError: (
    title: string | any,
    description?: string,
    options?: Partial<ToastOptions>
  ) => string;

  /** Show an info toast */
  showInfo: (
    title: string | any,
    description?: string,
    options?: Partial<ToastOptions>
  ) => string;

  /** Show a warning toast */
  showWarning: (
    title: string | any,
    description?: string,
    options?: Partial<ToastOptions>
  ) => string;

  /**
   * Show a dynamic island progress bar toast (progress between 0..1 or 0..100)
   * Returns the toast id to allow calling updateProgress / completeProgress
   */
  showProgress: (
    title: string,
    progress?: number,
    description?: string,
    options?: Partial<ToastOptions>
  ) => string;

  /** Update an ongoing progress toast */
  updateProgress: (
    id: string,
    progress: number,
    title?: string,
    description?: string
  ) => void;

  /** Complete an ongoing progress toast into a success toast with celebration */
  completeProgress: (
    id: string,
    title?: string,
    description?: string
  ) => void;

  /** Fail an ongoing progress toast into an error toast */
  failProgress: (
    id: string,
    title?: string,
    description?: string
  ) => void;

  /**
   * Track an asynchronous promise with auto morphing from loading -> success/error
   */
  showPromise: <T>(
    promise: Promise<T>,
    options: {
      loading: string | ToastOptions;
      success: string | ToastOptions | ((data: T) => string | ToastOptions);
      error: string | ToastOptions | ((err: any) => string | ToastOptions);
    }
  ) => Promise<T>;

  /** Dismiss a specific toast or current toast */
  dismissToast: (id?: string) => void;

  /** Clear all toasts */
  clearToasts: () => void;

  /** Direct dynaura instance */
  dynaura: typeof dynaura;
}

// ─── Message Extractor Helper ─────────────────────────────────────────────────

export function extractMessage(message: unknown): { title: string; description?: string } {
  if (typeof message === "string") {
    const trimmed = message.trim();
    if (trimmed.includes("\n")) {
      const [first, ...rest] = trimmed.split("\n");
      return { title: first.trim(), description: rest.join("\n").trim() || undefined };
    }
    const colonIdx = trimmed.indexOf(": ");
    if (colonIdx > 0 && colonIdx <= 35 && !trimmed.slice(0, colonIdx).includes("http")) {
      const title = trimmed.slice(0, colonIdx).trim();
      const desc = trimmed.slice(colonIdx + 2).trim();
      if (desc) {
        return { title, description: desc };
      }
    }
    return { title: trimmed };
  }

  if (message && typeof message === "object") {
    const obj = message as Record<string, any>;
    const titleCandidate =
      obj.title ||
      obj.msg ||
      obj.message ||
      obj.description ||
      obj.detail?.msg ||
      obj.detail?.description ||
      (typeof obj.detail === "string" ? obj.detail : null) ||
      (obj.error ? String(obj.error) : null) ||
      "Notification";

    const descCandidate =
      obj.description && obj.description !== titleCandidate
        ? String(obj.description)
        : obj.detail?.description && obj.detail.description !== titleCandidate
        ? String(obj.detail.description)
        : obj.detail && typeof obj.detail === "string" && obj.detail !== titleCandidate
        ? obj.detail
        : undefined;

    return {
      title: String(titleCandidate).trim(),
      description: descCandidate ? String(descCandidate).trim() : undefined,
    };
  }

  return { title: String(message || "") };
}

// Normalize progress between 0 and 1
function normalizeProgress(p: number | undefined): number {
  if (p === undefined || isNaN(p)) return 0;
  const val = p > 1 ? p / 100 : p;
  return Math.max(0, Math.min(1, val));
}

// Global rate limiter to avoid spamming the same notification on double clicks
const recentToastsMap = new Map<string, number>();

function shouldRateLimit(key: string, cooldownMs = 1200): boolean {
  const now = Date.now();
  const last = recentToastsMap.get(key) || 0;
  if (now - last < cooldownMs) return true;
  recentToastsMap.set(key, now);
  // Clean map when it grows large
  if (recentToastsMap.size > 200) {
    for (const [k, ts] of recentToastsMap.entries()) {
      if (now - ts > 10000) recentToastsMap.delete(k);
    }
  }
  return false;
}

// ─── Standalone Global Notification Helper ────────────────────────────────────
// Can be called anywhere (even outside React components, e.g. in API interceptors)
export const toast = {
  show: (message: string | any, type: ToastType = "success", options?: Partial<ToastOptions>): string => {
    const { title, description } = extractMessage(message);
    if (!title && !options?.title) return "";

    const key = `${type}:${title}:${description || ""}`;
    if (shouldRateLimit(key)) return "";

    const opts: ToastOptions = {
      title: options?.title || title,
      description: options?.description || description,
      duration: options?.duration ?? (type === "error" ? 5000 : 3800),
      ...options,
    };

    switch (type) {
      case "error":
        return dynaura.error(opts);
      case "warning":
        return dynaura.warning(opts);
      case "info":
        return dynaura.info(opts);
      case "loading":
        return dynaura.loading({ ...opts, duration: null });
      case "progress":
        return dynaura.loading({ ...opts, progress: normalizeProgress(options?.progress), duration: null });
      case "success":
      default:
        return dynaura.success(opts);
    }
  },

  success: (message: string | any, options?: Partial<ToastOptions>): string => {
    return toast.show(message, "success", options);
  },

  error: (message: string | any, options?: Partial<ToastOptions>): string => {
    return toast.show(message, "error", options);
  },

  info: (message: string | any, options?: Partial<ToastOptions>): string => {
    return toast.show(message, "info", options);
  },

  warning: (message: string | any, options?: Partial<ToastOptions>): string => {
    return toast.show(message, "warning", options);
  },

  progress: (
    title: string,
    progress: number = 0,
    description?: string,
    options?: Partial<ToastOptions>
  ): string => {
    const norm = normalizeProgress(progress);
    return dynaura.loading({
      title,
      description,
      progress: norm,
      duration: null,
      ...options,
    });
  },

  updateProgress: (
    id: string,
    progress: number,
    title?: string,
    description?: string
  ): void => {
    const norm = normalizeProgress(progress);
    dynaura.update(id, {
      progress: norm,
      ...(title ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
    });
  },

  complete: (
    id: string,
    title: string = "Complete",
    description?: string
  ): void => {
    dynaura.update(id, {
      type: "success",
      title,
      description,
      progress: undefined,
      duration: 4000,
      confetti: true,
    });
  },

  fail: (
    id: string,
    title: string = "Failed",
    description?: string
  ): void => {
    dynaura.update(id, {
      type: "error",
      title,
      description,
      progress: undefined,
      duration: 5000,
    });
  },

  promise: dynaura.promise,
  dismiss: dynaura.dismiss,
  clear: dynaura.clear,
};

// ─── React Context ────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const showToast = useCallback(
    (message: string | any, type: ToastType = "success", options?: Partial<ToastOptions>): string => {
      return toast.show(message, type, options);
    },
    []
  );

  const showSuccess = useCallback((title: string | any, description?: string, options?: Partial<ToastOptions>): string => {
    const extracted = extractMessage(title);
    return toast.success(extracted.title, {
      description: description || extracted.description,
      ...options,
    });
  }, []);

  const showError = useCallback((title: string | any, description?: string, options?: Partial<ToastOptions>): string => {
    const extracted = extractMessage(title);
    return toast.error(extracted.title, {
      description: description || extracted.description,
      ...options,
    });
  }, []);

  const showInfo = useCallback((title: string | any, description?: string, options?: Partial<ToastOptions>): string => {
    const extracted = extractMessage(title);
    return toast.info(extracted.title, {
      description: description || extracted.description,
      ...options,
    });
  }, []);

  const showWarning = useCallback((title: string | any, description?: string, options?: Partial<ToastOptions>): string => {
    const extracted = extractMessage(title);
    return toast.warning(extracted.title, {
      description: description || extracted.description,
      ...options,
    });
  }, []);

  const showProgress = useCallback(
    (title: string, progress: number = 0, description?: string, options?: Partial<ToastOptions>): string => {
      return toast.progress(title, progress, description, options);
    },
    []
  );

  const updateProgress = useCallback(
    (id: string, progress: number, title?: string, description?: string): void => {
      toast.updateProgress(id, progress, title, description);
    },
    []
  );

  const completeProgress = useCallback(
    (id: string, title?: string, description?: string): void => {
      toast.complete(id, title, description);
    },
    []
  );

  const failProgress = useCallback(
    (id: string, title?: string, description?: string): void => {
      toast.fail(id, title, description);
    },
    []
  );

  const showPromise = useCallback(
    <T,>(
      promise: Promise<T>,
      options: {
        loading: string | ToastOptions;
        success: string | ToastOptions | ((data: T) => string | ToastOptions);
        error: string | ToastOptions | ((err: any) => string | ToastOptions);
      }
    ): Promise<T> => {
      return dynaura.promise(promise, options);
    },
    []
  );

  const dismissToast = useCallback((id?: string) => {
    dynaura.dismiss(id);
  }, []);

  const clearToasts = useCallback(() => {
    dynaura.clear();
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showProgress,
        updateProgress,
        completeProgress,
        failProgress,
        showPromise,
        dismissToast,
        clearToasts,
        dynaura,
      }}
    >
      {/* Dynamic Island Global Toaster mounted across all pages */}
      <Toaster
        position="top"
        theme="dark"
        queue={true}
        offset={18}
      />
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

export { dynaura };
